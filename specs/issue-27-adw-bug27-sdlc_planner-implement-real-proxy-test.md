# Bug: Implement Real Proxy Connectivity Test

## Metadata

issue_number: `27`
adw_id: `bug27`
issue_json: `{ "title": "fix the [test proxy] to use buy trying to request a page from 'https://example.com' using the: (procotol, host, post, username, password) in a format similar to the following for the URL : curl -x http://username:password@proxy_ip:proxy_port http://example.com", "body": "" }`

## Bug Description

The "Test proxy" button in the Proxies management UI only issues a lease and assumes success without verifying actual connectivity through the proxy. Users expect a genuine test that attempts a request to an external site (https://example.com) using the full proxy URL format (e.g., curl -x {protocol}://{username}:{password}@{host}:{port} https://example.com), reporting success/failure and response details. Currently, it logs a placeholder and shows simulated results, which doesn't validate proxy functionality, leading to untested proxies in production.

## Problem Statement

The handleTest function in the frontend simulates proxy testing by issuing a lease but doesn't perform an outbound request through the proxy, failing to confirm if the proxy (protocol, host:port, username/password) works. This needs integration with a backend endpoint that executes the actual curl-like request securely.

## Solution Statement

Create a new backend endpoint POST /v1/proxies/:id/test to perform the connectivity test: build proxy URL (protocol://username:password@host:port if auth), use Node's http/https or child_process.exec to request https://example.com (handle timeouts/errors), return status (success/fail), response time, HTTP status. Update frontend handleTest to call this endpoint, display results in modal (e.g., status, latency, or error). Keep lease issuance as precondition; release on failure if leased.

## Steps to Reproduce

1. Start app: `docker compose up --build -d` and ensure proxies exist with auth (add via POST /v1/proxies with username/password).
2. Navigate to http://localhost:4173/proxies; click "Test" on a proxy.
3. Observe: Modal shows "Testing proxy..." then success with lease string, no actual request made (check network: only /v1/proxy? for lease, no outbound simulation).
4. Verify console: No real proxy validation, just lease response; no HTTP status/latency from example.com.

## Root Cause Analysis

In Proxies.tsx, handleTest calls issueLease (which returns lease if successful) but comments "Simulate test" without using the proxy for a real request. No backend endpoint exists for proxy testing; frontend lacks fetch to validate. Lease API is for runtime use, not testing—real test requires constructing {protocol}://{username}:{password}@{host}:{port} URL and requesting external site. Missing: Backend service method to exec curl or HTTP request via proxy (security: avoid client-side curl for consistency).

## Relevant Files

Use these files to fix the bug:

### Existing Files
- `README.md`: API overview; proxy endpoints reference for base.
- `apps/packages/admin/src/pages/Proxies.tsx`: UI handleTest button/modal; update to call new /test endpoint instead of simulating (pass proxy ID), parse response for display (status, latency, error).
- `apps/packages/admin/src/lib/api.ts`: issueLease exists (/v1/proxy); add export const testProxy = (id: string) => post(`/proxies/${id}/test`, {});.
- `apps/packages/api/src/modules/proxies/proxies.controller.ts`: Add POST :id/test handler calling service.testProxy(id).
- `apps/packages/api/src/modules/proxies/proxies.service.ts`: Implement testProxy(id): From DB get proxy details (host, port, etc.), build URL, use node-fetch or child_process.spawn('curl', ['-x', url, 'https://example.com', '--max-time', '10']), capture stdout/stderr/status/timeout, return { success, httpStatus, latency, error }.
- `apps/packages/api/src/modules/proxies/proxies.module.ts`: Ensure ProxyService injected.
- `.claude/commands/conditional_docs.md`: Matches client (UI changes) and server (API), include README; for UI test button interaction.
- Read `.claude/commands/test_e2e.md`, `.claude/commands/e2e/test_proxy-management.md`, and `.claude/commands/e2e/test_proxy-delete-api-error.md` for E2E test structure.

### New Files
- None; extend existing controller/service.

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### Research Current Test Flow
- Read `apps/packages/admin/src/pages/Proxies.tsx` handleTest: Confirm issues lease via issueLease but simulates success without real request; logs "proxy:" but no outbound.
- Read `apps/packages/admin/src/lib/api.ts` issueLease: Calls /v1/proxy? for lease, not test.
- Trace service/controller: No dedicated test method/endpoint; add one.
- Reproduce: Add auth proxy, click Test, verify no real request (network: only lease GET), modal shows lease proxy string as "result" without validation.

### Implement Backend Test Endpoint
- In `apps/packages/api/src/modules/proxies/proxies.service.ts`, add async testProxy(id: string): Promise<{success: boolean, httpStatus?: number, latencyMs?: number, error?: string}> { get proxy, if disabled/faile d return error; build proxyUrl = `${proxy.protocol || 'http'}://${proxy.username ? `${proxy.username}:${proxy.password}@` : ''}${proxy.host}:${proxy.port}`; use import child_process; const { spawn } = require('child_process'); spawn curl ['-x', proxyUrl, 'https://example.com', '--max-time', '5000'], handle promise on exit with timeout 10s, parse output for HTTP status/timeout, return object. If error, {success: false, error} }.
- In `apps/packages/api/src/modules/proxies/proxies.controller.ts`, add @Post(':id/test') @ApiOperation({ summary: 'Test proxy connectivity' }) async test(@Param('id') id: string) { return this.service.testProxy(id); }.
- No schema changes; test locally with curl POST /v1/proxies/:id/test after add proxy (expect {success, status 200} or error).

### Update Frontend Test Integration
- In `apps/packages/admin/src/lib/api.ts`, add export async function testProxy(id: string): Promise<{success: boolean, httpStatus?: number, latencyMs?: number, error?: string}> { return apiRequest(`/v1/proxies/${id}/test`, {method: 'POST'}); }.
- In `apps/packages/admin/src/pages/Proxies.tsx`, update handleTest: After issueLease success, call testProxy(id), setTestResult from response (e.g., success=true if httpStatus 200, latency from timing, error if fail); display in modal (status, latency, full response snippet if error).
- Ensure test uses lease if obtained, but since test is quick, spawn new request; handle errors (e.g., ECONNREFUSED if proxy down).

### Add E2E Test for Real Proxy Test
- Read `.claude/commands/test_e2e.md`, `.claude/commands/e2e/test_proxy-management.md`, and `.claude/commands/e2e/test_proxy-fields-display-edit.md` for structure.
- Create a new E2E test file in `.claude/commands/e2e/test_proxy-real-connectivity.md` that validates: Add auth proxy, click Test, verify modal shows real HTTP status (200 for example.com), latency >0, success if 200; for bad proxy, error message. Screenshots: Test button, modal with success/error, network 200/502. Minimal: Setup proxy, test button, verify response.

### Validation and Testing
- Restart: `docker compose down && docker compose up --build -d`.
- Add proxy with auth, click Test: Verify requests /v1/proxy (lease), /v1/proxies/:id/test, modal shows actual status/latency.
- Test failure: Add invalid proxy (host 999.999.999 wrong), click Test, confirm error displayed.
- Frontend build/test.

## Validation Commands

Execute every command to validate the bug is fixed with zero regressions.

- `docker compose exec api npx nest build` - Backend builds without errors.
- Add test proxy: curl POST /v1/proxies with valid/invalid details.
- GET /v1/proxies/:id/test via curl POST: Expect JSON {success: true, httpStatus: 200, latencyMs: ~100} or {success: false, error: 'ECONN...'}.
- Load /proxies UI, click Test: Verify modal shows real status (200 OK), latency; console no errors.
- Before: Simulate only; after: Real request succeeds/fails appropriately.
- `cd apps/packages/admin && bun tsc --noEmit` - Types pass.
- `cd apps/packages/admin && bun run build` - Frontend builds.
- Read `.claude/commands/test_e2e.md`, then read and execute your new E2E `.claude/commands/e2e/test_proxy-real-connectivity.md` test file to validate this functionality works.

## Notes

- Security: Backend handles curl internally (no shell injection); use timeouts (curl --max-time 10); validate URL components.
- Libs: If child_process ok, no new; ensure node modules for fetch/child_process.
- Edge: HTTPS proxies, timeouts (return error), auth formats (':' if no user/pass).
- No DB changes; test with mixed valid/invalid proxies.
- Update Swagger for new endpoint.