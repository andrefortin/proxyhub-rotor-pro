# Feature: Implement Dashboard API Endpoints

## Metadata

issue_number: `1`
adw_id: `1`
issue_json: `{"title": "Implement dashboard endpoints", "body": "implement the endpoint needed in the api module to handle our dashboard page : fetch('/v1/pools/stats').then(r => r.ok ? r.json() : Promise.reject(r)), fetch('/v1/usage/summary').then(r => r.ok ? r.json() : Promise.reject(r)), fetch('/v1/proxies/count').then(r => r.ok ? r.json() : { count: 0 }), fetch('/v1/proxies/stats').then(r => r.ok ? r.json() : { avgScore: 85 })"}`

## Feature Description

This feature implements the necessary API endpoints required for the admin dashboard to fetch and display key statistics. The endpoints will provide data on pool statistics, usage summary, proxy counts, and proxy statistics (e.g., average score). These endpoints will enable the dashboard to load real-time data for monitoring proxies, pools, and overall system usage, improving administrative oversight and decision-making in the ProxyHub Rotator Pro application.

## User Story

As a system administrator
I want to fetch dashboard statistics via API endpoints
So that I can view real-time insights into pools, usage, and proxies on the admin UI without manual intervention.

## Problem Statement

The admin dashboard currently lacks backend API endpoints to support data fetching for pools stats, usage summary, proxy counts, and proxy stats. The frontend attempts to call `/v1/pools/stats`, `/v1/usage/summary`, `/v1/proxies/count`, and `/v1/proxies/stats`, but these do not exist, leading to failed requests and incomplete dashboard functionality.

## Solution Statement

Introduce new controller methods in the existing API modules (primarily under `modules/proxies` and potentially a new `modules/pools` or `modules/usage`) to handle the specified GET requests. Leverage Prisma for database queries to aggregate and compute the required statistics from the `Proxy` and related tables. Ensure responses match the expected JSON structures from the frontend fetches (e.g., for `/v1/proxies/count` return `{ count: number }`, for `/v1/proxies/stats` return `{ avgScore: number }`). Follow NestJS patterns observed in existing controllers like `proxies.controller.ts` and `providers.controller.ts`, using services for business logic.

## Relevant Files

Use these files to implement the feature:

- `README.md`: Provides project overview, API examples, and integration details for proxies, providers, and usage tracking.
- `apps/packages/api/src/modules/proxies/proxies.controller.ts`: Existing controller for proxy-related endpoints; extend with `/count` and `/stats` routes.
- `apps/packages/api/src/modules/proxies/proxies.service.ts`: (Inferred from controller imports) Service layer for proxy operations; add methods for count, stats, and aggregations.
- `apps/packages/api/src/main.ts` or `app.module.ts`: To ensure Prisma client injection and module registration if new modules are added.
- `apps/packages/api/prisma/schema.prisma`: Database schema defining `Proxy`, `Provider`, and any usage-related models for querying stats.
- `.claude/commands/conditional_docs.md`: Check for additional documentation needs, but no matching conditions (no UI changes, no new libs).

### New Files

- `apps/packages/api/src/modules/pools/pools.controller.ts`: New controller for `/v1/pools/stats` if pools require separate handling.
- `apps/packages/api/src/modules/pools/pools.service.ts`: Service for pool statistics aggregation.
- `apps/packages/api/src/modules/usage/usage.controller.ts`: New controller for `/v1/usage/summary`.
- `apps/packages/api/src/modules/usage/usage.service.ts`: Service for summarizing usage metrics.

## Implementation Plan

### Phase 1: Foundation

Review existing codebase structure, Prisma schema, and current proxy/provider models to understand data sources for stats. Ensure Prisma is set up for aggregations (e.g., count, avg). If needed, add indexes to schema for performance on large proxy tables.

### Phase 2: Core Implementation

Implement services for each endpoint: query database for pool stats (e.g., proxies per pool), usage summary (e.g., active proxies, uptime), proxy count (simple count query), and proxy stats (average score, perhaps top performers). Create controllers to expose these as GET endpoints under `/v1/`.

### Phase 3: Integration

Integrate with existing auth/middleware if required (e.g., admin-only access). Update any shared utilities or Prisma extensions. Test endpoints with sample data to match frontend expectations.

## Step by Step Tasks

### Research and Setup

