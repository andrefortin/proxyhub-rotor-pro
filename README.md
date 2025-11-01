# ProxyHub Rotator — Pro Build

**Enterprise proxy management and rotation service with AI integration**

🚀 **Features**: IPRoyal Integration • Sticky Sessions • GeoIP Enrichment • Health Monitoring • MCP Support

## Quick Start

```bash
cp .env.example .env
docker compose up --build -d
docker compose exec api npx prisma migrate deploy
```

**Access Points**:
- API: http://localhost:8080
- Admin UI: http://localhost:4173  
- API Docs: http://localhost:8080/api-docs

## Core Features

### 🔄 Proxy Leasing System
```bash
# Get proxy for project
curl -H "X-Access-Token: TOKEN" \
  "http://localhost:8080/v1/proxy?project=scraper&pool=residential&sticky=true&country=US"

# Release with feedback
curl -X POST -H "X-Access-Token: TOKEN" \
  -d '{"status":"ok","latencyMs":250}' \
  "http://localhost:8080/v1/proxy/LEASE_ID/release"
```

### 🌍 Geographic & Performance Filtering
```bash
# Search by location
curl "http://localhost:8080/v1/proxies?search=Germany&sortBy=score&sortOrder=desc"

# Bounding box filter (US West Coast)
curl "http://localhost:8080/v1/proxies?bbox=-125,32,-114,42"
```

### 🔗 Provider Integration

**IPRoyal Setup**:
```json
POST /v1/provider
{
  "name": "iproyal-datacenter",
  "type": "api",
  "config": {
    "kind": "iproyal",
    "access_token": "YOUR_TOKEN",
    "list_endpoint": "https://apid.iproyal.com/v1/reseller/datacenter/proxies",
    "default_pool": "datacenter"
  }
}
```

**Import Proxies**: `POST /v1/provider/{id}/import`

### 🎯 Sticky Sessions
Reuse same proxy for project/pool: `GET /v1/proxy?project=AGENT&sticky=true`

### 📍 GeoIP Enrichment

1. Download [GeoLite2-City.mmdb](https://www.maxmind.com/en/geolite2/signup)
2. Place at `./geoip/GeoLite2-City.mmdb`
3. Set `GEOIP_DB_PATH=/geoip/GeoLite2-City.mmdb`

Health worker automatically enriches proxies with location data.

### 📊 Health Monitoring
- Automatic proxy testing every 60 seconds
- Score-based ranking (0-100%)
- Failed proxy rotation
- Performance metrics

### 🔔 Notifications
**Supported**: Discord, Telegram, Generic Webhooks

```bash
# Test webhook
curl -X POST -H "X-Access-Token: TOKEN" \
  -d '{"event":"test","payload":{"message":"Hello"}}' \
  "http://localhost:8080/v1/webhooks"
```

## 🤖 AI Integration (MCP)

**Model Context Protocol** support for AI assistants:

```json
{
  "mcpServers": {
    "proxyhub": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"],
      "env": {
        "FETCH_BASE_URL": "http://localhost:8080",
        "FETCH_HEADERS": "{\"X-Access-Token\": \"your-token\"}"
      }
    }
  }
}
```

**Available AI Tools**:
- `get_proxy_lease` - Get proxy for web scraping
- `list_proxies` - Search/filter proxies
- `create_provider` - Setup proxy providers
- `test_proxy` - Check proxy health
- `send_webhook` - Test notifications

See [MCP_README.md](./MCP_README.md) for full AI integration guide.

## 📚 Documentation

- **API Reference**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **MCP Integration**: [MCP_README.md](./MCP_README.md)
- **Interactive Docs**: http://localhost:8080/api-docs
- **OpenAPI Spec**: http://localhost:8080/api-docs-json

## 🏗️ Architecture

```
┌─────────────┐  ┌──────────────┐  ┌─────────────┐
│   Admin UI  │  │  API Server  │  │ Health Worker│
│ (React/Vite)│  │ (NestJS/TS) │  │ (TypeScript)│
└─────────────┘  └──────────────┘  └─────────────┘
       │                │                 │
       └────────────────┼─────────────────┘
                        │
              ┌─────────────────┐
              │   PostgreSQL    │
              │   + Redis       │
              └─────────────────┘
```

## 🔧 Configuration

**Environment Variables**:
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/proxyhub
REDIS_URL=redis://localhost:6379
GEOIP_DB_PATH=/geoip/GeoLite2-City.mmdb
PORT=8080
```

**Docker Services**:
- `api` - NestJS API server
- `admin` - React admin interface  
- `worker-health` - Proxy health monitoring
- `postgres` - Database
- `redis` - Caching & sessions

## 🚀 Production Deployment

```bash
# Production build
docker compose -f docker-compose.prod.yml up -d

# Scale workers
docker compose up --scale worker-health=3

# Health check
curl http://localhost:8080/health
```

## 📈 Monitoring

**Usage Statistics**: `GET /usage/stats`
**Proxy Health**: Admin UI → Proxies tab
**Notifications**: `GET /v1/notifications/logs`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.
