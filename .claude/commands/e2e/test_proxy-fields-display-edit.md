# E2E Test: Proxy Fields Display and Edit Prefill

## Steps to Validate

1. Start app: `docker compose up --build -d` and `docker compose exec api npx prisma migrate deploy`.
2. Add test provider: http://localhost:4173/providers, add "TestProvider" (manual, config: {\"test\": true}).
3. Add test proxy via curl: `curl -X POST http://localhost:3000/v1/proxies -H "Content-Type: application/json" -d '{\"host\":\"test.com\",\"port\":8080,\"username\":\"user\",\"password\":\"pass\",\"pool\":\"test\",\"providerId\":\"TEST_ID\"}'`.
4. Navigate to http://localhost:4173/proxies: Verify table Host:Port "test.com:8080" (port shown), tooltip shows "Auth: user (password set)".
5. Screenshot: Table with host:port and tooltip open.
6. Click Edit on proxy: Verify modal pre-fills Host: test.com, Port: 8080, Username: user, Password: *****, Pool: test.
7. Change port to 8081, submit: Verify updates, table shows "test.com:8081" without errors.
8. Screenshot: Edit modal with pre-filled fields.
9. Verify no console errors; before fix: port blank; after: populated.

## Expected Screenshots
- Table displaying host:port and auth tooltip.
- Edit modal with pre-filled port, username, masked password.

## Validation
- API: curl GET /v1/proxies – Confirm "port":8080, "username":"user" in JSON (password absent/masked).
- `cd apps/packages/admin && bun run build` succeeds.
- Inspect network: GET /v1/proxies includes fields.