- Read `apps/packages/api/prisma/schema.prisma` to confirm models for Proxy, Provider, Pool (if exists), and any usage logs.
- Read `apps/packages/api/src/modules/proxies/proxies.service.ts` to understand existing query patterns.
- If pools are not explicitly modeled, plan to group proxies by `pool` field in queries.
- Read `.env` or config for any usage tracking mechanisms (e.g., Redis for sessions, logs for usage).

### Implement Proxy Endpoints

- In `apps/packages/api/src/modules/proxies/proxies.service.ts`, add `getProxyCount()` method: Use `prisma.proxy.count({})` for total count.
- Add `getProxyStats()` method: Use `prisma.proxy.aggregate({ _avg: { score: true } })` and format as `{ avgScore: number }`.
- In `proxies.controller.ts`, add `@Get('count')` returning `{ count }` and `@Get('stats')` returning stats object.
- Test queries with sample data to ensure efficiency.

### Implement Pools and Usage Endpoints

- Create new module `apps/packages/api/src/modules/pools/` if needed: Generate controller and service using NestJS patterns.
- In pools service, add `getPoolsStats()`: Group proxies by pool, count per pool, perhaps total proxies, active ones; return array of { pool: string, count: number, avgScore: number }.
- Create `apps/packages/api/src/modules/usage/usage.service.ts`: Query for usage summary, e.g., total requests, unique sessions, or from logs/Redis; format as summary object (e.g., { totalUsage: number, period: 'daily' }).
- Add corresponding controllers: `@Controller('v1/pools')` with `@Get('stats')`, and `@Controller('v1/usage')` with `@Get('summary')`.
- Register new modules in `app.module.ts` if created.

### Testing

- Add unit tests in `__tests__` or existing test files: Mock Prisma for each service method, assert response shapes.
- Run integration tests: Use Supertest to call endpoints and verify 200 OK with correct data.

### Final Validation

- Execute validation commands to ensure no regressions.

## Testing Strategy

### Unit Tests

- Test `getProxyCount()`: Verify returns total proxy count; edge case: empty DB returns 0.
- Test `getProxyStats()`: Verify averages score; handle no proxies gracefully.
- Test pool/usage services: Mock data for grouped counts and summaries; test error handling for invalid pools.

### Edge Cases

- No proxies in DB: Endpoints should return { count: 0 }, { avgScore: null or 0 }, empty pools array.
- Large datasets: Ensure queries use efficient aggregations, test with limit if needed.
- Auth failures: If endpoints require admin role, test 401 responses.
- Invalid params: Though GET, test query param handling if added later.

## Acceptance Criteria

- `/v1/proxies/count` returns `{ count: number }` with total proxies.
- `/v1/proxies/stats` returns `{ avgScore: number }` (or similar stats).
- `/v1/pools/stats` returns array of pool statistics (e.g., [{ pool: 'default', count: 100, avgScore: 85 }]).
- `/v1/usage/summary` returns usage metrics object (e.g., { totalRequests: 500, activeUsers: 10 }).
- All endpoints respond in <500ms with sample data.
- No errors in server logs; integrates with existing Prisma setup.
- Frontend fetches succeed without rejects (simulate in tests).

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

- `cd apps/packages/api && npx prisma generate` - Regenerate Prisma client after any schema tweaks.
- `docker compose up --build api` - Start API in dev mode.
- Use curl or Postman: `curl http://localhost:3000/v1/proxies/count` expects { "count": X }, similarly for other endpoints.
- `cd apps/packages/api && npm run test` - Run all tests, ensure 100% pass including new ones.
- `cd apps/packages/admin && bun run dev` - Start admin UI, navigate to dashboard, verify data loads without errors in console.
- Read `.claude/commands/test_e2e.md`, then read and execute `.claude/commands/e2e/test_dashboard-endpoints.md` to validate this functionality works.

- `cd apps/packages/api && uv run pytest` - Run server tests to validate the feature works with zero regressions (if pytest setup exists; fallback to npm test).
- `cd apps/packages/admin && bun tsc --noEmit` - Run frontend tests to validate the feature works with zero regressions.
- `cd apps/packages/admin && bun run build` - Run frontend build to validate the feature works with zero regressions.

## Notes

- If usage summary requires new data tracking (e.g., request logs), consider adding a simple Prisma model or use existing webhook/events.
- No new libraries needed; use built-in Prisma aggregations.
- Ensure endpoints are protected if admin-only; check existing auth guards.
- For pools stats, assume pooling by `pool` field in Proxy model; adjust if different.
- Future: Add caching (Redis) for stats if query performance issues arise.