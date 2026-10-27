package sh.dockside.api.deployment;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import sh.dockside.api.site.SiteRepository;
import sh.dockside.api.site.SiteResponse;

@RestController
@RequestMapping("/deployments")
@SecurityRequirement (name = "bearerAuth")
public class RollbackController {
  private final DeploymentRepository deployments;
  private final SiteRepository sites;

  public RollbackController(DeploymentRepository deployments, SiteRepository sites) {
    this.deployments = deployments;
    this.sites = sites;
  }

  @PostMapping("/{id}/rollback")
  @Transactional
  public SiteResponse rollback(@PathVariable Long id) {
    var deployment = deployments.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "deployment not found"));
    if (deployment.getStatus() != DeploymentStatus.success) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "only success builds are rollback-eligible");
    }

    var site = deployment.getSite();
    site.setCurrentVersion(deployment.getVersion());
    var latest = deployments.findFirstBySiteIdOrderByVersionDesc(site.getId()).orElse(null);
    return SiteResponse.from(sites.save(site), null, latest);
  }
}
