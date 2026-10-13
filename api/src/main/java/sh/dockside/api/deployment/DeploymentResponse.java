package sh.dockside.api.deployment;

import java.time.Instant;

public record DeploymentResponse(
  Long id,
  Long siteId,
  Integer version,
  DeploymentStatus status,
  Instant createdAt
) {
  static DeploymentResponse from(Deployment d) {
    return new DeploymentResponse(
      d.getId(),
      d.getSite().getId(),
      d.getVersion(),
      d.getStatus(),
      d.getCreatedAt()
    );
  }
}
