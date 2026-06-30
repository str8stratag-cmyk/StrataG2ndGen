import React, { useState } from 'react';
import { Truck, Users, AlertTriangle, Radio, Zap, Bell } from 'lucide-react';
import { DashboardStats } from '../types/dispatch';

interface DashboardOverviewProps {
  stats: DashboardStats | null;
  calls: any[];
  incidents: any[];
  drivers: any[];
  autonomousMode: boolean;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ stats, calls, incidents, drivers }) => {
  const activeIncidents = incidents.filter(i => i.status !== 'CLEARED');
  const availableDrivers = drivers.filter(d => d.status === 'AVAILABLE');
  const signal4Calls = calls.filter(c => c.is_signal4);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<AlertTriangle className="h-5 w-5" />} label="Active Incidents" value={activeIncidents.length} color="red" />
        <KpiCard icon={<Users className="h-5 w-5" />} label="Available Drivers" value={availableDrivers.length} color="emerald" />
        <KpiCard icon={<Radio className="h-5 w-5" />} label="Signal 4 Calls" value={signal4Calls.length} color="purple" />
        <KpiCard icon={<Truck className="h-5 w-5" />} label="Total Drivers" value={drivers.length} color="cyan" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel-dark p-6">
          <h3 className="text-lg font-bold text-white mb-4">Incident Breakdown</h3>
          <div className="space-y-3">
            <StatBar label="Critical" value={parseInt(stats?.incidents?.critical || '0')} max={parseInt(stats?.incidents?.total_incidents || '1')} color="bg-red-500" />
            <StatBar label="Unassigned" value={parseInt(stats?.incidents?.unassigned || '0')} max={parseInt(stats?.incidents?.total_incidents || '1')} color="bg-amber-500" />
            <StatBar label="Dispatched" value={parseInt(stats?.incidents?.dispatched || '0')} max={parseInt(stats?.incidents?.total_incidents || '1')} color="bg-[#00d2ff]" />
            <StatBar label="Cleared" value={parseInt(stats?.incidents?.cleared || '0')} max={parseInt(stats?.incidents?.total_incidents || '1')} color="bg-emerald-500" />
          </div>
        </div>

        <div className="glass-panel-dark p-6">
          <h3 className="text-lg font-bold text-white mb-4">Driver Status</h3>
          <div className="space-y-3">
            <StatBar label="Available" value={parseInt(stats?.drivers?.available || '0')} max={parseInt(stats?.drivers?.total_drivers || '1')} color="bg-emerald-500" />
            <StatBar label="En Route" value={parseInt(stats?.drivers?.en_route || '0')} max={parseInt(stats?.drivers?.total_drivers || '1')} color="bg-[#00d2ff]" />
            <StatBar label="On Scene" value={parseInt(stats?.drivers?.on_scene || '0')} max={parseInt(stats?.drivers?.total_drivers || '1')} color="bg-purple-500" />
            <StatBar label="Off Duty" value={parseInt(stats?.drivers?.off_duty || '0')} max={parseInt(stats?.drivers?.total_drivers || '1')} color="bg-slate-500" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-panel-dark p-6">
        <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
        <div className="space-y-2">
          {stats?.recentActivity?.slice(0, 5).map((item: any) => (
            <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-[#00d2ff]" />
                <div>
                  <p className="text-sm font-medium text-white">{item.case_number || item.location_address}</p>
                  <p className="text-xs text-slate-400">{item.status} • {item.severity}</p>
                </div>
              </div>
              <span className="text-xs text-slate-500">{new Date(item.created_at).toLocaleTimeString()}</span>
            </div>
          )) || <p className="text-sm text-slate-500">No recent activity</p>}
        </div>
      </div>
    </div>
  );
};

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    red: 'bg-red-500/10 text-red-400 border-red-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    cyan: 'bg-[#00d2ff]/10 text-[#00d2ff] border-[#00d2ff]/30',
  };

  return (
    <div className={`glass-panel p-4 flex items-center gap-4 ${colorMap[color] || colorMap.cyan}`}>
      <div className="p-3 rounded-xl bg-white/5">{icon}</div>
      <div>
        <p className="text-2xl font-black text-white">{value}</p>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
      </div>
    </div>
  );
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400">{value}</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
