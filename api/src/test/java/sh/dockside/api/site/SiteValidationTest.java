package sh.dockside.api.site;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.AbstractMap;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.client.RestClient;

import sh.dockside.api.TestPostgres;
import sh.dockside.api.auth.LoginResponse;
import sh.dockside.api.common.ErrorResponse;

@SpringBootTest (webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import (TestPostgres.class)
public class SiteValidationTest {
  @LocalServerPort
  private int port;

  private RestClient client;

  @BeforeEach
  void setup() {
    client = RestClient.builder().baseUrl("http://localhost:" + port).build();
  }

  private String adminToken() {
    var res = client.post().uri("/auth/login")
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"username\":\"admin\",\"password\":\"admin123\"}")
      .retrieve().toEntity(LoginResponse.class);
    return res.getBody().accessToken();
  }

  @Test
  void createSiteMissingFields() {
    var res = client.post().uri("/sites")
      .headers(h -> h.setBearerAuth(adminToken()))
      .contentType(MediaType.APPLICATION_JSON)
      .body("{}")
      .exchange((request, response) -> new AbstractMap.SimpleEntry<>(
        response.getStatusCode(), response.bodyTo(ErrorResponse.class)));
    assertThat(res.getKey().value()).isEqualTo(400);
    assertThat(res.getValue().code()).isEqualTo("BAD_REQUEST");
    assertThat(res.getValue().fields()).containsKeys("slug", "name");
  }
}
