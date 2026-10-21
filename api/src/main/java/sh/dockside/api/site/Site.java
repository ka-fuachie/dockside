package sh.dockside.api.site;

import jakarta.persistence.*;
import sh.dockside.api.user.User;

import java.time.Instant;

@Entity
@Table(name="sites")
public class Site {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String slug;

  @Column(nullable = false)
  private String name;

  @ManyToOne(fetch = FetchType.LAZY, optional = true)
  @JoinColumn(name = "created_by")
  private User createdBy;

  @Column(name = "current_version")
  private Integer currentVersion;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void prePersist() {
    if (createdAt == null) createdAt = Instant.now();
  }

  public Long getId() { return id; }
  public String getSlug() { return slug; }
  public String getName() { return name; }
  public User getCreatedBy() { return createdBy; }
  public Integer getCurrentVersion() { return currentVersion; }
  public Instant getCreatedAt() { return createdAt; }

  public void setSlug(String slug) { this.slug = slug; }
  public void setName(String name) { this.name = name; }
  public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
  public void setCurrentVersion(Integer currentVersion) { this.currentVersion = currentVersion; }
}
