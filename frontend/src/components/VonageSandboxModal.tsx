import React, { useState } from 'react';
import { Phone, MessageSquare, Send, X } from 'lucide-react';
import { Driver } from '../types/dispatch';

interface VonageSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: any;
  onUpdateConfig: (cfg: any) => void;
  logs: any[];
  onClearLogs: () => void;
  drivers: Driver[];
}

export const VonageSandboxModal: React.FC<VonageSandboxModalProps> = ({ isOpen, onClose, drivers }) => {
  const [tab, setTab] = useState<'SMS' | 'WHATSAPP' | 'LOGS'>('SMS');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!selectedDriver || !message) return;
    setSending(true);
    // API call would go here
    setTimeout(() => { setSending(false); setMessage(''); }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <h2 className="text-lg font-bold text-white">Vonage Communications</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex border-b border-slate-700/50">
          {(['SMS', 'WHATSAPP', 'LOGS'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 text-xs font-bold transition ${tab === t ? 'text-[#00d2ff] border-b-2 border-[#00d2ff]' : 'text-slate-400 hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          {tab !== 'LOGS' && (
            <div className="space-y-3">
              <select className="input-field w-full" value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)}>
                <option value="">Select Driver</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.callsign} - {d.name} ({d.phone})</option>)}
              </select>
              <textarea className="input-field w-full h-24 resize-none" placeholder="Message..." value={message} onChange={e => setMessage(e.target.value)} />
              <button onClick={handleSend} disabled={sending} className="btn-primary w-full flex items-center justify-center gap-2">
                <Send className="h-4 w-4" /> {sending ? 'Sending...' : 'Send ' + tab}
              </button>
            </div>
          )}
          {tab === 'LOGS' && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">Message history will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
