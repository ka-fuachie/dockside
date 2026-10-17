package sh.dockside.api.health;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.client.RestClient;

import sh.dockside.api.TestPostgres;
import sh.dockside.api.auth.LoginResponse;
import sh.dockside.api.deployment.DeploymentRepository;
import sh.dockside.api.incident.IncidentRepository;
import sh.dockside.api.site.SiteRepository;
import sh.dockside.api.site.SiteResponse;

@SpringBootTest (webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles ("test")
@Import (TestPostgres.class)
public class HealthReportTest {
  @LocalServerPort
  private int port;

  private RestClient client;
  private final String agent = "test-agent-secret";

  @Autowired IncidentRepository incidents;
  @Autowired HealthCheckRepository health;
  @Autowired DeploymentRepository deployments;
  @Autowired SiteRepository sites;

  @BeforeEach
  void setup() {
    client = RestClient.builder().baseUrl("http://localhost:" + port).build();
    incidents.deleteAll();
    health.deleteAll();
    deployments.deleteAll();
    sites.deleteAll();
  }

  private String token(String user, String pass) {
    var res = client.post().uri("/auth/login")
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"username\":\"" + user + "\",\"password\":\"" + pass + "\"}")
      .retrieve().toEntity(LoginResponse.class);
    return res.getBody().accessToken();
  }

  private Long createSite(String adminJwt, String slug) {
    return client.post().uri("/sites")
      .headers(h -> h.setBearerAuth(adminJwt))
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"slug\":\"" + slug + "\",\"name\":\"" + slug + "\"}")
      .retrieve().toEntity(SiteResponse.class).getBody().id();
  }

  private void report(Long siteId, boolean up) {
    client.post().uri("/agent/sites/" + siteId + "/health")
      .headers(h -> h.set("X-Agent-Token", agent))
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"up\":" + up + ",\"latencyMs\":42,\"bytes\":100}")
      .retrieve().toBodilessEntity();
  }

  private SiteResponse getSite(Long siteId, String jwt) {
    return client.get().uri("/sites/" + siteId)
      .headers(h -> h.setBearerAuth(jwt))
      .retrieve().toEntity(SiteResponse.class).getBody();
  }

  @Test
  void reportRoundTripBothDirections() {
    var admin = token("admin", "admin123");
    var siteId = createSite(admin, "healthy");
    var dev = token("dev", "dev123");

    assertThat(getSite(siteId, dev).up()).isNull();

    report(siteId, true);
    var up = getSite(siteId, dev);
    assertThat(up.up()).isTrue();
    assertThat(up.checkedAt()).isNotNull();

    report(siteId, false);
    var down = getSite(siteId, dev);
    assertThat(down.up()).isFalse();
    assertThat(down.checkedAt()).isAfter(up.checkedAt());
  }

  @Test
  void badTokenIs401() {
    var status = client.post().uri("/agent/sites/1/health")
      .headers(h -> h.set("X-Agent-Token", "wrong"))
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"up\":true,\"latencyMs\":1,\"bytes\":0}")
      .exchange((req, res) -> res.getStatusCode());
    assertThat(status.value()).isEqualTo(401);
  }
}
