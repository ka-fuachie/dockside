package sh.dockside.api.deployment;

import java.time.Instant;

public record DeploymentResponse(
  Long id,
  Long siteId,
  String siteSlug,
  Integer version,
  DeploymentStatus status,
  JobType jobType,
  Instant createdAt,
  String createdByUsername
) {
  public static DeploymentResponse from(Deployment d) {
    return new DeploymentResponse(
      d.getId(),
      d.getSite().getId(),
      d.getSite().getSlug(),
      d.getVersion(),
      d.getStatus(),
      d.getJobType(),
      d.getCreatedAt(),
      d.getCreatedBy() != null ? d.getCreatedBy().getUsername(): null
    );
  }
}
