package sh.dockside.api.agent;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.AbstractMap;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.apache.commons.io.output.ByteArrayOutputStream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;

import sh.dockside.api.TestPostgres;
import sh.dockside.api.auth.LoginResponse;
import sh.dockside.api.common.ErrorResponse;
import sh.dockside.api.deployment.DeploymentRepository;
import sh.dockside.api.deployment.DeploymentResponse;
import sh.dockside.api.incident.IncidentRepository;
import sh.dockside.api.site.SiteRepository;
import sh.dockside.api.site.SiteResponse;

@SpringBootTest (webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles ("test")
@Import (TestPostgres.class)
public class AgentPublishTest {
  @LocalServerPort
  private int port;

  private RestClient client;
  private final String agent = "test-agent-secret";

  @Autowired DeploymentRepository deployments;
  @Autowired SiteRepository sites;
  @Autowired IncidentRepository incidents;

  @BeforeEach
  void setup() {
    client = RestClient.builder().baseUrl("http://localhost:" + port).build();
    incidents.deleteAll();
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

  private byte[] zipWithEntry(String name, String content) throws Exception {
    var out = new ByteArrayOutputStream();
    try (var zip = new ZipOutputStream(out)) {
      zip.putNextEntry(new ZipEntry(name));
      zip.write(content.getBytes());
      zip.closeEntry();
    }
    return out.toByteArray();
  }

  private DeploymentResponse uploadVersion(Long siteId, String jwt, byte[] zip) {
    var file = new ByteArrayResource(zip) {
      @Override public String getFilename() { return "site.zip"; }
    };
    var parts = new LinkedMultiValueMap<String, Object>();
    parts.add("file", file);
    return client.post().uri("/sites/" + siteId + "/deployments")
      .headers(h -> h.setBearerAuth(jwt))
      .contentType(MediaType.MULTIPART_FORM_DATA)
      .body(parts)
      .retrieve().toEntity(DeploymentResponse.class).getBody();
  }

  @Test
  void artifactDownloadRoundTrip() throws Exception {
    var admin = token("admin", "admin123");
    var siteId = createSite(admin, "artifacts");
    var dev = token("dev", "dev123");
    var zip = zipWithEntry("index.html", "<html>hi</html>");
    var dep = uploadVersion(siteId, dev, zip);

    var bytes = client.get().uri("/agent/deployments/" + dep.id() + "/artifact")
      .headers(h -> h.set("X-Agent-Token", agent))
      .retrieve().toEntity(byte[].class).getBody();

    assertThat(bytes).isEqualTo(zip);
  }

  @Test
  void artifactRejectsBadTokenAndUnknownId() {
    var bad = client.get().uri("/agent/deployments/1/artifact")
      .headers(h -> h.set("X-Agent-Token", "wrong"))
      .exchange((req, res) -> res.getStatusCode());
    assertThat(bad.value()).isEqualTo(401);

    var missing = client.get().uri("/agent/deployments/999999/artifact")
      .headers(h -> h.set("X-Agent-Token", agent))
      .exchange((req, res) -> new AbstractMap.SimpleEntry<>(
        res.getStatusCode(), res.bodyTo(ErrorResponse.class)));
    assertThat(missing.getKey().value()).isEqualTo(404);
  }

  @Test
  void activateFlipsCurrentVersionAndIsIdempotent() throws Exception {
    var admin = token("admin", "admin123");
    var siteId = createSite(admin, "activates");
    var dev = token("dev", "dev123");
    var dep = uploadVersion(siteId, dev, zipWithEntry("index.html", "<html></html>"));

    var first = client.post().uri("/agent/deployments/" + dep.id() + "/activate")
      .headers(h -> h.set("X-Agent-Token", agent))
      .retrieve().toEntity(SiteResponse.class).getBody();
    assertThat(first.currentVersion()).isEqualTo(dep.version());

    var second = client.post().uri("/agent/deployments/" + dep.id() + "/activate")
      .headers(h -> h.set("X-Agent-Token", agent))
      .retrieve().toEntity(SiteResponse.class).getBody();
    assertThat(second.currentVersion()).isEqualTo(dep.version());

    var drained = client.get().uri("/agent/next-job")
      .headers(h -> h.set("X-Agent-Token", agent))
      .retrieve().toEntity(Void.class);
    assertThat(drained.getStatusCode().value()).isEqualTo(204);
  }
}
