import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function DashboardKPI() {
  const [poolsStats, setPoolsStats] = useState<any>(null);
  const [usageSummary, setUsageSummary] = useState<any>(null);
  const [proxiesCount, setProxiesCount] = useState<number>(0);
  const [proxiesStats, setProxiesStats] = useState<{ avgScore: number }>({ avgScore: 85 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pools, usage, count, stats] = await Promise.all([
          fetch(`${API_BASE}/v1/pools/stats`).then(res => res.ok ? res.json() : Promise.reject('Pools stats failed')),
          fetch(`${API_BASE}/v1/usage/summary`).then(res => res.ok ? res.json() : Promise.reject('Usage summary failed')),
          fetch(`${API_BASE}/v1/proxies/count`).then(res => res.ok ? res.json() : ({ count: 0 })),
          fetch(`${API_BASE}/v1/proxies/stats`).then(res => res.ok ? res.json() : ({ avgScore: 85 })),
        ]);
        setPoolsStats(pools);
        setUsageSummary(usage);
        setProxiesCount(count.count);
        setProxiesStats(stats);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to fetch KPI data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading KPIs...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Pools</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{poolsStats?.total || 0}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Usage Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{usageSummary?.total || 0}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Proxy Count</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{proxiesCount}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Avg Proxy Score</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{proxiesStats.avgScore.toFixed(2)}</p>
        </CardContent>
      </Card>
    </div>
  );
}