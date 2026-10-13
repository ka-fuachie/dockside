package sh.dockside.api.incident;

import java.time.Instant;

import jakarta.persistence.*;
import sh.dockside.api.deployment.Deployment;
import sh.dockside.api.site.Site;

@Entity
@Table(name = "incidents")
public class Incident {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "deployment_id", nullable = false)
  private Deployment deployment;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "site_id", nullable = false)
  private Site site;

  @Column(nullable = false)
  private String reason;

  @Column
  private String logs;

  @Column(name = "resolved_at")
  private Instant resolvedAt;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void prePersist() {
    if (createdAt == null) createdAt = Instant.now();
  }

  public Long getId() { return id; }

  public void setDeployment(Deployment deployment) { this.deployment = deployment; }
  public void setSite(Site site) { this.site = site; }
  public void setReason(String reason) { this.reason = reason; }
  public void setLogs(String logs) { this.logs = logs; }
}
