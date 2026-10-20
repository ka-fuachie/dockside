package sh.dockside.api.auth;

import java.security.NoSuchAlgorithmException;
import java.time.Instant;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import sh.dockside.api.user.UserRepository;

@Service
public class AuthService {
  private final UserRepository users;
  private final RefreshTokenRepository tokens;
  private final PasswordEncoder passwords;
  private final JwtService jwt;

  public AuthService(UserRepository users, RefreshTokenRepository tokens, PasswordEncoder passwords, JwtService jwt) {
    this.users = users;
    this.tokens = tokens;
    this.passwords = passwords;
    this.jwt = jwt;
  }

  @Transactional
  public LoginResponse login(String username, String rawPassword) {
    tokens.deleteByExpiresAtLessThanEqual(Instant.now());
    var user = users.findByUsername(username)
      .orElseThrow(() -> new BadCredentialsException("bad login"));
    if (!passwords.matches(rawPassword, user.getPasswordHash())) {
      throw new BadCredentialsException("bad login");
    }

    try {
      var refreshToken = jwt.refreshToken(user.getUsername());
      tokens.save(RefreshToken.issue(user.getId(), tokens.hash(refreshToken), jwt.refreshMs));
      return new LoginResponse(
        jwt.accessToken(user.getUsername(), user.getRole()),
        refreshToken
      );
    } catch(NoSuchAlgorithmException err) {
      throw new IllegalStateException(err);
    }
  }

  @Transactional
  public LoginResponse refresh(String refreshToken) {
    try {
      var storedToken = tokens.findByTokenHash(tokens.hash(refreshToken))
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid refresh"));
      if (!storedToken.isLive()) {
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid refresh");
      }

    var username = jwt.username(refreshToken);
    var user = users.findByUsername(username)
      .orElseThrow(() -> new BadCredentialsException("bad login"));

      var newRefreshToken = jwt.refreshToken(user.getUsername());
      storedToken.revoke();
      tokens.save(RefreshToken.issue(user.getId(), tokens.hash(newRefreshToken), jwt.refreshMs));
      return new LoginResponse(
        jwt.accessToken(user.getUsername(), user.getRole()),
        newRefreshToken
      );
    } catch(NoSuchAlgorithmException err) {
      throw new IllegalStateException(err);
    }
  }

  @Transactional
  public void logout(String refreshToken) {
    try {
      var hash = tokens.hash(refreshToken);
      tokens.findByTokenHash(hash).ifPresent(RefreshToken::revoke);
    } catch (NoSuchAlgorithmException err) {
      throw new IllegalStateException(err);
    }
  }
}
