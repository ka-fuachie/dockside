# web

SolidJS 2.0 SSR dashboard for site list/detail, deployments with incident logs, rollback, user management.

## Architecture

The app is server-rendered: every API request is made by the web backend, so tokens and secrets never reach the client.

API calls go over the Docker network in prod (api & web are peers behind Nginx), which keeps them fast and off the public internet.

Live data is periodic polling (Solid Router `liveQuery` with server-side polling producers) to keep the UI showing fresh data.

## Development

```bash
pnpm dev:web    # from the repo root
```
