import pg from 'pg';
const { Client } = pg;
function dayFloor(d) { const x = new Date(d); x.setUTCHours(0,0,0,0); return x; }
async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const { rows } = await client.query('SELECT * FROM "UsageEvent" WHERE time > now() - interval \'25 hours\'');
  const map = new Map();
  for (const r of rows) {
    const key = JSON.stringify({ day: dayFloor(r.time).toISOString(), project: r.project, pool: r.pool, apiKeyId: r.apiKeyId });
    if (!map.has(key)) map.set(key, { success:0, failure:0 });
    const o = map.get(key); (r.outcome === 'success' ? o.success++ : o.failure++);
  }
  for (const [k,v] of map) {
    const j = JSON.parse(k);
    await client.query(`
      INSERT INTO "UsageDaily"(id, day, project, pool, "apiKeyId", success, failure)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
      ON CONFLICT (day, project, pool, "apiKeyId")
      DO UPDATE SET success = "UsageDaily".success + EXCLUDED.success, failure = "UsageDaily".failure + EXCLUDED.failure
    `, [j.day, j.project, j.pool, j.apiKeyId, v.success, v.failure]);
  }
  await client.end();
  setTimeout(run, 3600_000);
}
run().catch(err => { console.error(err); process.exit(1); });
