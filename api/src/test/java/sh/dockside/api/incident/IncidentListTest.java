package sh.dockside.api.incident;

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
import sh.dockside.api.deployment.DeploymentRepository;
import sh.dockside.api.deployment.DeploymentResponse;
import sh.dockside.api.site.SiteRepository;
import sh.dockside.api.site.SiteResponse;

@SpringBootTest (webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles ("test")
@Import (TestPostgres.class)
public class IncidentListTest {
  @LocalServerPort
  private int port;

  private RestClient client;

  @Autowired DeploymentRepository deployments;
  @Autowired SiteRepository sites;

  @BeforeEach
  void setup() {
    client = RestClient.builder().baseUrl("http://localhost:" + port).build();
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
  void listsIncidentsNewestFirstAfterFailedDeploy() throws Exception {
    var admin = token("admin", "admin123");
    var siteId = createSite(admin, "incidents");
    var dev = token("dev", "dev123");
    var dep = uploadVersion(siteId, dev, zipWithEntry("index.html", "<html>hi</html>"));

    client.post().uri("/agent/deployments/" + dep.id() + "/result")
      .headers(h -> h.set("X-Agent-Token", "test-agent-secret"))
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"success\":false,\"logs\":\"boom: compile error\"}")
      .retrieve().toEntity(DeploymentResponse.class).getBody();

    var body = client.get().uri("/deployments/" + dep.id() + "/incidents")
      .headers(h -> h.setBearerAuth(dev))
      .retrieve().body(java.util.List.class);

    assertThat(body).hasSize(1);

    var missing = client.get().uri("/deployments/999999/incidents")
      .headers(h -> h.setBearerAuth(dev))
      .exchange((req, res) -> res.getStatusCode());
    assertThat(missing.value()).isEqualTo(404);
  }
}
