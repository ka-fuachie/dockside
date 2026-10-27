package sh.dockside.api.user;

import jakarta.validation.constraints.NotNull;

public record ChangeRoleRequest(
  @NotNull Role role
) {}
