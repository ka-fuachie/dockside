package sh.dockside.api.site;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CreateSiteRequest(
  @NotBlank @Pattern(regexp = "[a-z0-9-]+") String slug,
  @NotBlank String name
){}
