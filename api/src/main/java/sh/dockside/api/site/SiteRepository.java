package sh.dockside.api.site;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface SiteRepository extends JpaRepository<Site, Long>, JpaSpecificationExecutor<Site> {
  Optional<Site> findBySlug(String slug);

  boolean existsBySlug(String slug);
}
