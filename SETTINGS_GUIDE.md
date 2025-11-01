# Settings Guide

## Overview
The Settings page provides an intuitive interface for configuring ProxyHub Rotator behavior. All settings are stored locally in your browser and persist across sessions.

## Settings Categories

### 🚀 General Settings

#### Auto Refresh
- **What it does**: Automatically updates dashboard data every 30 seconds
- **When to enable**: Keep this ON for real-time monitoring
- **When to disable**: Turn OFF if you prefer manual control or to reduce server load

#### GeoIP Enrichment
- **What it does**: Automatically adds location data (country, city, coordinates) to proxies
- **When to enable**: Essential for the map view and geographic filtering
- **When to disable**: Only if you don't need location data

#### Auto Retry Failed Proxies
- **What it does**: Automatically retests proxies that fail health checks
- **When to enable**: Helps recover temporarily failed proxies
- **When to disable**: If you prefer manual proxy management

### 🔔 Notifications

#### Enable Notifications
- **What it does**: Shows browser notifications for important events
- **Events tracked**: Proxy failures, health score drops, system alerts
- **Recommendation**: Keep enabled for proactive monitoring

#### Health Monitoring Alerts
- **What it does**: Alerts when average proxy health drops below 60%
- **Why it matters**: Early warning system for proxy pool degradation
- **Recommendation**: Enable for production environments

### ⚡ Performance Settings

#### Refresh Interval (10-300 seconds)
- **Default**: 30 seconds
- **Lower values**: More real-time data, higher server load
- **Higher values**: Less server load, less frequent updates
- **Recommendation**: 30s for active monitoring, 60s+ for passive monitoring

#### Max Failures Before Disable (1-20)
- **Default**: 5 failures
- **Lower values**: Stricter quality control, fewer available proxies
- **Higher values**: More tolerance, more available proxies
- **Recommendation**: 5 for balanced approach

#### Lease Timeout (60-3600 seconds)
- **Default**: 300 seconds (5 minutes)
- **What it does**: How long a proxy lease remains active
- **Lower values**: Faster proxy rotation
- **Higher values**: Better for long-running tasks
- **Recommendation**: 300s for general use, 600s+ for scraping

### 🛡️ Advanced Settings

#### Sticky Sessions
- **What it does**: Reuses the same proxy for a project/pool combination
- **When to enable**: For websites that track IP addresses
- **When to disable**: For maximum proxy rotation
- **Use case**: Session-based scraping, authenticated requests

## Best Practices

### For High-Volume Operations
```
✓ Auto Refresh: ON
✓ Refresh Interval: 30s
✓ Max Failures: 5
✓ Lease Timeout: 300s
✓ Health Monitoring: ON
```

### For Low-Volume Monitoring
```
✓ Auto Refresh: ON
✓ Refresh Interval: 60s
✓ Max Failures: 7
✓ Lease Timeout: 600s
✓ Health Monitoring: ON
```

### For Development/Testing
```
✓ Auto Refresh: OFF
✓ Refresh Interval: 60s
✓ Max Failures: 10
✓ Lease Timeout: 300s
✓ Health Monitoring: OFF
```

## Tips & Tricks

### 💡 Quick Tip: Auto Refresh
Enable auto-refresh to keep your dashboard data up-to-date without manual refreshing. Perfect for monitoring proxy health in real-time.

### 🛡️ Best Practice: Max Failures
Set max failures to 5 for optimal balance between reliability and proxy utilization. This prevents bad proxies from being used while giving temporary failures a chance to recover.

### ⚡ Performance: Refresh Intervals
Lower refresh intervals provide real-time data but may increase server load. For most use cases, 30 seconds provides a good balance.

## Saving Settings

Settings are automatically saved to your browser's local storage when you click "Save Changes". They will persist across:
- Browser sessions
- Page refreshes
- Tab closures

**Note**: Settings are stored per browser. If you use multiple browsers or devices, you'll need to configure settings separately.

## Troubleshooting

### Settings Not Saving
1. Check browser console for errors
2. Ensure local storage is enabled
3. Try clearing browser cache
4. Verify you clicked "Save Changes"

### Dashboard Not Auto-Refreshing
1. Verify "Auto Refresh" is enabled
2. Check refresh interval is set correctly
3. Ensure browser tab is active (some browsers pause inactive tabs)

### Notifications Not Appearing
1. Check browser notification permissions
2. Verify "Enable Notifications" is ON
3. Test with a manual notification trigger

## Security Notes

- All settings are stored locally in your browser
- No sensitive data is stored in settings
- Settings do not affect server-side proxy behavior
- Clearing browser data will reset settings to defaults

## Default Values

When you first visit the Settings page or reset to defaults:

```json
{
  "autoRefresh": true,
  "notifications": true,
  "healthMonitoring": true,
  "stickySession": false,
  "geoEnrichment": true,
  "autoRetry": true,
  "refreshInterval": 30,
  "maxFailures": 5,
  "leaseTimeout": 300
}
```

## Advanced Configuration

For advanced users who need to configure settings programmatically:

```javascript
// Get current settings
const settings = JSON.parse(localStorage.getItem('proxyHubSettings'));

// Update specific setting
settings.refreshInterval = 60;
localStorage.setItem('proxyHubSettings', JSON.stringify(settings));

// Reset to defaults
localStorage.removeItem('proxyHubSettings');
```

## Feature Animations

The Settings page includes subtle micro-animations for better UX:
- **Fade-in**: Settings sections animate in on page load
- **Hover effects**: Cards lift slightly on hover
- **Button feedback**: Save button scales on click
- **Success state**: Checkmark animation when settings are saved

These animations are optimized for performance and accessibility.
