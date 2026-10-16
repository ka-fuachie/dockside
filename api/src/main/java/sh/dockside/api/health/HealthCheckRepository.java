package sh.dockside.api.health;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface HealthCheckRepository extends JpaRepository<HealthCheck, Long> {
  Optional<HealthCheck> findTopBySiteIdOrderByCheckedAtDesc(Long siteId);
}
