import axios from "axios";
import { Client } from "pg";
import { HttpsProxyAgent } from "https-proxy-agent";
import { HttpProxyAgent } from "http-proxy-agent";
import * as mm from "maxmind";
import { existsSync } from "fs";
import { promises as dns } from "dns";

let geoEnrichmentEnabled = true;
let autoRetryEnabled = true;
let maxFailures = 5;
let refreshInterval = 60000;
let notificationsEnabled = true;
let healthMonitoringEnabled = true;
let healthCheckUrl = 'https://ipv4.icanhazip.com/?format=json';

async function loadSettings(client: Client) {
  try {
    const result = await client.query('SELECT key, value FROM "AppSettings" WHERE key IN ($1, $2, $3, $4, $5, $6, $7)', ['geoEnrichment', 'autoRetry', 'maxFailures', 'refreshInterval', 'notifications', 'healthMonitoring', 'healthCheckUrl']);
    result.rows.forEach(row => {
      if (row.key === 'geoEnrichment') geoEnrichmentEnabled = row.value;
      if (row.key === 'autoRetry') autoRetryEnabled = row.value;
      if (row.key === 'maxFailures') maxFailures = row.value;
      if (row.key === 'refreshInterval') refreshInterval = row.value * 1000;
      if (row.key === 'notifications') notificationsEnabled = row.value;
      if (row.key === 'healthMonitoring') healthMonitoringEnabled = row.value;
      if (row.key === 'healthCheckUrl') healthCheckUrl = row.value;
    });
  } catch (error) {
    console.warn('Failed to load settings:', error);
  }
}

