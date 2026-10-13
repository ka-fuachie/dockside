package sh.dockside.api.site;

import java.time.Instant;

public record SiteResponse(
  Long id,
  String slug,
  String name,
  Integer currentVersion,
  Instant createdAt
) {
  public static SiteResponse from(Site s) {
    return new SiteResponse(
      s.getId(),
      s.getSlug(),
      s.getName(),
      s.getCurrentVersion(),
      s.getCreatedAt()
    );
  }
}
