import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { MapPin, Navigation } from 'lucide-react';
import { Driver, Incident } from '../types/dispatch';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default markers
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const driverIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #00d2ff; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px rgba(0,210,255,0.5);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const incidentIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #ef4444; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(239,68,68,0.5);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

interface IncidentMapProps {
  drivers: Driver[];
  incidents: Incident[];
}

export const IncidentMap: React.FC<IncidentMapProps> = ({ drivers, incidents }) => {
  const center: [number, number] = [27.9506, -82.4572];

  return (
    <div className="glass-panel-dark p-4 h-[500px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <MapPin className="h-5 w-5 text-[#00d2ff]" /> Live Operations Map
        </h3>
        <div className="flex gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#00d2ff]" /> Drivers</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500" /> Incidents</span>
        </div>
      </div>
      <MapContainer center={center} zoom={12} className="h-[420px] rounded-xl" style={{ background: '#0b1120' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {drivers.filter(d => d.current_location_lat && d.current_location_lng).map(driver => (
          <Marker key={driver.id} position={[driver.current_location_lat, driver.current_location_lng]} icon={driverIcon}>
            <Popup className="custom-popup">
              <div className="text-slate-900">
                <p className="font-bold">{driver.callsign}</p>
                <p className="text-sm">{driver.name}</p>
                <p className={`text-xs font-bold ${driver.status === 'AVAILABLE' ? 'text-emerald-600' : driver.status === 'EN_ROUTE' ? 'text-blue-600' : 'text-slate-500'}`}>{driver.status}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        {incidents.filter(i => i.location_lat && i.location_lng && i.status !== 'CLEARED').map(incident => (
          <Marker key={incident.id} position={[incident.location_lat, incident.location_lng]} icon={incidentIcon}>
            <Popup className="custom-popup">
              <div className="text-slate-900">
                <p className="font-bold">{incident.case_number}</p>
                <p className="text-sm">{incident.location_address}</p>
                <p className="text-xs font-bold text-red-600">{incident.severity}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
