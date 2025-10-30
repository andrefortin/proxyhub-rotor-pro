# Feature: Implement CRUD Endpoints for Proxies and Providers

## Metadata

issue_number: `7`
adw_id: `abc123`
issue_json: `{\"title\":\"Implement CRUD endpoints for proxies and providers\",\"body\":\"implement crud endpoints for the proxies, and providers, with an query param to get sample data for testing in the API module\"}`

## Feature Description

This feature adds full CRUD (Create, Read, Update, Delete) RESTful endpoints for managing proxies and providers in the API module. It builds on existing partial implementations by adding missing operations (e.g., delete for providers, full CRUD for proxies) and introduces a query parameter '?sample=true' on the proxies list endpoint to return a limited random sample (up to 200) for quick testing and performance. This enables administrators to fully manage proxy infrastructure via API, including bulk imports, status updates, and testing without loading full datasets.

## User Story

As a proxy administrator
I want to create, read, update, and delete proxies and providers via API endpoints
So that I can programmatically manage the proxy rotation system, test configurations with sample data, and integrate with external tools without manual intervention.

## Problem Statement

Currently, the API has partial CRUD support: providers have create/update/list/import but lack delete; proxies have list/sample but no create/update/delete. There's no unified way to fetch sample data via query param on list, forcing separate calls. This limits full lifecycle management and testing efficiency in the admin panel or scripts.

## Solution Statement

Extend existing NestJS controllers and services using Prisma for database operations. Add DELETE for providers, full CRUD for proxies (with validation for relations like providerId). Introduce '?sample=true' query on /v1/proxies to return random subset. Ensure consistency with existing patterns (e.g., transactions for updates affecting related proxies). Use JSON responses with error handling. No new libraries needed; leverage Prisma's raw queries for sampling.

## Relevant Files

Use these files to implement the feature:

- `apps/packages/api/src/modules/providers/providers.controller.ts`: Extend with DELETE endpoint; why: Handles provider management HTTP routes.
- `apps/packages/api/src/modules/providers/providers.service.ts`: Add deleteProvider method with cascading proxy handling; why: Core business logic for providers, including Prisma interactions.
- `apps/packages/api/src/modules/providers/providers.module.ts`: No changes needed; why: Exports service, already set up.
- `apps/packages/api/src/modules/proxies/proxies.controller.ts`: Add POST/PATCH/DELETE; enhance GET with sample query param; why: Manages proxy HTTP routes, extend existing list/sample.
- `apps/packages/api/src/modules/proxies/proxies.module.ts`: Add ProxyService; why: Currently empty, needs service for CRUD logic.
- `apps/packages/api/prisma/schema.prisma`: Reference for models (Provider, Proxy); why: Defines DB structure, ensure relations on create/update.
- `apps/packages/api/src/app.module.ts`: Import ProxiesModule if needed; why: Root module for global setup.
- `README.md`: For API endpoint examples and IPRoyal integration patterns; why: Guides overall project structure and quickstart.

### New Files

- `apps/packages/api/src/modules/proxies/proxies.service.ts`: Implements CRUD logic for proxies; why: Missing service for proxy operations, following NestJS pattern.

## Implementation Plan

### Phase 1: Foundation

Review Prisma schema for Provider/Proxy relations. Ensure providers service handles cascading deletes/updates on proxies. Add missing imports/DTOs for validation if needed (but keep simple, use any for now).

### Phase 2: Core Implementation

Implement proxy CRUD in new service and controller. For providers, add delete to service/controller. Add sample param to proxies list, using existing raw query logic.

### Phase 3: Integration

Test endpoint consistency with existing auth (none currently). Update README if new endpoints added. Ensure responses match patterns (e.g., {items: []} for lists).

## Step by Step Tasks

### Research and Setup

- Read existing providers.controller.ts and service.ts to understand current create/update/list patterns.
- Read proxies.controller.ts to extend GET for sample param and add missing routes.
- Create new proxies.service.ts with CRUD methods mirroring providers.service.
- Add ProxyService to proxies.module.ts and export if needed.

### Implement Provider CRUD Completion

