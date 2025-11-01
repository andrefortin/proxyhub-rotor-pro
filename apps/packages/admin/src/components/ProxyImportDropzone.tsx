import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';

interface ProxyRow {
  host: string;
  port?: number;
  username?: string;
  password?: string;
  protocol?: string;
  pool?: string;
}

interface ProxyImportDropzoneProps {
  onRowsParsed: (rows: ProxyRow[]) => void;
  onError: (error: string) => void;
}

export const ProxyImportDropzone: React.FC<ProxyImportDropzoneProps> = ({ onRowsParsed, onError }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'text/csv') {
      Papa.parse<ProxyRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<ProxyRow>) => {
          // Check required headers first
          const headers = results.meta.fields || [];
          const normalizeHeader = (header: string) => {
            const lower = header.toLowerCase().trim();
            if (lower === 'host') return 'host';
            if (lower === 'port') return 'port';
            if (lower === 'user' || lower === 'username') return 'username';
            if (lower === 'pass' || lower === 'password') return 'password';
            if (lower === 'protocol') return 'protocol';
            if (lower === 'pool') return 'pool';
            return lower;
          };
          
          const normalizedHeaders = headers.map(normalizeHeader);
          const requiredHeaders = ['host', 'port', 'username', 'password'];
          const missingHeaders = requiredHeaders.filter(h => !normalizedHeaders.includes(h));
          
          if (missingHeaders.length > 0) {
            onError(`Missing required headers: ${missingHeaders.join(', ')}. Required: host, port, username, password`);
            return;
          }
          
          const rows: ProxyRow[] = results.data.map((row: any) => {
            // Create normalized row object
            const normalizedRow: any = {};
            Object.keys(row).forEach(key => {
              const normalizedKey = normalizeHeader(key);
              normalizedRow[normalizedKey] = row[key];
            });
            
            return {
              host: normalizedRow.host,
              port: parseInt(normalizedRow.port) || 8080,
              username: normalizedRow.username || '',
              password: normalizedRow.password || '',
              protocol: normalizedRow.protocol || 'http',
              pool: normalizedRow.pool || '',
            };
          });
          
          // Validate required fields are not empty
          const validRows = rows.filter(row => 
            row.host && row.host.trim() && 
            row.port && 
            row.username && row.username.trim() && 
            row.password && row.password.trim()
          );
          
          if (validRows.length === 0) {
            onError('No valid proxies found. All rows must have host, port, username, and password.');
            return;
          }
          
          onRowsParsed(validRows);
        },
        error: (error: Error) => onError(`CSV parse error: ${error.message}`),
      });
    } else {
      onError('Please upload a valid CSV file.');
    }
  }, [onRowsParsed, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed border-gray-300 rounded-lg p-24 text-center transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 ${
        isDragActive ? 'border-blue-500 bg-blue-50' : ''
      }`}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p className="text-blue-600">Drop the CSV file here...</p>
      ) : (
        <div>
          <p className="mb-2 text-gray-600">Drag & drop a CSV file here, or click to select</p>
          <p className="text-sm text-gray-500">Required columns: host, port, username, password. Optional: pool, protocol</p>
        </div>
      )}
    </div>
  );
};
