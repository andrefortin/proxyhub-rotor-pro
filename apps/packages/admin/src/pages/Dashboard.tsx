import { useEffect, useState } from 'react'
import DashboardKPI from '../DashboardKPI'
import UsageChart from '../UsageChart'
import ActivityLog from '../ActivityLog'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

interface Proxy {
  id: string
  host: string
  score: number
  // Add more fields as needed
}

export default function Dashboard() {
  const [proxies, setProxies] = useState<Proxy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/v1/proxies/sample`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch proxies')
        return res.json()
      })
      .then((data) => {
        setProxies(data.items || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="p-8">Loading...</div>
  if (error) return <div className="p-8 text-red-500">{error}</div>

  const avgScore = proxies.reduce((sum, p) => sum + p.score, 0) / proxies.length || 0
  const totalProxies = proxies.length

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Proxies</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{totalProxies}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Average Score</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{avgScore.toFixed(2)}</p>
        </CardContent>
      </Card>
      {/* Add more cards for stats */}
      <Card>
        <CardHeader>
          <CardTitle>Proxy List</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {proxies.slice(0, 5).map((proxy) => (
              <li key={proxy.id} className="text-sm">{proxy.host} - Score: {proxy.score}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}