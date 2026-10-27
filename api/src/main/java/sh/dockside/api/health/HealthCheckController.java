package sh.dockside.api.health;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import sh.dockside.api.site.SiteRepository;

@RestController
@RequestMapping("/sites/{siteId}/health-checks")
@SecurityRequirement(name = "bearerAuth")
public class HealthCheckController {
  private final SiteRepository sites;
  private final HealthCheckRepository health;

  public HealthCheckController(SiteRepository sites, HealthCheckRepository health) {
    this.sites = sites;
    this.health = health;
  }

  public record HealthCheckResponse(Long siteId, Instant checkedAt, Boolean up, Integer latencyMs, Long bytes) {
    static HealthCheckResponse from(Long siteId, HealthCheck h) {
      return new HealthCheckResponse(siteId, h.getCheckedAt(), h.getUp(), h.getLatencyMs(), h.getBytes().longValue());
    }
  }

  @GetMapping
  public List<HealthCheckResponse> history(@PathVariable Long siteId, @RequestParam(name = "limit", defaultValue = "50") int limit) {
    if (limit < 1 || limit > 500) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "bad limit");
    }
    if (!sites.existsById(siteId)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "site not found");
    }
    var page = health.findBySiteId(siteId, PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "checkedAt")));
    return page.getContent().stream().map(h -> HealthCheckResponse.from(siteId, h)).toList();
  }
}
