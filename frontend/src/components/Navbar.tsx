import React from 'react';
import { Shield, Radio, Truck, Settings, User, AlertTriangle, Bell, Volume2, VolumeX, Plus, Zap } from 'lucide-react';

export type ViewState = 'DASHBOARD' | 'MAP_FLEET' | 'FEEDS_DISPATCH' | 'ADMIN' | 'DRIVER_PORTAL';

interface NavbarProps {
  activeView: ViewState;
  onViewChange: (view: ViewState) => void;
  unreadLogsCount: number;
  autonomousMode: boolean;
  onToggleAutonomous: () => void;
  onOpenVonageModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenNewIncidentModal: () => void;
  audioMuted: boolean;
  onToggleMute: () => void;
  activeIncidentsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView, onViewChange, unreadLogsCount, autonomousMode, onToggleAutonomous,
  onOpenVonageModal, onOpenSettingsModal, onOpenNewIncidentModal, audioMuted, onToggleMute, activeIncidentsCount
}) => {
  const navItems: { view: ViewState; label: string; icon: React.ReactNode }[] = [
    { view: 'DASHBOARD', label: 'Dashboard', icon: <Shield className="h-4 w-4" /> },
    { view: 'FEEDS_DISPATCH', label: 'Dispatch', icon: <Radio className="h-4 w-4" /> },
    { view: 'MAP_FLEET', label: 'Fleet & Map', icon: <Truck className="h-4 w-4" /> },
    { view: 'ADMIN', label: 'Admin', icon: <Settings className="h-4 w-4" /> },
    { view: 'DRIVER_PORTAL', label: 'Drivers', icon: <User className="h-4 w-4" /> },
  ];

  return (
    <nav className="bg-[#0b1120]/95 border-b border-slate-700/50 sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#00d2ff] to-purple-500 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-black text-white tracking-tight">StrataG2ndGen</h1>
                <p className="text-[10px] text-slate-400 leading-none">AI Emergency Dispatch</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <button
                  key={item.view}
                  onClick={() => onViewChange(item.view)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition ${activeView === item.view ? 'bg-[#00d2ff]/10 text-[#00d2ff]' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={onToggleAutonomous} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${autonomousMode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
              <Zap className="h-3 w-3" /> {autonomousMode ? 'Auto' : 'Manual'}
            </button>
            <button onClick={onToggleMute} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition">
              {audioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button onClick={onOpenVonageModal} className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition">
              <Bell className="h-4 w-4" />
              {unreadLogsCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
            </button>
            <button onClick={onOpenNewIncidentModal} className="btn-primary text-xs flex items-center gap-1">
              <Plus className="h-3 w-3" /> New Incident
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
