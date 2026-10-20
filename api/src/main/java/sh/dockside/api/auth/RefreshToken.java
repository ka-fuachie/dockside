package sh.dockside.api.auth;

import java.time.Instant;

import jakarta.persistence.*;

@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Column(name = "token_hash", nullable = false, unique = true)
  private String tokenHash;

  @Column(name = "expires_at", nullable = false)
  private Instant expiresAt;

  @Column(name = "revoked_at")
  private Instant revokedAt;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void prePersist() {
    if(createdAt == null) createdAt = Instant.now();
  }

  public String getTokenHash() { return tokenHash; }

  public static RefreshToken issue(Long userId, String tokenHash, long ttlMs) {
    var t = new RefreshToken();
    t.userId = userId;
    t.tokenHash = tokenHash;
    t.expiresAt = Instant.now().plusMillis(ttlMs);
    return t;
  }

  public boolean isLive() {
    return revokedAt == null && Instant.now().isBefore(expiresAt);
  }
  public void revoke() { revokedAt = Instant.now(); }
}
