import React, { useEffect, useState } from 'react'
import MapCard from './MapCard'

function Card({title, children}:{title:string, children:any}) {
  return (
    <div className="p-6 border border-gray-200 rounded-xl mb-6 bg-white shadow-sm">
      <h2 className="mt-0 text-xl font-semibold text-gray-900 border-b-2 border-gray-100 pb-2 mb-4">
        {title}
      </h2>
      {children}
    </div>
  )
}

export default function App() {
  const [providers, setProviders] = useState<any[]>([])
  const [pools, setPools] = useState<any[]>([])
  const [usage, setUsage] = useState<any|null>(null)
  const [showAddProviderModal, setShowAddProviderModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'api' as 'api' | 'file' | 'manual',
    config: '{}',
    logoUrl: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isToggling, setIsToggling] = useState<{ [key: string]: boolean }>({})

  const refreshProviders = async () => {
    try {
      const res = await fetch('http://localhost:8080/v1/providers')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setProviders(Array.isArray(data) ? data : data.items || [])
    } catch (error) {
      console.error('Failed to refresh providers:', error)
    }
  }

  const toggleProvider = async (id: string, currentActive: boolean) => {
    setIsToggling(prev => ({ ...prev, [id]: true }))
    try {
      const res = await fetch(`http://localhost:8080/v1/providers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive })
      })
      if (!res.ok) throw new Error('Failed to toggle')
      await refreshProviders()
    } catch (error) {
      console.error('Failed to toggle provider:', error)
      alert('Failed to toggle provider status')
    } finally {
      setIsToggling(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleSubmitProvider = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload = {
        ...formData,
        config: JSON.parse(formData.config)
      }
      const res = await fetch('http://localhost:8080/v1/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to create')
      setShowAddProviderModal(false)
      setFormData({ name: '', type: 'api', config: '{}', logoUrl: '' })
      await refreshProviders()
    } catch (error) {
      console.error('Failed to create provider:', error)
      alert('Failed to create provider: ' + (error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }
  const [notifications, setNotifications] = useState<any[]>([])
  const [selectedNotificationMethod, setSelectedNotificationMethod] = useState<string>('')
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [configFormData, setConfigFormData] = useState({ enabled: false, config: {}, eventTypes: [] as string[] })
  const eventTypes = [
    'provider-added',
    'provider-updated',
    'order-rotated',
    'order-deleted',
    'health-fail',
    'usage-alert',
    'import-complete',
    'lease-failed'
  ] as const
  const [notificationConfigs, setNotificationConfigs] = useState<{ [key: string]: any }>({})

  const [orders, setOrders] = useState<any[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [points, setPoints] = useState<any[]>([])
  const [sampleMode, setSampleMode] = useState(true)

  useEffect(()=>{
    async function loadData() {
      try {
        const [provRes, poolsRes, usageRes] = await Promise.all([
          fetch('http://localhost:8080/v1/providers').then(r => r.ok ? r.json() : Promise.reject(r)),
          fetch('/v1/pools/stats').then(r => r.ok ? r.json() : Promise.reject(r)),
          fetch('/v1/usage/summary').then(r => r.ok ? r.json() : Promise.reject(r))
        ]);
        setProviders(Array.isArray(provRes) ? provRes : provRes.items || []);
        setPools(poolsRes);
        setUsage(usageRes);
      } catch (error) {
        console.error('Failed to load data:', error);
        // Set empty states gracefully
        setProviders([]);
        setPools([]);
        setUsage(null);
      }
    }
    loadData();
    loadPoints(true);
  },[])

  async function loadPoints(sample:boolean) {
    try {
      setSampleMode(sample)
      const url = sample ? '/v1/proxies/sample' : '/v1/proxies?limit=5000'
      const r = await fetch(url)
      if (!r.ok) {
        throw new Error(`HTTP ${r.status}: ${r.statusText}`);
      }
      const data = await r.json()
      setPoints((data.items || data || []).map((p:any)=>({
        id: p.id,
        latitude: p.latitude,
        longitude: p.longitude,
        host: p.host,
        country: p.country,
        city: p.city,
        asn: p.asn,
        org: p.org,
        pool: p.pool
      })))
    } catch (error) {
      console.error('Failed to load points:', error)
      setPoints([])  // Graceful empty state
    }
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
    <div className="max-w-6xl mx-auto p-10 font-inter">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">ProxyHub Admin</h1>

      <Card title="Proxy Map">
        <div className="flex gap-2 mb-2">
          <button onClick={()=>loadPoints(true)} disabled={sampleMode} className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50">Load Sample</button>
          <button onClick={()=>loadPoints(false)} disabled={!sampleMode} className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50">Load All (clustered)</button>
        </div>
        <MapCard points={points}/>
      </Card>

      <Card title="Pools"><pre>{JSON.stringify(pools, null, 2)}</pre></Card>

      <Card title="Providers">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700 m-0">Provider Management</h3>
            <button
              onClick={() => setShowAddProviderModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium shadow-sm hover:bg-blue-600 transform hover:-translate-y-0.5 transition-all"
            >
              + Add Provider
            </button>
          </div>
          {providers.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#9ca3af',
              fontStyle: 'italic'
            }}>
              <p>No providers configured yet.</p>
              <p>Click "Add Provider" to get started.</p>
            </div>
          ) : (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24}}>
              {providers.map(p => (
                <div
                  key={p.id}
                  className="border border-gray-200 rounded-lg p-5 cursor-pointer transition-all duration-300 shadow-md hover:shadow-xl hover:border-gray-300 hover:-translate-y-1 bg-white"
                  onClick={() => loadOrders(p.id)}
                >
                  <div style={{display: 'flex', alignItems: 'center', marginBottom: 12}}>
                    <img
                      src={p.logoUrl || (p.config?.website ? `https://${p.config.website}/apple-touch-icon.png` : 'https://via.placeholder.com/64?text=Logo')}
                      alt={`${p.name} logo`}
                      style={{width: 48, height: 48, borderRadius: 8, marginRight: 12, objectFit: 'cover'}}
                      onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/64?text=Logo'}
                    />
                    <div>
                      <h3 style={{margin: 0, fontSize: 18, fontWeight: 600, color: '#111827'}}>{p.name}</h3>
                      {p.logoUrl && <p style={{margin: 0, fontSize: 12, color: '#6b7280'}}>Logo: {p.logoUrl.substring(0, 30)}...</p>}
                    </div>
                  </div>
                  <p style={{margin: '4px 0', color: '#6b7280', fontSize: 14}}><strong>Type:</strong> {p.type}</p>
                  <div style={{display: 'flex', alignItems: 'center', margin: '4px 0', gap: 8}}>
                    <strong style={{color: '#6b7280', fontSize: 14}}>Active:</strong>
                    <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                      <input
                        type="checkbox"
                        checked={p.active}
                        onChange={() => toggleProvider(p.id, p.active)}
                        disabled={isToggling[p.id]}
                        style={{margin: 0, width: 16, height: 16}}
                      />
                      <span style={{marginLeft: 8, color: p.active ? '#059669' : '#dc2626', fontSize: 14}}>
                        {p.active ? 'Yes' : 'No'}
                      </span>
                    </label>
                    {isToggling[p.id] && <span style={{fontSize: 12, color: '#6b7280'}}>Updating...</span>}
                  </div>
                  {p.config?.website && (
                    <p style={{margin: '4px 0', fontSize: 14}}>
                      <strong>Website:</strong> <a href={`https://${p.config.website}`} target="_blank" rel="noopener noreferrer" style={{color: '#3b82f6', textDecoration: 'none'}}>{p.config.website}</a>
                    </p>
                  )}
                  {p.config?.dashboard && (
                    <p style={{margin: '4px 0', fontSize: 14}}>
                      <strong>Dashboard:</strong> <a href={p.config.dashboard} target="_blank" rel="noopener noreferrer" style={{color: '#3b82f6', textDecoration: 'none'}}>{p.config.dashboard.substring(0, 40)}...</a>
                    </p>
                  )}
                  {p.config?.apiDocs && (
                    <p style={{margin: '4px 0', fontSize: 14}}>
                      <strong>API Docs:</strong> <a href={p.config.apiDocs} target="_blank" rel="noopener noreferrer" style={{color: '#3b82f6', textDecoration: 'none'}}>{p.config.apiDocs.substring(0, 40)}...</a>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
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
        <h3 style={{marginBottom: 16, color: '#374151'}}>Notification Methods</h3>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16}}>
          {['discord', 'telegram', 'webhook'].map(method => {
            const config = notifications.find(n => n.method === method) || { enabled: false, config: {}, eventTypes: [] };
            const isEnabled = config.enabled;
            return (
              <div key={method} style={{border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, backgroundColor: 'white'}}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                    {method === 'discord' && <span style={{fontSize: 20}}>🔔</span>}
                    {method === 'telegram' && <span style={{fontSize: 20}}>📱</span>}
                    {method === 'webhook' && <span style={{fontSize: 20}}>🔗</span>}
                    <span style={{fontWeight: 600, color: '#111827'}}>{method.charAt(0).toUpperCase() + method.slice(1)}</span>
                  </div>
                  <label style={{display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer'}}>
                    <span>Enabled</span>
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={async (e) => {
                        const newEnabled = e.target.checked;
                        const updateData = { ...config, enabled: newEnabled };
                        setNotifications(prev => prev.map(n => n.method === method ? updateData : n));
                        try {
                          await fetch(`http://localhost:8080/v1/notifications/${method}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(updateData)
                          });
                        } catch (error) {
                          console.error('Failed to update toggle:', error);
                        }
                      }}
                      style={{width: 16, height: 16}}
                    />
                  </label>
                </div>
                <button
                  onClick={() => {
                    setSelectedNotificationMethod(method);
                    setConfigFormData(config);
                    setShowConfigModal(true);
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    width: '100%'
                  }}
                >
                  ⚙️ Configure Settings
                </button>
                <div style={{marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb', fontSize: 12, color: '#9ca3af'}}>
                  <small>Events: {config.eventTypes.join(', ') || 'None'}</small>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {showConfigModal && selectedNotificationMethod && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowConfigModal(false)}>
          <div
            style={{
              backgroundColor: 'white',
              padding: 24,
              borderRadius: 12,
              width: 'min(500px, 90vw)',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{marginTop: 0, fontSize: 20, fontWeight: 600, color: '#111827', marginBottom: 20}}>
              Configure {selectedNotificationMethod.charAt(0).toUpperCase() + selectedNotificationMethod.slice(1)}
            </h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const updateData = configFormData;
              setNotifications(prev => prev.map(n => n.method === selectedNotificationMethod ? updateData : n));
              try {
                const res = await fetch(`http://localhost:8080/v1/notifications/${selectedNotificationMethod}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updateData)
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                setShowConfigModal(false);
              } catch (error) {
                console.error('Failed to save:', error);
                alert('Failed to save configuration');
              }
            }}>
              {selectedNotificationMethod === 'discord' && (
                <div style={{marginBottom: 16}}>
                  <label style={{display: 'block', marginBottom: 4, fontWeight: 500, color: '#374151'}}>Discord Webhook URL *</label>
                  <input
                    type="url"
                    value={configFormData.config.webhookUrl || ''}
                    onChange={(e) => setConfigFormData({ ...configFormData, config: { ...configFormData.config, webhookUrl: e.target.value } })}
                    required
                    placeholder="https://discord.com/api/webhooks/..."
                    style={{width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box'}}
                  />
                </div>
              )}
              {selectedNotificationMethod === 'telegram' && (
                <>
                  <div style={{marginBottom: 16}}>
                    <label style={{display: 'block', marginBottom: 4, fontWeight: 500, color: '#374151'}}>Telegram Bot Token *</label>
                    <input
                      type="text"
                      value={configFormData.config.botToken || ''}
                      onChange={(e) => setConfigFormData({ ...configFormData, config: { ...configFormData.config, botToken: e.target.value } })}
                      required
                      placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                      style={{width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box'}}
                    />
                  </div>
                  <div style={{marginBottom: 16}}>
                    <label style={{display: 'block', marginBottom: 4, fontWeight: 500, color: '#374151'}}>Chat ID *</label>
                    <input
                      type="text"
                      value={configFormData.config.chatId || ''}
                      onChange={(e) => setConfigFormData({ ...configFormData, config: { ...configFormData.config, chatId: e.target.value } })}
                      required
                      placeholder="@channel or 123456789"
                      style={{width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box'}}
                    />
                  </div>
                </>
              )}
              {selectedNotificationMethod === 'webhook' && (
                <div style={{marginBottom: 16}}>
                  <label style={{display: 'block', marginBottom: 4, fontWeight: 500, color: '#374151'}}>Webhook URL *</label>
                  <input
                    type="url"
                    value={configFormData.config.url || ''}
                    onChange={(e) => setConfigFormData({ ...configFormData, config: { ...configFormData.config, url: e.target.value } })}
                    required
                    placeholder="https://your-webhook.com/notify"
                    style={{width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box'}}
                  />
                </div>
              )}
              <div style={{marginBottom: 16}}>
                <label style={{display: 'block', marginBottom: 4, fontWeight: 500, color: '#374151'}}>Event Types</label>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8, maxHeight: 200, overflowY: 'auto', padding: 8, border: '1px solid #e5e7eb', borderRadius: 8}}>
                  {eventTypes.map(event => (
                    <label key={event} style={{display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: 4, borderRadius: 6, backgroundColor: configFormData.eventTypes.includes(event) ? '#dbeafe' : 'transparent'}}>
                      <input
                        type="checkbox"
                        checked={configFormData.eventTypes.includes(event)}
                        onChange={(e) => {
                          const newEvents = e.target.checked
                            ? [...configFormData.eventTypes, event]
                            : configFormData.eventTypes.filter(et => et !== event);
                          setConfigFormData({...configFormData, eventTypes: newEvents});
                        }}
                        style={{margin: 0}}
                      />
                      <span style={{fontSize: 12, color: '#374151'}}>{event.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{display: 'flex', gap: 12, justifyContent: 'flex-end'}}>
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'white',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddProviderModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowAddProviderModal(false)}>
          <div
            style={{
              backgroundColor: 'white',
              padding: 24,
              borderRadius: 12,
              width: 'min(500px, 90vw)',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{marginTop: 0, fontSize: 20, fontWeight: 600, color: '#111827', marginBottom: 20}}>
              Add New Provider
            </h2>
            <form onSubmit={handleSubmitProvider}>
              <div style={{marginBottom: 16}}>
                <label style={{display: 'block', marginBottom: 4, fontWeight: 500, color: '#374151'}}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Provider name"
                  style={{width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box'}}
                />
              </div>
              <div style={{marginBottom: 16}}>
                <label style={{display: 'block', marginBottom: 4, fontWeight: 500, color: '#374151'}}>Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'api' | 'file' | 'manual' })}
                  required
                  style={{width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box'}}
                >
                  <option value="api">API</option>
                  <option value="file">File</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              <div style={{marginBottom: 16}}>
                <label style={{display: 'block', marginBottom: 4, fontWeight: 500, color: '#374151'}}>Config (JSON) *</label>
                <textarea
                  value={formData.config}
                  onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                  required
                  placeholder='{"website": "example.com", "apiKey": "your-key"}'
                  rows={6}
                  style={{width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'monospace'}}
                />
              </div>
              <div style={{marginBottom: 16}}>
                <label style={{display: 'block', marginBottom: 4, fontWeight: 500, color: '#374151'}}>Logo URL</label>
                <input
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  style={{width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box'}}
                />
              </div>
              <div style={{display: 'flex', gap: 12, justifyContent: 'flex-end'}}>
                <button
                  type="button"
                  onClick={() => setShowAddProviderModal(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'white',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Provider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Card title="Test Notifications">
        <p>Send a test notification using the configured methods.</p>
        <button
          onClick={async () => {
            try {
              const res = await fetch('http://localhost:8080/v1/webhooks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event: 'test', payload: { message: 'Test from Admin UI' } })
              });
              if (res.ok) {
                alert('Test notification sent successfully!');
              } else {
                alert('Failed to send test notification');
              }
            } catch (error) {
              alert('Error sending test');
              console.error(error);
            }
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Send Test Notification
        </button>
      </Card>
    </div>
  )
}
