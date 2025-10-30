# Feature: Add Pagination to API GET Endpoints

## Metadata

issue_number: `8`
adw_id: `xyz789`
issue_json: `{}`

## Feature Description

The feature adds pagination support to all GET endpoints in the API module, allowing clients to retrieve data in paginated chunks rather than all at once. This improves performance for large datasets, reduces response times, and enhances scalability. Pagination will use standard query parameters like `page` (default 1) and `limit` (default 10, max 100) to compute `skip` and `take` values in Prisma queries. Total count will be included in responses for client-side pagination UI.

## User Story

As a API consumer (e.g., admin UI or external client)
I want to retrieve lists of resources (providers, proxies, usage stats) in paginated form
So that I can efficiently load and display large amounts of data without overwhelming the server or client.

## Problem Statement

Current GET endpoints either fetch all records (e.g., providers.findAll with fixed take:100) or apply ad-hoc limits (e.g., proxies limit up to 5000), leading to potential performance issues with growing data volumes. No consistent pagination mechanism exists, making it hard for clients to implement infinite scrolling or paginated tables in UIs.

## Solution Statement

Introduce a reusable pagination utility in services (e.g., compute skip/take from page/limit params). Update all relevant controllers to parse `page` and `limit` from queries and pass to services. Services will modify Prisma findMany calls to use skip/take and return { items: [], total: count } structure. Validate params (page >=1, 1<=limit<=100) and include total count via Prisma count query. This follows existing patterns like providers.getProviders which already supports pagination.

## Relevant Files

Use these files to implement the feature:

- `apps/packages/api/src/modules/providers/providers.controller.ts`: Update GET /v1/providers to accept page/limit params and call service with pagination.
- `apps/packages/api/src/modules/providers/providers.service.ts`: Enhance findAll to support pagination params; already has getProviders with skip/take - unify and add total count.
- `apps/packages/api/src/modules/proxies/proxies.controller.ts`: Update GET /v1/proxies to parse page/limit (in addition to existing limit) and pass to service.
- `apps/packages/api/src/modules/proxies/proxies.service.ts`: Modify listProxies to use skip/take instead of just take; add total count query for full list size (considering filters).
- `apps/packages/api/src/modules/usage/usage.controller.ts`: Update GET /usage/stats if it returns lists; assume it needs pagination for aggregated data.
- `apps/packages/api/src/modules/usage/usage.service.ts`: Add pagination logic to getStats if applicable (e.g., if returning daily usage events).
- `apps/packages/api/prisma/schema.prisma`: No changes needed, but reference models like Provider, Proxy, UsageDaily for query patterns.
- `README.md`: Update API documentation section to mention new pagination params for GET endpoints.

### New Files

None required; extend existing services/controllers.

## Implementation Plan

### Phase 1: Foundation

Create a shared pagination helper function or type in a common module to standardize param validation and response structure across services.

### Phase 2: Core Implementation

Update each service's list/fetch methods to incorporate pagination and total count. Then update controllers to extract and validate params.

### Phase 3: Integration

Ensure existing filters (e.g., pool, providerId, bbox in proxies) work with pagination. Test responses include total for client compatibility. Update README for API docs.

## Step by Step Tasks

### Research and Planning

- Review all GET endpoints in controllers (providers, proxies, usage, webhook, etc.) to identify which return lists needing pagination.
- Read existing service methods to understand current query patterns (e.g., providers.getProviders already has skip/take but not total).
- Define standard response format: { items: T[], total: number, page: number, limit: number }.

### Implement Shared Pagination Utility

- Create a new file `apps/packages/api/src/common/pagination.ts` with functions: validatePagination(page?: number, limit?: number) returning { skip: number, take: number } with defaults (page=1, limit=10, max=100).
- Export a PaginatedResponse<T> type: { items: T[], total: number, page: number, limit: number }.

### Update Providers Module

- In providers.service.ts: Modify findAll to accept pagination opts and search; use getProviders with added count: await prisma.provider.count({ where }) and wrap in PaginatedResponse.
- In providers.controller.ts: Extract page/limit/search from @Query(), validate via utility, call service.findAll(pagination, search), return response.

### Update Proxies Module

- In proxies.service.ts: Update listProxies to accept pagination {skip, take} in addition to query filters; compute count with same where clause (handle bbox/special filters in count query).
- In proxies.controller.ts: For @Get(), extract page/limit alongside existing q params, compute pagination, call service.listProxies({...q, pagination}), adjust sample endpoint if needed (no pagination for random sample).
- Handle special case for sample: Return fixed { items: rows, total: 200 } without real count.

### Update Usage Module

- In usage.service.ts: If getStats returns a list (e.g., daily stats), add pagination support similar to above; use count for total days or events.
- In usage.controller.ts: Extract page/limit, pass to service.

### Other Modules (if applicable)

- Check notify, webhook, provider (single), notifications: Likely no lists, but confirm no GET lists exist.
- If any other GET /list endpoints found (e.g., via glob), apply similarly.

### Documentation and Validation

- Update README.md API section to document ?page=1&limit=20 params and response format for paginated endpoints.
- Run Prisma generate and API tests to ensure no regressions.
- Test manually: e.g., GET /v1/providers?page=1&limit=5, verify items length=5, total correct.

Your last step should be running the `Validation Commands` to validate the feature works correctly with zero regressions.

## Testing Strategy

### Unit Tests

- Add tests in providers.service.spec.ts (if exists) or create: Test findAll with pagination returns correct skip/take and total.
- For proxies.service: Test listProxies with filters + pagination, verify count excludes disabled/low-score if patterned.
- Usage: Test paginated stats return.

### Edge Cases

- Page=0 or negative: Defaults to 1.
- Limit=0 or >100: Defaults to 10 or caps at 100.
- Empty results: { items: [], total: 0, page:1, limit:10 }.
- Large page beyond total: Empty items, correct total.
- Filters with pagination: Count matches filtered total.
- Sample endpoint: Unaffected, fixed limit.

## Acceptance Criteria

- All list-returning GET endpoints (providers list, proxies list, usage stats if list) support ?page & ?limit with validation.
- Responses include paginated structure with total count.
- Existing params (e.g., pool, providerId, bbox) compatible with pagination.
- No performance regression; count queries efficient.
- README updated with new API docs.
- Server starts and endpoints respond without errors post-changes.

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

- `docker compose up --build` - Ensure API builds and starts without errors.
- `docker compose exec api npx prisma generate` - Regenerate Prisma client.
- `curl "http://localhost:3000/v1/providers?page=1&limit=5"` - Verify paginated response with items, total, page, limit.
- `curl "http://localhost:3000/v1/proxies?pool=default&page=1&limit=10"` - Test with filters, check total and items.
- `curl "http://localhost:3000/usage/stats?page=2&limit=5"` - If applicable, test usage pagination.
- `npm run test:api` or `docker compose exec api npm run test` - Run any existing API tests for zero regressions (assume jest/nestjs testing setup).
- `docker compose down` - Clean up.

## Notes

- Assume standard NestJS testing if no tests exist; add if time allows.
- For proxies bbox filter, ensure count query replicates the where clause accurately (may need raw SQL for complex filters if Prisma AND issues).
- Future: Add sorting param (e.g., ?sort=score:desc) building on orderBy patterns.
- No new libs needed; uses built-in Prisma pagination.