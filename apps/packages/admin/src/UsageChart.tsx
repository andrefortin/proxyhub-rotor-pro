import { useEffect, useState } from 'react';
import { BarChart, XAxis, YAxis, Bar, PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getUsageStats } from './lib/api';
import type { UsageData, ResponseCodeData } from './types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const UsageChart = () => {
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [responseCodes, setResponseCodes] = useState<ResponseCodeData[]>([
    { name: '200', value: 800 },
    { name: '3xx', value: 100 },
    { name: '4xx', value: 50 },
    { name: '5xx', value: 20 }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsageStats = async () => {
      try {
        const data = await getUsageStats();
        setUsageData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch usage stats');
      } finally {
        setLoading(false);
      }
    };

    fetchUsageStats();
  }, []);

  // Derive dailyResponses from usageData or fallback
  const dailyResponses = usageData.length > 0 ? usageData : [
    { date: "2025-10-24", responses: 123 },
    { date: "2025-10-25", responses: 456 },
  ];

  if (loading) return <div>Loading chart data...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md dark:shadow-blue-900">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Responses / Day (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailyResponses}>
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", color: "hsl(var(--card-foreground))" }} />
            <Bar dataKey="responses" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Response Codes</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={responseCodes} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
              {responseCodes.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "hsl(var(--card))", color: "hsl(var(--card-foreground))" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default UsageChart;