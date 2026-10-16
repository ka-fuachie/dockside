package sh.dockside.api.health;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import sh.dockside.api.site.SiteRepository;

@RestController
@RequestMapping ("/agent/sites/{siteId}/health")
@SecurityRequirement(name = "agentToken")
public class AgentHealthController {
  private final SiteRepository sites;
  private final HealthCheckRepository health;

  public AgentHealthController(SiteRepository sites, HealthCheckRepository health) {
    this.sites = sites;
    this.health = health;
  }

  @PostMapping
  @ResponseStatus (HttpStatus.NO_CONTENT)
  public void report(
    @PathVariable Long siteId,
    @Valid @RequestBody HealthReportRequest body
  ) {
    var site = sites.findById(siteId)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "site not found"));

    var check = new HealthCheck();
    check.setSite(site);
    check.setUp(body.up());
    check.setLatencyMs(body.latencyMs());
    check.setBytes(body.bytes() == null ? 0 : body.bytes());
    health.save(check);
  }
}
