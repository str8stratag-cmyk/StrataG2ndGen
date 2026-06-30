import React from 'react';
import { BarChart3, Download, Clock } from 'lucide-react';

interface AdminConsoleProps {
  twilioLogs: any[];
  calls: any[];
  incidents: any[];
  drivers: any[];
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({ incidents, drivers }) => {
  const cleared = incidents.filter(i => i.status === 'CLEARED');
  const avgResponse = incidents.filter(i => i.dispatched_at && i.created_at).reduce((sum, i) => {
    const created = new Date(i.created_at).getTime();
    const dispatched = new Date(i.dispatched_at).getTime();
    return sum + (dispatched - created) / 60000;
  }, 0) / (incidents.filter(i => i.dispatched_at).length || 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel-dark p-4">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-5 w-5 text-[#00d2ff]" />
            <h3 className="text-sm font-bold text-white">Total Incidents</h3>
          </div>
          <p className="text-3xl font-black text-white">{incidents.length}</p>
        </div>
        <div className="glass-panel-dark p-4">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-5 w-5 text-[#00d2ff]" />
            <h3 className="text-sm font-bold text-white">Avg Response</h3>
          </div>
          <p className="text-3xl font-black text-white">{avgResponse.toFixed(1)}m</p>
        </div>
        <div className="glass-panel-dark p-4">
          <div className="flex items-center gap-3 mb-2">
            <Download className="h-5 w-5 text-[#00d2ff]" />
            <h3 className="text-sm font-bold text-white">Cleared</h3>
          </div>
          <p className="text-3xl font-black text-white">{cleared.length}</p>
        </div>
      </div>

      <div className="glass-panel-dark p-6">
        <h3 className="text-lg font-bold text-white mb-4">All Incidents Ledger</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-400 border-b border-slate-700/50">
              <tr>
                <th className="text-left py-2 px-3">Case #</th>
                <th className="text-left py-2 px-3">Location</th>
                <th className="text-left py-2 px-3">Severity</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-left py-2 px-3">Driver</th>
                <th className="text-left py-2 px-3">Time</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {incidents.slice(0, 50).map(inc => (
                <tr key={inc.id} className="border-b border-slate-700/20 hover:bg-slate-800/30">
                  <td className="py-2 px-3 font-mono text-xs">{inc.case_number}</td>
                  <td className="py-2 px-3 max-w-xs truncate">{inc.location_address}</td>
                  <td className="py-2 px-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${inc.severity === 'CRITICAL' ? 'bg-red-500 text-white' : inc.severity === 'MAJOR' ? 'bg-amber-500 text-white' : 'bg-slate-600 text-white'}`}>{inc.severity}</span></td>
                  <td className="py-2 px-3 text-xs">{inc.status}</td>
                  <td className="py-2 px-3 text-xs">{inc.driver_callsign || '-'}</td>
                  <td className="py-2 px-3 text-xs text-slate-500">{new Date(inc.created_at).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
