import React, { useState } from 'react';
import { X, Settings } from 'lucide-react';
import { RangecastConfig } from '../types/dispatch';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RangecastConfig;
  onUpdateConfig: (cfg: RangecastConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onUpdateConfig }) => {
  const [local, setLocal] = useState(config);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateConfig(local);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Settings className="h-5 w-5" /> Rangecast Settings</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Feed Mode</label>
            <select className="input-field w-full" value={local.mode} onChange={e => setLocal({...local, mode: e.target.value as any})}>
              <option value="SIMULATED_AI_SYNTH">Simulated AI</option>
              <option value="LIVE_EMBED">Live URL</option>
              <option value="BROWSER_MIC">Browser Mic</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Feed URL</label>
            <input className="input-field w-full" value={local.feedUrl} onChange={e => setLocal({...local, feedUrl: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Filter</label>
            <select className="input-field w-full" value={local.activeFilter} onChange={e => setLocal({...local, activeFilter: e.target.value as any})}>
              <option value="ALL">All Calls</option>
              <option value="ONLY_SIGNAL_4">Only Signal 4</option>
              <option value="NO_ROUTINE">No Routine</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={local.autoDispatchEnabled} onChange={e => setLocal({...local, autoDispatchEnabled: e.target.checked})} className="rounded" />
            <label className="text-sm text-slate-300">Auto-dispatch on Signal 4</label>
          </div>
          <button onClick={handleSave} className="btn-primary w-full">Save Settings</button>
        </div>
      </div>
    </div>
  );
};
