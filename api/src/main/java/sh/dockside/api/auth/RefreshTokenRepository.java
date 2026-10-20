package sh.dockside.api.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
  Optional<RefreshToken> findByTokenHash(String tokenHash);

  int deleteByExpiresAtLessThanEqual(Instant cutoff);

  default String hash(String raw) throws NoSuchAlgorithmException {
    var digest = MessageDigest.getInstance("SHA-256");
    return HexFormat.of().formatHex(digest.digest(raw.getBytes(StandardCharsets.UTF_8)));
  }
}
