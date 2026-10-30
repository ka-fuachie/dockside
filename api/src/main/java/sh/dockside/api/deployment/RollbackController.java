package sh.dockside.api.deployment;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import sh.dockside.api.site.SiteResponse;

@RestController
@RequestMapping("/deployments")
@SecurityRequirement (name = "bearerAuth")
public class RollbackController {
  private final DeploymentRepository deployments;

  public RollbackController(DeploymentRepository deployments) {
    this.deployments = deployments;
  }

  @PostMapping("/{id}/rollback")
  @Transactional
  public SiteResponse rollback(@PathVariable Long id) {
    var deployment = deployments.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "deployment not found"));
    if (deployment.getStatus() != DeploymentStatus.success) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "only success builds are rollback-eligible");
    }
    if (deployments.existsBySiteIdAndStatusAndIdNot(deployment.getSite().getId(), DeploymentStatus.running, id)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "site has a deployment in progress");
    }

    deployment.setJobType(JobType.repoint);
    deployment.setStatus(DeploymentStatus.running);
    deployments.save(deployment);

    var site = deployment.getSite();
    var latest = deployments.findFirstBySiteIdOrderByVersionDesc(site.getId()).orElse(null);
    return SiteResponse.from(site, null, latest);
  }
}
