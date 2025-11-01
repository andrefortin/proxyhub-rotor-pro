import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Proxy } from '../types';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const activeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const inactiveIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface ProxyWithLease extends Proxy {
  hasActiveLease?: boolean;
}

interface ProxyMapProps {
  proxies: ProxyWithLease[];
}

function MapBounds({ proxies }: { proxies: ProxyWithLease[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (proxies.length > 0) {
      const bounds = L.latLngBounds(
        proxies.map(p => [p.latitude!, p.longitude!])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [proxies, map]);
  
  return null;
}

export default function ProxyMap({ proxies }: ProxyMapProps) {
  const proxiesWithCoords = proxies.filter(p => p.latitude && p.longitude);
  
  if (proxiesWithCoords.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-gray-100 rounded-lg">
        <p className="text-gray-500">No proxies with GPS coordinates available</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{ height: '500px', width: '100%' }}
      className="rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapBounds proxies={proxiesWithCoords} />
      {proxiesWithCoords.map((proxy) => (
        <Marker
          key={proxy.id}
          position={[proxy.latitude!, proxy.longitude!]}
          icon={proxy.hasActiveLease ? activeIcon : inactiveIcon}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-bold">{proxy.host}:{proxy.port}</p>
              <p>Pool: {proxy.pool}</p>
              <p>Country: {proxy.country || 'Unknown'}</p>
              <p>City: {proxy.city || 'Unknown'}</p>
              <p>Score: {proxy.score.toFixed(1)}%</p>
              <p className="mt-1">
                <span className={`inline-block w-2 h-2 rounded-full mr-1 ${proxy.hasActiveLease ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                {proxy.hasActiveLease ? 'Active Lease' : 'Available'}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