async function sendNotification(client: Client, event: string, payload: any) {
  if (!notificationsEnabled) return;
  
  try {
    const webhooks = await client.query('SELECT * FROM "NotificationConfig" WHERE enabled = true');
    for (const webhook of webhooks.rows) {
      try {
        await axios.post(webhook.endpoint, {
          event,
          payload,
          timestamp: new Date().toISOString()
        }, {
          headers: webhook.headers || {},
          timeout: 5000
        });
      } catch (error) {
        console.error(`Failed to send notification to ${webhook.endpoint}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Failed to send notifications:', error);
  }
}



const ASN_DB = process.env.GEOIP_ASN_DB || "/geoip/GeoLite2-ASN.mmdb";
const CITY_DB = process.env.GEOIP_CITY_DB || "/geoip/GeoLite2-City.mmdb";
const COUNTRY_DB =
  process.env.GEOIP_COUNTRY_DB || "/geoip/GeoLite2-Country.mmdb";

interface ProxyRow {
  id: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol: string;
  country?: string;
}

interface GeoData {
  asn: number | null;
  org: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface CheckResult extends GeoData {
  ok: boolean;
  latency: number | null;
}

let asnDb: mm.Reader<mm.AsnResponse> | null = null;
let cityDb: mm.Reader<mm.CityResponse> | null = null;
let countryDb: mm.Reader<mm.CountryResponse> | null = null;

if (existsSync(ASN_DB)) asnDb = await mm.open(ASN_DB);
if (existsSync(CITY_DB)) cityDb = await mm.open(CITY_DB);
if (existsSync(COUNTRY_DB)) countryDb = await mm.open(COUNTRY_DB);

function proxyUrl(p: ProxyRow): string {
  const username = p.username ? encodeURIComponent(p.username) : 'anonymous';
  const password = p.password ? encodeURIComponent(p.password) : '';
  return `http://${username}:${password}@${p.host}:${p.port}`;
}

function isIpAddress(host: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(host) || /^[0-9a-fA-F:]+$/.test(host);
}

async function resolveHost(host: string): Promise<string> {
  if (isIpAddress(host)) return host;
  try {
    const addresses = await dns.resolve4(host);
    return addresses[0];
  } catch {
    try {
      const addresses = await dns.resolve6(host);
      return addresses[0];
    } catch {
      return host;
    }
  }
}

async function enrich(host: string, existingCountry?: string): Promise<GeoData> {
  if (!geoEnrichmentEnabled) {
    return { asn: null, org: null, country: null, city: null, region: null, latitude: null, longitude: null };
  }
  const ip = await resolveHost(host);
  let asn: number | null = null;
  let org: string | null = null;
  let country: string | null = null;
  let city: string | null = null;
  let region: string | null = null;
  let lat: number | null = null;
  let lon: number | null = null;

  if (asnDb) {
    try {
      const a = asnDb.get(ip);
      asn = a?.autonomous_system_number || null;
      org = a?.autonomous_system_organization || null;
    } catch {}
  }

  if (cityDb) {
    try {
      const c = cityDb.get(ip);
      country = c?.country?.iso_code || null;
      city = c?.city?.names?.en || null;
      region = c?.subdivisions?.[0]?.iso_code || null;
      lat = c?.location?.latitude || null;
      lon = c?.location?.longitude || null;
    } catch {}
  }

  if (!country && countryDb) {
    try {
      const co = countryDb.get(ip);
      country = co?.country?.iso_code || null;
    } catch {}
  }

  // Only call API if no country found in MaxMind AND no existing country in database
  if (!country && !existingCountry) {
    try {
      const response = await axios.get(`https://api.iplocation.net/?ip=${ip}`, {
        timeout: 5000,
        headers: { 'User-Agent': 'ProxyHub-Rotator/1.0' }
      });
      if (response.data && response.data.country_code2) {
        country = response.data.country_code2;
        if (!city && response.data.city) city = response.data.city;
        if (!region && response.data.region_name) region = response.data.region_name;
        if (!lat && response.data.latitude) lat = parseFloat(response.data.latitude);
        if (!lon && response.data.longitude) lon = parseFloat(response.data.longitude);
        if (!org && response.data.isp) org = response.data.isp;
      }
    } catch (apiError: any) {
      console.warn(`iplocation.net API failed for ${ip}:`, apiError.message);
      
      // Fallback to ipapi.co
      try {
        const response = await axios.get(`https://ipapi.co/${ip}/json/`, {
          timeout: 5000,
          headers: { 'User-Agent': 'ProxyHub-Rotator/1.0' }
        });
        if (response.data && response.data.country_code) {
          country = response.data.country_code;
          if (!city && response.data.city) city = response.data.city;
          if (!region && response.data.region) region = response.data.region;
          if (!lat && response.data.latitude) lat = response.data.latitude;
          if (!lon && response.data.longitude) lon = response.data.longitude;
          if (!org && response.data.org) org = response.data.org;
          if (!asn && response.data.asn) asn = parseInt(response.data.asn.replace('AS', ''));
        }
      } catch (fallbackError: any) {
        console.warn(`ipapi.co API failed for ${ip}:`, fallbackError.message);
      }
    }
  }

  return { asn, org, country, city, region, latitude: lat, longitude: lon };
}

async function checkProxy(row: ProxyRow): Promise<CheckResult> {
  const start = Date.now();
  const geo = await enrich(row.host, row.country);
  try {
    const purl = proxyUrl(row);
    const agent = new HttpsProxyAgent(purl);
    console.log(`Testing proxy ${row.host}:${row.port} (${row.pool}) via ${healthCheckUrl}`);
    await axios.get(healthCheckUrl, {
      httpsAgent: agent,
      proxy: false,
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const latency = Date.now() - start;
    console.log(`✓ Proxy ${row.host}:${row.port} OK (${latency}ms)`);
    return { ok: true, latency, ...geo };
  } catch (e: any) {
    console.log(`✗ Proxy ${row.host}:${row.port} FAILED: ${e.code || e.message}`);
    return { ok: false, latency: null, ...geo };
  }
}

async function run(): Promise<void> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await loadSettings(client);
  console.log(`Health worker started - checking every ${refreshInterval/1000}s, maxFailures: ${maxFailures}`);

  const query = autoRetryEnabled
    ? 'SELECT id, host, port, username, password, protocol, country FROM "Proxy" WHERE disabled = false ORDER BY (country IS NULL) DESC, "failedCount" DESC, random() LIMIT 10'
    : 'SELECT id, host, port, username, password, protocol, country FROM "Proxy" WHERE disabled = false ORDER BY (country IS NULL) DESC, random() LIMIT 10';
  
  const { rows } = await client.query<ProxyRow>(query);
  console.log(`Checking ${rows.length} proxies...`);

  for (const r of rows) {
    const res = await checkProxy(r);
    
    // Health monitoring alert for low score
    if (healthMonitoringEnabled && res.ok && (r as any).score < 60) {
      await sendNotification(client, 'proxy.health.low', {
        proxyId: r.id,
        host: r.host,
        port: r.port,
        score: (r as any).score,
        message: `Proxy ${r.host}:${r.port} health score dropped below 60%`
      });
    }
    
    if (res.ok) {
      const scoreBonus = res.latency! < 5000 ? 3 : res.latency! < 15000 ? 1 : 0;
      await client.query(
        'UPDATE "Proxy" SET "lastChecked" = now(), score = LEAST(100, score + $1), country = COALESCE($2,country), city = COALESCE($3,city), region = COALESCE($4,region), latitude = COALESCE($5,latitude), longitude = COALESCE($6,longitude), asn = COALESCE($7,asn), org = COALESCE($8,org) WHERE id = $9',
        [
          scoreBonus,
          res.country,
          res.city,
          res.region,
          res.latitude,
          res.longitude,
          res.asn,
          res.org,
          r.id,
        ]
      );
    } else {
      const newFailedCount = (await client.query('SELECT "failedCount" FROM "Proxy" WHERE id = $1', [r.id])).rows[0]?.failedCount + 1 || 1;
      const shouldDisable = newFailedCount >= maxFailures;
      
      // Send notification when proxy fails
      if (notificationsEnabled) {
        await sendNotification(client, 'proxy.failed', {
          proxyId: r.id,
          host: r.host,
          port: r.port,
          failedCount: newFailedCount,
          disabled: shouldDisable,
          message: shouldDisable 
            ? `Proxy ${r.host}:${r.port} disabled after ${newFailedCount} failures`
            : `Proxy ${r.host}:${r.port} failed (${newFailedCount}/${maxFailures})`
        });
      }
      
      await client.query(
        'UPDATE "Proxy" SET "lastChecked" = now(), "failedCount" = "failedCount" + 1, score = GREATEST(0, score - 3), disabled = $2, country = COALESCE($3,country), city = COALESCE($4,city), region = COALESCE($5,region), latitude = COALESCE($6,latitude), longitude = COALESCE($7,longitude), asn = COALESCE($8,asn), org = COALESCE($9,org) WHERE id = $1',
        [r.id, shouldDisable, res.country, res.city, res.region, res.latitude, res.longitude, res.asn, res.org]
      );
    }
  }

  await client.end();
  setTimeout(run, refreshInterval);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
