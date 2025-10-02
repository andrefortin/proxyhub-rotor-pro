import axios from 'axios';
import pg from 'pg';
const { Client } = pg;

function normalize(line, providerId, defaultPool='default') {
  let host, port, username=null, password=null, protocol='http';
  let s = String(line).trim();
  try {
    if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('socks5://')) {
      const u = new URL(s);
      protocol = u.protocol.replace(':','');
      host = u.hostname; port = parseInt(u.port, 10);
      if (u.username) username = decodeURIComponent(u.username);
      if (u.password) password = decodeURIComponent(u.password);
    } else {
      const parts = s.split(':');
      host = parts[0]; port = parseInt(parts[1], 10);
      if (parts.length >= 4) { username = parts[2]; password = parts[3]; }
    }
  } catch (e) { return null; }
  if (!host || !port) return null;
  return { providerId, pool: defaultPool, host, port, username, password, protocol };
}

async function insertMany(client, rows) {
  for (const r of rows) {
    await client.query(`
      INSERT INTO "Proxy"(id, "providerId", pool, host, port, username, password, protocol, score)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 100)
      ON CONFLICT DO NOTHING
    `, [r.providerId, r.pool, r.host, r.port, r.username, r.password, r.protocol]);
  }
}

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const { rows: providers } = await client.query('SELECT id, name, type, config FROM "Provider" WHERE active = true');
  for (const p of providers) {
    try {
      // file list
      if (p.type === 'file' && p.config?.export_url) {
        const resp = await axios.get(p.config.export_url);
        const lines = String(resp.data).split('\n').filter(Boolean);
        const normalized = lines.map(l => normalize(l, p.id, p.config.default_pool || 'default')).filter(Boolean);
        await insertMany(client, normalized);
        await client.query(`INSERT INTO "ProviderImport"(id, "providerId", "importType", "sourceUri", "rowsAdded", "rowsTotal", status) VALUES (gen_random_uuid(), $1, 'file', $2, $3, $4, 'done')`, [p.id, p.config.export_url, normalized.length, lines.length]);
        console.log('Imported', normalized.length, 'from', p.name);
      }
      // generic api list
      if (p.type === 'api' && p.config?.list_endpoint && !p.config?.kind) {
        const resp = await axios.get(p.config.list_endpoint, { headers: p.config.headers || {} });
        let lines = [];
        if (Array.isArray(resp.data)) lines = resp.data.map(String);
        else if (Array.isArray(resp.data?.proxies)) lines = resp.data.proxies.map(String);
        else if (typeof resp.data === 'string') lines = resp.data.split('\n').filter(Boolean);
        const normalized = lines.map(l => normalize(l, p.id, p.config.default_pool || 'default')).filter(Boolean);
        await insertMany(client, normalized);
        await client.query(`INSERT INTO "ProviderImport"(id, "providerId", "importType", "sourceUri", "rowsAdded", "rowsTotal", status) VALUES (gen_random_uuid(), $1, 'api', $2, $3, $4, 'done')`, [p.id, p.config.list_endpoint, normalized.length, lines.length]);
        console.log('Imported', normalized.length, 'via API from', p.name);
      }
      // IPRoyal
      if (p.type === 'api' && p.config?.kind === 'iproyal' && p.config?.list_endpoint && p.config?.access_token) {
        const resp = await axios.get(p.config.list_endpoint, { headers: { 'X-Access-Token': p.config.access_token } });
        let lines = [];
        if (Array.isArray(resp.data)) lines = resp.data.map(String);
        else if (Array.isArray(resp.data?.proxies)) lines = resp.data.proxies.map(String);
        else if (typeof resp.data === 'string') lines = resp.data.split('\n').filter(Boolean);
        const normalized = lines.map(l => normalize(l, p.id, p.config.default_pool || 'default')).filter(Boolean);
        await insertMany(client, normalized);
        await client.query(`INSERT INTO "ProviderImport"(id, "providerId", "importType", "sourceUri", "rowsAdded", "rowsTotal", status) VALUES (gen_random_uuid(), $1, 'api', $2, $3, $4, 'done')`, [p.id, p.config.list_endpoint, normalized.length, lines.length]);
        console.log('Imported', normalized.length, 'via IPRoyal API from', p.name);
      }
    } catch (e) {
      await client.query(`INSERT INTO "ProviderImport"(id, "providerId", "importType", "sourceUri", status, meta) VALUES (gen_random_uuid(), $1, $2, $3, 'failed', $4)`, [p.id, p.type, (p.config?.export_url || p.config?.list_endpoint || ''), JSON.stringify({ error: String(e) })]);
      console.error('Import failed for', p.name, String(e));
    }
  }
  await client.end();
  setTimeout(run, 60000);
}
run().catch(err => { console.error(err); process.exit(1); });
