package sh.dockside.api.agent;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
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
import sh.dockside.api.deployment.DeploymentResponse;
import sh.dockside.api.deployment.DeploymentStatus;
import sh.dockside.api.incident.Incident;
import sh.dockside.api.incident.IncidentRepository;
import sh.dockside.api.site.SiteRepository;
import sh.dockside.api.site.SiteResponse;

@RestController
@RequestMapping("/agent")
@SecurityRequirement(name = "agentToken")
public class AgentController {
  private final DeploymentRepository deployments;
  private final IncidentRepository incidents;
  private final SiteRepository sites;
  private final Path uploadDir;

  public AgentController(
    DeploymentRepository deployments,
    IncidentRepository incidents,
    SiteRepository sites,
    @Value("${app.upload-dir}") String uploadDir
  ) {
    this.deployments = deployments;
    this.incidents = incidents;
    this.sites = sites;
    this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
  }

  @GetMapping("/next-job")
  public ResponseEntity<DeploymentResponse> nextJob() {
    var deployment = deployments.findFirstByStatusOrderByCreatedAtAsc(DeploymentStatus.running);
    if(deployment.isEmpty()) return ResponseEntity.noContent().build();
    return ResponseEntity.ok(DeploymentResponse.from(deployment.get()));
  }

  @GetMapping("/deployments/{deploymentId}/artifact")
  public ResponseEntity<Resource> artifact(@PathVariable Long deploymentId) throws IOException {
    var deployment = deployments.findById(deploymentId)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "deployment not found"));

    var path = Paths.get(deployment.getArtifactPath()).toAbsolutePath().normalize();

    if (!path.startsWith(uploadDir) || !Files.isRegularFile(path)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "artifact not found");
    }

    var resource = new FileSystemResource(path);
    return ResponseEntity.ok()
      .contentType(MediaType.parseMediaType("application/zip"))
      .header(HttpHeaders.CONTENT_DISPOSITION,
        "attachment; filename=\"" + path.getFileName() + "\"")
      .contentLength(Files.size(path))
      .body(resource);
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

  @PostMapping("/deployments/{deploymentId}/activate")
  @Transactional
  public SiteResponse activate(@PathVariable Long deploymentId) {
    var deployment = deployments.findById(deploymentId)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "deployment not found"));

    deployment.setStatus(DeploymentStatus.success);
    var site = deployment.getSite();
    site.setCurrentVersion(deployment.getVersion());
    return SiteResponse.from(sites.save(site));
  }
}
