import React, { useEffect, useState } from 'react'
import MapCard from './MapCard'

function Card({title, children}:{title:string, children:any}) {
  return (<div style={{padding:'16px', border:'1px solid #e5e7eb', borderRadius:12, marginBottom:16}}>
    <h2 style={{marginTop:0}}>{title}</h2>{children}
  </div>)
}

export default function App() {
  const [providers, setProviders] = useState<any[]>([])
  const [pools, setPools] = useState<any[]>([])
  const [usage, setUsage] = useState<any|null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [points, setPoints] = useState<any[]>([])
  const [sampleMode, setSampleMode] = useState(true)

  useEffect(()=>{
    fetch('/v1/providers').then(r=>r.json()).then(setProviders).catch(()=>{})
    fetch('/v1/pools/stats').then(r=>r.json()).then(setPools).catch(()=>{})
    fetch('/v1/usage/summary').then(r=>r.json()).then(setUsage).catch(()=>{})
    loadPoints(true)
  },[])

  async function loadPoints(sample:boolean) {
    setSampleMode(sample)
    const url = sample ? '/v1/proxies/sample' : '/v1/proxies?limit=5000'
    const r = await fetch(url)
    const data = await r.json()
    setPoints((data.items || []).map((p:any)=>({ id:p.id, latitude:p.latitude, longitude:p.longitude, host:p.host, country:p.country, city:p.city, asn:p.asn, org:p.org, pool:p.pool })))
  }

  async function loadOrders(pid:string) {
    setSelectedProvider(pid)
    const r = await fetch(`/v1/providers/${pid}/orders/sync`, {method:'POST'})
    const data = await r.json()
    setOrders(data.orders || [])
  }

  async function rotateOrder(pid:string, oid:string) {
    await fetch(`/v1/providers/${pid}/orders/${oid}/rotate`, {method:'POST'})
    await loadOrders(pid)
  }
  async function deleteOrder(pid:string, oid:string) {
    await fetch(`/v1/providers/${pid}/orders/${oid}/delete`, {method:'POST'})
    await loadOrders(pid)
  }

  return (
    <div style={{maxWidth:1200, margin:'40px auto', fontFamily:'Inter, ui-sans-serif'}}>
      <h1>ProxyHub Admin</h1>

      <Card title="Proxy Map">
        <div style={{display:'flex', gap:8, marginBottom:8}}>
          <button onClick={()=>loadPoints(true)} disabled={sampleMode}>Load Sample</button>
          <button onClick={()=>loadPoints(false)} disabled={!sampleMode}>Load All (clustered)</button>
        </div>
        <MapCard points={points}/>
      </Card>

      <Card title="Pools"><pre>{JSON.stringify(pools, null, 2)}</pre></Card>

      <Card title="Providers">
        <ul>
          {providers.map(p=><li key={p.id}>
            {p.name} <button onClick={()=>loadOrders(p.id)}>Load Orders</button>
          </li>)}
        </ul>
      </Card>

      <Card title="Orders">
        {selectedProvider ? <div>
          <p>Orders for provider {selectedProvider}</p>
          <ul>
            {orders.map(o=><li key={o.id}>
              {o.id} - {o.status || 'active'}
              <button onClick={()=>rotateOrder(selectedProvider,o.id)}>Rotate</button>
              <button onClick={()=>deleteOrder(selectedProvider,o.id)}>Delete</button>
            </li>)}
          </ul>
        </div> : <p>Select a provider to load orders.</p>}
      </Card>

      <Card title="Usage (summary)"><pre>{JSON.stringify(usage, null, 2)}</pre></Card>

      <Card title="Notifications">
        <p>Discord / Telegram / webhook are supported. Set the following in <code>.env</code>:</p>
        <pre>{`DISCORD_WEBHOOK_URL=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
ADMIN_GENERIC_WEBHOOK=`}</pre>
        <p>To send a manual test: <code>POST /v1/webhooks</code> with {"{event, payload}"}</p>
      </Card>
    </div>
  )
}
