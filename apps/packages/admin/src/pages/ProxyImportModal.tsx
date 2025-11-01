import React, { useState } from 'react';
import { DataTable } from '../components/DataTable'; // Assume existing or add simple table
import { useToast } from '../components/ui/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { ProxyImportDropzone } from '../components/ProxyImportDropzone';
import { importProxies } from '../lib/api'; // Existing API utils
import type { Provider } from '../types'; // Assume typed

interface ProxyRow {
  host: string;
  port?: number;
  username?: string;
  password?: string;
  protocol?: string;
  pool?: string;
  providerId?: string;
}

interface ProxyImportModalProps {
  onImportSuccess: () => void;
  providers: Provider[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ProxyImportModal: React.FC<ProxyImportModalProps> = ({ onImportSuccess, providers, open = false, onOpenChange }) => {
  const [parsedRows, setParsedRows] = useState<ProxyRow[]>([]);
  const [selectedPool, setSelectedPool] = useState('isp');
  const [selectedProviderId, setSelectedProviderId] = useState(providers.length === 1 ? providers[0].id : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const handleParse = (rows: ProxyRow[]) => {
    // Apply selected pool and provider if global
    const updatedRows = rows.map(row => ({ 
      ...row, 
      pool: row.pool || selectedPool || '',
      providerId: row.providerId || selectedProviderId || ''
    }));
    setParsedRows(updatedRows);
    setError('');
  };

  const handleError = (err: string) => {
    setError(err);
    toast({ variant: 'destructive', title: 'Upload Error', description: err });
  };

  const handleSubmit = async () => {
    if (parsedRows.length === 0) {
      toast({ variant: 'destructive', title: 'No Data', description: 'Please upload a CSV first.' });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { imported, skipped } = await importProxies({
        proxies: parsedRows,
        pool: selectedPool || undefined,
        providerId: selectedProviderId || undefined,
      });
      toast({
        title: 'Import Successful',
        description: `Imported ${imported} proxies, skipped ${skipped} duplicates.`,
      });
      setParsedRows([]);
      onOpenChange?.(false);
      onImportSuccess(); // Refetch
    } catch (err: any) {
      handleError(err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { accessorKey: 'host', header: 'Host' },
    { accessorKey: 'port', header: 'Port' },
    { accessorKey: 'username', header: 'Username' },
    { accessorKey: 'password', header: 'Password', cell: ({ getValue }: any) => '***' + (getValue() || '').slice(-4) },
    { accessorKey: 'pool', header: 'Pool' },
    { accessorKey: 'providerId', header: 'Provider' },
  ]; // Preview columns with masked password

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Proxies from CSV</DialogTitle>
        </DialogHeader>
        <Card>
          <CardContent className="p-6 space-y-4">
            {parsedRows.length === 0 ? (
              <ProxyImportDropzone onRowsParsed={handleParse} onError={handleError} />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={selectedPool}
                    onChange={(e) => setSelectedPool(e.target.value)}
                    className="px-3 py-2 border border-input rounded-md bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">All Pools</option>
                    <option value="residential">Residential</option>
                    <option value="isp">ISP</option>
                    <option value="datacenter">Datacenter</option>
                    <option value="mobile">Mobile</option>
                    <option value="web_unblocker">Web Unblocker</option>
                    <option value="test">Test</option>
                  </select>
                  <select
                    value={selectedProviderId}
                    onChange={(e) => setSelectedProviderId(e.target.value)}
                    className="px-3 py-2 border border-input rounded-md bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">All Providers</option>
                    {providers.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <DataTable data={parsedRows.slice(0, 5)} columns={columns} /> {/* Preview first 5 */}
                {parsedRows.length > 5 && <p className="text-sm text-gray-500">Showing first 5 of {parsedRows.length} rows</p>}
              </div>
            )}
            {error && (
              <div className="flex items-center p-4 bg-destructive/10 text-destructive rounded-md">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            )}
            {parsedRows.length > 0 && (
              <Button onClick={handleSubmit} disabled={loading} className="w-full">
                {loading ? (
                  <><CheckCircle className="mr-2 h-4 w-4 animate-spin" /> Importing...</>
                ) : (
                  <>Import {parsedRows.length} Proxies</>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
