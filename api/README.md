# api

Spring Boot REST API. Owns the database, auth, and the deployment queue.

## Technologies

Java 25, Spring Boot, Maven.

- **JPA / Hibernate** for persistence, entities for sites, deployments, users, incidents, health checks.
- **Flyway** for schema migrations, each change is versioned under `src/main/resources/db/migration/`.
- **Spring Security** with BCrypt password hashing and JWT. Role-based: `ADMIN` manages users and sites, `DEV` only deploys and rolls back.
- **springdoc** for OpenAPI, served at `/v3/api-docs` when running.
- Uniform errors (`{ code, message, fields }`) via a `@ControllerAdvice`.

Tests are JUnit with Testcontainers. Each suite spins up a real Postgres container in Docker and runs the app against it; nothing is mocked. Requires Docker to run.

## Commands

```bash
pnpm start:api    # from repo root, runs ./mvnw spring-boot:run
pnpm test:api     # runs ./mvnw test
```
