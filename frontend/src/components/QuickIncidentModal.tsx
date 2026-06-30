import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface QuickIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateIncident: (data: any) => void;
}

export const QuickIncidentModal: React.FC<QuickIncidentModalProps> = ({ isOpen, onClose, onCreateIncident }) => {
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('MAJOR');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onCreateIncident({
      location_address: address,
      location_lat: 27.9506 + (Math.random() - 0.5) * 0.1,
      location_lng: -82.4572 + (Math.random() - 0.5) * 0.1,
      signal_code: 'Signal 4',
      description,
      severity,
      vehicles_involved: 2,
      injuries_reported: severity === 'CRITICAL',
      hazmat_or_blocking: false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-400" /> New Incident</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-4 space-y-4">
          <input className="input-field w-full" placeholder="Location Address" value={address} onChange={e => setAddress(e.target.value)} />
          <textarea className="input-field w-full h-20 resize-none" placeholder="Description..." value={description} onChange={e => setDescription(e.target.value)} />
          <select className="input-field w-full" value={severity} onChange={e => setSeverity(e.target.value)}>
            <option value="CRITICAL">Critical</option>
            <option value="MAJOR">Major</option>
            <option value="MODERATE">Moderate</option>
            <option value="MINOR">Minor</option>
          </select>
          <button onClick={handleSubmit} className="btn-danger w-full">Create Incident</button>
        </div>
      </div>
    </div>
  );
};
