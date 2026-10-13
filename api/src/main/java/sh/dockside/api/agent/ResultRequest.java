package sh.dockside.api.agent;

import jakarta.validation.constraints.NotNull;

public record ResultRequest(@NotNull Boolean success, String logs) {}
