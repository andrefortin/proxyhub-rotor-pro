import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users2, Plus, Edit, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface Provider {
  id: string;
  name: string;
  type: string;
  active: boolean;
  config: any;
  logoUrl?: string;
  createdAt: Date;
}

export default function Providers() {
  const [searchParams] = useSearchParams();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [skip, setSkip] = useState(0);
  const [take, setTake] = useState(10);
  const [total, setTotal] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [mock, setMock] = useState(searchParams.get('mock') === 'true');

  useEffect(() => {
    fetchProviders();
  }, [skip, take, search, mock]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const url = `${API_BASE}/v1/providers?skip=${skip}&take=${take}&search=${search}${mock ? '&mock=true' : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch providers');
      const data = await res.json();
      setProviders(data);
      // Assume total from API or calculate
      setTotal(data.length * 10); // Placeholder
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: any) => {
    const url = `${API_BASE}/v1/providers${mock ? '?mock=true' : ''}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      fetchProviders();
      setShowModal(false);
    }
  };

  const handleUpdate = async (data: any) => {
    const url = `${API_BASE}/v1/providers/${editingId}${mock ? '?mock=true' : ''}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      fetchProviders();
      setEditingId(null);
      setShowModal(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete provider?')) return;
    const url = `${API_BASE}/v1/providers/${id}${mock ? '?mock=true' : ''}`;
    const res = await fetch(url, { method: 'DELETE' });
    if (res.ok) fetchProviders();
  };

  const openEdit = async (id: string) => {
    const url = `${API_BASE}/v1/providers/${id}${mock ? '?mock=true' : ''}`;
    const res = await fetch(url);
    const provider = await res.json();
    setEditData(provider);
    setEditingId(id);
    setShowModal(true);
  };

  if (loading) return <div className="p-8">Loading providers...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users2 className="w-5 h-5" />
              Providers Management
            </CardTitle>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-1 bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90">
              <Plus className="w-4 h-4" />
              Add Provider
            </button>
          </div>
        </CardHeader>
        <CardContent>
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
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Type</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Created</th>
                    <th className="text-right p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((provider) => (
                    <tr key={provider.id} className="border-b border-border hover:bg-accent">
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
                        <button onClick={() => openEdit(provider.id)} className="mr-2 p-1 text-blue-600 hover:text-blue-800">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(provider.id)} className="p-1 text-red-600 hover:text-red-800">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {providers.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No providers found. Add one to get started!</p>
            )}
          </div>
          <div className="flex justify-between mt-4">
            <button onClick={() => setSkip(skip - take)} disabled={skip === 0} className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50">
              Previous
            </button>
            <span>{skip / take + 1} of {Math.ceil(total / take)}</span>
            <button onClick={() => setSkip(skip + take)} disabled={providers.length < take} className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50">
              Next
            </button>
          </div>
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Provider' : 'Add Provider'}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = {
                  name: formData.get('name'),
                  type: formData.get('type'),
                  config: formData.get('config') ? JSON.parse(formData.get('config') as string) : {},
                };
                editingId ? handleUpdate(data) : handleCreate(data);
              }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input type="text" name="name" defaultValue={editData.name} required className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select name="type" defaultValue={editData.type} required className="w-full px-3 py-2 border rounded-md">
                    <option value="api">API</option>
                    <option value="file">File</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1">Config (JSON)</label>
                  <textarea name="config" defaultValue={JSON.stringify(editData.config, null, 2)} rows={6} className="w-full px-3 py-2 border rounded-md font-mono text-sm" />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Save</button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}