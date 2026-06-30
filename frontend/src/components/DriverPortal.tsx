import React from 'react';
import { Truck, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import { Driver, Incident } from '../types/dispatch';

interface DriverPortalProps {
  drivers: Driver[];
  incidents: Incident[];
  onUpdateDriverStatus: (driverId: string, status: Driver['status'], incidentId?: string) => void;
  onUpdateIncidentStatus: (incidentId: string, status: Incident['status']) => void;
}

export const DriverPortal: React.FC<DriverPortalProps> = ({ drivers, incidents, onUpdateDriverStatus, onUpdateIncidentStatus }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {drivers.map(driver => {
          const activeIncident = incidents.find(i => i.id === driver.active_incident_id);
          return (
            <div key={driver.id} className="glass-panel-dark p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xl font-black text-white">{driver.callsign}</p>
                  <p className="text-sm text-slate-400">{driver.name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${driver.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : driver.status === 'EN_ROUTE' ? 'bg-[#00d2ff]/20 text-[#00d2ff] border-[#00d2ff]/30' : 'bg-purple-500/20 text-purple-400 border-purple-500/30'}`}>
                  {driver.status}
                </span>
              </div>

              {activeIncident ? (
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30 mb-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Active Assignment</p>
                  <p className="font-bold text-white mb-1">{activeIncident.case_number}</p>
                  <p className="text-sm text-slate-300 mb-2 flex items-center gap-1"><MapPin className="h-3 w-3" /> {activeIncident.location_address}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {activeIncident.eta_minutes}m ETA</span>
                    <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> {activeIncident.distance_miles?.toFixed(1)} mi</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {driver.status === 'EN_ROUTE' && (
                      <button onClick={() => onUpdateDriverStatus(driver.id, 'ON_SCENE', activeIncident.id)} className="btn-primary text-xs py-1.5">On Scene</button>
                    )}
                    {driver.status === 'ON_SCENE' && (
                      <button onClick={() => onUpdateDriverStatus(driver.id, 'TOWING', activeIncident.id)} className="btn-primary text-xs py-1.5">Towing</button>
                    )}
                    {driver.status === 'TOWING' && (
                      <button onClick={() => {
                        onUpdateDriverStatus(driver.id, 'AVAILABLE', undefined);
                        onUpdateIncidentStatus(activeIncident.id, 'CLEARED');
                      }} className="btn-secondary text-xs py-1.5 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Clear</button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-sm">No active assignment</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
