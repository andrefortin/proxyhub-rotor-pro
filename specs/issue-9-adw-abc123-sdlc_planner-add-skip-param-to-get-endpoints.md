# Feature: Add Skip Parameter to GET Endpoints

## Metadata

issue_number: `9`
adw_id: `abc123`
issue_json: `{}`

## Feature Description

This feature adds a 'skip' query parameter to all paginated GET endpoints in the API module, allowing clients to directly specify the number of records to offset from the beginning of the result set. Combined with existing 'limit' (or 'take'), it enables flexible offset-based pagination. If 'page' is provided, it will compute 'skip' as before for backward compatibility; direct 'skip' overrides it. This supports advanced use cases like cursor-based pagination or resuming large queries without recalculating from page numbers. Responses remain in the PaginatedResponse format with total count.

## User Story

As an API consumer (e.g., admin UI, scripting client, or integration)
I want to use a direct 'skip' parameter in GET requests for lists (e.g., /v1/providers?skip=50&limit=10)
So that I can implement efficient offset-based pagination or resume queries from specific points without relying solely on page calculations.

## Problem Statement

The current pagination system relies on 'page' and 'limit', computing 'skip = (page-1)*limit', which is simple but less flexible for scenarios like server-side cursors, resuming failed large exports, or integrations with databases that natively support offset. Direct 'skip' access would make the API more versatile without breaking existing clients.

## Solution Statement

Enhance the shared `validatePagination` function to accept and prioritize 'skip' from query params, falling back to page/limit computation if skip is not provided. Update controllers to extract 'skip', 'limit', 'page' from queries and pass to services. Services will use the provided skip/take directly in Prisma queries. Maintain backward compatibility by defaulting to page/limit behavior. No changes to response structure; validate skip >=0, cap limit at 100 as before. This builds directly on the existing pagination utility.

## Relevant Files

Use these files to implement the feature:

- `apps/packages/api/src/common/pagination.ts`: Core utility; update `validatePagination` to handle 'skip' input param, prioritize it over page computation.
- `apps/packages/api/src/modules/providers/providers.controller.ts`: Extract 'skip', 'page', 'limit', 'search' from @Query(); pass computed pagination to service.
- `apps/packages/api/src/modules/providers/providers.service.ts`: Use provided skip/take in findAll; already structured for this.
- `apps/packages/api/src/modules/proxies/proxies.controller.ts`: Extract pagination params alongside filters (pool, providerId, bbox); pass to listProxies.
- `apps/packages/api/src/modules/proxies/proxies.service.ts`: Consume skip/take, adjust for sample mode (ignore skip for random sample).
- `apps/packages/api/src/modules/usage/usage.controller.ts`: If stats endpoint evolves to list form, but currently static; prepare for future by adding param extraction.
- `apps/packages/api/src/modules/usage/usage.service.ts`: No change needed as it returns fixed data; add if listing events.
- `README.md`: Update API docs to mention new 'skip' param, examples, and compatibility notes.
- `apps/packages/api/prisma/schema.prisma`: Reference for Prisma findMany with skip/take patterns, no changes.

### New Files

None required; extend existing pagination utility and endpoint handlers.

## Implementation Plan

### Phase 1: Foundation

Update the shared pagination utility to support direct 'skip' input, ensuring validation and fallbacks for existing page/limit usage.

### Phase 2: Core Implementation

Modify controller query parsing to include 'skip' and compute/prioritize accordingly. Update service methods to use the passed skip/take values in Prisma queries.

### Phase 3: Integration

Ensure filters (e.g., search, pool, bbox) interact correctly with skip. Update docs and validate no breaking changes for clients using page/limit.

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### Update Pagination Utility

- In `apps/packages/api/src/common/pagination.ts`: Enhance `validatePagination` to accept 'skip?: number' in params. If skip provided and >=0, use it directly; else compute from page/limit. Update return to include skip if overridden. Validate limit 1-100, skip >=0.

### Update Providers Module

- In `providers.controller.ts`: Extract 'skip', 'page', 'limit', 'search' from q. Call validatePagination with {page, limit, skip}.
- In `providers.service.ts`: findAll already uses skip/take from validated params; no major changes, but ensure where clause for search applies to count and skip.

### Update Proxies Module

- In `proxies.controller.ts`: Extract 'skip', 'page', 'limit' alongside q (pool, etc.). Compute pagination = validatePagination({page: q.page, limit: q.limit, skip: q.skip}). For non-sample, pass {skip: pagination.skip, take: pagination.take} to listProxies(q, false, pagination).
- In `proxies.service.ts`: listProxies accepts pagination?: {skip, take}; use provided skip/take, fallback to default if sample (ignore skip for random). Ensure count uses same where (handle bbox AND in count).

### Check Other Modules

- For usage: getStats returns static object, not list; no action needed but add comment for future.
- Notifications getAll/config: Returns single/few items, low volume; no skip needed.
- Webhook: POST only, no GET list.

### Documentation and Testing

- Update README.md: Add examples like GET /v1/proxies?skip=100&limit=20, note compatibility with page.
- Run Prisma generate, start services, test with curl: e.g., /v1/providers?skip=0&limit=5, verify items offset correctly.

Your last step should be running the `Validation Commands` to validate the feature works correctly with zero regressions.

## Testing Strategy

### Unit Tests

- In pagination.ts (add if no tests): Test validatePagination with skip=50, limit=10 returns {skip:50, take:10,...}; with page=6, limit=10, skip undefined returns {skip:50, take:10,...}; invalid skip<0 defaults to 0.
- Providers service: Mock Prisma, test findAll with skip=10 returns items starting after first 10, total full count.
- Proxies service: Test with filters + skip, verify offset applied post-filter, count matches filtered total.

### Edge Cases

- skip=0: First page.
- skip > total: Empty items, correct total.
- skip with filters: Offset after applying where.
- skip + page: Skip takes precedence.
- Invalid skip (negative/string): Defaults to 0.
- Sample mode: Ignores skip, fixed random 200.
- Large skip: Efficient Prisma handling.

## Acceptance Criteria

- validatePagination supports and prioritizes 'skip' >=0, falls back to page/limit.
- GET /v1/providers?skip=10&limit=5 returns items 11-15 (0-based), total full count.
- GET /v1/proxies?skip=0&pool=default&limit=10 works with filters, bbox.
- Backward compatible: ?page=2&limit=10 computes skip=10 correctly.
- No changes for non-list endpoints (usage stats, single providers).
- README docs updated with skip examples.
- Services build/start, queries execute without errors or regressions.

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

- `docker compose up --build -d` - Build and start API.
- `docker compose exec api npx prisma generate` - Update client.
- `curl "http://localhost:3000/v1/providers?skip=0&limit=2"` - Verify first 2, total correct.
- `curl "http://localhost:3000/v1/providers?page=2&limit=2"` - Verify compatible, items 3-4.
- `curl "http://localhost:3000/v1/proxies?skip=10&limit=5&pool=default"` - Test offset with filter.
- `docker compose exec api npm run test` - Run tests (if exist) for zero failures.
- `docker compose down` - Stop services.

## Notes

- Since Prisma supports skip efficiently (with indexes), no perf issues expected, but advise indexing on orderBy fields (e.g., createdAt for providers).
- If future cursor-based (e.g., afterId), extend to 'cursor' param.
- No new libs; builds on existing Prisma/NestJS.
- For high-volume proxies, consider cursor pagination in v2 to avoid deep skip perf degradation.