- Add delete method to providers.service.ts: Use Prisma delete with optional cascade to proxies (set disabled or soft delete).
- Add @Delete(':id') to providers.controller.ts, calling service.delete(id).
- Update service methods to handle mock mode if relevant, but prioritize real DB ops.

### Implement Proxy CRUD

- In proxies.service.ts: Implement findAll (with filters), create (validate providerId exists), update (e.g., score, disabled), delete (hard or soft).
- Add to proxies.controller.ts: @Post() for create, @Patch(':id') for update, @Delete(':id') for delete.
- Enhance @Get() to check ?sample=true: If true, use raw query for random 200 limit, else full query.

### Testing and Validation

- Manually test endpoints with curl or Postman: Create provider, create proxy linked to it, list with ?sample=true, update, delete.
- Run Prisma studio (`npx prisma studio`) to verify DB changes.
- Ensure no regressions: Test existing list/import endpoints.

- `docker compose exec api npx prisma migrate deploy` - Apply any schema changes if needed (none here).
- `docker compose exec api curl -X GET http://localhost:3000/v1/providers` - Validate list unchanged.
- `docker compose exec api curl -X GET http://localhost:3000/v1/proxies?sample=true` - Validate sample returns ~200 random.
- `docker compose exec api npx prisma generate` - Regenerate client.
- Restart API container and test full CRUD flow end-to-end.

## Testing Strategy

### Unit Tests

Add to a new or existing test file (e.g., providers.spec.ts): Test each CRUD method in services with mocked Prisma. For proxies, test create with valid/invalid providerId, update score, delete cascades.

### Edge Cases

- Create proxy with invalid providerId: Should error.
- Update provider active=false: Proxies disabled automatically.
- Sample=true with filters (pool): Apply random within filter.
- Delete non-existent: Return 404.
- Large lists without limit: Enforce max 5000.

## Acceptance Criteria

- Provider endpoints: POST /v1/providers, GET /v1/providers, PATCH /v1/providers/:id, DELETE /v1/providers/:id all functional.
- Proxy endpoints: POST /v1/proxies (with providerId), GET /v1/proxies (filters + ?sample=true), PATCH /v1/proxies/:id, DELETE /v1/proxies/:id all functional.
- ?sample=true on proxies returns random <=200 records; without returns filtered list.
- All operations use Prisma transactions for relations; no data inconsistencies.
- Responses in JSON format consistent with existing (e.g., {items: [...]} for lists).
- Existing endpoints (e.g., /v1/proxies/sample, import) unchanged.

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

- `docker compose restart api` - Restart API to load changes.
- `docker compose exec api curl -X POST http://localhost:3000/v1/providers -H \"Content-Type: application/json\" -d '{\"name\":\"Test\",\"type\":\"api\",\"config\":{}}'` - Validate create provider succeeds.
- `docker compose exec api curl -X GET http://localhost:3000/v1/proxies?sample=true` - Returns ~200 items.
- `docker compose exec api curl -X GET http://localhost:3000/v1/proxies?pool=linkedin` - Returns filtered list.
- `docker compose exec api curl -X PATCH http://localhost:3000/v1/providers/{test-id} -H \"Content-Type: application/json\" -d '{\"active\":false}'` - Update succeeds, proxies disabled.
- `docker compose exec api curl -X DELETE http://localhost:3000/v1/providers/{test-id}` - Delete succeeds.
- `docker compose exec api npx prisma studio` - Manually inspect DB for changes (run interactively, close after).
- `docker compose exec api npx prisma generate && docker compose restart api` - Ensure client updated, no build errors.
- Test full flow: Create provider, create proxy, list sample, update proxy score, delete proxy, delete provider - all succeed without errors.

## Notes

- Follow dependency injection patterns: Use @Injectable() services, inject PrismaClient.
- For proxies create: Validate providerId exists via service lookup.
- Soft delete preferred (set disabled=true) to avoid data loss.
- If IPRoyal integration affected, ensure config preserved on update.
- No new libs; use existing raw SQL for sampling efficiency.
- Future: Add DTOs for validation, pagination to all lists.