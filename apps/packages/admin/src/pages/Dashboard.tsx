import { useEffect, useState } from 'react';
import DashboardKPI from '../DashboardKPI';
import ProxyMap from '../components/ProxyMap';
import { getProxies, getActiveLeases, getSettings } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import type { Proxy } from '../types';
import { MapPin, AlertCircle } from 'lucide-react';

interface ProxyWithLease extends Proxy {
  hasActiveLease?: boolean;
}

export default function Dashboard() {
  const [proxies, setProxies] = useState<ProxyWithLease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSettings();
        if (settings.autoRefresh !== undefined) setAutoRefresh(settings.autoRefresh);
        if (settings.refreshInterval !== undefined) setRefreshInterval(settings.refreshInterval * 1000);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [proxiesData, leasesData] = await Promise.all([
          getProxies({ page: 1, limit: 1000 }),
          getActiveLeases(),
        ]);
        
        const activeProxyIds = new Set(leasesData.proxyIds || []);
        const proxiesWithLeaseInfo = proxiesData.items.map(proxy => ({
          ...proxy,
          hasActiveLease: activeProxyIds.has(proxy.id),
        }));
        
        setProxies(proxiesWithLeaseInfo);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setLoading(false);
      }
    };

    fetchData();
    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">Unable to load dashboard: {error}</span>
        </div>
      </div>
    );
  }

  const proxiesWithCoords = proxies.filter(p => p.latitude && p.longitude);
  const activeProxies = proxies.filter(p => p.hasActiveLease);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-1">Monitor your proxy network in real-time</p>
      </div>

      <DashboardKPI />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Proxy Network Map
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span>
                Active ({activeProxies.length})
                <span className="inline-block w-3 h-3 rounded-full bg-blue-500 ml-3 mr-1"></span>
                Available ({proxiesWithCoords.length - activeProxies.filter(p => p.latitude && p.longitude).length})
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">{proxiesWithCoords.length} of {proxies.length} proxies</p>
              <p className="text-xs text-gray-500">have location data</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProxyMap proxies={proxies} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Proxies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {proxies
                .filter(p => !p.disabled)
                .sort((a, b) => b.score - a.score)
                .slice(0, 5)
                .map((proxy) => (
                  <div key={proxy.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <div>
                        {proxy.country && (
                          <span className="text-lg" title={proxy.country}>
                            {String.fromCodePoint(...[...proxy.country.toUpperCase()].map(c => 127397 + c.charCodeAt(0)))}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{proxy.host}:{proxy.port}</p>
                        <p className="text-xs text-gray-500">{proxy.country || 'Unknown'} • {proxy.pool}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">{proxy.score.toFixed(0)}%</p>
                      {proxy.hasActiveLease && (
                        <span className="text-xs text-green-600">● Active</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(
                proxies.reduce((acc, p) => {
                  const country = p.country || 'Unknown';
                  acc[country] = (acc[country] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              )
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([country, count]) => {
                  const percentage = ((count / proxies.length) * 100).toFixed(1);
                  return (
                    <div key={country} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium flex items-center gap-2">
                          {country !== 'Unknown' && (
                            <span className="text-lg" title={country}>
                              {String.fromCodePoint(...[...country.toUpperCase()].map(c => 127397 + c.charCodeAt(0)))}
                            </span>
                          )}
                          {country}
                        </span>
                        <span className="text-gray-600">{count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}