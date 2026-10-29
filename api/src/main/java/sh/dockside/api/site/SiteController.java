package sh.dockside.api.site;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
  public Page<SiteResponse> list(
    @RequestParam(required = false) String q,
    @RequestParam(required = false) String status,
    Pageable pageable
  ) {
    var up = status == null ? null : parseStatus(status);
    var query = q == null || q.isBlank() ? null : q.toLowerCase();
    var page = pageable.getSort().isSorted() ? pageable
      : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "id"));
    return sites.findAll(filter(query, up), page).map(this::withHealth);
  }

  private org.springframework.data.jpa.domain.Specification<Site> filter(String query, Boolean up) {
    org.springframework.data.jpa.domain.Specification<Site> spec = null;
    if (query != null) {
      org.springframework.data.jpa.domain.Specification<Site> qSpec = (root, cq, cb) -> cb.or(
        cb.like(cb.lower(root.get("slug")), "%" + query + "%"),
        cb.like(cb.lower(root.get("name")), "%" + query + "%"));
      spec = qSpec;
    }
    if (up != null) {
      org.springframework.data.jpa.domain.Specification<Site> statusSpec = (root, cq, cb) -> {
        var latestAt = cq.subquery(java.time.Instant.class);
        var h2 = latestAt.from(sh.dockside.api.health.HealthCheck.class);
        latestAt.select(cb.greatest(h2.<java.time.Instant>get("checkedAt")));
        latestAt.where(cb.equal(h2.get("site").get("id"), root.get("id")));

        var latestIsUp = cq.subquery(Boolean.class);
        var lh = latestIsUp.from(sh.dockside.api.health.HealthCheck.class);
        latestIsUp.select(lh.get("up"));
        latestIsUp.where(
          cb.equal(lh.get("site").get("id"), root.get("id")),
          cb.equal(lh.get("checkedAt"), latestAt),
          cb.equal(lh.get("up"), true));

        return Boolean.TRUE.equals(up)
          ? cb.exists(latestIsUp)
          : cb.not(cb.exists(latestIsUp));
      };
      spec = spec == null ? statusSpec : spec.and(statusSpec);
    }
    return spec;
  }

  private Boolean parseStatus(String value) {
    return switch (value) {
      case "up" -> Boolean.TRUE;
      case "down" -> Boolean.FALSE;
      default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "bad status");
    };
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
