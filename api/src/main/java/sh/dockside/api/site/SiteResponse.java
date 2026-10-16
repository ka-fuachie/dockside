package sh.dockside.api.site;

import java.time.Instant;

import sh.dockside.api.health.HealthCheck;

public record SiteResponse(
  Long id,
  String slug,
  String name,
  Integer currentVersion,
  Instant createdAt,
  Boolean up,
  Instant checkedAt
) {
  public static SiteResponse from(Site s) {
    return from(s, null);
  }

  public static SiteResponse from(Site s, HealthCheck h) {
    return new SiteResponse(
      s.getId(),
      s.getSlug(),
      s.getName(),
      s.getCurrentVersion(),
      s.getCreatedAt(),
      h == null ? null : h.getUp(),
      h == null ? null : h.getCheckedAt()
    );
  }
}
