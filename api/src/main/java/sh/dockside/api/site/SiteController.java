package sh.dockside.api.site;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import sh.dockside.api.deployment.DeploymentRepository;
import sh.dockside.api.health.HealthCheckRepository;
import sh.dockside.api.user.User;
import sh.dockside.api.user.UserRepository;

@RestController
@RequestMapping("/sites")
@SecurityRequirement(name = "bearerAuth")
public class SiteController {
  private final SiteRepository sites;
  private final HealthCheckRepository health;
  private final UserRepository users;
  private final DeploymentRepository deployments;

  public SiteController(SiteRepository sites, HealthCheckRepository health, UserRepository users, DeploymentRepository deployments) {
    this.sites = sites;
    this.health = health;
    this.users = users;
    this.deployments = deployments;
  }

  private SiteResponse withHealth(Site site) {
    var healthCheck = health.findTopBySiteIdOrderByCheckedAtDesc(site.getId()).orElse(null);
    var latest = deployments.findFirstBySiteIdOrderByVersionDesc(site.getId()).orElse(null);
    return SiteResponse.from(site, healthCheck, latest);
  }

  private User currentUser() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    return users.findByUsername(auth.getName())
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "user not found"));
  }

  @GetMapping
  public Page<SiteResponse> list(Pageable pageable) {
    return sites.findAll(pageable).map(this::withHealth);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public SiteResponse create(@Valid @RequestBody CreateSiteRequest body) {
    if (sites.existsBySlug(body.slug())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "slug taken");
    }
    var site = new Site();
    site.setSlug(body.slug());
    site.setName(body.name());
    site.setCreatedBy(currentUser());
    return SiteResponse.from(sites.save(site));
  }

  @GetMapping("/{id}")
  public SiteResponse one(@PathVariable Long id) {
    var site = sites.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "site not found"));
    return withHealth(site);
  }
}
