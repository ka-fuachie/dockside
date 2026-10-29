package sh.dockside.api.site;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.AbstractMap;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.client.RestClient;

import sh.dockside.api.TestPostgres;

@ActiveProfiles("test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestPostgres.class)
class ListFilterTest {
  @LocalServerPort
  private int port;

  @Autowired
  private SiteRepository sites;

  private record SiteRow(Long id, String slug, String name) {}
  private record SitePage(java.util.List<SiteRow> content, long totalElements) {}
  private record UserRow(Long id, String username, String role) {}
  private record UserPage(java.util.List<UserRow> content, long totalElements) {}

  private String token(RestClient client, String user, String pass) {
    var body = client.post().uri("/auth/login")
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"username\":\"" + user + "\",\"password\":\"" + pass + "\"}")
      .retrieve().toEntity(String.class).getBody();
    var key = "accessToken\":\"";
    var start = body.indexOf(key) + key.length();
    return body.substring(start, body.indexOf('"', start));
  }

  @Test
  void siteSearchAndStatusFilter() throws Exception {
    var client = RestClient.builder().baseUrl("http://localhost:" + port).build();
    var admin = token(client, "admin", "admin123");
    var sites = RestClient.builder()
      .baseUrl("http://localhost:" + port)
      .defaultHeader("Authorization", "Bearer " + admin)
      .build();

    sites.post().uri("/sites")
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"slug\":\"filter-alpha\",\"name\":\"Alpha Radio\"}")
      .retrieve().toEntity(String.class);
    sites.post().uri("/sites")
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"slug\":\"filter-beta\",\"name\":\"Beta TV\"}")
      .retrieve().toEntity(String.class);

    var qHit = sites.get().uri("/sites?q=radio")
      .retrieve().toEntity(SitePage.class).getBody();
    var slugs = qHit.content().stream().map(SiteRow::slug).toList();
    assertThat(slugs).contains("filter-alpha");
    assertThat(qHit.content().stream().allMatch(s -> s.name().toLowerCase().contains("radio") || s.slug().contains("radio"))).isTrue();

    var down = sites.get().uri("/sites?status=down")
      .retrieve().toEntity(SitePage.class).getBody();
    var downSlugs = down.content().stream().map(SiteRow::slug).toList();
    assertThat(downSlugs).contains("filter-alpha", "filter-beta");

    var bad = sites.get().uri("/sites?status=sideways")
      .exchange((req, _res) -> _res.getStatusCode().value());
    assertThat(bad).isEqualTo(400);
  }

  @Test
  void userSearchAndRoleFilter() throws Exception {
    var client = RestClient.builder().baseUrl("http://localhost:" + port).build();
    var admin = token(client, "admin", "admin123");
    var users = RestClient.builder()
      .baseUrl("http://localhost:" + port)
      .defaultHeader("Authorization", "Bearer " + admin)
      .build();

    users.post().uri("/users")
      .contentType(MediaType.APPLICATION_JSON)
      .body("{\"username\":\"filterdev1\",\"password\":\"pw12345\",\"role\":\"DEV\"}")
      .retrieve().toEntity(String.class);

    var byQ = users.get().uri("/users?q=filterdev")
      .retrieve().toEntity(UserPage.class).getBody();
    assertThat(byQ.totalElements()).isEqualTo(1);
    assertThat(byQ.content().getFirst().username()).isEqualTo("filterdev1");

    var admins = users.get().uri("/users?role=ADMIN")
      .retrieve().toEntity(UserPage.class).getBody();
    assertThat(admins.content().stream().allMatch(u -> u.role().equals("ADMIN"))).isTrue();

    var bad = users.get().uri("/users?role=ROOT")
      .exchange((req, _res) -> _res.getStatusCode().value());
    assertThat(bad).isEqualTo(400);
  }
}
