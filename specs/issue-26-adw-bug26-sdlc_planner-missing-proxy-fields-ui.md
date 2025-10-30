# Bug: Missing Proxy Fields in UI Display and Edit Dialog

## Metadata

issue_number: `26`
adw_id: `bug26`
issue_json: `{ "title": "when loading proxies from the database via the api, not all the fields are available to display on the UI or the proxies management code is not displaying the values properly for the proxies. Missing fields are (port, username, password). These same fields are not being displayed in the EDIT proxy dialog either.", "body": "" }`

## Bug Description

When loading proxies via the GET /v1/proxies API for the Proxies management page, fields like port, username, and password are not returned, causing the UI table to show incomplete info (e.g., host without port) and the Edit dialog to fail pre-filling these values. Expected: Full proxy details visible in list and editable with pre-filled values; actual: Missing fields lead to blank/misdisplayed data, hindering management.

## Problem Statement

The backend API for listing proxies selects only a subset of fields (id, host, pool, etc.) for performance, excluding essential ones like port, username, password needed for UI display and editing, while individual getProxy likely returns full data but list does not, causing inconsistencies in the Proxies page and modal.

## Solution Statement

Expand the field selection in the backend listProxies query to include port, username, password (and protocol if relevant), mask sensitive fields like password in responses if needed; update frontend UI to display port/username where appropriate (e.g., in table tooltip/details); ensure Edit dialog prefills all available fields from list data, falling back to full fetch if incomplete.

## Steps to Reproduce

1. Start app: `docker compose up --build -d` and `docker compose exec api npx prisma migrate deploy`.
2. Add a test proxy with auth: Use curl POST /v1/proxies with host: "test.com", port: 8080, username: "user", password: "pass", pool: "test".
3. Navigate to http://localhost:4173/proxies; verify table shows proxies but Host:Port as "test.com:" (port missing), no auth indication.
4. Click Edit on the proxy; verify modal shows host but blank/missing port, username, password fields.
5. Console log proxy object: Confirm port, username, password absent in list response.

## Root Cause Analysis

In proxies.service.ts, listProxies uses Prisma findMany with select excluding port, username, password (optimized for maps/UI summary), so API returns partial data. Proxies.tsx assumes full Proxy type but receives subset, causing undefined values in display ({proxy.host}:{proxy.port} shows empty port) and editData setting undefined for missing fields. getProxy(id) likely returns full, but list doesn't use it, leading to incomplete UI. Schema has these fields optional but populated on create.

## Relevant Files

Use these files to fix the bug:

### Existing Files
- `README.md`: API endpoints reference (Proxies API with pagination/filters) and setup for reproduction.
- `apps/packages/api/src/modules/proxies/proxies.service.ts`: Core issue; listProxies select clause limits fields – expand to include port, username, password for management views.
- `apps/packages/api/src/modules/proxies/proxies.controller.ts`: Handles GET /v1/proxies; update if response transformation needed (e.g., mask password).
- `apps/packages/admin/src/pages/Proxies.tsx`: UI displays {proxy.host}:{proxy.port} (port undefined) and openEdit sets editData from partial proxy; add conditional display for username (e.g., tooltip "Auth: user") and ensure port shown.
- `apps/packages/admin/src/lib/api.ts`: getProxies returns PaginationResponse<Proxy> but data lacks fields; no change needed if backend fixed, but verify type safety.
- `apps/packages/api/prisma/schema.prisma`: Proxy model confirms fields exist (port: Int, username/password: String?); ensure optional handling.
- `.claude/commands/conditional_docs.md`: Matches client (UI changes) and server (API), so include README; no specific app_docs match.
- Read `.claude/commands/test_e2e.md` and `.claude/commands/e2e/test_proxy-management.md` to understand E2E test creation for validating field display/edit.

