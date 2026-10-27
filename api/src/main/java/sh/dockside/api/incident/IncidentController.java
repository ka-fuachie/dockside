package sh.dockside.api.incident;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import sh.dockside.api.deployment.DeploymentRepository;

@RestController
@RequestMapping("/deployments/{deploymentId}/incidents")
@SecurityRequirement(name = "bearerAuth")
public class IncidentController {
  private final IncidentRepository incidents;
  private final DeploymentRepository deployments;

  public IncidentController(
    IncidentRepository incidents,
    DeploymentRepository deployments
  ) {
    this.incidents = incidents;
    this.deployments = deployments;
  }

  public record IncidentResponse(
    Long id,
    Long deploymentId,
    Long siteId,
    String reason,
    String logs,
    Instant resolvedAt,
    Instant createdAt
  ) {
    public static IncidentResponse from(Incident i) {
      return new IncidentResponse(
        i.getId(),
        i.getDeployment().getId(),
        i.getSite().getId(),
        i.getReason(),
        i.getLogs(),
        i.getResolvedAt(),
        i.getCreatedAt()
      );
    }
  }

  @GetMapping
  public List<IncidentResponse> list(@PathVariable Long deploymentId) {
    if (!deployments.existsById(deploymentId)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "deployment not found");
    }
    return incidents.findByDeploymentIdOrderByCreatedAtDesc(deploymentId)
      .stream().map(IncidentResponse::from).toList();
  }
}
