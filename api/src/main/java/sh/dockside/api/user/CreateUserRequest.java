package sh.dockside.api.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateUserRequest(
  @NotBlank String username,
  @NotBlank String password,
  @NotNull Role role
) {}
