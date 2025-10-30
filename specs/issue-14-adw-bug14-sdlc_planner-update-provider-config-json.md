# Bug: Update Provider Config JSON and User Messaging

## Metadata

issue_number: `14`
adw_id: `bug14`
issue_json: `{"title":"Update provider config JSON and user messaging","body":"update the provider config json and user messaging to accept input like the following : {\"apiKey\":\"bc2a3c9d12118584a24c9157defbd8e634b5fbf4464765f7c1db37ac0077\",\"apiDocs\":[\"https://docs.iproyal.com/proxies/datacenter/api/user\",\"https://docs.iproyal.com/proxies/datacenter/api/products\",\"https://docs.iproyal.com/proxies/datacenter/api/orders\",\"https://docs.iproyal.com/proxies/datacenter/api/proxies\"],\"baseUrl\":\"https://api.provider.com/v1/reseller\",\"authType\":\"header\",\"authHeader\":\"X-Access-Token\"}"}`

## Bug Description

The current provider configuration in the README and implementation is hardcoded for IPRoyal-specific fields (e.g., \"kind\": \"iproyal\", \"access_token\", \"list_endpoint\", \"default_pool\"). This limits flexibility for other providers. Users cannot provide a generic config with fields like apiKey, apiDocs (array of URLs), baseUrl, authType, and authHeader. The DTO allows any object, but the service logic and documentation do not support this structure, leading to incomplete integration for non-IPRoyal providers.

Expected: POST /v1/providers accepts and processes a flexible config JSON as specified.

Actual: Documentation and code expect IPRoyal-specific keys, causing failures or manual adaptations for other providers.

## Problem Statement

The provider creation endpoint and documentation do not support a standardized, generic API provider configuration that includes apiKey, apiDocs array, baseUrl, authType, and authHeader, restricting extensibility to other proxy providers.

## Solution Statement

Update the provider.service.ts to parse and use the new config structure for API calls (e.g., construct endpoints using baseUrl, add auth headers based on authType/authHeader, store apiDocs for reference). Update README documentation to reflect the new generic config example. Since DTO already allows arbitrary objects, no validation changes needed. Ensure backward compatibility for existing IPRoyal configs by mapping old keys to new ones if present.

## Steps to Reproduce

1. Start the application: docker compose up --build -d; docker compose exec api npx prisma migrate deploy
2. POST to /v1/providers with the new config JSON: { "name": "test-provider", "type": "api", "config": {"apiKey":"testkey","apiDocs":["https://docs.example.com"],"baseUrl":"https://api.example.com/v1","authType":"header","authHeader":"X-Api-Key"} }
3. Observe that the provider is created but import/sync operations fail due to hardcoded IPRoyal assumptions in provider.service.ts.
4. Check README: It shows only IPRoyal example, misleading users.

## Root Cause Analysis

The provider.service.ts likely has hardcoded logic for IPRoyal (e.g., specific endpoint paths like "/reseller/datacenter/proxies", header "X-Access-Token"). The README documentation reinforces this by providing only IPRoyal examples. While CreateProviderDto accepts any config object, the service does not dynamically use baseUrl/auth for requests, causing failures for non-matching configs. This stems from initial implementation focused solely on IPRoyal integration without generalizing the API client logic.

## Relevant Files

Use these files to fix the bug:

- `apps/packages/api/src/dto/provider.dto.ts`: Defines CreateProviderDto with flexible config: ConfigDto as any object. Relevant because it already supports the new JSON structure; no changes needed, but confirm validation.
- `apps/packages/api/src/modules/providers/providers.controller.ts`: Handles POST /v1/providers. Relevant to ensure endpoint accepts the new config without issues.
- `apps/packages/api/src/modules/providers/providers.service.ts`: Core logic for creating providers and config handling. Relevant because it needs updates to parse/use apiKey, baseUrl, etc., for API interactions (e.g., in import/sync methods).
- `apps/packages/api/src/modules/provider/provider.service.ts`: May contain specific provider operations like import. Relevant if it has IPRoyal-specific code to generalize.
- `README.md`: Contains provider config examples and documentation. Relevant to update user messaging with the new generic JSON structure and examples.
- `apps/packages/api/prisma/schema.prisma`: Defines Provider model with config as JSON. Relevant to confirm config field can store the new structure (it uses Json type).

### New Files

None.

## Step by Step Tasks

### Update Provider Service Logic

- Read `apps/packages/api/src/modules/providers/providers.service.ts` to identify hardcoded IPRoyal logic (e.g., endpoint construction, auth headers).
- Update the service to dynamically build API clients using config.baseUrl for endpoints, config.apiKey for authentication, config.authType/authHeader for request headers (e.g., if authType="header", set headers[authHeader] = apiKey).
- In methods like createProvider or importProxies, use the new config fields; map legacy fields (e.g., access_token -> apiKey, list_endpoint -> baseUrl + "/path") for backward compatibility.
- Store apiDocs in the provider config for future reference (e.g., validation or logging), but do not require it for core functionality.

### Generalize Provider Operations

- Read `apps/packages/api/src/modules/provider/provider.service.ts` and update any IPRoyal-specific calls (e.g., fetch proxies) to use the dynamic client from the updated config.
- Ensure POST /v1/providers/{id}/import uses the new config to construct requests to baseUrl + relevant path from apiDocs or defaults.
- Add error handling for missing config fields (e.g., throw BadRequestException if baseUrl or apiKey absent for type="api").

### Update Documentation

- Read `README.md` and update the "IPRoyal Integration" section to "Generic API Provider Integration", providing the new config example.
- Add a note on backward compatibility and how to migrate existing providers.
- Include usage for apiDocs (e.g., for manual endpoint reference).

### Validation and Testing

- Run Prisma migration if schema changes (none expected).
- Manually test: Create provider with new config, trigger import, verify proxies fetched using dynamic endpoints/headers.
- Update any unit tests in providers.service.spec.ts (if exists) to cover new config parsing.

### Final Validation

- Execute the Validation Commands to ensure no regressions.

## Validation Commands

Execute every command to validate the bug is fixed with zero regressions.

- `docker compose up --build -d` - Restart services to apply changes.
- `docker compose exec api npx prisma migrate deploy` - Ensure DB up to date.
- POST to /v1/providers with legacy IPRoyal config; verify creation and import works (backward compatibility).
- POST to /v1/providers with new generic config; verify creation, then POST /v1/providers/{id}/import succeeds and fetches proxies.
- GET /v1/providers; confirm new provider listed with full config.
- Check README.md content for updated examples (manual verification).
- `docker compose exec api npm run test` - Run API tests to ensure no regressions (if tests exist; else manual endpoint testing via curl).
- `docker compose down` - Clean up.

- `cd apps/packages/api && npm run build` - Build API to validate compilation.
- Manual reproduction: Before fix (if rolled back), new config import fails; after, it succeeds.

## Notes

- No new libraries needed; use existing Axios or HttpService in NestJS for dynamic requests.
- Ensure config.apiDocs is validated as optional array of URLs if used.
- Consider adding Swagger examples in controller for the new config shape.
- This fix enhances extensibility for other providers like BrightData or Oxylabs without code changes.