# ProxyHub Rotator API Documentation

## Overview

ProxyHub Rotator is a comprehensive proxy management and rotation service with MCP (Model Context Protocol) support for AI tool integration. The API provides endpoints for managing proxy providers, issuing proxy leases, monitoring usage, and configuring notifications.

## Base URL

- Development: `http://localhost:8080`
- API Documentation: `http://localhost:8080/api-docs`

## Authentication

All API endpoints require authentication using the `X-Access-Token` header:

```bash
curl -H "X-Access-Token: YOUR_TOKEN" http://localhost:8080/v1/proxies
```

## MCP Integration

This API is optimized for AI tool usage through the Model Context Protocol. Key endpoints are tagged with `mcp-tool` for easy discovery. See `mcp-server.json` for complete tool definitions.

## Core Endpoints

### Proxy Management

#### Issue Proxy Lease

```http
GET /v1/proxy?project=AGENT&pool=default&sticky=true&country=US
```

**Purpose**: Get a proxy for immediate use in your project.

**Parameters**:

- `project` (required): Project identifier for tracking
- `pool` (optional): Proxy pool name (default: "default")
- `sticky` (optional): Enable session reuse (true/false)
- `country` (optional): Filter by country code (e.g., "US", "UK")

**Response**:

```json
{
  "leaseId": "uuid-lease-id",
  "proxy": "http://user:pass@proxy.host:port",
  "protocol": "http",
  "expiresAt": "2024-01-01T12:00:00Z",
  "meta": {
    "providerId": "provider-id",
    "score": 85,
    "country": "US",
    "sticky": true
  }
}
```

#### Release Proxy Lease

```http
POST /v1/proxy/{leaseId}/release
Content-Type: application/json

{
  "status": "ok",
  "latencyMs": 250,
  "statusCode": 200
}
```

**Purpose**: Mark lease as completed and provide performance feedback.

#### List Proxies

```http
GET /v1/proxies?page=1&limit=50&search=US&pool=residential&sortBy=score&sortOrder=desc
```

**Purpose**: Browse and search available proxies with filtering.

**Parameters**:

- `page`, `limit`: Pagination
- `search`: Search term (host, country, city, etc.)
- `pool`: Filter by pool name
- `providerId`: Filter by provider
- `bbox`: Geographic bounding box `minLon,minLat,maxLon,maxLat`
- `sortBy`: Sort field (score, lastChecked, etc.)
- `sortOrder`: asc/desc

#### Test Proxy

```http
GET /v1/proxy/{proxyId}/test
```

**Purpose**: Test proxy connectivity and measure latency.

### Provider Management

#### List Providers

```http
GET /v1/providers?search=iproyal
```

#### Create Provider

```http
POST /v1/provider
Content-Type: application/json

{
  "name": "iproyal-dc",
  "type": "api",
  "config": {
    "kind": "iproyal",
    "access_token": "YOUR_TOKEN",
    "list_endpoint": "https://apid.iproyal.com/v1/reseller/datacenter/proxies",
    "default_pool": "default"
  }
}
```

#### Import Proxies

```http
POST /v1/provider/{providerId}/import
```

**Purpose**: Trigger proxy import from provider API or file.

### Notifications & Webhooks

#### Send Test Webhook

```http
POST /v1/webhooks
Content-Type: application/json

{
  "event": "test",
  "payload": {
    "message": "Hello from ProxyHub"
  }
}
```

#### Configure Notifications

```http
PATCH /v1/notifications/discord
Content-Type: application/json

{
  "enabled": true,
  "config": {
    "webhook_url": "https://discord.com/api/webhooks/..."
  },
  "eventTypes": ["proxy_failed", "import_completed"]
}
```

### Usage Statistics

#### Get Usage Stats

```http
GET /usage/stats
```

**Response**:

```json
{
  "daily": {
    "2024-01-01": {
      "requests": 1250,
      "success": 1180,
      "failed": 70
    }
  },
  "codes": {
    "200": 1180,
    "404": 45,
    "500": 25
  }
}
```

## Common Use Cases

### 1. Web Scraping Setup

```bash
# 1. Get a sticky proxy for consistent sessions
curl -H "X-Access-Token: $TOKEN" \
  "http://localhost:8080/v1/proxy?project=scraper&pool=residential&sticky=true&country=US"

# 2. Use the returned proxy URL in your scraper
# 3. Release when done
curl -X POST -H "X-Access-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"ok","latencyMs":300}' \
  "http://localhost:8080/v1/proxy/LEASE_ID/release"
```

### 2. Provider Setup (IPRoyal)

```bash
# Create IPRoyal provider
curl -X POST -H "X-Access-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iproyal-datacenter",
    "type": "api",
    "config": {
      "kind": "iproyal",
      "access_token": "YOUR_IPROYAL_TOKEN",
      "list_endpoint": "https://apid.iproyal.com/v1/reseller/datacenter/proxies",
      "default_pool": "datacenter"
    }
  }' \
  "http://localhost:8080/v1/provider"

# Import proxies from provider
curl -X POST -H "X-Access-Token: $TOKEN" \
  "http://localhost:8080/v1/provider/PROVIDER_ID/import"
```

### 3. Geographic Filtering

```bash
# Find proxies in specific region (US West Coast)
curl -H "X-Access-Token: $TOKEN" \
  "http://localhost:8080/v1/proxies?bbox=-125,32,-114,42&limit=20"

# Get proxy from specific country
curl -H "X-Access-Token: $TOKEN" \
  "http://localhost:8080/v1/proxy?project=geo-test&country=DE"
```

## Error Handling

### Common Error Responses

**No Proxy Available**:

```json
{
  "error": "NO_PROXY_AVAILABLE"
}
```

**Invalid Parameters**:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

**Authentication Required**:

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

## Rate Limits

- Proxy lease requests: 100/minute per project
- Import operations: 5/minute per provider
- General API calls: 1000/minute per token

## Sticky Sessions

Sticky sessions allow reusing the same proxy for a project/pool combination:

1. Request proxy with `sticky=true`
2. Subsequent requests with same project/pool return same proxy
3. Session expires after `reuseTtlSeconds` (default: 24 hours)
4. Failed proxies are automatically rotated out

## Webhook Events

Configure webhooks to receive notifications:

- `proxy_failed`: Proxy marked as failed
- `import_completed`: Provider import finished
- `lease_expired`: Proxy lease expired
- `provider_created`: New provider added
- `test`: Manual test event

## MCP Tool Integration

For AI assistants, use the MCP configuration:

```json
{
  "mcpServers": {
    "proxyhub": {
      "command": "node",
      "args": ["mcp-server.js"],
      "env": {
        "PROXYHUB_API_URL": "http://localhost:8080",
        "PROXYHUB_TOKEN": "your-access-token"
      }
    }
  }
}
```

## Support

- API Documentation: http://localhost:8080/api-docs
- OpenAPI Spec: http://localhost:8080/api-docs-json
- MCP Config: ./mcp-server.json
