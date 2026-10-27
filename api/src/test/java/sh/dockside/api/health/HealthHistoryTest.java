package sh.dockside.api.health;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.core.ParameterizedTypeReference;
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
public class HealthHistoryTest {
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

  private String adminToken() {
    var res = client.post().uri("/auth/login")
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"username\":\"admin\",\"password\":\"admin123\"}")
      .retrieve().toEntity(LoginResponse.class);
    return res.getBody().accessToken();
  }

  private Long createSite(String jwt, String slug) {
    return client.post().uri("/sites")
      .headers(h -> h.setBearerAuth(jwt))
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"slug\":\"" + slug + "\",\"name\":\"" + slug + "\"}")
      .retrieve().toEntity(SiteResponse.class).getBody().id();
  }

  private void report(Long siteId, boolean up, int latencyMs) {
    client.post().uri("/agent/sites/" + siteId + "/health")
      .headers(h -> h.set("X-Agent-Token", agent))
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"up\":" + up + ",\"latencyMs\":" + latencyMs + ",\"bytes\":100}")
      .retrieve().toBodilessEntity();
  }

  @Test
  void historyNewestFirstAndLimit() throws InterruptedException {
    var admin = adminToken();
    var siteId = createSite(admin, "history");

    report(siteId, true, 10);
    Thread.sleep(20);
    report(siteId, false, 20);
    Thread.sleep(20);
    report(siteId, true, 30);

    var all = client.get().uri("/sites/{id}/health-checks", siteId)
      .headers(h -> h.setBearerAuth(admin))
      .retrieve().toEntity(new ParameterizedTypeReference<java.util.List<HealthCheckController.HealthCheckResponse>>() {})
      .getBody();
    assertThat(all).hasSize(3);
    assertThat(all.get(0).checkedAt()).isAfter(all.get(1).checkedAt()).isAfter(all.get(2).checkedAt());
    assertThat(all.get(0).latencyMs()).isEqualTo(30);
    assertThat(all.get(1).latencyMs()).isEqualTo(20);
    assertThat(all.get(2).latencyMs()).isEqualTo(10);

    var limited = client.get().uri("/sites/{id}/health-checks?limit=2", siteId)
      .headers(h -> h.setBearerAuth(admin))
      .retrieve().toEntity(new ParameterizedTypeReference<java.util.List<HealthCheckController.HealthCheckResponse>>() {})
      .getBody();
    assertThat(limited).hasSize(2);
    assertThat(limited.get(0).latencyMs()).isEqualTo(30);
    assertThat(limited.get(1).latencyMs()).isEqualTo(20);
  }

  @Test
  void badLimitIs400AndMissingSiteIs404() {
    var admin = adminToken();
    var status = client.get().uri("/sites/1/health-checks?limit=501")
      .headers(h -> h.setBearerAuth(admin))
      .exchange((req, res) -> res.getStatusCode());
    assertThat(status.value()).isEqualTo(400);

    var notFound = client.get().uri("/sites/999999/health-checks")
      .headers(h -> h.setBearerAuth(admin))
      .exchange((req, res) -> res.getStatusCode());
    assertThat(notFound.value()).isEqualTo(404);
  }
}
