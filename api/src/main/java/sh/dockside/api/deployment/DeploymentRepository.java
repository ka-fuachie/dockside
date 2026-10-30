package sh.dockside.api.deployment;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeploymentRepository extends JpaRepository<Deployment, Long> {
  Optional<Deployment> findFirstBySiteIdOrderByVersionDesc(Long siteId);

  Page<Deployment> findBySiteIdOrderByVersionDesc(Long siteId, Pageable pageable);

  Optional<Deployment> findFirstByStatusOrderByCreatedAtAsc(DeploymentStatus status);

  boolean existsBySiteIdAndStatusAndIdNot(Long siteId, DeploymentStatus status, Long id);
}
