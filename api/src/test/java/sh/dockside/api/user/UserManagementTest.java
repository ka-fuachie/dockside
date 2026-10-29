package sh.dockside.api.user;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.AbstractMap;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer.OrderAnnotation;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.client.RestClient;

import sh.dockside.api.TestPostgres;
import sh.dockside.api.auth.LoginResponse;
import sh.dockside.api.common.ErrorResponse;

@ActiveProfiles("test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestPostgres.class)
@TestMethodOrder(OrderAnnotation.class)
class UserManagementTest {
  @LocalServerPort
  private int port;

  private RestClient client;

  private final String suffix = String.valueOf(System.currentTimeMillis());

  @BeforeEach
  void setup() {
    client = RestClient.builder().baseUrl("http://localhost:" + port).build();
  }

  private String token(String username, String password) {
    var res = client.post().uri("/auth/login")
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"username\": \"" + username + "\", \"password\":\"" + password + "\"}")
      .retrieve().toEntity(LoginResponse.class);
    assertThat(res.getStatusCode().is2xxSuccessful()).isTrue();
    return res.getBody().accessToken();
  }

  private RestClient authed(String token) {
    return RestClient.builder().baseUrl("http://localhost:" + port)
      .defaultHeader("Authorization", "Bearer " + token).build();
  }

  private Long idOf(RestClient c, String username) {
    return c.get().uri("/users").retrieve().body(UsersPage.class).content().stream()
      .filter(u -> u.username().equals(username)).findFirst().orElseThrow().id();
  }

  @Test
  @Order(1)
  void devForbiddenOnListAndCreate() throws Exception {
    var dev = token("dev", "dev123");
    var c = authed(dev);
    var list = c.get().uri("/users")
      .exchange((req, _res) -> new AbstractMap.SimpleEntry<>(_res.getStatusCode(), _res.bodyTo(ErrorResponse.class)));
    assertThat(list.getKey().value()).isEqualTo(403);
    var create = c.post().uri("/users")
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"username\":\"nope-user\",\"password\":\"pw12345\",\"role\":\"DEV\"}")
      .exchange((req, _res) -> new AbstractMap.SimpleEntry<>(_res.getStatusCode(), _res.bodyTo(ErrorResponse.class)));
    assertThat(create.getKey().value()).isEqualTo(403);
  }

  @Test
  @Order(2)
  void adminListsUsers() throws Exception {
    var admin = token("admin", "admin123");
    var res = authed(admin).get().uri("/users").retrieve().body(UsersPage.class);
    assertThat(res.content().stream().map(UserResponse::username))
      .contains("admin", "dev");
  }

  @Test
  @Order(3)
  void adminCreatesUserThenDuplicateConflicts() throws Exception {
    var admin = token("admin", "admin123");
    var c = authed(admin);
    var res = c.post().uri("/users")
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"username\":\"plainuser-" + suffix + "\",\"password\":\"pw12345\",\"role\":\"DEV\"}")
      .retrieve().toEntity(UserResponse.class);
    assertThat(res.getStatusCode().value()).isEqualTo(201);
    assertThat(res.getBody().username()).isEqualTo("plainuser-" + suffix);
    assertThat(res.getBody().role()).isEqualTo(Role.DEV);

    var dup = c.post().uri("/users")
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"username\":\"plainuser-" + suffix + "\",\"password\":\"pw12345\",\"role\":\"DEV\"}")
      .exchange((req, _res) -> new AbstractMap.SimpleEntry<>(_res.getStatusCode(), _res.bodyTo(ErrorResponse.class)));
    assertThat(dup.getKey().value()).isEqualTo(409);
    assertThat(dup.getValue().message()).isEqualTo("username taken");
  }

  @Test
  @Order(4)
  void roleChangeGuards() throws Exception {
    var admin = token("admin", "admin123");
    var c = authed(admin);
    var adminId = idOf(c, "admin");
    var devId = idOf(c, "dev");

    var selfChange = c.put().uri("/users/{id}/role", adminId)
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"role\":\"DEV\"}")
      .exchange((req, _res) -> new AbstractMap.SimpleEntry<>(_res.getStatusCode(), _res.bodyTo(ErrorResponse.class)));
    assertThat(selfChange.getKey().value()).isEqualTo(409);
    assertThat(selfChange.getValue().message()).isEqualTo("cannot change own role");

    var promoteDev = c.put().uri("/users/{id}/role", devId)
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"role\":\"ADMIN\"}")
      .retrieve().toEntity(UserResponse.class);
    assertThat(promoteDev.getStatusCode().is2xxSuccessful()).isTrue();
    assertThat(promoteDev.getBody().role()).isEqualTo(Role.ADMIN);

    var demote = c.put().uri("/users/{id}/role", devId)
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"role\":\"DEV\"}")
      .retrieve().toEntity(UserResponse.class);
    assertThat(demote.getStatusCode().is2xxSuccessful()).isTrue();
    assertThat(demote.getBody().role()).isEqualTo(Role.DEV);
  }

  @Test
  @Order(5)
  void deleteGuards() throws Exception {
    var admin = token("admin", "admin123");
    var c = authed(admin);
    var adminId = idOf(c, "admin");
    var devId = idOf(c, "dev");

    var self = c.delete().uri("/users/{id}", adminId)
      .exchange((req, _res) -> new AbstractMap.SimpleEntry<>(_res.getStatusCode(), _res.bodyTo(ErrorResponse.class)));
    assertThat(self.getKey().value()).isEqualTo(409);
    assertThat(self.getValue().message()).isEqualTo("cannot delete yourself");

    var created = c.post().uri("/users")
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"username\":\"deleteme-" + suffix + "\",\"password\":\"pw12345\",\"role\":\"DEV\"}")
      .retrieve().toEntity(UserResponse.class);
    assertThat(created.getStatusCode().value()).isEqualTo(201);
    var ok = c.delete().uri("/users/{id}", created.getBody().id())
      .retrieve().toBodilessEntity();
    assertThat(ok.getStatusCode().value()).isEqualTo(204);

    var victim = c.post().uri("/users")
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"username\":\"victim-" + suffix + "\",\"password\":\"pw12345\",\"role\":\"ADMIN\"}")
      .retrieve().toEntity(UserResponse.class);
    var deleteSecondAdmin = c.delete().uri("/users/{id}", victim.getBody().id()).retrieve().toBodilessEntity();
    assertThat(deleteSecondAdmin.getStatusCode().value()).isEqualTo(204);

    var lastAdminSelf = c.delete().uri("/users/{id}", adminId)
      .exchange((req, _res) -> new AbstractMap.SimpleEntry<>(_res.getStatusCode(), _res.bodyTo(ErrorResponse.class)));
    assertThat(lastAdminSelf.getKey().value()).isEqualTo(409);

    var missing = c.delete().uri("/users/{id}", created.getBody().id())
      .exchange((req, _res) -> new AbstractMap.SimpleEntry<>(_res.getStatusCode(), _res.bodyTo(ErrorResponse.class)));
    assertThat(missing.getKey().value()).isEqualTo(404);
    assertThat(missing.getValue().message()).isEqualTo("user not found");
  }

  public record UsersPage(List<UserResponse> content) {}
}
