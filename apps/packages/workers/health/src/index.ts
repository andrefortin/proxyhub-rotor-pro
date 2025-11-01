import axios from "axios";
import { Client } from "pg";
import { HttpsProxyAgent } from "https-proxy-agent";
import { HttpProxyAgent } from "http-proxy-agent";
import * as mm from "maxmind";
import { existsSync } from "fs";

const TEST_URL = process.env.TEST_URL || "https://httpbin.org/ip";

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
  if (p.username && p.password) {
    return `${p.protocol}://${encodeURIComponent(
      p.username
    )}:${encodeURIComponent(p.password)}@${p.host}:${p.port}`;
  }
  return `${p.protocol}://${p.host}:${p.port}`;
}

async function enrich(ip: string, existingCountry?: string): Promise<GeoData> {
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
    } catch (apiError) {
      console.warn(`iplocation.net API failed for ${ip}:`, apiError.message);
    }
  }

  return { asn, org, country, city, region, latitude: lat, longitude: lon };
}

async function checkProxy(row: ProxyRow): Promise<CheckResult> {
  const start = Date.now();
  try {
    const purl = proxyUrl(row);
    const agent = purl.startsWith("https://")
      ? new HttpsProxyAgent(purl)
      : new HttpProxyAgent(purl);
    await axios.get(TEST_URL, {
      httpsAgent: agent,
      httpAgent: agent,
      timeout: 30000,
    });
    const latency = Date.now() - start;
    const geo = await enrich(row.host, row.country);
    return { ok: true, latency, ...geo };
  } catch (e) {
    return {
      ok: false,
      latency: null,
      asn: null,
      org: null,
      country: null,
      city: null,
      region: null,
      latitude: null,
      longitude: null,
    };
  }
}

async function run(): Promise<void> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const { rows } = await client.query<ProxyRow>(
    'SELECT id, host, port, username, password, protocol, country FROM "Proxy" ORDER BY random() LIMIT 10'
  );

  for (const r of rows) {
    const res = await checkProxy(r);
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
      await client.query(
        'UPDATE "Proxy" SET "lastChecked" = now(), "failedCount" = "failedCount" + 1, score = GREATEST(0, score - 3) WHERE id = $1',
        [r.id]
      );
    }
  }

  await client.end();
  setTimeout(run, 60000);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
