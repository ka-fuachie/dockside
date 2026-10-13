package sh.dockside.api.site;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
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

@RestController
@RequestMapping("/sites")
@SecurityRequirement(name = "bearerAuth")
public class SiteController {
  private final SiteRepository sites;

  public SiteController(SiteRepository sites) {
    this.sites = sites;
  }

  @GetMapping
  public Page<SiteResponse> list(Pageable pageable) {
    return sites.findAll(pageable).map(SiteResponse::from);
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
    return SiteResponse.from(sites.save(site));
  }

  @GetMapping("/{id}")
  public SiteResponse one(@PathVariable Long id) {
    var site = sites.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "site not found"));
    return SiteResponse.from(site);
  }
}
