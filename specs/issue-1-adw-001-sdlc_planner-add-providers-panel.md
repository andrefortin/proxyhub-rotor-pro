# Feature: Providers Panel Management

## Metadata

issue_number: `1`
adw_id: `adw-001`
issue_json: `{\"title\": \"Add Providers Panel in Admin\", \"body\": \"Provide a [Providers] panel in the ProxyHub admin that allow us to view and manage providers with a card view and include a button to add new providers that works. When we enable/disable a provider, it should also enable/disable the proxies related to it.\"}`

## Feature Description

The feature adds a dedicated Providers panel in the ProxyHub admin UI for viewing, managing, and adding providers in a card-based layout. The panel will display providers with details like name, type, status, and config previews. It includes an "Add Provider" button to create new providers via API. Toggling a provider's active status will cascade to update related proxies' status, enabling quick management of proxy availability.

This enhances the admin experience by centralizing provider operations, making it easier to monitor and control the proxy ecosystem.

## User Story

As a ProxyHub admin user
I want to view and manage providers in a clean card panel with add functionality
So that I can easily add new providers and toggle their status to control associated proxies without navigating multiple screens

## Problem Statement

Currently, the admin UI lacks a dedicated, visual panel for providers. Providers are not easily viewable or manageable, and adding new ones requires raw API calls. Enabling/disabling providers does not automatically affect related proxies, leading to manual follow-up work and potential inconsistencies in proxy availability.

## Solution Statement

Extend the existing App.tsx in the admin package to include a Providers panel with card views for each provider, fetched from /v1/providers. Add an "Add Provider" modal that posts to the API. For enable/disable, add toggle buttons that PATCH the provider's active status and then update related proxies via /v1/proxies endpoints or Prisma queries. Use existing patterns like MapCard for UI consistency.

## Relevant Files

Use these files to implement the feature:

- `apps/packages/admin/src/App.tsx` - Main admin component; extend to add Providers panel with cards and add modal.
- `apps/packages/api/src/modules/providers/providers.service.ts` - Backend service for provider CRUD; add PATCH for active status and cascade to proxies.
- `apps/packages/api/prisma/schema.prisma` - Database schema; ensure Provider active field cascades to Proxy (via relation update).
- `apps/packages/api/src/modules/providers/providers.controller.ts` - API controller; extend PATCH endpoint to handle status toggle and proxy updates.
- `README.md` - Project overview; confirms admin UI at localhost:4173 and API at 8080 for integration.
- `.claude/commands/conditional_docs.md` - Read this to determine additional docs; matches UI conditions for app_docs/feature-cc73faf1-upload-button-text.md (for modal UX) and app_docs/feature-490eb6b5-one-click-table-exports.md (for list handling).
- `apps/packages/admin/src/MapCard.tsx` - Existing card pattern; follow for provider cards.

### New Files

- `.claude/commands/e2e/test_providers-panel.md` - E2E test for the new panel (add task to create this).

## Implementation Plan

### Phase 1: Foundation

Prepare the backend for status toggle cascade and frontend for panel structure.

### Phase 2: Core Implementation

Build the Providers panel in App.tsx with cards, add modal, and status toggles.

### Phase 3: Integration

Connect frontend to backend API for CRUD and cascade updates; add E2E test.

## Step by Step Tasks

### Task 1: Update Backend for Provider Status Cascade

- In providers.service.ts, add logic to PATCH provider active status.
- When updating active, query related proxies by providerId and set their disabled field (add disabled to Proxy schema if missing).
- Update Prisma schema to include disabled on Proxy if needed, then push via prisma db push.
- Extend providers.controller.ts to expose PATCH /v1/providers/{id} for active toggle.

### Task 2: Enhance Frontend Providers Panel in App.tsx

- Add a Providers section with card grid for each provider (name, type, active toggle, config preview).
- Implement card click to load details/orders.
- Add "Add Provider" button to open modal with form (name, type, config, logoUrl).
- Form submits POST to /v1/providers, refreshes list on success.

### Task 3: Implement Status Toggle and Cascade

- In provider card, add toggle for active; on change, PATCH /v1/providers/{id} with new active value.
- On success, refresh providers list and update proxies (optional: call API to bulk-update proxies).
- Add loading state during toggle.

### Task 4: Add E2E Test

- Read .claude/commands/test_e2e.md and .claude/commands/e2e/test_basic_query.md for examples.
- Create .claude/commands/e2e/test_providers-panel.md with steps: load admin, view providers cards, toggle active (verify API call and UI update), add new provider via modal (verify POST and card appears).
- Include screenshots for verification in the test file.

### Task 5: Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

- cd apps/packages/api && npx prisma generate && npx prisma db push - Run backend schema sync and generate client.
- docker compose -f docker-compose.dev.yml restart api - Restart API to apply changes.
- cd apps/packages/admin && npm run build - Build admin to validate no TS errors.
- docker compose -f docker-compose.dev.yml up - Start services and navigate to http://localhost:5173 (providers panel renders).
- Read .claude/commands/test_e2e.md, then read and execute .claude/commands/e2e/test_providers-panel.md to validate panel, toggle, and add functionality.
- curl -X POST http://localhost:8080/v1/providers -H "Content-Type: application/json" -d '{"name": "test", "type": "api", "config": {}}' - Verify provider creation.
- docker compose -f docker-compose.dev.yml exec db psql -U postgres -d proxyhub -c "SELECT * FROM \"Provider\" LIMIT 1;" - Check DB has new provider.
- docker compose -f docker-compose.dev.yml logs api | grep -i "error" - Ensure no API errors during toggle/add.

## Testing Strategy

### Unit Tests

- Test providers.service.ts PATCH: mock Prisma, verify active update cascades to disable proxies (expect 3 proxy updates for provider with proxies).
- Test providers.controller PATCH: unit test endpoint returns 200 with updated provider including active false.

### Edge Cases

- Toggle inactive provider with no proxies: succeeds without cascade.
- Add provider with invalid config: API validation error, modal shows feedback.
- Network failure during toggle: UI shows error toast, retries on next load.
- Disabled provider: cards show red status, proxies filtered out in map/pools.

## Acceptance Criteria

- Providers panel displays as card grid with name, type, status toggle, config preview.
- "Add Provider" modal opens, form submits to API, new card appears after refresh.
- Toggle provider active: PATCH succeeds, related proxies update disabled=true/false.
- E2E test passes: validates panel view, add, toggle with screenshots.
- No regressions: existing map, orders, usage load without errors.
- Admin builds/runs clean; API logs no 500s during operations.

## Notes

- Follow Card component pattern from MapCard for consistency.
- Use existing API endpoints; no new libs needed.
- For cascade, use Prisma transaction in service to update provider and proxies atomically.
- UI: Add confirmation dialog for toggle if provider has >10 proxies.
- Future: Bulk actions in panel (enable all, import for multiple).