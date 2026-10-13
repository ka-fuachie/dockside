package sh.dockside.api.auth;

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
import sh.dockside.api.common.ErrorResponse;

@ActiveProfiles("test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestPostgres.class)
class AuthTest {
  @LocalServerPort
  private int port;

  private RestClient client;

  @BeforeEach
  void setup() {
    client = RestClient.builder().baseUrl("http://localhost:" + port).build();
  }

  @Test
  void loginOk() throws Exception {
    var res = client.post().uri("/auth/login")
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"username\": \"dev\", \"password\":\"dev123\"}")
      .retrieve().toEntity(LoginResponse.class);
    assertThat(res.getStatusCode().is2xxSuccessful()).isTrue();
    assertThat(res.getBody().accessToken()).isNotBlank();
  }

  @Test
  void loginBadPassword() throws Exception {
    var res = client.post().uri("/auth/login")
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"username\":\"dev\",\"password\":\"nope\"}")
      .exchange((req, _res) ->
        new AbstractMap.SimpleEntry<>(_res.getStatusCode(), _res.bodyTo(ErrorResponse.class)));
    assertThat(res.getKey().is4xxClientError()).isTrue();
    assertThat(res.getValue().code()).isEqualTo("BAD_CREDENTIALS");
  }
}
