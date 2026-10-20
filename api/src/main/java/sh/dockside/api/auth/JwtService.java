package sh.dockside.api.auth;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import sh.dockside.api.user.Role;

@Service
public class JwtService {
  public final SecretKey key;
  public final long accessMs;
  public final long refreshMs;

  public JwtService(
    @Value("${jwt.secret}") String secret,
    @Value("${jwt.access-minutes}") long accessMinutes,
    @Value("${jwt.refresh-days}") long refreshDays
  ) {
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.accessMs = accessMinutes * 60 * 1000;
    this.refreshMs = refreshDays * 24 * 60 * 60 * 1000;
  }

  public String accessToken(String username, Role role) {
    return build(username, role, accessMs);
  }

  public String refreshToken(String username) {
    return build(username, null, refreshMs);
  }

  private String build(String username, Role role, long ttl) {
    var b = Jwts.builder()
      .subject(username)
      .id(UUID.randomUUID().toString())
      .issuedAt(new Date())
      .expiration(new Date(System.currentTimeMillis() + ttl));
    if (role != null) b.claim("role", role.name());

    return b.signWith(key).compact();
  }

  public String username(String token) {
    return Jwts.parser()
      .verifyWith(key)
      .build()
      .parseSignedClaims(token)
      .getPayload()
      .getSubject();
  }
}
