# Feature: Providers Management Page

## Metadata

issue_number: `3`
adw_id: `3`
issue_json: `{"title": "Build providers management page", "body": "build out the providers page to manage the proxy providers. Ensure the crud api endpoints exist in the api module and return results. Also include a param to send into the functions to mock data for testing."}`

## Feature Description

This feature implements a comprehensive Providers Management page in the admin UI for viewing, creating, editing, and deleting proxy providers. The page will display a table of existing providers with pagination, search, and actions (edit/delete). CRUD operations will integrate with new/enhanced API endpoints in the providers module, supporting real Prisma queries by default but allowing a ?mock=true query parameter to return simulated data for development and testing purposes. This enables administrators to efficiently manage proxy sources (e.g., IPRoyal API configs) without relying on live data during UI/API development, improving the overall provider workflow in ProxyHub Rotator Pro.

## User Story

As a system administrator
I want a dedicated providers page with full CRUD functionality
So that I can easily configure, update, and monitor proxy provider integrations without manual database intervention.

## Problem Statement

Currently, the admin UI lacks a dedicated page for managing providers, forcing direct API calls or database editing. The providers API exists but requires full CRUD endpoints (GET all/single, POST create, PATCH update, DELETE) for seamless UI integration. No mock data toggle hinders local development and testing, leading to reliance on live databases which risks data integrity during UI prototyping.

## Solution Statement

Extend the existing providers API module with full CRUD endpoints: GET /providers (list with pagination/search), GET /providers/{id}, POST /providers (create), PATCH /providers/{id} (update), DELETE /providers/{id}. Implement mock mode via query param ?mock=true returning predefined sample data (e.g., IPRoyal config). In the admin UI, add /providers route under sidebar navigation, displaying a responsive table (using existing Card/UI components) with forms for add/edit modals. Use React Router for navigation and fetch API for data. Ensure mock param integration in UI fetches for local testing. Follow NestJS patterns in API and Tailwind for UI consistency.

## Relevant Files

Use these files to implement the feature:

- `README.md`: Project overview, IPRoyal provider config examples, and API patterns for providers/orders integration.
- `apps/packages/api/src/modules/providers/providers.controller.ts`: Existing controller; extend with CRUD routes (GET, POST, PATCH, DELETE) for /providers.
- `apps/packages/api/src/modules/providers/providers.service.ts`: Service layer; add methods for list/create/update/delete with Prisma queries, and conditional mock data.
- `apps/packages/api/src/modules/providers/providers.module.ts`: Module registration; ensure PrismaService imported for DB access.
- `apps/packages/api/prisma/schema.prisma`: Provider model definition; confirm/expand fields (name, type, config Json, etc.).
- `apps/packages/admin/src/App.tsx`: Router setup; add route for /providers.
- `apps/packages/admin/src/components/Sidebar.tsx`: Update nav items to include Providers link.
- `.claude/commands/test_e2e.md`: Instructions for E2E tests.
- `.claude/commands/e2e/test_basic_query.md`: Example E2E test for UI validation.

### New Files

- `apps/packages/admin/src/pages/Providers.tsx`: New page component for providers list/table and CRUD forms.
- `.claude/commands/e2e/test_providers-management.md`: E2E test validating CRUD operations on providers page.

## Implementation Plan

### Phase 1: Foundation

Review existing providers model in Prisma schema and extend if needed (e.g., add fields for mock testing). Update API service to support CRUD with mock flag, ensuring transaction safety for creates/updates.

### Phase 2: Core Implementation

Implement API endpoints for full CRUD, injecting mock data for ?mock=true (e.g., sample Provider configs). In UI, create Providers page with table (columns: name, type, status, actions), add/edit modals using forms with validation. Integrate API calls with useState/useEffect, handling loading/errors.

### Phase 3: Integration

Add Providers route and sidebar link. Ensure responsive design (mobile table scroll/hide). Test mock mode toggles ?mock=true in fetches for dev. Add E2E test for page load, create provider, edit, delete.

## Step by Step Tasks

### API Enhancements

- Read apps/packages/api/prisma/schema.prisma to confirm Provider model; add mockEnabled Boolean if needed for testing flags.
- In providers.service.ts, add getProviders(pagination: {skip: number, take: number}, search: string, mock?: boolean): Promise<Provider[]>
  - If mock, return hardcoded array (e.g., 10 sample providers with IPRoyal configs).
  - Else, Prisma query: prisma.provider.findMany({ skip, take, where: { name: { contains: search } }, include relations if any }).
