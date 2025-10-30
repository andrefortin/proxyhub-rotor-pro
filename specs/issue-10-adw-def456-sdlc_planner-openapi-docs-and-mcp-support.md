# Feature: OpenAPI Documentation and MCP Consumption

## Metadata

issue_number: `10`
adw_id: `def456`
issue_json: `{}`

## Feature Description

Implement OpenAPI (Swagger) documentation for all API endpoints using @nestjs/swagger, generating interactive specs accessible at /api-docs. This provides auto-generated API reference, schema validation, and testing UI. Additionally, enhance API for easy MCP (Model Context Protocol) consumption by adding MCP-specific tags/decorators in OpenAPI, supporting MCP headers (e.g., x-mcp-model), and documenting MCP usage patterns for agent integration in Claude Code workflows.

## User Story

As an API developer or MCP agent integrator
I want interactive OpenAPI docs for all endpoints and MCP-optimized spec
So that I can easily discover, test, and integrate the API in tools like Claude Code or Postman, accelerating development and agentic interactions.

## Problem Statement

The API lacks formal documentation beyond README.md manual descriptions, making it hard for developers and MCP agents to understand schemas, params, responses, and authentication. No OpenAPI spec means no auto-generation for clients/stubs or MCP tool calling, reducing consumability in AI workflows.

## Solution Statement

Install @nestjs/swagger and swagger-ui-express. Configure SwaggerModule in main.ts for JSON spec at /api-json and UI at /api-docs. Add @ApiTags, @ApiOperation, @ApiParam, @ApiResponse, @ApiBody decorators to controllers/services for all endpoints (providers, proxies, usage, notifications, webhooks). For MCP: Add custom tags like 'mcp-tool' to relevant endpoints, document MCP headers, and include MCP consumption examples in /api-docs. Serve spec with MCP-friendly extensions (e.g., x-mcp-description). This follows NestJS conventions, auto-generates docs from code, and ensures extensibility for future endpoints.

## Relevant Files

Use these files to implement the feature:

- `README.md`: Update with OpenAPI/MCP usage instructions and links to /api-docs.
- `apps/packages/api/src/main.ts`: Configure SwaggerModule.setup for OpenAPI doc generation and UI serving; import DocumentBuilder.
- `apps/packages/api/package.json`: Add dependencies (@nestjs/swagger, swagger-ui-express) and scripts (e.g., npm run start:dev:swagger).
- `apps/packages/api/src/modules/providers/providers.controller.ts`: Add Swagger decorators (@ApiTags('providers'), @ApiOperation({summary: 'List Providers'}), @ApiQuery for params, @ApiResponse for 200/{items}).
- `apps/packages/api/src/modules/proxies/proxies.controller.ts`: Decorate GET/POST/PATCH/DELETE with @ApiOperation, @ApiQuery (e.g., for skip/limit/pool), @ApiBody for create/update, MCP tag for list endpoints.
- `apps/packages/api/src/modules/usage/usage.controller.ts`: Add decorators for stats endpoint.
- `apps/packages/api/src/modules/notifications/notifications.controller.ts`: Decorate config/logs with @ApiTags('notifications'), pagination queries.
- `apps/packages/api/src/modules/webhook/webhook.controller.ts`: Add @ApiTags('webhooks'), @ApiBody for POST.
- `apps/packages/api/prisma/schema.prisma`: Use for schema models in @ApiProperty if needed in DTOs, but primarily for reference.

### New Files

- `apps/packages/api/src/dto/` (if needed): Create DTOs like CreateProviderDto, ProxyQueryDto with @ApiProperty for OpenAPI schema generation.

## Implementation Plan

### Phase 1: Foundation

Install Swagger dependencies, configure in main.ts to enable doc generation without breaking existing setup.

### Phase 2: Core Implementation

Add decorators to all controllers, create DTOs for complex bodies/queries to enhance specs. Tag endpoints for MCP usability.

### Phase 3: Integration

Update README with docs URL and MCP examples. Validate spec generation includes all endpoints, test UI interactivity.

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### Install Dependencies

