package sh.dockside.api.health;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record HealthReportRequest(
  @NotNull Boolean up,
  @NotNull @Min (0) Integer latencyMs,
  @Min(0) Integer bytes
) {}
