# Bug: Error in the proxies Management page when deleting a proxy via the api

## Metadata

issue_number: `25`
adw_id: `bug25`
issue_json: `{ "title": "Error in the proxies Management page when deleting a proxy via the api", "body": "" }`

## Bug Description

The proxies management page in the admin UI encounters an error when attempting to delete a proxy through the API. Users expect a successful deletion with appropriate feedback, but instead receive an error message or failed request, preventing proxy management and potentially leading to stale data.

## Problem Statement

The DELETE operation for proxies via the API endpoint is either missing, incorrectly implemented, or not properly handled in the frontend UI, resulting in errors during deletion attempts from the Proxies page.

## Solution Statement

Implement or fix the DELETE /v1/proxies/{id} endpoint in the backend to handle proxy deletion securely, update the Prisma schema if needed for cascading deletes, and ensure the frontend correctly calls this endpoint with proper error handling and user feedback (e.g., success toast or modal confirmation).

## Steps to Reproduce

1. Start the application: `docker compose up --build -d` and `docker compose exec api npx prisma migrate deploy`.
2. Access the admin UI at http://localhost:4173/proxies.
3. Ensure there are proxies listed (if none, import via providers).
4. Click the delete button/action for a proxy.
5. Observe the error in the network tab (likely 404 or 500) or UI feedback indicating failure.

## Root Cause Analysis

The proxies module in the API likely lacks a dedicated DELETE handler in the controller, or the service method does not properly remove the proxy from the database and handle relations (e.g., usage logs). On the frontend, the delete API call in Proxies.tsx may not match the endpoint or fail to handle non-200 responses, leading to uncaught errors. This could stem from incomplete CRUD implementation focused on GET/POST, as per recent specs for proxy management.

## Relevant Files

Use these files to fix the bug:

### Existing Files
- `README.md`: Project overview, setup instructions, and API endpoints reference to confirm proxy management flow.
- `apps/packages/admin/src/pages/Proxies.tsx`: The UI component for managing proxies; relevant for implementing the delete button, API call via api.ts, and error handling (e.g., using DeleteConfirmModal).
- `apps/packages/admin/src/components/DeleteConfirmModal.tsx`: Reusable modal for confirmations; integrate with proxy deletion.
- `apps/packages/admin/src/lib/api.ts`: API client utilities (likely Axios); update or add DELETE proxy call.
- `apps/packages/api/src/modules/proxies/proxies.controller.ts`: Backend controller; add or fix @Delete() handler for /proxies/:id.
- `apps/packages/api/src/modules/proxies/proxies.service.ts`: Service logic; implement deleteProxy method with Prisma proxy.delete().
- `apps/packages/api/src/modules/proxies/proxies.module.ts`: Ensure ProxyService is provided.
- `apps/packages/api/prisma/schema.prisma`: Database model for Proxy; verify relations and if cascading delete is needed (e.g., to usage).
- `adws/adw_modules/agent.py`: If using ADW for implementation, but primary focus on direct code changes.
- `.claude/commands/conditional_docs.md`: Checked conditions; relevant for client (admin UI changes) and server (API backend), so include README.md and app_docs if UI-specific.

### New Files
- None required beyond potential E2E test (see tasks).

## Step by Step Tasks

### Research and Understand Current Implementation
- Read `apps/packages/api/src/modules/proxies/proxies.controller.ts` and `proxies.service.ts` to confirm if DELETE endpoint exists and what it returns (e.g., 404 if missing).
- Read `apps/packages/admin/src/pages/Proxies.tsx` and trace the delete action: check for API call like DELETE /v1/proxies/${id}, handle response, and update local state (e.g., refetch list).
- Read `apps/packages/admin/src/lib/api.ts` for the proxy delete method; ensure it uses correct endpoint and headers.
- Test reproduction: Use browser dev tools to simulate delete and capture exact error (e.g., network request failure).

### Implement Backend DELETE Endpoint
- In `apps/packages/api/src/modules/proxies/proxies.service.ts`, add or update async deleteProxy(id: string): Promise<Proxy> { return this.prisma.proxy.delete({ where: { id } }); } handling any relations (e.g., soft delete if needed).
- In `apps/packages/api/src/modules/proxies/proxies.controller.ts`, add @Delete(':id') async remove(@Param('id') id: string, @Req() req: Request) { return this.proxiesService.deleteProxy(id); } with auth if required.
- Update `apps/packages/api/prisma/schema.prisma` if needed (e.g., add deletedAt for soft delete), then run `npx prisma migrate dev --name add-proxy-delete`.
- Ensure error handling: Throw NotFoundException if proxy not exists.

### Update Frontend Delete Handling
- In `apps/packages/admin/src/pages/Proxies.tsx`, integrate DeleteConfirmModal for proxy delete: on confirm, call api.deleteProxy(id), then refetch proxies list on success, show error toast on failure.
- In `apps/packages/admin/src/lib/api.ts`, add export const deleteProxy = (id: string) => api.delete(`/proxies/${id}`);.
- Add loading state and user feedback (e.g., success message) to prevent multiple deletes.

### Add UI-Affecting E2E Test
- Read `.claude/commands/test_e2e.md`, `.claude/commands/e2e/test_providers-management.md`, and `.claude/commands/e2e/test_proxy-management.md` to understand E2E structure.
- Create a new E2E test file in `.claude/commands/e2e/test_proxy-delete-api-error.md` that validates the bug is fixed: Steps include navigating to /proxies, confirming a proxy exists, triggering delete via modal, verifying success (no error, list updates without the proxy), and screenshot of updated list. Include failure case check before fix if possible.

### Validation and Testing
- Rebuild and restart: `docker compose down && docker compose up --build -d`.
- Run backend tests: `docker compose exec api npm run test:proxies` (assuming Jest setup).
- Run frontend build: `cd apps/packages/admin && bun run build`.
- Manually test deletion end-to-end.
- Run your new E2E test validation.

## Validation Commands

Execute every command to validate the bug is fixed with zero regressions.

- `docker compose exec api npx prisma migrate deploy` - Ensure DB schema is up to date after changes.
- Navigate to http://localhost:4173/proxies, attempt to delete a proxy: Before fix, expect error; after, successful removal with no errors.
- Check API directly: `curl -X DELETE http://localhost:3000/v1/proxies/{valid-id} -H "Authorization: Bearer token"` - Expect 200 with deleted proxy or no content.
- `docker compose exec api npm run test` - Run full API tests to ensure no regressions.
- `cd apps/packages/admin && bun run build` - Frontend build succeeds without errors.
- Read `.claude/commands/test_e2e.md`, then read and execute your new E2E `.claude/commands/e2e/test_proxy-delete-api-error.md` test file to validate this functionality works.
- `docker compose exec api npx prisma studio` - Inspect DB to confirm proxy is deleted (or soft-deleted).

## Notes

- Ensure dependency injection in NestJS for proxies module; recall setup from CLAUDE.md: Providers/Proxies use similar injection patterns.
- If auth is required for DELETE, add guards (e.g., JwtAuthGuard).
- Minimal changes: Only add/fix delete logic, no unrelated refactors.
- No new libraries needed; use existing Prisma and Axios.