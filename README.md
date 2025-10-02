# ProxyHub Rotator — Pro Build (IPRoyal Orders + Sticky + GeoIP)

Quickstart:
```bash
cp .env.example .env
docker compose up --build -d
docker compose exec api npx prisma migrate deploy
```

## IPRoyal Integration
### Provider Config
```json
POST /v1/providers
{
  "name": "iproyal-dc",
  "type": "api",
  "config": {
    "kind": "iproyal",
    "access_token": "YOUR_X_ACCESS_TOKEN",
    "list_endpoint": "https://apid.iproyal.com/v1/reseller/datacenter/proxies",
    "default_pool": "default"
  }
}
```
Trigger import: `POST /v1/providers/{id}/import`

### Orders API (Reseller)
You can call these endpoints with `X-Access-Token` in headers:
- `GET /v1/reseller/orders` → list orders
- `GET /v1/reseller/orders/{id}` → get single order
- `POST /v1/reseller/orders` → create new order (pass plan, quantity, etc.)
- `POST /v1/reseller/orders/{id}/rotate` → rotate proxies in that order
- `PATCH /v1/reseller/orders/{id}` → change credentials or settings
- `DELETE /v1/reseller/orders/{id}` → delete order

We wrap these under:
```
POST /v1/providers/{id}/orders/sync   # fetch all orders
POST /v1/providers/{id}/orders/create # create new order
POST /v1/providers/{id}/orders/{orderId}/rotate
POST /v1/providers/{id}/orders/{orderId}/delete
```
Responses are proxied back from IPRoyal.

## Sticky Sessions
`GET /v1/proxy?project=AGENT&pool=linkedin&sticky=true` uses Redis `sticky:{project}:{pool}` to reuse proxies.

## GeoIP Setup (MaxMind)
1. Create free MaxMind account: https://www.maxmind.com/en/geolite2/signup
2. Go to "GeoLite2 Free Downloadable Databases".
3. Download **GeoLite2-City.mmdb**.
4. Place file at `./geoip/GeoLite2-City.mmdb`.
5. In `docker-compose.yml`, mount volume:
```yaml
services:
  api:
    volumes: ["./geoip:/geoip"]
  worker-health:
    volumes: ["./geoip:/geoip"]
```
6. Set `.env`:
```
GEOIP_DB_PATH=/geoip/GeoLite2-City.mmdb
```
The health worker will then enrich proxies with country/city/region.

## Admin UI
Open http://localhost:4173 → shows pools, providers, usage summary, webhooks.


---

## Proxies API for Map
- List with filters: `GET /v1/proxies?limit=5000&pool=POOL&providerId=...&bbox=minLon,minLat,maxLon,maxLat`
- Sample: `GET /v1/proxies/sample` (200 random)

## Admin Map
- Leaflet + clustering (default), toggle to Google Maps (set `VITE_GOOGLE_MAPS_API_KEY` in `packages/admin/.env` or your env).
- Buttons: **Load Sample** (fast) and **Load All (clustered)**.

## Notifications
- Discord, Telegram, and generic webhook integrated.
- Send a test: `POST /v1/webhooks` with `{"event":"test","payload":{"hello":"world"}}`.
# proxyhub-rotor-pro
