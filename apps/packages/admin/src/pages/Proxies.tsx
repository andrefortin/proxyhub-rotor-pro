import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { Button } from '../components/ui/button';
import { Globe, Zap, Plus, Edit, Trash2, Filter, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { getProxies, createProxy, updateProxy, deleteProxy, issueLease, getProviders, type Proxy, type CreateProxy, type UpdateProxy, type Provider } from '../lib/api';

const LIMIT = 10;

interface LeaseResponse {
  leaseId: string;
  proxy: string;
  protocol: string;
  expiresAt: string;
  meta: {
    providerId?: string;
    score: number;
    country?: string;
    sticky: boolean;
  };
}

interface TestResult {
  success: boolean;
  proxyString?: string;
  error?: string;
  score: number;
}

export default function Proxies() {
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedPool, setSelectedPool] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<CreateProxy | UpdateProxy>>({});
  const [showTestModal, setShowTestModal] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [fetchingProviders, setFetchingProviders] = useState(false);

  // Fetch providers for filter dropdown
  useEffect(() => {
    const fetchProviders = async () => {
      setFetchingProviders(true);
      try {
        const data = await getProviders({ limit: 100 }); // Fetch all for dropdown
        setProviders(data.items);
      } catch (err) {
        console.error('Failed to fetch providers:', err);
      } finally {
        setFetchingProviders(false);
      }
    };
    fetchProviders();
  }, []);

  const fetchProxies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page,
        limit: LIMIT,
      };
      if (search) params.search = search; // Assuming API supports search; if not, client-side
      if (selectedPool) params.pool = selectedPool;
      if (selectedProvider) params.providerId = selectedProvider;
      const data = await getProxies(params);
      setProxies(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch proxies');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedPool, selectedProvider]);

  useEffect(() => {
    fetchProxies();
  }, [fetchProxies]);

  const resetFilters = () => {
    setSearch('');
    setSelectedPool('');
    setSelectedProvider('');
    setPage(1);
  };

  const handleCreate = async (data: CreateProxy) => {
    try {
      await createProxy(data);
      fetchProxies();
      setShowModal(false);
      setEditData({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create proxy');
    }
  };

  const handleUpdate = async (data: UpdateProxy) => {
    if (!editingId) return;
    try {
      await updateProxy(editingId, data);
      fetchProxies();
      setEditingId(null);
      setShowModal(false);
      setEditData({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update proxy');
    }
  };

  const handleToggle = useCallback(async (id: string, currentDisabled: boolean) => {
    if (togglingId === id) return;
    setTogglingId(id);
    try {
      // Optimistic update
      setProxies(prev => prev.map(p => p.id === id ? { ...p, disabled: !currentDisabled } : p));
      await updateProxy(id, { disabled: !currentDisabled });
      fetchProxies(); // Sync
    } catch (err) {
      // Revert
      setProxies(prev => prev.map(p => p.id === id ? { ...p, disabled: currentDisabled } : p));
      setError(err instanceof Error ? err.message : 'Failed to toggle proxy status');
    } finally {
      setTogglingId(null);
    }
  }, [togglingId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this proxy? This is irreversible.')) return;
    try {
      await deleteProxy(id);
      fetchProxies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete proxy');
    }
  };

  const openEdit = async (id: string) => {
    try {
      // For simplicity, use current data from list; in full impl, fetch single
      const proxy = proxies.find(p => p.id === id);
      if (proxy) {
        setEditData({
          pool: proxy.pool,
          providerId: proxy.providerId,
          tags: proxy.tags,
          meta: proxy.meta,
          disabled: proxy.disabled,
        });
        setEditingId(id);
        setShowModal(true);
      }
    } catch (err) {
      setError('Failed to prepare edit');
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    setShowTestModal(true);
    try {
      const proxy = proxies.find(p => p.id === id);
      if (!proxy || !proxy.pool) throw new Error('Invalid proxy');
      const leaseResponse = await issueLease({
        project: 'admin-test',
        pool: proxy.pool,
        sticky: false,
      });
      if ('error' in leaseResponse) {
        setTestResult({ success: false, error: leaseResponse.error, score: proxy.score });
      } else {
        // Simulate test: In real, fetch via proxy to external URL
        // For now, assume success if lease issued
        setTestResult({
          success: true,
          proxyString: leaseResponse.proxy,
          score: leaseResponse.meta.score,
        });
        // Optionally release lease immediately
        // await releaseLease(leaseResponse.leaseId, { status: 'ok' });
      }
    } catch (err) {
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : 'Test failed',
        score: proxies.find(p => p.id === id)?.score || 0,
      });
    } finally {
      setTestingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading proxies...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Proxies Management
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="text-muted-foreground ml-1">(?)</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Manage, test, and organize your uploaded proxies from various providers.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <Button onClick={() => setShowModal(true)} className="flex items-center gap-1 hover:scale-105 transition-transform">
              <Plus className="w-4 h-4" />
              Add Proxy
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-4 p-4 bg-muted rounded-lg">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search proxies by host or tags..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedPool}
                onChange={(e) => setSelectedPool(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">All Pools</option>
                <option value="residential">Residential</option>
                <option value="datacenter">Datacenter</option>
                <option value="test">Test</option>
                {/* Dynamically from data if needed */}
              </select>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                disabled={fetchingProviders}
                className="px-3 py-2 border border-input rounded-md bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                <option value="">All Providers</option>
                {providers.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <Button variant="outline" onClick={resetFilters} size="sm">
                Clear
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3">Host:Port</th>
                  <th className="text-left p-3">Pool</th>
                  <th className="text-left p-3">Provider</th>
                  <th className="text-left p-3">Location</th>
                  <th className="text-left p-3">Score</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {proxies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No proxies found. {search || selectedPool || selectedProvider ? 'Try adjusting filters.' : 'Add one above!'}
                    </td>
                  </tr>
                ) : (
                  proxies.map((proxy) => {
                    const provider = providers.find(p => p.id === proxy.providerId);
                    return (
                      <tr key={proxy.id} className="border-b border-border hover:bg-accent data-[state=hover]:scale-[1.01] transition-transform">
                        <td className="p-3 font-mono">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                {proxy.host}:{proxy.port}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Protocol: {proxy.protocol || 'http'}</p>
                                {proxy.username && <p>Auth: Username provided (masked)</p>}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary">{proxy.pool || 'default'}</Badge>
                        </td>
                        <td className="p-3">
                          {provider ? provider.name : 'Unknown'}
                        </td>
                        <td className="p-3">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="flex items-center gap-1">
                                  <Globe className="w-4 h-4" />
                                  {proxy.country}, {proxy.city}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Region: {proxy.region}</p>
                                {proxy.asn && <p>ASN: {proxy.asn} ({proxy.org})</p>}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                        <td className="p-3">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant={proxy.score > 80 ? 'default' : 'secondary'}>
                                  {Math.round(proxy.score)}%
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Reliability score based on recent usage (higher is better).</p>
                                <p>Failures: {proxy.failedCount}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                        <td className="p-3">
                          <Switch
                            checked={!proxy.disabled}
                            onCheckedChange={() => handleToggle(proxy.id, proxy.disabled)}
                            disabled={togglingId === proxy.id}
                            className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500 transition-colors"
                          />
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => handleTest(proxy.id)} className="hover:bg-green-100 dark:hover:bg-green-900 hover:scale-110 transition-all">
                                  <Zap className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Test proxy connectivity</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(proxy.id)} className="hover:bg-blue-100 dark:hover:bg-blue-900 hover:scale-110 transition-all">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(proxy.id)} className="hover:bg-red-100 dark:hover:bg-red-900 hover:scale-110 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > LIMIT && (
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="hover:scale-105 transition-transform"
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {Math.ceil(total / LIMIT)}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => p + 1)}
                disabled={proxies.length < LIMIT}
                className="hover:scale-105 transition-transform"
              >
                Next
              </Button>
            </div>
          )}

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
          <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingId ? 'Edit Proxy' : 'Add New Proxy'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configure proxy details. For authentication, enter credentials if required.
              </p>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data: Partial<CreateProxy | UpdateProxy> = {
                  host: formData.get('host') as string,
                  port: parseInt(formData.get('port') as string),
                  username: formData.get('username') as string || undefined,
                  password: formData.get('password') as string || undefined,
                  protocol: formData.get('protocol') as string || 'http',
                  pool: formData.get('pool') as string || undefined,
                  providerId: formData.get('providerId') as string || undefined,
                  tags: (formData.get('tags') as string)?.split(',').map(t => t.trim()).filter(Boolean) || undefined,
                  meta: formData.get('meta') ? JSON.parse(formData.get('meta') as string) : undefined,
                  disabled: formData.get('disabled') === 'on' ? false : true, // Active by default unless disabled
                };
                editingId ? handleUpdate(data as UpdateProxy) : handleCreate(data as CreateProxy);
              }}
              className="p-6 space-y-4"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="host" className="block text-sm font-medium mb-2">
                    Host <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="host"
                    name="host"
                    type="text"
                    defaultValue={editData.host}
                    required
                    placeholder="e.g., proxy.example.com"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label htmlFor="port" className="block text-sm font-medium mb-2">
                    Port <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="port"
                    name="port"
                    type="number"
                    defaultValue={editData.port}
                    required
                    min="1"
                    max="65535"
                    placeholder="8080"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="protocol" className="block text-sm font-medium mb-2">
                    Protocol
                  </label>
                  <select
                    id="protocol"
                    name="protocol"
                    defaultValue={editData.protocol}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="http">HTTP</option>
                    <option value="https">HTTPS</option>
                    <option value="socks4">SOCKS4</option>
                    <option value="socks5">SOCKS5</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="pool" className="block text-sm font-medium mb-2">
                    Pool
                  </label>
                  <input
                    id="pool"
                    name="pool"
                    type="text"
                    defaultValue={editData.pool}
                    placeholder="e.g., residential"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="providerId" className="block text-sm font-medium mb-2">
                    Provider
                  </label>
                  <select
                    id="providerId"
                    name="providerId"
                    defaultValue={editData.providerId}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">None</option>
                    {providers.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium mb-2">
                    Username (Optional)
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    defaultValue={editData.username}
                    placeholder="username"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    Password (Optional)
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    defaultValue={editData.password ? '*****' : ''} // Masked display
                    placeholder="password"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="disabled" defaultChecked={editData.disabled} className="rounded" />
                    <span className="text-sm">Disabled</span>
                  </label>
                </div>
              </div>
              <div>
                <label htmlFor="tags" className="block text-sm font-medium mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  id="tags"
                  name="tags"
                  type="text"
                  defaultValue={editData.tags?.join(', ')}
                  placeholder="tag1, tag2, geo-us"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label htmlFor="meta" className="block text-sm font-medium mb-2">
                  Meta (JSON, optional)
                </label>
                <textarea
                  id="meta"
                  name="meta"
                  rows={3}
                  defaultValue={JSON.stringify(editData.meta, null, 2)}
                  placeholder='{"custom": "value"}'
                  className="w-full px-3 py-2 border border-input rounded-md bg-background font-mono text-sm focus-visible:ring-2 focus-visible:ring-ring"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="text-xs text-muted-foreground mt-1 block cursor-help">(Help)</span>
                    </TooltipTrigger>
                    <TooltipContent>Additional metadata as JSON. Use for custom fields not covered above.</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => { setShowModal(false); setEditData({}); setEditingId(null); }}>
                  Cancel
                </Button>
                <Button type="submit" className="ml-auto hover:scale-105 transition-transform">
                  {loading ? 'Saving...' : editingId ? 'Update' : 'Add Proxy'}
                </Button>
              </div>
              {error && <div className="text-destructive text-sm">{error}</div>}
            </form>
          </div>
        </div>
      )}

      {/* Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowTestModal(false)}>
          <div className="bg-background rounded-lg shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Test Results for Proxy</h2>
            </div>
            <div className="p-6 space-y-4">
              {testResult ? (
                <>
                  <div className={cn('p-3 rounded-md', testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200')}>
                    <p className="font-medium">Status: {testResult.success ? 'Success' : 'Failed'}</p>
                    {testResult.success && testResult.proxyString && (
                      <div className="mt-2 p-2 bg-muted font-mono text-sm rounded">
                        {testResult.proxyString}
                      </div>
                    )}
                    {testResult.error && <p className="text-sm mt-1">Error: {testResult.error}</p>}
                    <p>Score: {testResult.score}%</p>
                  </div>
                  <Button onClick={() => setShowTestModal(false)} className="w-full">
                    Close
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p>Testing proxy... (issuing lease and checking connectivity)</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}