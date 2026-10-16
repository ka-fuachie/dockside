package sh.dockside.api.agent;

import sh.dockside.api.site.Site;

public record AgentSite(Long id, String slug) {
  static AgentSite from(Site site) {
    return new AgentSite(site.getId(), site.getSlug());
  }
}
