# Feature: Proxy Test Endpoint

## Metadata

issue_number: `14`
adw_id: `backend14`
issue_json: `{ "title": "Add Proxy Test Endpoint", "body": "Add proxy test endpoint for admin UI to ping proxy and update score without issuing full lease" }`

## Feature Description

This feature adds a new API endpoint `POST /v1/proxies/:id/test` in the backend to allow testing an individual proxy's connectivity without issuing a full lease. The endpoint will validate the proxy, make an HTTP request through it to a test URL (default: a public health-check service like httpbin.org/ip), and update the proxy's score and failedCount based on the result. Success increases the score and resets failures; failure decreases the score and increments failures. This enables the admin UI to provide a "Test" button for quick proxy validation, improving manageability without consuming lease resources. Responses will include test success, status, and updated metrics for UI feedback. The implementation follows existing NestJS patterns for controllers and services, using axios for proxy requests.

## User Story

As a backend developer or admin
I want to test proxy connectivity via a dedicated API endpoint
So that I can verify and score proxies independently of leasing, aiding in maintenance and quality control.

## Problem Statement

Existing proxy management relies on leasing (GET /v1/proxy) for testing, which creates temporary leases, consumes resources, and ties up proxies briefly. There's no lightweight endpoint to ping a proxy's connectivity directly, update its health metrics (score/failedCount), or validate without full lease issuance. This limits efficient admin UI integration for non-technical users who need simple test buttons without understanding leasing.

## Solution Statement

Implement the endpoint in ProxiesController and ProxyService, injecting axios for HTTP tests through the proxy. Fetch the proxy by ID, construct proxy config, attempt a GET to a configurable test URL (default: httpbin.org/ip for IP verification), handle success/failure by updating Prisma fields (score ± adjustment, failedCount, lastChecked). Return a structured response for UI consumption. Use existing pagination/CRUD patterns; add DTOs for request/response. No new libraries beyond axios (install via npm). Ensure error handling for invalid proxies, timeouts, and auth. This solves the problem by decoupling testing from leasing, allowing independent health checks.

## Relevant Files

Use these files to implement the feature:

- `README.md`: Provides overview of Proxies API endpoints (e.g., GET /v1/proxies for listing, POST /v1/proxies for create), confirming pagination and filters exist. Relevant for understanding integration with admin UI (localhost:4173) and ensuring new endpoint aligns with /v1/ prefix.
- `apps/packages/api/src/modules/proxies/proxies.controller.ts`: Existing controller for proxy CRUD (GET list, POST create, PATCH update, DELETE); add new @Post(':id/test') method here following @ApiOperation and @ApiBody patterns for Swagger docs.
- `apps/packages/api/src/modules/proxies/proxies.service.ts`: Core service for proxy operations via Prisma (listProxies, createProxy, updateProxy); add testProxy(id: string, dto: TestProxyDto) method to handle validation, axios request, and Prisma updates for score/failedCount/lastChecked.
- `apps/packages/api/prisma/schema.prisma`: Database schema defining Proxy model (fields: id, host, port, username, password, protocol, score, failedCount, lastChecked, disabled); ensure updates target these for health metrics; no schema changes needed.
- `apps/packages/api/src/dto/proxy.dto.ts`: Existing DTOs (ProxyQueryDto for queries, CreateProxyDto for creation); add new TestProxyDto (optional url: string) and TestProxyResponseDto (success: bool, status?: number, error?: string, updatedScore?: number).
- `apps/packages/api/src/modules/proxies/proxies.module.ts`: NestJS module importing/exporting ProxyService; no changes needed unless adding new providers (e.g., for axios).

### New Files

None; extend existing DTO file for new types.

## Implementation Plan

### Phase 1: Foundation

Install axios dependency, define DTOs, and prepare service method stub. Ensure Prisma access for proxy fetch/update. Review existing lease logic in /modules/proxy/ to avoid overlap (e.g., check if proxy is leased before testing).

### Phase 2: Core Implementation

Implement testProxy service method: Fetch proxy, build axios config with proxy (host/port/auth), GET to test URL, update metrics on success/fail. Add controller endpoint to call service and return DTO. Configure test URL via env (default: httpbin.org/ip).

### Phase 3: Integration

Integrate with admin UI API calls (extend api.ts in admin if needed, but focus on backend). Add unit tests for service (mock axios/Prisma). Validate endpoint via Swagger or curl. Ensure updates cascade minimally (e.g., if score < threshold, mark disabled?).

## Step by Step Tasks

### Task 1: Setup Dependencies and DTOs

- Run `cd apps/packages/api && npm install axios` (or equivalent; report in notes if uv preferred).
- Extend `apps/packages/api/src/dto/proxy.dto.ts`: Add `TestProxyDto` class (url?: string, with validation @IsOptional() @IsUrl()), `TestProxyResponseDto` (success: boolean, status?: number, error?: string, updatedScore?: number, failedCount?: number).
- Import axios in `apps/packages/api/src/modules/proxies/proxies.service.ts`.

