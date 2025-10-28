import pg from 'pg';
import axios from 'axios';
const { Client } = pg;
const DISCORD = process.env.DISCORD_WEBHOOK_URL || '';
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TG_CHAT = process.env.TELEGRAM_CHAT_ID || '';
const ADMIN_WEBHOOK = process.env.ADMIN_GENERIC_WEBHOOK || '';
const THRESH = parseInt(process.env.POOL_LOW_THRESHOLD || '25', 10);
const SPIKE_RATE = parseFloat(process.env.FAILURE_SPIKE_RATE || '0.5');
const MIN_EVENTS = parseInt(process.env.MIN_EVENTS_FOR_SPIKE || '50', 10);

async function broadcast(event, payload) {
  const text = `Event: ${event}\nPayload: ${JSON.stringify(payload).slice(0,1500)}`;
  await Promise.allSettled([
    DISCORD && axios.post(DISCORD, { content: text }),
    (TG_TOKEN && TG_CHAT) && axios.get(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, { params: { chat_id: TG_CHAT, text } }),
    ADMIN_WEBHOOK && axios.post(ADMIN_WEBHOOK, { event, payload, time: new Date().toISOString() })
  ]);
}

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const { rows } = await client.query('SELECT pool, COUNT(*)::int as total FROM "Proxy" GROUP BY pool');
  for (const r of rows) { if (r.total < THRESH) await broadcast('pool_low', r); }
  const { rows: usage } = await client.query('SELECT outcome, COUNT(*)::int as c FROM "UsageEvent" WHERE time > now() - interval \'1 hour\' GROUP BY outcome');
  const s = usage.find(u=>u.outcome==='success')?.c || 0;
  const f = usage.find(u=>u.outcome==='failure')?.c || 0;
  const n = s + f;
  if (n >= MIN_EVENTS && f / Math.max(1,n) >= SPIKE_RATE) await broadcast('spike_failures', { total:n, failures:f, rate: f/n });
  await client.end();
  setTimeout(run, 300000);
}
run().catch(err => { console.error(err); process.exit(1); });
