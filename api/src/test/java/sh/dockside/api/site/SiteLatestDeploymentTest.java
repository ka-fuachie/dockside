package sh.dockside.api.site;

import static org.assertj.core.api.Assertions.assertThat;

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
import sh.dockside.api.deployment.DeploymentResponse;
import sh.dockside.api.deployment.DeploymentStatus;
import sh.dockside.api.incident.IncidentRepository;

import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@SpringBootTest (webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles ("test")
@Import (TestPostgres.class)
public class SiteLatestDeploymentTest {
  @LocalServerPort
  private int port;

  private RestClient client;
  private final String agent = "test-agent-secret";

  @Autowired IncidentRepository incidents;

  @BeforeEach
  void setup() {
    client = RestClient.builder().baseUrl("http://localhost:" + port).build();
    incidents.deleteAll();
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
  void latestDeploymentIsNullWithoutDeployments() {
    var admin = token("admin", "admin123");
    var siteId = createSite(admin, "latest-empty");

    var site = client.get().uri("/sites/" + siteId)
      .headers(h -> h.setBearerAuth(admin))
      .retrieve().toEntity(SiteResponse.class).getBody();

    assertThat(site.latestDeployment()).isNull();
  }

  @Test
  void latestDeploymentReflectsVersionAndStatusAfterActivate() throws Exception {
    var admin = token("admin", "admin123");
    var siteId = createSite(admin, "latest-active");
    var dev = token("dev", "dev123");
    var dep = uploadVersion(siteId, dev, zipWithEntry("index.html", "<html></html>"));

    var before = client.get().uri("/sites/" + siteId)
      .headers(h -> h.setBearerAuth(admin))
      .retrieve().toEntity(SiteResponse.class).getBody();
    assertThat(before.latestDeployment()).isNotNull();
    assertThat(before.latestDeployment().version()).isEqualTo(dep.version());
    assertThat(before.latestDeployment().status()).isNotEqualTo(DeploymentStatus.success);

    client.post().uri("/agent/deployments/" + dep.id() + "/activate")
      .headers(h -> h.set("X-Agent-Token", agent))
      .retrieve().toEntity(SiteResponse.class).getBody();

    var after = client.get().uri("/sites/" + siteId)
      .headers(h -> h.setBearerAuth(admin))
      .retrieve().toEntity(SiteResponse.class).getBody();
    assertThat(after.latestDeployment()).isNotNull();
    assertThat(after.latestDeployment().version()).isEqualTo(dep.version());
    assertThat(after.latestDeployment().status()).isEqualTo(DeploymentStatus.success);
  }
}
