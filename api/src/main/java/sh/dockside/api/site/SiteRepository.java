package sh.dockside.api.site;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SiteRepository extends JpaRepository<Site, Long> {
  Optional<Site> findBySlug(String slug);

  boolean existsBySlug(String slug);
}
