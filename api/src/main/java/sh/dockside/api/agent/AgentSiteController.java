package sh.dockside.api.agent;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import sh.dockside.api.site.SiteRepository;


@RestController
@RequestMapping("/agent/sites")
@SecurityRequirement(name = "agentToken")
public class AgentSiteController {
  private final SiteRepository sites;

  public AgentSiteController(SiteRepository sites) {
    this.sites = sites;
  }

  @GetMapping
  public List<AgentSite> list() {
    return sites.findAll().stream()
      .map(AgentSite::from)
      .toList();
  }
}
