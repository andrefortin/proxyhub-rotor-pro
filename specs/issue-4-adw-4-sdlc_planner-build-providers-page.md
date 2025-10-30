# Feature: Build Providers Management Page

## Metadata

issue_number: `4`
adw_id: `4`
issue_json: `{"title": "Build providers management page", "body": "build out the providers page to manage the proxy providers. Ensure the crud api endpoints exist in the api module and return results. Also include a param to send into the functions to mock data for testing."}`

## Feature Description

This feature adds a dedicated Providers page in the admin UI for managing proxy providers via CRUD operations. It ensures the API has full CRUD endpoints for providers, with an optional ?mock=true param to return hardcoded test data instead of querying the database. The UI will include a searchable, paginated table of providers, add/edit forms, delete confirmation, and a mock toggle. This enables admins to configure providers (e.g., IPRoyal API) easily and supports mock mode for safe testing/ development without affecting real data.

## User Story

As an admin user
I want a providers management page with CRUD and mock data option
So that I can easily add, edit, delete providers and test the UI/API without live database changes.

## Problem Statement

The admin UI lacks a page for viewing and managing the list of proxy providers. While some API endpoints exist, full CRUD is needed, and there's no way to mock responses for testing, leading to potential issues during development (e.g., polluting DB with test data). This hinders efficient provider management and safe UI prototyping.

## Solution Statement

Enhance the providers API module with complete CRUD endpoints (GET list/single, POST create, PATCH update, DELETE remove), adding ?mock=true query param to service methods for returning sample data (e.g., mock IPRoyal config). In admin UI, create Providers.tsx with a responsive table using Tailwind/Card components, search/pagination, modals for add/edit (forms with validation), delete buttons with confirmation. Add mock toggle checkbox that appends ?mock=true to API calls. Integrate with existing sidebar navigation. Add E2E test validating the page and CRUD flow in both modes.

## Relevant Files

Use these files to implement the feature:

- `README.md`: Provides overview of provider config examples (e.g., IPRoyal) and API patterns to follow for CRUD.
- `apps/packages/api/src/modules/providers/providers.controller.ts`: Existing controller; extend with full CRUD routes including mock param handling.
- `apps/packages/api/src/modules/providers/providers.service.ts`: Service for DB operations; add mock logic and methods for list/create/update/delete.
- `apps/packages/api/prisma/schema.prisma`: Provider model definition; verify fields for CRUD (id, name, type, config, etc.).
- `apps/packages/admin/src/App.tsx`: For adding /providers route.
- `apps/packages/admin/src/components/Sidebar.tsx`: To add Providers nav link.
- `apps/packages/admin/src/components/ui/card.tsx`: Reuse for table cards.
- `.claude/commands/test_e2e.md` and `.claude/commands/e2e/test_basic_query.md`: Read to create E2E test file.

### New Files

- `apps/packages/admin/src/pages/Providers.tsx`: Page component with table, search, pagination, CRUD modals.
- `.claude/commands/e2e/test_providers-management.md`: E2E test for page and operations.

## Implementation Plan

### Phase 1: Foundation

Review Provider Prisma model, ensure all fields for CRUD. Update service with mock-capable methods using hardcoded data when ?mock=true.

### Phase 2: Core Implementation

Implement API CRUD endpoints passing mock param to service. Build UI page with table rendering providers, forms for add/edit, delete handling.

### Phase 3: Integration

Add route and sidebar link. Connect UI to API with fetch, handle mock toggle via state. Create E2E test.

## Step by Step Tasks

### API CRUD Implementation

- In providers.service.ts, add getProviders(pagination, search, mock) with mock returning samples, else Prisma findMany.
- Add getProvider(id, mock) with mock check.
- Add createProvider(data, mock) simulating if mock.
- Add updateProvider(id, data, mock) simulating if mock.
- Add deleteProvider(id, mock) returning true if mock.
- In controller.ts, add @Get() calling service.getProviders with query params.
- Add @Get(':id') with mock query.
- Add @Post() with body and mock.
- Add @Patch(':id') with body and mock.
- Add @Delete(':id') with mock, return 204 on success.

### UI Page Creation

- Add <Route path="/providers" element={<Providers />} /> in App.tsx.
- Add { name: 'Providers', path: '/providers', icon: Users2 } to navItems in Sidebar.tsx.
- Create Providers.tsx: useState for providers, loading, error, search, skip/take, mock.
- useEffect fetch(`${API_BASE}/v1/providers?skip=${skip}&take=${take}&search=${search}${mock ? '&mock=true' : ''}`), set data.
- Render Card with table: headers Name/Type/Status/Created/Actions.
- Rows map providers, actions Edit/Delete icons with handlers.
- Search input onChange setSearch, debounce if needed.
- Pagination buttons prev/next disabled appropriately.
- Add button opens modal with form (name, type select, config textarea JSON.parse on submit).
- Edit prefills form with getProvider, update on submit.
- Delete confirms then calls DELETE, refresh list.

### E2E Test Creation

- Read .claude/commands/test_e2e.md and .claude/commands/e2e/test_basic_query.md.
- Create .claude/commands/e2e/test_providers-management.md: Steps to load page with ?mock=true, screenshot table, toggle mock off, verify empty, add provider, edit, delete, check console no errors, screenshot key states.

### Validation

- Run validation commands to confirm.

## Testing Strategy

### Unit Tests

- Service: test getProviders real returns DB, mock returns samples.
- Controller: mock service, test endpoints return expected with/without ?mock=true.
- UI: test Providers component renders table, form submits call fetch, delete confirms.

### Edge Cases

- Mock mode: CRUD doesn't affect DB, returns consistent samples.
- Empty list: Shows message.
- Invalid form: Prevent submit or show error.
- Delete failure: Alert user.
- Large list: Pagination works.

## Acceptance Criteria

- API CRUD endpoints work with/without mock, return correct data/status.
- Providers page lists providers, supports search/pagination/mock toggle.
- Add/Edit forms validate and submit to API, update table.
- Delete removes with confirmation.
- E2E test passes CRUD flow without console errors.
- UI responsive, dark mode compatible.

## Validation Commands

- `cd apps/packages/api && npm run test` - API unit tests.
- `curl 'http://localhost:8080/v1/providers?mock=true&take=2' | jq` - Mock list.
- `curl -X POST http://localhost:8080/v1/providers -d '{"name":"test","type":"api","config":{}}' | jq` - Create.
- `cd apps/packages/admin && bun run dev` - Manual UI test add/edit/delete.
- Read .claude/commands/test_e2e.md, then read and execute .claude/commands/e2e/test_providers-management.md to validate this functionality works.
- `cd apps/packages/api && uv run pytest` - Server tests.
- `cd apps/packages/admin && bun tsc --noEmit` - Frontend type check.
- `cd apps/packages/admin && bun run build` - Frontend build.

## Notes

- Mock data: 3-5 samples with varied types/configs.
- Forms: Simple validation (required fields, valid JSON config).
- No auth on API assumed; add if needed.
- Future: Add import button calling /:id/import.