- Run `cd apps/packages/api && npm i @nestjs/swagger swagger-ui-express` to add Swagger support.

### Configure Swagger in Main

- In `main.ts`: Import SwaggerModule, DocumentBuilder. Create builder with title 'ProxyHub API', version '1.0', for MCP agents. Define custom options (tags: ['mcp-tool']). Setup module after app init (post-validationPipe), serve UI at /api-docs with custom css if needed.

### Create DTOs if Needed

- Create `apps/packages/api/src/dto/provider.dto.ts`: ProviderDto, CreateProviderDto with @ApiProperty for fields (name, type, config). Use ClassValidator for validation.
- Create `apps/packages/api/src/dto/proxy.dto.ts`: ProxyQueryDto for filters (pool?, providerId?, bbox?, skip?, limit?), @ApiProperty({required: false}).

### Decorate Providers Module

- In providers.controller.ts: @ApiTags('providers', 'mcp-tool'). @Get() @ApiOperation({summary: 'Paginated list of providers'}). @ApiQuery for skip/limit/search. @ApiResponse({status:200, type: [ProviderDto]}). Similar for POST @ApiBody({type: CreateProviderDto}), PATCH/DELETE.

### Decorate Proxies Module

- @ApiTags('proxies', 'mcp-tool'). @Get() @ApiOperation({summary: 'Paginated/filtered proxies'}). @ApiQuery({name:'pool', required:false}), for skip/limit/bbox. @ApiResponse({description: 'Paginated proxies', schema: {type: 'object', properties: {items: {type:'array', items:{$ref:'# (/ProxyDto)'}}}}}). POST/PATCH/DELETE with bodies.

### Decorate Other Modules

- Usage: @ApiTags('usage'). @Get('stats') @ApiOperation({summary: 'Get usage stats'}).
- Notifications: @ApiTags('notifications'). Decorate getAll/logs with pagination queries.
- Webhook: @ApiTags('webhooks', 'mcp-tool'). @Post() @ApiOperation({summary: 'Handle webhook'}). @ApiBody for event/payload.

### Update README and Validate

- Update README.md: Add sections 'OpenAPI Docs' linking /api-docs, 'MCP Integration' with examples (e.g., tool calling spec).
- Run `npm run start:dev`, visit http://localhost:3000/api-docs, verify all endpoints documented, try test calls.

Your last step should be running the `Validation Commands` to validate the feature works correctly with zero regressions.

## Testing Strategy

### Unit Tests

- Add e2e tests for /api-docs response (JSON spec validation), ensure all endpoints present in spec (use jest to fetch/parse).

### Edge Cases

- Missing decorators: Ensure default fallbacks.
- Custom MCP tags: Verify in spec output.
- Large configs: @ApiProperty for Json fields.
- Validation errors: Test with invalid params, check error responses in UI.

## Acceptance Criteria

- Swagger UI accessible at /api-docs post-start, lists all endpoints (providers, proxies, usage, notifications, webhooks).
- Spec JSON at /api-json includes descriptions, params (skip/page/limit), schemas for bodies/responses.
- MCP tags visible in spec for tool endpoints.
- No breaking changes to API; endpoints function as before.
- README updated with /api-docs link and MCP notes.
- Build/start succeeds, no deprecation warnings from Swagger.

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

- `cd apps/packages/api && npm i @nestjs/swagger swagger-ui-express` - Install deps.
- `cd apps/packages/api && npm run build` - Build API.
- `docker compose up --build api` - Start API only.
- `curl http://localhost:3000/api-docs-json` - Fetch spec, grep for endpoint paths.
- `curl -X GET "http://localhost:3000/v1/providers?skip=0&limit=5"` - Test endpoint still works.
- `docker compose down` - Stop.

## Notes

- Use npm for JS deps as Node/NestJS project.
- If auth needed, add bearer in Swagger config.
- For MCP: Extend with x-mcp-model in security schemes if tokens required.
- Future: Export spec to YAML, integrate with MCP server via .mcp.json.