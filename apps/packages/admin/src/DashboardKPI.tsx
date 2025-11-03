import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { getProxies, getActiveLeases, getProxyCounts } from './lib/api';
import { Activity, Globe, Zap, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function DashboardKPI() {
  const [totalProxies, setTotalProxies] = useState<number>(0);
  const [availableProxies, setAvailableProxies] = useState<number>(0);
  const [proxiesStats, setProxiesStats] = useState<{ avgScore: number }>({ avgScore: 85 });
  const [activeLeases, setActiveLeases] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
    const [proxiesData, leases, counts] = await Promise.all([
      getProxies({ page: 1, limit: 1000 }),
      getActiveLeases(),
      getProxyCounts(),
    ]);
    setTotalProxies(counts.total || 0);
    setAvailableProxies(counts.available || 0);
    const avgScore = proxiesData.items.length > 0
      ? proxiesData.items.reduce((sum, p) => sum + p.score, 0) / proxiesData.items.length
      : 85;
    setProxiesStats({ avgScore });
    setActiveLeases(leases.proxyIds?.length || 0);
    setLoading(false);
  } catch (err) {
    console.error('Dashboard fetch error:', err);
    setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    setLoading(false);
  }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-4">Loading dashboard...</div>;
  if (error) return <div className="p-4 text-red-500">Unable to load data. Please refresh.</div>;

  const healthScore = proxiesStats.avgScore;
  const healthColor = healthScore >= 80 ? 'text-green-600' : healthScore >= 60 ? 'text-yellow-600' : 'text-red-600';
  const healthBg = healthScore >= 80 ? 'bg-green-50' : healthScore >= 60 ? 'bg-yellow-50' : 'bg-red-50';

  const barData = [
    { name: 'Total Proxies', value: totalProxies, color: '#0088FE' },
    { name: 'Enabled Proxies', value: availableProxies, color: '#00C49F' },
    { name: 'Active Leases', value: activeLeases, color: '#FFBB28' },
    { name: 'Available Leases', value: availableProxies - activeLeases, color: '#FF8042' },
  ];

  return (
  <Card>
    <CardHeader>
      <CardTitle>Proxy Statistics</CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={barData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value">
            {barData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);
}