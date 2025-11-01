import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Input } from '../components/ui/input';
import { Settings as SettingsIcon, Bell, Shield, Zap, Database, Globe, Clock, AlertCircle, CheckCircle2, Save, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSettings, updateSettings as apiUpdateSettings } from '../lib/api';

const SettingItem = ({ icon: Icon, title, description, children }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
  >
    <div className="mt-1">
      <div className="p-2 bg-blue-50 rounded-lg">
        <Icon className="h-5 w-5 text-blue-600" />
      </div>
    </div>
    <div className="flex-1">
      <h3 className="font-medium text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
      <div className="mt-3">{children}</div>
    </div>
  </motion.div>
);

export default function Settings() {
  const [settings, setSettings] = useState({
    autoRefresh: true,
    notifications: true,
    healthMonitoring: true,
    stickySession: false,
    geoEnrichment: true,
    autoRetry: true,
    darkMode: false,
    refreshInterval: 30,
    maxFailures: 5,
    leaseTimeout: 300,
    healthCheckUrl: 'https://ipv4.icanhazip.com/?format=json',
    geoipMaxmind: true,
    geoipIplocation: true,
    geoipIpapi: true,
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSettings();
        if (Object.keys(data).length > 0) {
          setSettings(prev => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    
    // If all GeoIP sources are disabled, disable GeoIP enrichment
    if (['geoipMaxmind', 'geoipIplocation', 'geoipIpapi'].includes(key)) {
      if (!newSettings.geoipMaxmind && !newSettings.geoipIplocation && !newSettings.geoipIpapi) {
        newSettings.geoEnrichment = false;
      }
    }
    
    setSettings(newSettings);
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      await apiUpdateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="h-6 w-6" />
            Settings
          </h1>
          <p className="text-gray-600 mt-1">Customize your proxy management experience</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingItem
              icon={Clock}
              title="Auto Refresh"
              description="Automatically refresh dashboard data"
            >
              <div className="flex items-center gap-3">
                <Switch
                  checked={settings.autoRefresh}
                  onCheckedChange={(checked) => updateSetting('autoRefresh', checked)}
                />
                {settings.autoRefresh && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={settings.refreshInterval}
                      onChange={(e) => updateSetting('refreshInterval', parseInt(e.target.value))}
                      className="w-20"
                      min="10"
                      max="300"
                    />
                    <span className="text-sm text-gray-600">seconds</span>
                  </div>
                )}
              </div>
            </SettingItem>

            <SettingItem
              icon={Globe}
              title="GeoIP Enrichment"
              description="Automatically add location data to proxies"
            >
              <Switch
                checked={settings.geoEnrichment}
                onCheckedChange={(checked) => updateSetting('geoEnrichment', checked)}
              />
            </SettingItem>

            {settings.geoEnrichment && (
              <div className="ml-12 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">GeoIP Sources (priority order)</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-white rounded border border-gray-200">
                    <span className="text-xs font-medium text-gray-500 w-6">1</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">MaxMind GeoLite2 (Local)</span>
                    </div>
                    <Switch
                      checked={settings.geoipMaxmind}
                      onCheckedChange={(checked) => updateSetting('geoipMaxmind', checked)}
                    />
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded border border-gray-200">
                    <span className="text-xs font-medium text-gray-500 w-6">2</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">iplocation.net API</span>
                    </div>
                    <Switch
                      checked={settings.geoipIplocation}
                      onCheckedChange={(checked) => updateSetting('geoipIplocation', checked)}
                    />
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded border border-gray-200">
                    <span className="text-xs font-medium text-gray-500 w-6">3</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">ipapi.co API (Fallback)</span>
                    </div>
                    <Switch
                      checked={settings.geoipIpapi}
                      onCheckedChange={(checked) => updateSetting('geoipIpapi', checked)}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Sources are tried in order until location data is found. Disable unused sources to improve performance.
                </p>
              </div>
            )}

            <SettingItem
              icon={AlertCircle}
              title="Auto Retry Failed Proxies"
              description="Automatically retry proxies that fail health checks"
            >
              <Switch
                checked={settings.autoRetry}
                onCheckedChange={(checked) => updateSetting('autoRetry', checked)}
              />
            </SettingItem>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-600" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingItem
              icon={Bell}
              title="Enable Notifications"
              description="Get notified about proxy failures and important events"
            >
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) => updateSetting('notifications', checked)}
              />
            </SettingItem>

            <SettingItem
              icon={Shield}
              title="Health Monitoring Alerts"
              description="Receive alerts when proxy health score drops below 60%"
            >
              <Switch
                checked={settings.healthMonitoring}
                onCheckedChange={(checked) => updateSetting('healthMonitoring', checked)}
              />
            </SettingItem>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-green-600" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingItem
              icon={AlertCircle}
              title="Max Failures Before Disable"
              description="Number of failures before a proxy is disabled"
            >
              <Input
                type="number"
                value={settings.maxFailures}
                onChange={(e) => updateSetting('maxFailures', parseInt(e.target.value))}
                className="w-24"
                min="1"
                max="100"
                step="1"
              />
            </SettingItem>

            <SettingItem
              icon={Clock}
              title="Lease Timeout"
              description="Default lease duration in seconds"
            >
              <Input
                type="number"
                value={settings.leaseTimeout}
                onChange={(e) => updateSetting('leaseTimeout', parseInt(e.target.value))}
                className="w-24"
                min="1"
                max="600"
                step="1"
              />
            </SettingItem>

            <SettingItem
              icon={Globe}
              title="Health Check URL"
              description="URL used to test proxy connectivity"
            >
              <Input
                type="url"
                value={settings.healthCheckUrl}
                onChange={(e) => updateSetting('healthCheckUrl', e.target.value)}
                className="w-full"
                placeholder="https://ipv4.icanhazip.com/?format=json"
              />
            </SettingItem>
          </CardContent>
        </Card>

        {/* Advanced */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-600" />
              Advanced
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingItem
              icon={Database}
              title="Sticky Sessions"
              description="Enable sticky sessions by default for all projects"
            >
              <Switch
                checked={settings.stickySession}
                onCheckedChange={(checked) => updateSetting('stickySession', checked)}
              />
            </SettingItem>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">Advanced Settings</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    These settings affect core proxy behavior. Change with caution.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="flex items-center gap-2 text-blue-900 font-medium">
            <CheckCircle2 className="h-5 w-5" />
            Quick Tip
          </div>
          <p className="text-sm text-blue-700 mt-2">
            Enable auto-refresh to keep your dashboard data up-to-date without manual refreshing.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-4 bg-green-50 border border-green-200 rounded-lg"
        >
          <div className="flex items-center gap-2 text-green-900 font-medium">
            <Shield className="h-5 w-5" />
            Best Practice
          </div>
          <p className="text-sm text-green-700 mt-2">
            Set max failures to 5 for optimal balance between reliability and proxy utilization.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-4 bg-purple-50 border border-purple-200 rounded-lg"
        >
          <div className="flex items-center gap-2 text-purple-900 font-medium">
            <Zap className="h-5 w-5" />
            Performance
          </div>
          <p className="text-sm text-purple-700 mt-2">
            Lower refresh intervals provide real-time data but may increase server load.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