### New Files
- `.claude/commands/e2e/test_proxy-fields-display-edit.md`: For validating fixed display and prefill (task below).

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### Research and Verify Current Data Flow
- Read `apps/packages/api/src/modules/proxies/proxies.service.ts` listProxies: Confirm select excludes port, username, password; test API response via curl GET /v1/proxies to verify missing fields.
- Read `apps/packages/admin/src/pages/Proxies.tsx`: Trace fetchProxies -> getProxies -> display {proxy.port} (undefined); check openEdit sets editData.port from proxy (missing).
- Read `apps/packages/admin/src/lib/api.ts`: Confirm getProxies uses /v1/proxies; verify getProxy fetches full for edit if needed, but optimize to avoid extra calls.
- Manually reproduce: Add proxy with port/username/password, load page, inspect network response and console.log(proxy) to confirm absence.

### Update Backend to Return Full Fields in List
- In `apps/packages/api/src/modules/proxies/proxies.service.ts`, expand select in findMany to include port, username, protocol, tags, meta (keep optional); for security, consider masking password in response (e.g., if (username) return { ...proxy, password: undefined }).
- Update `apps/packages/api/src/modules/proxies/proxies.controller.ts` if needed for response handling, but service change propagates.
- No schema changes; test locally with curl POST proxy (with fields), then GET to confirm included.

### Enhance Frontend Display and Edit Prefill
- In `apps/packages/admin/src/pages/Proxies.tsx`, update table Host:Port display to handle undefined port (e.g., {proxy.host}{proxy.port ? `:${proxy.port}` : ''}); add tooltip for auth: if (username) show "Auth: {username} (password set)".
- In openEdit, if fields missing from list (fallback), call getProxy(id) to fetch full details before setting editData; populate password as '*****' if exists.
- Add loading state for edit fetch if implemented; ensure form inputs defaultValue uses fetched data.

### Add E2E Test for Field Display and Edit
- Read `.claude/commands/test_e2e.md`, `.claude/commands/e2e/test_proxy-management.md`, and `.claude/commands/e2e/test_proxy-delete-api-error.md` to understand structure.
- Create a new E2E test file in `.claude/commands/e2e/test_proxy-fields-display-edit.md` that validates the bug is fixed: Steps include adding proxy with port=8080, username="testuser", password="pass" via API/curl; navigate to /proxies, verify table shows "host:8080" and tooltip "Auth: testuser"; click Edit, confirm modal pre-fills port, username (password masked), submit update (e.g., change port), verify table updates; screenshot table with fields and edit modal. Minimal steps: Add, list display, edit prefill, no blanks/errors.

### Validation and Testing
- Restart: `docker compose down && docker compose up --build -d`.
- Test API: curl POST proxy with fields, GET /v1/proxies, confirm response includes port, username (password masked if added).
- Frontend: Load /proxies, verify display; edit proxy, confirm prefill; build with `cd apps/packages/admin && bun run build`.
- Run your new E2E test validation.

## Validation Commands

Execute every command to validate the bug is fixed with zero regressions.

- `docker compose exec api npx prisma migrate deploy` - Ensure DB ready.
- Add test proxy via curl: `curl -X POST http://localhost:3000/v1/proxies -d '{"host":"test.com","port":8080,"username":"user","password":"pass","pool":"test"}'`; GET /v1/proxies: Confirm JSON includes "port":8080, "username":"user" (password optional/masked).
- Navigate to http://localhost:4173/proxies: Verify table shows "test.com:8080", tooltip auth; before fix: port missing; after: displayed.
- Edit proxy: Verify modal pre-fills port/username; update and confirm table refreshes without errors.
- `cd apps/packages/admin && bun tsc --noEmit` - Type check passes.
- `cd apps/packages/admin && bun run build` - Build succeeds.
- Read `.claude/commands/test_e2e.md`, then read and execute your new E2E `.claude/commands/e2e/test_proxy-fields-display-edit.md` test file to validate this functionality works.
- No server tests for this; manual API/UI verification ensures zero regressions.

## Notes

- Security: Consider not returning password in list response; use getProxy only for edit, or mask as 'set'.
- Performance: Including more fields in list is fine for management (small pages); if large, add ?full=true param to toggle select.
- Types: Update Proxy type in admin/src/types.ts if needed for optional fields.
- No new libs; use existing Prisma/Axios.