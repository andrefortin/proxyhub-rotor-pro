import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Supercluster from 'supercluster';
import { GoogleMap, Marker as GMarker, useLoadScript } from '@react-google-maps/api';

// Basic Leaflet icon fix for default marker
const DefaultIcon = L.icon({ iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png' });
L.Marker.prototype.options.icon = DefaultIcon as any;

type ProxyPoint = { id:string; latitude:number|null; longitude:number|null; host:string; country?:string; city?:string; asn?:number; org?:string; pool?:string };

function useClusters(points: ProxyPoint[], zoom: number, bounds: number[]) {
  return useMemo(() => {
    const index = new Supercluster({ radius: 60, maxZoom: 17 });
    const features = points.filter(p=>p.latitude && p.longitude).map(p => ({
      type: 'Feature',
      properties: { cluster: false, proxyId: p.id, host: p.host, country: p.country, city: p.city, asn: p.asn, org: p.org, pool: p.pool },
      geometry: { type: 'Point', coordinates: [p.longitude!, p.latitude!] }
    }));
    index.load(features as any);
    const clusters = index.getClusters(bounds.length ? bounds : [-180, -85, 180, 85], Math.round(zoom));
    return { clusters, index };
  }, [points, zoom, bounds]);
}

function LeafletClusters({ points }:{points: ProxyPoint[]}) {
  const [zoom, setZoom] = useState(2);
  const [bounds, setBounds] = useState<number[]>([]);
  const map = useMap();
  useEffect(()=>{
    function update() {
      setZoom(map.getZoom());
      const b = map.getBounds();
      setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    }
    update();
    map.on('moveend', update);
    return () => { map.off('moveend', update); };
  }, [map]);
  const { clusters, index } = useClusters(points, zoom, bounds);
  return (<>
    {clusters.map((c:any) => {
      const [lng, lat] = c.geometry.coordinates;
      const { cluster: isCluster, point_count: pointCount } = c.properties;
      if (isCluster) {
        const size = 10 + (pointCount/10);
        const icon = L.divIcon({
          html: `<div style="background:#4f46e5;color:#fff;border-radius:9999px;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-size:12px">${pointCount}</div>`,
          className: ''
        });
        return <Marker key={`c-${c.id}`} position={[lat, lng]} icon={icon as any} eventHandlers={{ click: () => {
          const expansionZoom = Math.min(index.getClusterExpansionZoom(c.id), 18);
          map.setView([lat, lng], expansionZoom, { animate: true });
        }}}/>;
      }
      return <Marker key={c.properties.proxyId} position={[lat, lng]}>
        <Popup>
          <div style={{fontSize:12}}>
            <div><b>{c.properties.host}</b></div>
            <div>{c.properties.city}, {c.properties.country}</div>
            <div>ASN {c.properties.asn} — {c.properties.org}</div>
            <div>Pool: {c.properties.pool}</div>
          </div>
        </Popup>
      </Marker>;
    })}
  </>);
}

export default function MapCard({ points }:{ points: ProxyPoint[] }) {
  const [engine, setEngine] = useState<'leaflet'|'google'>('leaflet');
  const { isLoaded } = useLoadScript({ googleMapsApiKey: (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '' });

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
        <b>Proxy Map</b>
        <div>
          <button onClick={()=>setEngine(e=> e==='leaflet' ? 'google': 'leaflet')}>
            Switch to {engine==='leaflet' ? 'Google Maps' : 'Leaflet'}
          </button>
        </div>
      </div>
      {engine === 'leaflet' ? (
        <MapContainer center={[20,0]} zoom={2} style={{height: '420px', width: '100%', borderRadius: 12}}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
          <LeafletClusters points={points}/>
        </MapContainer>
      ) : (
        <div style={{height:420, width:'100%'}}>
          {isLoaded ? (
            <GoogleMap center={{lat: 20, lng: 0}} zoom={2} mapContainerStyle={{height: '420px', width: '100%'}}>
              {points.filter(p=>p.latitude && p.longitude).map(p => (
                <GMarker key={p.id} position={{lat: p.latitude!, lng: p.longitude!}} title={`${p.host} — ${p.city}, ${p.country}`} />
              ))}
            </GoogleMap>
          ) : <div>Loading Google Maps...</div>}
        </div>
      )}
    </div>
  );
}
