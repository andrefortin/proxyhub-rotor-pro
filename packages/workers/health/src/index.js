import axios from 'axios';
import pg from 'pg';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';
import mm from 'maxmind';
import fs from 'fs';

const { Client } = pg;
const TEST_URL = process.env.TEST_URL || 'https://httpbin.org/ip';

const ASN_DB = process.env.GEOIP_ASN_DB || '/geoip/GeoLite2-ASN.mmdb';
const CITY_DB = process.env.GEOIP_CITY_DB || '/geoip/GeoLite2-City.mmdb';
const COUNTRY_DB = process.env.GEOIP_COUNTRY_DB || '/geoip/GeoLite2-Country.mmdb';

let asnDb=null, cityDb=null, countryDb=null;
if (fs.existsSync(ASN_DB)) asnDb = await mm.open(ASN_DB);
if (fs.existsSync(CITY_DB)) cityDb = await mm.open(CITY_DB);
if (fs.existsSync(COUNTRY_DB)) countryDb = await mm.open(COUNTRY_DB);

function proxyUrl(p) {
  if (p.username && p.password) return `${p.protocol}://${encodeURIComponent(p.username)}:${encodeURIComponent(p.password)}@${p.host}:${p.port}`;
  return `${p.protocol}://${p.host}:${p.port}`;
}

function enrich(ip) {
  let asn=null, org=null, country=null, city=null, region=null, lat=null, lon=null;
  if (asnDb) {
    try { const a = asnDb.get(ip); asn = a?.autonomous_system_number; org = a?.autonomous_system_organization; } catch {}
  }
  if (cityDb) {
    try {
      const c = cityDb.get(ip);
      country = c?.country?.iso_code || null;
      city = c?.city?.names?.en || null;
      region = c?.subdivisions?.[0]?.iso_code || null;
      lat = c?.location?.latitude; lon = c?.location?.longitude;
    } catch {}
  }
  if (!country && countryDb) {
    try { const co = countryDb.get(ip); country = co?.country?.iso_code; } catch {}
  }
  return { asn, org, country, city, region, latitude:lat, longitude:lon };
}

async function checkProxy(row) {
  const start = Date.now();
  try {
    const purl = proxyUrl(row);
    const agent = purl.startsWith('https://') ? new HttpsProxyAgent(purl) : new HttpProxyAgent(purl);
    await axios.get(TEST_URL, { httpsAgent: agent, httpAgent: agent, timeout: 6000 });
    const latency = Date.now() - start;
    const geo = enrich(row.host);
    return { ok: true, latency, ...geo };
  } catch (e) {
    return { ok: false, latency: null };
  }
}

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const { rows } = await client.query('SELECT id, host, port, username, password, protocol FROM "Proxy" ORDER BY random() LIMIT 50');
  for (const r of rows) {
    const res = await checkProxy(r);
    if (res.ok) {
      await client.query('UPDATE "Proxy" SET "lastChecked" = now(), score = LEAST(100, score + 1), country = COALESCE($1,country), city = COALESCE($2,city), region = COALESCE($3,region), latitude = COALESCE($4,latitude), longitude = COALESCE($5,longitude), asn = COALESCE($6,asn), org = COALESCE($7,org) WHERE id = $8',
        [res.country, res.city, res.region, res.latitude, res.longitude, res.asn, res.org, r.id]);
    } else {
      await client.query('UPDATE "Proxy" SET "lastChecked" = now(), "failedCount" = "failedCount" + 1, score = GREATEST(0, score - 10) WHERE id = $1', [r.id]);
    }
  }
  await client.end();
  setTimeout(run, 15000);
}
run().catch(err => { console.error(err); process.exit(1); });