- Add getProviderById(id: string, mock?: boolean): Promise<Provider | null> - mock returns first sample or null.
- Add createProvider(data: CreateProviderDto, mock?: boolean): Promise<Provider> - mock returns created mock entry.
- Add updateProvider(id: string, data: UpdateProviderDto, mock?: boolean): Promise<Provider> - mock updates sample.
- Add deleteProvider(id: string, mock?: boolean): Promise<boolean> - mock simulates deletion.
- In providers.controller.ts, add @Get() getAll(@Query() query: GetProvidersQuery) - call service.getProviders({skip: query.skip || 0, take: query.take || 10}, query.search, query.mock).
- Add @Get(':id') getOne(@Param('id') id, @Query('mock') mock) - service.getProviderById(id, mock === 'true').
- Add @Post() create(@Body() data, @Query('mock') mock) - service.createProvider(data, mock === 'true').
- Add @Patch(':id') update(@Param('id') id, @Body() data, @Query('mock') mock) - service.updateProvider(id, data, mock === 'true').
- Add @Delete(':id') remove(@Param('id') id, @Query('mock') mock) - if service.deleteProvider(id, mock === 'true') return 200 else 404.
- Ensure DTOs for CreateProviderDto/UpdateProviderDto with class-validator if needed (name: string, type: ProviderType, config: Json).

### UI Implementation

- Add route <Route path="/providers" element={<Providers />} /> in src/App.tsx Routes.
- Update src/components/Sidebar.tsx to add Providers link (icon e.g., Users, path '/providers').
- Create src/pages/Providers.tsx: UseState for providers, searchInput, modal open state.
- Fetch on load: useEffect fetch /v1/providers (with search/pagination params, ?mock=true for dev).
- Render table with providers data: columns name, type, config summary, createdAt, actions (edit/delete buttons).
- Add search input and pagination controls (prev/next buttons).
- Implement add button opening modal with form for name, type select (api/file/manual), config textarea (JSON).
- Edit modal prefill with getProviderById.
- Delete button with confirmation dialog, call DELETE.
- Handle loading/spinner, errors (toast or alert).

### E2E Test Creation

- Read .claude/commands/test_e2e.md and .claude/commands/e2e/test_basic_query.md for format.
- Create .claude/commands/e2e/test_providers-management.md: Steps: Start services, load /providers, verify table empty or with samples, add new provider (fill form, submit), verify added in table, edit existing, delete one, toggle ?mock=true, verify mock data loads. Include screenshots of table, add modal submit, post-delete state.

### Integration and Testing

- Ensure forms validate (e.g., required fields).
- Test API endpoints with curl/Postman, including ?mock=true returning samples.
- Run admin dev server, verify page loads, CRUD works in UI.
- Deploy via docker-compose.dev.yml, confirm endpoints respond.

## Testing Strategy

### Unit Tests

- Test service methods: getProviders real vs mock, create/update with valid/invalid data.
- Test controller endpoints: Mock service, assert responses 200/OK with data, 400 for bad requests.
- UI tests (Vitest): Mock fetch, test table render, form submissions update state.

### Edge Cases

- Mock vs real mode: Ensure ?mock=true bypasses DB, returns consistent samples.
- Empty list: Table shows "No providers" message.
- Validation: Create with invalid JSON config fails.
- Pagination: Large list navigates pages.
- Delete non-existent: API returns 404.
- Concurrent edits: UI handles API errors gracefully.

## Acceptance Criteria

- /providers GET returns list (mock: samples, real: DB), supports search/pagination.
- Full CRUD API endpoints functional with mock param.
- Providers page accessible via sidebar, displays table with actions.
- Add/Edit modals work, submit to API, update table on success.
- Delete with confirmation, removes from table.
- ?mock=true toggles mock data in UI fetches (add ?mock=true to URL).
- Responsive: Mobile table scrolls horizontally.
- Dark mode styling applies to page/components.
- E2E test passes, validates CRUD flow.

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

- `cd apps/packages/api && npm run test` - Run API tests for providers CRUD.
- `curl 'http://localhost:8080/v1/providers?mock=true' | jq` - Verify mock list returns samples.
- `curl -X POST http://localhost:8080/v1/providers -H 'Content-Type: application/json' -d '{"name":"test","type":"api","config":{}}' | jq` - Create provider.
- `curl http://localhost:8080/v1/providers -H 'Content-Type: application/json' | jq` - List shows new provider.
- `cd apps/packages/admin && bun run dev` - Start UI, navigate /providers, verify table/add/edit/delete, check console no errors.
- Read .claude/commands/test_e2e.md, then read and execute .claude/commands/e2e/test_providers-management.md to validate this functionality works.
- `cd apps/packages/api && uv run pytest` - Run server tests to validate the feature works with zero regressions.
- `cd apps/packages/admin && bun tsc --noEmit` - Run frontend tests to validate the feature works with zero regressions.
- `cd apps/packages/admin && bun run build` - Run frontend build to validate the feature works with zero regressions.

## Notes

- Mock data: Define 5-10 sample providers in service with varied types (api/file/manual), valid configs.
- Security: Add auth guard @UseGuards(JwtAuthGuard) if admin-only; assume implemented.
- UI Forms: Use react-hook-form for validation if complex, but keep simple with native inputs.
- No new libs needed; use existing Tailwind/Card for table/modals.
- Future: Add provider import button linking to /providers/{id}/import from README.