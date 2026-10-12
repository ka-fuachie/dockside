package sh.dockside.api.auth;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import sh.dockside.api.user.UserRepository;

@Service
public class AuthService {
  private final UserRepository users;
  private final PasswordEncoder passwords;
  private final JwtService jwt;

  public AuthService(UserRepository users, PasswordEncoder passwords, JwtService jwt) {
    this.users = users;
    this.passwords = passwords;
    this.jwt = jwt;
  }

  public LoginResponse login(String username, String rawPassword) {
    // hash password, compare to db
    var user = users.findByUsername(username)
      .orElseThrow(() -> new BadCredentialsException("bad login"));
    if (!passwords.matches(rawPassword, user.getPasswordHash())) {
      throw new BadCredentialsException("bad login");
    }

    return new LoginResponse(
      jwt.accessToken(user.getUsername(), user.getRole()),
      jwt.refreshToken(user.getUsername())
    );
  }

  public LoginResponse refresh(String refreshToken) {
    var username = jwt.username(refreshToken);
    var user = users.findByUsername(username)
      .orElseThrow(() -> new BadCredentialsException("bad login"));
    return new LoginResponse(
      jwt.accessToken(user.getUsername(), user.getRole()),
      refreshToken
    );
  }
}
