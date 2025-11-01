import React from 'react';

interface Column {
  accessorKey: string;
  header: string;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
}

export const DataTable: React.FC<DataTableProps> = ({ data, columns }) => (
  <div className="rounded-md border">
    <table className="w-full">
      <thead>
        <tr className="border-b">
          {columns.map((column) => (
            <th key={column.accessorKey} className="text-left p-3 font-medium">{column.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={index} className="border-b hover:bg-gray-50">
            {columns.map((column) => (
              <td key={column.accessorKey} className="p-3">{row[column.accessorKey] || ''}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
