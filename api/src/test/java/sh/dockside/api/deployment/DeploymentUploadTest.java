package sh.dockside.api.deployment;

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
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;

import sh.dockside.api.TestPostgres;
import sh.dockside.api.auth.LoginResponse;
import sh.dockside.api.common.ErrorResponse;
import sh.dockside.api.incident.IncidentRepository;
import sh.dockside.api.site.SiteRepository;
import sh.dockside.api.site.SiteResponse;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(TestPostgres.class)
public class DeploymentUploadTest {
  @LocalServerPort
  private int port;

  private RestClient client;

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

  private byte[] zipWithEntry(String name, String content) throws Exception {
    var out = new ByteArrayOutputStream();
    try (var zip = new ZipOutputStream(out)) {
      zip.putNextEntry(new ZipEntry(name));
      zip.write(content.getBytes());
      zip.closeEntry();
    }
    return out.toByteArray();
  }

  private AbstractMap.SimpleEntry<HttpStatusCode,ErrorResponse> upload(Long siteId, String jwt, byte[] zip) {
    var file = new ByteArrayResource(zip) {
      @Override public String getFilename() { return "site.zip"; }
    };
    var parts = new LinkedMultiValueMap<String, Object>();
    parts.add("file", file);
    return client.post().uri("/sites/" + siteId + "/deployments")
      .headers(h -> h.setBearerAuth(jwt))
      .contentType(MediaType.MULTIPART_FORM_DATA)
      .body(parts)
      .exchange((request, response) -> new AbstractMap.SimpleEntry<>(
        response.getStatusCode(), response.bodyTo(ErrorResponse.class)));
  }

  @Test
  void uploadEvilZipRejected() throws Exception {
    var admin = token("admin", "admin123");
    var siteRes = client.post().uri("/sites")
      .headers(h -> h.setBearerAuth(admin))
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"slug\":\"evil\",\"name\":\"Evil\"}")
      .retrieve().toEntity(SiteResponse.class);
    var site = siteRes.getBody();
    var dev = token("dev", "dev123");
    var res = upload(site.id(), dev, zipWithEntry("../../x", "x"));
    assertThat(res.getKey().value()).isEqualTo(400);
    assertThat(res.getValue().code()).isEqualTo("BAD_REQUEST");
  }

  @Test
  void deployHappyPath() throws Exception {
    var admin = token("admin", "admin123");
    var siteRes = client.post().uri("/sites")
      .headers(h -> h.setBearerAuth(admin))
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"slug\":\"happy\",\"name\":\"Happy\"}")
      .retrieve().toEntity(SiteResponse.class);
    var siteId = siteRes.getBody().id();

    var dev = token("dev", "dev123");
    var file = new ByteArrayResource(zipWithEntry("index.html", "<html></html>")) {
      @Override public String getFilename() { return "site.zip"; }
    };
    var parts = new LinkedMultiValueMap<String, Object>();
    parts.add("file", file);
    var up = client.post().uri("/sites/" + siteId + "/deployments")
      .headers(h -> h.setBearerAuth(dev))
      .contentType(MediaType.MULTIPART_FORM_DATA)
      .body(parts)
      .retrieve().toEntity(DeploymentResponse.class);
    assertThat(up.getStatusCode().value()).isEqualTo(201);
    var jobId = up.getBody().id();

    var agent = "test-agent-secret";
    var job = client.get().uri("/agent/next-job")
      .headers(h -> h.set("X-Agent-Token", agent))
      .retrieve().toEntity(DeploymentResponse.class);
    assertThat(job.getBody().id()).isEqualTo(jobId);

    var done = client.post().uri("/agent/deployments/" + jobId + "/result")
      .headers(h -> h.set("X-Agent-Token", agent))
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"success\":true,\"logs\":\"ok\"}")
      .retrieve().toEntity(DeploymentResponse.class);
    assertThat(done.getBody().status()).isEqualTo(DeploymentStatus.success);

    var drained = client.get().uri("/agent/next-job")
      .headers(h -> h.set("X-Agent-Token", agent))
      .retrieve().toEntity(Void.class);
    assertThat(drained.getStatusCode().value()).isEqualTo(204);
  }

  private Long uploadVersion(Long siteId, String jwt, String entry) throws Exception {
    var file = new ByteArrayResource(zipWithEntry(entry, "<html></html>")) {
      @Override public String getFilename() { return "site.zip"; }
    };
    var parts = new LinkedMultiValueMap<String, Object>();
    parts.add("file", file);
    return client.post().uri("/sites/" + siteId + "/deployments")
      .headers(h -> h.setBearerAuth(jwt))
      .contentType(MediaType.MULTIPART_FORM_DATA)
      .body(parts)
      .retrieve().toEntity(DeploymentResponse.class).getBody().id();
  }

  @Test
  void rollbackMovesCurrentVersion() throws Exception {
    var admin = token("admin", "admin123");
    var siteId = client.post().uri("/sites")
      .headers(h -> h.setBearerAuth(admin))
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"slug\":\"roll\",\"name\":\"Roll\"}")
      .retrieve().toEntity(SiteResponse.class).getBody().id();

    var dev = token("dev", "dev123");
    var agent = "test-agent-secret";

    var v1 = uploadVersion(siteId, dev, "index.html");
    client.post().uri("/agent/deployments/" + v1 + "/result")
      .headers(h -> h.set("X-Agent-Token", agent))
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"success\":true,\"logs\":\"ok\"}")
      .retrieve().toBodilessEntity();

    var v2 = uploadVersion(siteId, dev, "index.html");
    client.post().uri("/agent/deployments/" + v2 + "/result")
      .headers(h -> h.set("X-Agent-Token", agent))
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"success\":true,\"logs\":\"ok\"}")
      .retrieve().toBodilessEntity();

    var curr = client.post().uri("/deployments/" + v2 + "/rollback")
      .headers(h -> h.setBearerAuth(dev))
      .retrieve().toEntity(SiteResponse.class);
    assertThat(curr.getStatusCode().is2xxSuccessful()).isTrue();
    assertThat(curr.getBody().currentVersion()).isEqualTo(2);

    var rb = client.post().uri("/deployments/" + v1 + "/rollback")
      .headers(h -> h.setBearerAuth(dev))
      .retrieve().toEntity(SiteResponse.class);
    assertThat(rb.getStatusCode().is2xxSuccessful()).isTrue();
    assertThat(rb.getBody().currentVersion()).isEqualTo(1);

    var v3 = uploadVersion(siteId, dev, "index.html");
    client.post().uri("/agent/deployments/" + v3 + "/result")
      .headers(h -> h.set("X-Agent-Token", agent))
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"success\":false,\"logs\":\"boom\"}")
      .retrieve().toBodilessEntity();

    var bad = client.post().uri("/deployments/" + v3 + "/rollback")
      .headers(h -> h.setBearerAuth(dev))
      .exchange((request, response) -> new AbstractMap.SimpleEntry<>(
        response.getStatusCode(), response.bodyTo(ErrorResponse.class)));
    assertThat(bad.getKey().value()).isEqualTo(400);
    assertThat(bad.getValue().code()).isEqualTo("BAD_REQUEST");
  }
}
