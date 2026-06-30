import React, { useState } from 'react';
import { AlertTriangle, Truck, Clock, MapPin, CheckCircle2, Phone } from 'lucide-react';
import { Incident, Driver } from '../types/dispatch';

interface ActiveIncidentsBoardProps {
  incidents: Incident[];
  drivers: Driver[];
  onAssignDriver: (incidentId: string, driverId: string) => void;
  onUpdateStatus: (incidentId: string, status: Incident['status']) => void;
}

export const ActiveIncidentsBoard: React.FC<ActiveIncidentsBoardProps> = ({ incidents, drivers, onAssignDriver, onUpdateStatus }) => {
  const active = incidents.filter(i => i.status !== 'CLEARED');
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'UNASSIGNED'>('ALL');

  const filtered = filter === 'ALL' ? active : active.filter(i => i.severity === filter || (filter === 'UNASSIGNED' && i.status === 'UNASSIGNED'));

  const availableDrivers = drivers.filter(d => d.status === 'AVAILABLE');

  return (
    <div className="glass-panel-dark p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">Active Incidents</h3>
          <p className="text-xs text-slate-400">{active.length} active cases requiring dispatch</p>
        </div>
        <div className="flex gap-2">
          {(['ALL', 'CRITICAL', 'UNASSIGNED'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-bold rounded-full transition ${filter === f ? 'bg-[#00d2ff] text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500/40" />
            <p className="text-sm font-medium">No active incidents</p>
          </div>
        ) : (
          filtered.map(incident => (
            <div key={incident.id} className={`p-4 rounded-2xl border transition ${incident.severity === 'CRITICAL' ? 'bg-red-500/5 border-red-500/20' : 'bg-slate-900/50 border-slate-700/30'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${incident.severity === 'CRITICAL' ? 'bg-red-500 text-white' : incident.severity === 'MAJOR' ? 'bg-amber-500 text-white' : 'bg-slate-600 text-white'}`}>{incident.severity}</span>
                    <span className="text-xs font-mono text-slate-400">{incident.case_number}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{incident.location_address}</h4>
                  <p className="text-xs text-slate-400 mb-2">{incident.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(incident.created_at).toLocaleTimeString()}</span>
                    {incident.distance_miles && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {incident.distance_miles.toFixed(1)} mi</span>}
                    {incident.eta_minutes && <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> {incident.eta_minutes}m ETA</span>}
                  </div>
                  {incident.driver_name && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-[#00d2ff]">
                      <Truck className="h-3 w-3" /> Assigned: {incident.driver_callsign} ({incident.driver_name})
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  {incident.status === 'UNASSIGNED' && (
                    <select
                      onChange={(e) => e.target.value && onAssignDriver(incident.id, e.target.value)}
                      className="input-field text-xs min-w-[140px]"
                      defaultValue=""
                    >
                      <option value="">Assign Driver</option>
                      {availableDrivers.map(d => (
                        <option key={d.id} value={d.id}>{d.callsign} - {d.name}</option>
                      ))}
                    </select>
                  )}
                  {incident.status === 'DISPATCHED' && (
                    <button onClick={() => onUpdateStatus(incident.id, 'ON_SCENE')} className="btn-primary text-xs py-1.5">On Scene</button>
                  )}
                  {incident.status === 'ON_SCENE' && (
                    <button onClick={() => onUpdateStatus(incident.id, 'RECOVERY_IN_PROGRESS')} className="btn-primary text-xs py-1.5">Recovery</button>
                  )}
                  {incident.status === 'RECOVERY_IN_PROGRESS' && (
                    <button onClick={() => onUpdateStatus(incident.id, 'CLEARED')} className="btn-danger text-xs py-1.5">Clear</button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
