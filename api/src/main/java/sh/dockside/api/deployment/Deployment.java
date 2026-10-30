package sh.dockside.api.deployment;

import java.time.Instant;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.*;
import sh.dockside.api.site.Site;
import sh.dockside.api.user.User;

@Entity
@Table(name = "deployments",
  uniqueConstraints = @UniqueConstraint(columnNames = {"site_id", "version"}))
public class Deployment {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "site_id", nullable = false)
  private Site site;

  @ManyToOne(fetch = FetchType.LAZY, optional = true)
  @JoinColumn(name = "created_by")
  private User createdBy;

  @Column(nullable = false)
  private Integer version;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private DeploymentStatus status;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private JobType jobType = JobType.build;

  @Column(name = "artifact_path", nullable = false)
  private String artifactPath;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "config_json", nullable = false, columnDefinition = "jsonb")
  private String configJson = "{}";

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void prePersist() {
    if (createdAt == null) createdAt = Instant.now();
  }

  public Long getId() { return id; }
  public Site getSite() { return site; }
  public User  getCreatedBy() { return createdBy; }
  public Integer getVersion() { return version; }
  public DeploymentStatus getStatus() { return status; }
  public JobType getJobType() { return jobType; }
  public String getArtifactPath() { return artifactPath; }
  public String getConfigJson() { return configJson; }
  public Instant getCreatedAt() { return createdAt; }

  public void setSite(Site site) { this.site = site; }
  public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
  public void setVersion(Integer version) { this.version = version; }
  public void setStatus(DeploymentStatus status) { this.status = status; }
  public void setJobType(JobType jobType) { this.jobType = jobType; }
  public void setArtifactPath(String artifactPath) { this.artifactPath = artifactPath; }
  public void setConfigJson(String configJson) { this.configJson = configJson; }
}
