CREATE TABLE health_checks (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_id BIGINT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  up BOOLEAN NOT NULL,
  latency_ms INT NOT NULL,
  bytes INT NOT NULL DEFAULT 0,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_health_site_time ON health_checks (site_id, checked_at DESC);
