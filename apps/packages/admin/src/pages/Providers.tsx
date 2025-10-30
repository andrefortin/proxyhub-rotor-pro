import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users2, Plus, Edit, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Switch } from '../components/ui/switch';
import { getProviders, createProvider, updateProvider, deleteProvider, getProvider, type Provider } from '../lib/api';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

const LIMIT = 10; // Fixed limit per Swagger (max 100)

export default function Providers() {
  const [searchParams] = useSearchParams();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<Partial<Provider>>({});
  const [selectedType, setSelectedType] = useState<'api' | 'file' | 'manual'>('api');
  const [config, setConfig] = useState('');
  const [fileContent, setFileContent] = useState<File | null>(null);
  const [mock, setMock] = useState(searchParams.get('mock') === 'true');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [rememberChoice, setRememberChoice] = useState(false);

  useEffect(() => {
  if (showModal && editData.type && ['api', 'file', 'manual'].includes(editData.type)) {
    setSelectedType(editData.type as 'api' | 'file' | 'manual');
  }
  if (showModal && editData.config) {
    setConfig(JSON.stringify(editData.config, null, 2));
  } else if (showModal) {
    setConfig('');
  }
  if (showModal) {
    setFileContent(null);
  }
}, [editData, showModal]);

const getPlaceholder = (type: 'api' | 'file' | 'manual') => {
  switch (type) {
    case 'api':
      return `{
"kind": "iproyal",
"access_token": "YOUR_X_ACCESS_TOKEN",
"list_endpoint": "https://apid.iproyal.com/v1/reseller/datacenter/proxies",
"default_pool": "default"
}`;
    case 'file':
      return `{
"filePath": "/path/to/proxies.json",
"format": "json",
"pools": {
  "default": "general"
}
}`;
    case 'manual':
      return `{
"proxies": [
  {
    "host": "1.2.3.4",
    "port": 8080,
    "username": "user",
    "password": "pass"
  }
]
}`;
    default:
      return `{
"apiKey": "your-api-key",
"endpoint": "https://api.example.com/proxies",
"authType": "bearer"
}`;
  }
};

useEffect(() => {
  console.log('editData or showModal changed:', { editData, showModal });
  if (showModal) {
    setSelectedType((editData.type as 'api' | 'file' | 'manual') || 'api');
    setConfig(editData.config ? JSON.stringify(editData.config, null, 2) : '');
    setFileContent(null);
  }
}, [editData, showModal]);

useEffect(() => {
  if (error) {
    console.error('Modal error:', error);
  }
}, [error]);

const fetchProviders = useCallback(async () =>{
    try {
      setError(null);
      setLoading(true);
      const data = await getProviders({ page, limit: LIMIT, search: search || undefined });
      console.log('Fetched data from API:', data); // Debug: Log full response
      console.log('Setting providers to data.items:', data.items, 'Type:', typeof data.items, 'Is array:', Array.isArray(data.items)); // Debug: Log items specifically
      if (!Array.isArray(data.items)) {
        console.error('API response items is not an array:', data.items);
        setProviders([]);
        setTotal(0);
        return;
      }
      setProviders(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch providers');
      setProviders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, mock]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleCreate = async (data: Omit<Provider, 'id' | 'createdAt'>) => {
    try {
      await createProvider(data);
      fetchProviders();
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create provider');
    }
  };

  const handleUpdate = async (data: Partial<Provider>) => {
    if (!editingId) return;
    try {
      await updateProvider(editingId, data);
      fetchProviders();
      setEditingId(null);
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update provider');
    }
  };

  const handleToggle = useCallback(async (id: string) => {
    if (togglingId === id) return;

    const provider = providers.find(p => p.id === id);
    if (!provider) return;

    const currentActive = provider.active;
    const newActive = !currentActive;

    console.log(`Toggling provider ${id} to ${newActive ? 'active' : 'inactive'}`); // Debug log

    setTogglingId(id);

    try {
      // Optimistic update
      setProviders(prev => prev.map(p => p.id === id ? { ...p, active: newActive } : p));

      await updateProvider(id, { active: newActive });

      // Refetch to sync
      await fetchProviders();
    } catch (err) {
      // Revert on error
      setProviders(prev => prev.map(p => p.id === id ? { ...p, active: currentActive } : p));
      setError(err instanceof Error ? err.message : 'Failed to toggle provider status');
    } finally {
      setTogglingId(null);
    }
  }, [providers, togglingId, updateProvider, fetchProviders]);


  const handleDelete = async (id: string) => {
    setPendingDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteProvider(pendingDeleteId);
      fetchProviders();
      if (rememberChoice) {
        sessionStorage.setItem('deleteConfirmed', 'true');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete provider');
    } finally {
      setShowDeleteModal(false);
      setPendingDeleteId(null);
      setRememberChoice(false);
    }
  };

  const handleRememberChange = (checked: boolean) => {
    setRememberChoice(checked);
  };

  const openEdit = async (id: string) => {
    try {
      const provider = await getProvider(id);
      setEditData(provider);
      setEditingId(id);
      setShowModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch provider');
    }
  };

useEffect(() => {
    console.log('editData changed:', editData); // Debug log
    if (editData.type && ['api', 'file', 'manual'].includes(editData.type)) {
      setSelectedType(editData.type as 'api' | 'file' | 'manual');
    }
    if (editData.config) {
      setConfig(JSON.stringify(editData.config, null, 2));
    } else {
      setConfig('');
    }
    setFileContent(null);
  }, [editData, showModal]);

  useEffect(() => {
    if (error) {
      console.error('Modal error:', error);
    }
  }, [error]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users2 className="w-5 h-5" />
              Providers Management
            </CardTitle>
            <button onClick={() => {
              setEditingId(null);
              setEditData({});
              setSelectedType('api');
              setConfig('');
              setFileContent(null);
              setShowModal(true);
            }} className="flex items-center gap-1 bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90">
              <Plus className="w-4 h-4" />
              Add Provider
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="p-8 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2"></div>
              <span>Loading providers...</span>
            </div>
          )}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm mb-4">
              {error}
            </div>
          )}
          {!loading && (
            <>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Search providers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-input"
                />
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={mock} onChange={(e) => setMock(e.target.checked)} />
                  Mock Mode
                </label>
              </div>
              <div className="space-y-2">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 w-12">Logo</th>
                        <th className="text-left p-3">Name</th>
                        <th className="text-left p-3">Type</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Created</th>
                        <th className="text-right p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {providers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-muted-foreground">
                            No providers found. Add one to get started!
                          </td>
                        </tr>
                      ) : (
                        providers.map((provider) => (
                          <tr key={provider.id} className="border-b border-border hover:bg-accent">
                            <td className="p-3 w-12">
                              {provider.logoUrl ? (
                                <img src={provider.logoUrl} alt={provider.name} className="w-8 h-8 rounded object-cover" onError={(e) => { e.currentTarget.src = '/placeholder-logo.png'; }} />
                              ) : (
                                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                                  <span className="text-gray-500 text-xs">{provider.name.charAt(0).toUpperCase()}</span>
                                </div>
                              )}
                            </td>
                            <td className="p-3">{provider.name}</td>
                            <td className="p-3">
                              <span className={cn('px-2 py-1 rounded text-xs', provider.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                                {provider.type}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={cn('px-2 py-1 rounded text-xs', provider.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                                {provider.active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-3">{new Date(provider.createdAt).toLocaleDateString()}</td>
                            <td className="p-3 text-right">
                              <Switch
                                checked={provider.active}
                                onCheckedChange={(checked) => handleToggle(provider.id)}
                                disabled={togglingId === provider.id}
                                className={cn('data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-600', 'w-10 h-5 mr-2')}
                              />
                              <button onClick={() => openEdit(provider.id)} className="p-1 text-blue-600 hover:text-blue-800" title="Edit provider details">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(provider.id)} className="p-1 text-red-600 hover:text-red-800" title="Delete provider">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {providers.length === 0 && !error && (
                  <p className="text-center text-muted-foreground py-8">No providers found. Add one to get started!</p>
                )}
              </div>
              <div className="flex justify-between mt-4">
                <button onClick={() => setPage(page - 1)} disabled={page === 1 || loading} className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50">
                  Previous
                </button>
                <span>{page} of {Math.ceil(total / LIMIT)}</span>
                <button onClick={() => setPage(page + 1)} disabled={providers.length < LIMIT || loading} className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50">
                  Next
                </button>
              </div>
              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm mt-4 flex items-center justify-between">
                  <span>{error}</span>
                  <button onClick={fetchProviders} disabled={loading} className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50">
                    Retry
                  </button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">{editingId ? 'Edit Provider' : 'Add New Provider'}</h2>
              <p className="text-sm text-gray-600 mt-1">Set up a provider to import and manage your proxy sources. Choose a type that matches your setup. We'll guide you through the configuration.</p>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                JSON.parse(config); // Validate JSON
              } catch {
                setError('Invalid JSON in configuration. Please check and correct.');
                return;
              }
              const formData = new FormData(e.currentTarget);
              const finalConfig = fileContent ? {
                ...JSON.parse(config),
                file: fileContent.name,
                uploaded: true
              } : JSON.parse(config);
              const data = {
                name: formData.get('name') as string,
                type: selectedType,
                logoUrl: formData.get('logoUrl') as string,
                config: finalConfig,
                active: formData.get('active') === 'on',
              };
              try {
                editingId ? await handleUpdate(data) : await handleCreate(data);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to save provider');
              }
            }} className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Provider Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    defaultValue={editData.name}
                    required
                    placeholder="e.g., Bright Data"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Logo URL (Optional)
                  </label>
                  <input
                    id="logoUrl"
                    type="url"
                    name="logoUrl"
                    defaultValue={editData.logoUrl || ''}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  Provider Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  value={selectedType}
                  onChange={(e) => {
                    const value = e.target.value as 'api' | 'file' | 'manual';
                    setSelectedType(value);
                  }}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="api">
                    API (Automated)
                  </option>
                  <option value="file">
                    File Upload
                  </option>
                  <option value="manual">
                    Manual Entry
                  </option>
                </select>
              </div>

const getPlaceholder = (type: 'api' | 'file' | 'manual') => {
  switch (type) {
    case 'api':
      return `{
"kind": "iproyal",
"access_token": "YOUR_X_ACCESS_TOKEN",
"list_endpoint": "https://apid.iproyal.com/v1/reseller/datacenter/proxies",
"default_pool": "default"
}`;
    case 'file':
      return `{
"filePath": "/path/to/proxies.json",
"format": "json",
"pools": {
  "default": "general"
}
}`;
    case 'manual':
      return `{
"proxies": [
  {
    "host": "1.2.3.4",
    "port": 8080,
    "username": "user",
    "password": "pass"
  }
]
}`;
    default:
      return `{
"apiKey": "your-api-key",
"endpoint": "https://api.example.com/proxies",
"authType": "bearer"
}`;
  }
};

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Configuration
                </label>
                <div className="space-y-2 mb-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500 bg-blue-50 p-3 rounded-md border border-blue-100">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p>JSON Configuration</p>
                      <p className="mb-0">Configure API keys, endpoints, file paths, or other settings for your provider type. See <a href="https://docs.proxyhub.com/providers/config" target="_blank" className="text-blue-600 hover:underline">documentation</a> for type-specific examples.</p>
                    </div>
                  </div>
                </div>
                <textarea
                  name="config"
                  value={config}
                  onChange={(e) => setConfig(e.target.value)}
                  rows={8}
                  placeholder={getPlaceholder(selectedType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical transition-colors"
                  title="Enter JSON configuration. Use the placeholder example for your selected provider type. Validate with a JSON linter if needed."
                />
                {selectedType === 'file' && (
                  <div className="mt-2">
                    <label htmlFor="configFile" className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Config File (JSON/CSV)
                    </label>
                    <input
                      id="configFile"
                      type="file"
                      accept=".json,.csv"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFileContent(file);
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const content = event.target?.result as string;
                            try {
                              const parsed = JSON.parse(content); // Assume JSON, or parse CSV manually if needed
                              setConfig(JSON.stringify({ source: 'uploaded', data: parsed }, null, 2));
                            } catch {
                              setConfig(JSON.stringify({ source: 'uploaded', content: content }, null, 2));
                            }
                          };
                          reader.readAsText(file);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  Tip: Start with the example config from your provider's documentation. Common fields: apiKey, endpoint, username, password, filePath.
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="active" defaultChecked={editData.active !== false} className="rounded" />
                  <span className="text-sm">Active</span>
                </label>
                <div className="ml-auto flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      'Save Provider'
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
