CREATE TABLE users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN('ADMIN', 'DEV')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sites (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  current_version INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE deployments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_id BIGINT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  version INT NOT NULL,
  status TEXT NOT NULL CHECK (status IN('running', 'success', 'failed')),
  artifact_path TEXT NOT NULL,
  config_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, version)
);

CREATE INDEX idx_deployments_sites ON deployments (site_id);

CREATE TABLE incidents (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  deployment_id BIGINT NOT NULL REFERENCES deployments (id) ON DELETE CASCADE,
  site_id BIGINT NOT NULL REFERENCES sites (id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  logs TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
