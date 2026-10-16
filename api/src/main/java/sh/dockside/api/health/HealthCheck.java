package sh.dockside.api.health;

import java.time.Instant;

import jakarta.persistence.*;
import sh.dockside.api.site.Site;

@Entity
@Table (name = "health_checks")
public class HealthCheck {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "site_id", nullable = false)
  private Site site;

  @Column(nullable = false)
  private Boolean up;

  @Column(name = "latency_ms", nullable = false)
  private Integer latencyMs;

  @Column(nullable = false)
  private Integer bytes = 0;

  @Column(name = "checked_at", nullable = false, updatable = false)
  private Instant checkedAt;

  @PrePersist
  void prePersist() {
    if (checkedAt == null) checkedAt = Instant.now();
  }

  public Long getId() { return id; }
  public Boolean getUp() { return up; }
  public Integer getLatencyMs() { return latencyMs; }
  public Integer getBytes() { return bytes; }
  public Instant getCheckedAt() { return checkedAt; }

  public void setSite(Site site) { this.site = site; }
  public void setUp(Boolean up) { this.up = up; }
  public void setLatencyMs(Integer latencyMs) { this.latencyMs = latencyMs; }
  public void setBytes(Integer bytes) { this.bytes = bytes; }
}
