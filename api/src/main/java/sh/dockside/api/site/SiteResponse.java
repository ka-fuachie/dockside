package sh.dockside.api.site;

import java.time.Instant;

import sh.dockside.api.deployment.Deployment;
import sh.dockside.api.deployment.DeploymentStatus;
import sh.dockside.api.health.HealthCheck;

public record SiteResponse(
  Long id,
  String slug,
  String name,
  Integer currentVersion,
  Instant createdAt,
  Boolean up,
  Instant checkedAt,
  String createdByUsername,
  Latest latestDeployment
) {
  public record Latest(Integer version, DeploymentStatus status, Instant createdAt) {}

  public static SiteResponse from(Site s) {
    return from(s, null, null);
  }

  public static SiteResponse from(Site s, HealthCheck h) {
    return from(s, h, null);
  }

  public static SiteResponse from(Site s, HealthCheck h, Deployment latest) {
    return new SiteResponse(
      s.getId(),
      s.getSlug(),
      s.getName(),
      s.getCurrentVersion(),
      s.getCreatedAt(),
      h == null ? null : h.getUp(),
      h == null ? null : h.getCheckedAt(),
      s.getCreatedBy() != null ? s.getCreatedBy().getUsername(): null,
      latest == null ? null : new Latest(latest.getVersion(), latest.getStatus(), latest.getCreatedAt())
    );
  }
}