### Task 2: Implement Service Logic

- In `proxies.service.ts`, add `async testProxy(id: string, dto: TestProxyDto)`:
  - Fetch proxy: `await this.prisma.proxy.findUnique({ where: { id } })`; throw if null or disabled.
  - Build proxy config: `{ protocol: proxy.protocol, host: proxy.host, port: proxy.port, auth: proxy.username && proxy.password ? { username: proxy.username, password: proxy.password } : undefined }`.
  - Test request: `const testUrl = dto.url || process.env.PROXY_TEST_URL || 'https://httpbin.org/ip'; const response = await axios.get(testUrl, { proxy: config, timeout: 10000 });`.
  - On success: Update `score = Math.min(100, proxy.score + 10)`, `failedCount = 0`, `lastChecked = new Date()`.
  - On error: Increment `failedCount`, adjust `score = Math.max(0, proxy.score - (proxy.failedCount > 5 ? 20 : 5))`, update `lastChecked`.
  - Return `TestProxyResponseDto` with results.
- Handle protocols: For SOCKS, use `socks-proxy-agent` if needed (add dependency).

### Task 3: Add Controller Endpoint

- In `proxies.controller.ts`, add `@Post(':id/test') @ApiOperation({ summary: 'Test proxy connectivity' }) async test(@Param('id') id: string, @Body() dto: TestProxyDto) { return await this.service.testProxy(id, dto); }`.
- Add Swagger docs: @ApiBody({ type: TestProxyDto }), @ApiResponse({ status: 200, type: TestProxyResponseDto }).

### Task 4: Unit Tests

- Create or extend `apps/packages/api/src/modules/proxies/proxies.service.spec.ts` with Jest: Mock Prisma and axios for success/fail scenarios.
  - Test: Valid proxy success → score increases, failedCount=0.
  - Test: Invalid proxy → 404 error.
  - Test: Timeout/fail → score decreases, failedCount++.
  - Test: No auth needed for public proxies.

### Task 5: Validation

- Run `cd apps/packages/api && npm run test` to execute unit tests.
- Manually test: Use curl `POST /v1/proxies/{id}/test -d '{"url": "https://httpbin.org/ip"}'`; verify response and DB updates (e.g., query score change).
- Run `cd apps/packages/api && npx prisma studio` to inspect Proxy table post-test.
- Integration: Start server (`docker compose up`), call endpoint, confirm no regressions in existing CRUD (e.g., GET /v1/proxies lists updated scores).

## Testing Strategy

### Unit Tests

- Test service method: Mock Prisma.findUnique/update, axios.get (success with 200, fail with timeout/4xx).
- Validate inputs: dto.url optional, id exists.
- Edge: Disabled proxy → error; low score threshold → further decrement.
- Use Jest mocks for dependencies.

### Edge Cases

- Proxy with auth: Verify username/password in axios auth.
- SOCKS protocol: If supported, test with socks config (add agent if needed).
- Timeout (e.g., unresponsive proxy): Decrement score minimally.
- Invalid URL in dto: Validate with class-validator.
- Non-existent ID: Return 404.
- High failedCount (>10): Auto-disable if score <20.

## Acceptance Criteria

- Endpoint responds with TestProxyResponseDto on success/fail (e.g., {success: true, status: 200, updatedScore: 90}).
- Score updates correctly: +10 on success (cap 100), -5/-20 on fail based on history.
- FailedCount increments on error, resets on success.
- LastChecked updates to now on every test.
- Disabled proxies cannot be tested (400 error).
- Works without lease: No Lease record created/updated.
- Swagger docs show endpoint with DTOs; curl/Postman calls succeed.
- Unit tests pass 100% (coverage >80% for new code).
- No impact on existing endpoints (e.g., list returns updated scores).

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

- `cd apps/packages/api && npm run test` - Run server tests to validate the feature works with zero regressions
- `docker compose up api` - Start backend, then test endpoint: `curl -X POST http://localhost:8080/v1/proxies/{valid_id}/test -H "Content-Type: application/json" -d '{}'`; verify JSON response and Prisma query shows score change.
- `cd apps/packages/api && npx prisma studio` - Inspect Proxy model: Create test proxy, run endpoint, confirm lastChecked/score/failedCount updated.
- `cd apps/packages/admin && bun tsc --noEmit` - Run frontend type check to ensure no regressions if UI extended.
- `cd apps/packages/admin && bun run build` - Run frontend build to validate no regressions.

## Notes

- Install axios: `npm install axios`; add to package.json.
- Env var: Add PROXY_TEST_URL to .env (default httpbin.org/ip); fallback in code.
- Future: Queue tests (BullMQ) for rate limiting; integrate with UsageEvent for logging.
- Security: Authenticate endpoint (existing @ApiBearerAuth); rate limit if abused.
- No UI changes; but notes for admin: Update api.ts with testProxy function to call new endpoint.