import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { getProxies, getActiveLeases } from './lib/api';
import { Activity, Globe, Zap, TrendingUp } from 'lucide-react';

export default function DashboardKPI() {
  const [proxiesCount, setProxiesCount] = useState<number>(0);
  const [proxiesStats, setProxiesStats] = useState<{ avgScore: number }>({ avgScore: 85 });
  const [activeLeases, setActiveLeases] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [proxiesData, leases] = await Promise.all([
          getProxies({ page: 1, limit: 1000 }),
          getActiveLeases(),
        ]);
        setProxiesCount(proxiesData.total || 0);
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Total Proxies</CardTitle>
          <Globe className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{proxiesCount}</div>
          <p className="text-xs text-gray-500 mt-1">Available proxy servers</p>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Active Now</CardTitle>
          <Activity className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{activeLeases}</div>
          <p className="text-xs text-gray-500 mt-1">Proxies currently in use</p>
        </CardContent>
      </Card>
      
      <Card className={`hover:shadow-lg transition-shadow ${healthBg}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Health Score</CardTitle>
          <TrendingUp className={`h-4 w-4 ${healthColor}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${healthColor}`}>{healthScore.toFixed(0)}%</div>
          <p className="text-xs text-gray-500 mt-1">Average proxy performance</p>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Available</CardTitle>
          <Zap className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{proxiesCount - activeLeases}</div>
          <p className="text-xs text-gray-500 mt-1">Ready to use</p>
        </CardContent>
      </Card>
    </div>
  );
}