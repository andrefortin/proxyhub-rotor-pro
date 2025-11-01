# ProxyHub Rotator MCP Server

Model Context Protocol (MCP) server for ProxyHub Rotator - enabling AI assistants to manage proxies, providers, and perform web scraping tasks.

## Quick Start

### 1. Start ProxyHub API

```bash
cd proxyhub-rotor-pro
docker compose up --build -d
```

### 2. Configure MCP Client

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "proxyhub": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"],
      "env": {
        "FETCH_BASE_URL": "http://localhost:8080",
        "FETCH_HEADERS": "{\"X-Access-Token\": \"your-access-token\"}"
      }
    }
  }
}
```

### 3. Available Tools

| Tool                  | Description                 | Usage                   |
| --------------------- | --------------------------- | ----------------------- |
| `get_proxy_lease`     | Get proxy for project       | Web scraping, API calls |
| `release_proxy_lease` | Release proxy with feedback | Mark usage complete     |
| `list_proxies`        | Search/filter proxies       | Find specific locations |
| `create_provider`     | Add proxy provider          | Setup IPRoyal, etc.     |
| `import_proxies`      | Import from provider        | Refresh proxy list      |
| `test_proxy`          | Test proxy connection       | Verify proxy health     |
| `send_webhook`        | Send test notification      | Test integrations       |
| `get_usage_stats`     | View API statistics         | Monitor usage           |

## Common AI Tasks

### Web Scraping

```text
"Get me a US residential proxy for scraping e-commerce sites"
→ Uses get_proxy_lease with country=US, pool=residential
```

### Proxy Management

```text
"Show me all proxies in Europe with good performance"
→ Uses list_proxies with geographic filtering and score sorting
```

### Provider Setup

```text
"Add IPRoyal as a datacenter proxy provider"
→ Uses create_provider with IPRoyal API configuration
```

### Health Monitoring

```text
"Test the top 10 proxies and show me their latency"
→ Uses list_proxies + test_proxy for performance analysis
```

## Configuration

### Environment Variables

- `PROXYHUB_API_URL`: API base URL (default: http://localhost:8080)
- `PROXYHUB_TOKEN`: Access token for authentication

### Authentication

Set your access token in the MCP configuration or environment:

```bash
export PROXYHUB_TOKEN="your-access-token-here"
```

## Tool Examples

### Get Proxy for Web Scraping

```json
{
  "tool": "get_proxy_lease",
  "parameters": {
    "project": "webscraper",
    "pool": "residential",
    "sticky": true,
    "country": "US"
  }
}
```

### Search Proxies by Location

```json
{
  "tool": "list_proxies",
  "parameters": {
    "search": "Germany",
    "sortBy": "score",
    "sortOrder": "desc",
    "limit": 20
  }
}
```

### Setup IPRoyal Provider

```json
{
  "tool": "create_provider",
  "parameters": {
    "name": "iproyal-datacenter",
    "type": "api",
    "config": {
      "kind": "iproyal",
      "access_token": "YOUR_TOKEN",
      "list_endpoint": "https://apid.iproyal.com/v1/reseller/datacenter/proxies"
    }
  }
}
```

## Error Handling

Common errors and solutions:

- **NO_PROXY_AVAILABLE**: No proxies match criteria - try different pool/country
- **401 Unauthorized**: Check access token configuration
- **Connection refused**: Ensure ProxyHub API is running on port 8080

## Advanced Usage

### Sticky Sessions

Enable `sticky=true` for consistent proxy reuse across requests in the same project.

### Geographic Filtering

Use `bbox` parameter for precise geographic boundaries:

```text
bbox: "-125,32,-114,42"  // US West Coast
```

### Performance Monitoring

Combine `list_proxies` + `test_proxy` to monitor proxy health and automatically rotate failed proxies.

## API Reference

Full API documentation: http://localhost:8080/api-docs

MCP tool definitions: `./mcp-server.json`
