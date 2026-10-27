package sh.dockside.api.user;

import java.time.Instant;

public record UserResponse(
  Long id,
  String username,
  Role role,
  Instant createdAt
) {
  static UserResponse from(User u) {
    return new UserResponse(u.getId(), u.getUsername(), u.getRole(), u.getCreatedAt());
  }
}
