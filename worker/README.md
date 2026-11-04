# worker

Node TS daemon that does the actual deploying. It polls the api for queued jobs, publishes artifacts as versioned directories, and symlinks the `current` directory to the latest version. Deployments work without reloading nginx.

It also handles rollbacks by just repointing the `current` directory to the version to rollback to without having to redeploy that version.

Failures of any kind are reported back to the api with a log tail, which become incidents (visible on the dashboard and via the CLI). A separate loop health-checks every site (`up`, latency, bytes) and exposes Prometheus metrics.

## Development

```bash
pnpm dev:worker   # from repo root
```
