package sh.dockside.api.site;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface SiteRepository extends JpaRepository<Site, Long> {
  Optional<Site> findBySlug(String slug);

  boolean existsBySlug(String slug);

  @Query("""
      SELECT s FROM Site s
      LEFT JOIN sh.dockside.api.health.HealthCheck h
        ON h.site.id = s.id
        AND h.checkedAt = (SELECT MAX(h2.checkedAt) FROM sh.dockside.api.health.HealthCheck h2
                           WHERE h2.site.id = s.id)
      WHERE (:q IS NULL OR LOWER(s.slug) LIKE CONCAT('%', :q, '%')
             OR LOWER(s.name) LIKE CONCAT('%', :q, '%'))
        AND (:up IS NULL
             OR (:up = TRUE AND h.up = TRUE)
             OR (:up = FALSE AND (h.up = FALSE OR h.id IS NULL)))
      """)
  Page<Site> search(String q, Boolean up, Pageable pageable);
}
