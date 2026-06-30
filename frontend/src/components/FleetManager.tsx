import React, { useState } from 'react';
import { Truck, Phone, MapPin, Star, Plus } from 'lucide-react';
import { Driver } from '../types/dispatch';

interface FleetManagerProps {
  drivers: Driver[];
  onUpdateDriver: (driver: Driver) => void;
}

export const FleetManager: React.FC<FleetManagerProps> = ({ drivers, onUpdateDriver }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newDriver, setNewDriver] = useState({ name: '', callsign: '', phone: '', vehicle_type: 'Tow Truck' });

  const statusColors: Record<string, string> = {
    AVAILABLE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    EN_ROUTE: 'bg-[#00d2ff]/20 text-[#00d2ff] border-[#00d2ff]/30',
    ON_SCENE: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    TOWING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    OFF_DUTY: 'bg-slate-600/20 text-slate-400 border-slate-600/30',
  };

  return (
    <div className="glass-panel-dark p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2"><Truck className="h-5 w-5 text-[#00d2ff]" /> Fleet Manager</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-xs"><Plus className="h-4 w-4 inline" /> Add Driver</button>
      </div>

      {showAdd && (
        <div className="mb-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/30 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input className="input-field" placeholder="Name" value={newDriver.name} onChange={e => setNewDriver({...newDriver, name: e.target.value})} />
            <input className="input-field" placeholder="Callsign" value={newDriver.callsign} onChange={e => setNewDriver({...newDriver, callsign: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className="input-field" placeholder="Phone" value={newDriver.phone} onChange={e => setNewDriver({...newDriver, phone: e.target.value})} />
            <select className="input-field" value={newDriver.vehicle_type} onChange={e => setNewDriver({...newDriver, vehicle_type: e.target.value})}>
              <option>Tow Truck</option>
              <option>Flatbed</option>
              <option>Wrecker</option>
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {drivers.map(driver => (
          <div key={driver.id} className="bg-slate-900/50 rounded-xl border border-slate-700/30 p-4 hover:border-slate-600 transition">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-bold text-white">{driver.callsign}</p>
                <p className="text-xs text-slate-400">{driver.name}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[driver.status] || statusColors.OFF_DUTY}`}>{driver.status}</span>
            </div>
            <div className="space-y-1 text-xs text-slate-400">
              <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {driver.phone}</p>
              <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {driver.current_location_address || 'Tampa, FL'}</p>
              <p className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-400" /> {driver.rating} • {driver.completed_dispatches} dispatches</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
