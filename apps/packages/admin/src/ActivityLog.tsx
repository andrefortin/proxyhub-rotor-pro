import { useState, useEffect } from 'react';

const ActivityLog = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch last 50 lines from /logs/notifications.json
    fetch('/logs/notifications.json') // Assume served or via API
      .then(res => res.json())
      .then(data => {
        const last50 = data.slice(-50); // Assume array of log objects, adjust as needed
        setLogs(last50.map(log => JSON.stringify(log)));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading logs ...</div>;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md dark:shadow-blue-900">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Activity Log (Last 50)</h3>
      <div className="max-h-96 overflow-y-auto mt-2 text-gray-700 dark:text-gray-300 font-mono text-sm">
        {logs.map((log, index) => (
          <p key={index} className="border-b border-gray-200 dark:border-gray-700 py-1">{log}</p>
        ))}
      </div>
    </div>
  );
};

export default ActivityLog;