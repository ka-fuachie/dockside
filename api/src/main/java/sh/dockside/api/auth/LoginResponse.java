package sh.dockside.api.auth;

public record LoginResponse(
  String accessToken,
  String refreshToken
) {}
