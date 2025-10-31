# E2E Test: Real Proxy Connectivity Test

## Steps to Validate

1. Start: `docker compose up --build -d` and `docker compose exec api npx prisma migrate deploy`.
2. Add valid proxy with auth: curl POST /v1/proxies -d '{"host":"test.proxy.com","port":8080,"username":"user","password":"pass","protocol":"http","pool":"test"}' (use real working proxy if avail; fallback to valid format).
3. Navigate http://localhost:4173/proxies, click Test on proxy.
4. Verify: Modal "Testing...", then success with HTTP: 200, Latency: ~number ms, proxyString shown; no error.
5. For invalid/fail: Edit port to 9999, Save, Test again: Expect error (e.g., "Connection refused" or timeout), success=false.
6. Screenshot: Success modal (status 200, latency), error modal.
7. Network: POST /v1/proxies/:id/test returns {success:true, httpStatus:200, latencyMs:123}.

## Expected Screenshots
- Test modal success with HTTP 200/latency.
- Test modal error with connection issue.

## Validation
- Before: Simulated only; after: Real curl response in backend logs/UI.
- `docker compose exec api npm run test` (if tests added).
- Manual curl POST /v1/proxies/:id/test confirms JSON output.