package sh.dockside.api.agent;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import sh.dockside.api.deployment.DeploymentRepository;
import sh.dockside.api.deployment.DeploymentResponse;
import sh.dockside.api.deployment.DeploymentStatus;
import sh.dockside.api.incident.Incident;
import sh.dockside.api.incident.IncidentRepository;

@RestController
@RequestMapping("/agent")
@SecurityRequirement(name = "agentToken")
public class AgentController {
  private final DeploymentRepository deployments;
  private final IncidentRepository incidents;

  public AgentController(DeploymentRepository deployments, IncidentRepository incidents) {
    this.deployments = deployments;
    this.incidents = incidents;
  }

  @GetMapping("/next-job")
  public ResponseEntity<DeploymentResponse> nextJob() {
    var deployment = deployments.findFirstByStatusOrderByCreatedAtAsc(DeploymentStatus.running);
    if(deployment.isEmpty()) return ResponseEntity.noContent().build();
    return ResponseEntity.ok(DeploymentResponse.from(deployment.get()));
  }

  @PostMapping("/deployments/{deploymentId}/result")
  @Transactional
  public DeploymentResponse result(
    @PathVariable Long deploymentId,
    @Valid @RequestBody ResultRequest body
  ) {
    var deployment = deployments.findById(deploymentId)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "deployment not found"));

    if(Boolean.TRUE.equals(body.success())) {
      deployment.setStatus(DeploymentStatus.success);
    } else {
      deployment.setStatus(DeploymentStatus.failed);
      var incident = new Incident();
      incident.setDeployment(deployment);
      incident.setSite(deployment.getSite());
      incident.setReason("deploy failed");
      incident.setLogs(body.logs());
      incidents.save(incident);
    }

    return DeploymentResponse.from(deployments.save(deployment));
  }
}
