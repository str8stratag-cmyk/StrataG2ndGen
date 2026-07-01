import { useState, useEffect, useCallback } from 'react';
import { Driver, Incident, RadioCall, VonageConfig, RangecastConfig, DashboardStats } from './types/dispatch';
import { Navbar, ViewState } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { LiveTranscriptionFeed } from './components/LiveTranscriptionFeed';
import { ActiveIncidentsBoard } from './components/ActiveIncidentsBoard';
import { FleetManager } from './components/FleetManager';
import { IncidentMap } from './components/IncidentMap';
import { DriverPortal } from './components/DriverPortal';
import { AdminConsole } from './components/AdminConsole';
import { VonageSandboxModal } from './components/VonageSandboxModal';
import { SettingsModal } from './components/SettingsModal';
import { QuickIncidentModal } from './components/QuickIncidentModal';
import { connectSocket, joinDispatchersRoom, onRadioCallReceived, onIncidentCreated, onIncidentDispatched, onDriverStatusChanged, onSignal4Detected } from './services/socket';
import { getDrivers, getIncidents, getRadioCalls, getDashboardStats, updateIncidentStatus, updateDriverStatus, dispatchIncident, createIncident } from './services/api';
import { AlertTriangle, Truck, Bell } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState<ViewState>('DASHBOARD');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [radioCalls, setRadioCalls] = useState<RadioCall[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [vonageLogs, setVonageLogs] = useState<any[]>([]);
  const [unreadLogsCount, setUnreadLogsCount] = useState(0);
  const [autonomousMode, setAutonomousMode] = useState(true);
  const [audioMuted, setAudioMuted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeToast, setActiveToast] = useState<{ id: string; title: string; message: string; type: 'signal4' | 'dispatch' | 'info' } | null>(null);
  const [isTwilioModalOpen, setIsTwilioModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isNewIncidentModalOpen, setIsNewIncidentModalOpen] = useState(false);

  const [vonageConfig, setVonageConfig] = useState<VonageConfig>({
    apiKey: '', apiSecret: '', fromNumber: '14157386102', fromWhatsApp: '14157386102', channel: 'sms', mode: 'LIVE_API'
  });
  const [rangecastConfig, setRangecastConfig] = useState<RangecastConfig>({
    feedUrl: 'https://audio.rangecast.com/hillsborough', feedName: 'Hillsborough County', mode: 'SIMULATED_AI_SYNTH', activeFilter: 'ONLY_SIGNAL_4', autoDispatchEnabled: true, autoDispatchRadiusMiles: 15
  });

  const triggerToast = useCallback((title: string, message: string, type: 'signal4' | 'dispatch' | 'info') => {
    setActiveToast({ id: `toast-${Date.now()}`, title, message, type });
    setTimeout(() => setActiveToast(null), 5000);
  }, []);

  // Initial data load
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [driversRes, incidentsRes, radioRes, statsRes] = await Promise.all([
          getDrivers(), getIncidents(), getRadioCalls({ limit: 50 }), getDashboardStats()
        ]);
        setDrivers(driversRes.data.drivers || []);
        setIncidents(incidentsRes.data.incidents || []);
        setRadioCalls(radioRes.data.radio_calls || []);
        setStats(statsRes.data);
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'Failed to load data');
        triggerToast('Connection Error', 'Could not connect to backend. Make sure the server is running.', 'info');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Socket.io real-time
  useEffect(() => {
    const socket = connectSocket();
    joinDispatchersRoom();

    const unsubRadio = onRadioCallReceived((call) => {
      setRadioCalls(prev => [call, ...prev].slice(0, 100));
    });

    const unsubSignal4 = onSignal4Detected((call) => {
      triggerToast('🚨 Signal 4 Detected', call.transcript, 'signal4');
      if (!audioMuted) {
        try {
          const u = new SpeechSynthesisUtterance(`Signal 4 alert. ${call.transcript}`);
          u.rate = 1.05; u.pitch = 0.95;
          window.speechSynthesis.speak(u);
        } catch { /* ignore */ }
      }
    });

    const unsubIncident = onIncidentCreated((inc) => {
      setIncidents(prev => [inc, ...prev]);
    });

    const unsubDispatched = onIncidentDispatched((inc) => {
      setIncidents(prev => prev.map(i => i.id === inc.id ? inc : i));
    });

    const unsubDriver = onDriverStatusChanged((drv) => {
      setDrivers(prev => prev.map(d => d.id === drv.id ? drv : d));
    });

    return () => {
      unsubRadio(); unsubSignal4(); unsubIncident(); unsubDispatched(); unsubDriver();
    };
  }, [audioMuted, triggerToast]);

  const handleExecuteDispatch = useCallback(async (incident: Partial<Incident>) => {
    try {
      const res = await createIncident(incident);
      const newIncident = res.data.incident;
      setIncidents(prev => [newIncident, ...prev]);
      if (autonomousMode && newIncident.status === 'UNASSIGNED') {
        await assignClosestDriver(newIncident.id);
      }
      triggerToast('Incident Created', `Case ${newIncident.case_number} logged.`, 'dispatch');
    } catch (err: any) {
      triggerToast('Error', err.response?.data?.error || 'Failed to create incident', 'info');
    }
  }, [autonomousMode, triggerToast]);

  const assignClosestDriver = async (incidentId: string) => {
    try {
      const available = drivers.filter(d => d.status === 'AVAILABLE');
      if (available.length === 0) return;
      const inc = incidents.find(i => i.id === incidentId);
      if (!inc) return;

      let best = available[0];
      let minDist = 9999;
      available.forEach(d => {
        const dist = Math.sqrt(Math.pow(d.current_location_lat - inc.location_lat, 2) + Math.pow(d.current_location_lng - inc.location_lng, 2)) * 69;
        if (dist < minDist) { minDist = dist; best = d; }
      });

      await dispatchIncident(incidentId, best.id);
    } catch (err) { console.error('Auto-dispatch failed', err); }
  };

  const handleUpdateIncidentStatus = async (id: string, status: Incident['status']) => {
    try {
      await updateIncidentStatus(id, status);
      setIncidents(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    } catch (err) { triggerToast('Error', 'Failed to update incident', 'info'); }
  };

  const handleUpdateDriverStatus = async (id: string, status: Driver['status'], incidentId?: string) => {
    try {
      await updateDriverStatus(id, { status, active_incident_id: incidentId || null });
      setDrivers(prev => prev.map(d => d.id === id ? { ...d, status, active_incident_id: incidentId || null } : d));
    } catch (err) { triggerToast('Error', 'Failed to update driver', 'info'); }
  };

  const handleAssignDriver = async (incidentId: string, driverId: string) => {
    try {
      await dispatchIncident(incidentId, driverId);
      triggerToast('Dispatched', 'Driver assigned to incident.', 'dispatch');
    } catch (err) { triggerToast('Error', 'Failed to dispatch', 'info'); }
  };

  const handleNewIncomingCall = useCallback((call: RadioCall) => {
    setRadioCalls(prev => [call, ...prev].slice(0, 100));
    if (call.is_signal4) {
      triggerToast('🚨 Signal 4 Alert', call.transcript, 'signal4');
    }
  }, [triggerToast]);

  if (loading) return (
    <div className="min-h-screen bg-[#0b1120] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#00d2ff] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-400">Loading StrataG2ndGen Dispatch...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#0b1120] flex items-center justify-center p-4">
      <div className="glass-panel p-8 max-w-md text-center">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Backend Connection Failed</h2>
        <p className="text-slate-400 mb-4">{error}</p>
        <p className="text-sm text-slate-500">Make sure the backend server is running on port 3000.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b1120] flex flex-col font-sans text-slate-100">
      <Navbar activeView={activeView} onViewChange={setActiveView} unreadLogsCount={unreadLogsCount} autonomousMode={autonomousMode} onToggleAutonomous={() => setAutonomousMode(!autonomousMode)} onOpenVonageModal={() => { setIsTwilioModalOpen(true); setUnreadLogsCount(0); }} onOpenSettingsModal={() => setIsSettingsModalOpen(true)} onOpenNewIncidentModal={() => setIsNewIncidentModalOpen(true)} audioMuted={audioMuted} onToggleMute={() => setAudioMuted(!audioMuted)} activeIncidentsCount={incidents.filter(i => i.status !== 'CLEARED').length} />

      <main className="flex-1 w-full max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
        {activeToast && (
          <div className={`mb-6 p-4 rounded-3xl border flex items-start justify-between shadow-2xl animate-slideDown z-50 backdrop-blur-xl ${activeToast.type === 'signal4' ? 'bg-red-500/10 border-red-500/50' : activeToast.type === 'dispatch' ? 'bg-[#00d2ff]/10 border-[#00d2ff]/50' : 'bg-slate-800/80 border-slate-600/50'}`}>
            <div className="flex items-start space-x-4">
              <div className={`mt-0.5 p-3 rounded-full flex-shrink-0 ${activeToast.type === 'signal4' ? 'bg-red-500' : activeToast.type === 'dispatch' ? 'bg-[#00d2ff]' : 'bg-amber-500'}`}>
                {activeToast.type === 'signal4' ? <AlertTriangle className="h-6 w-6 text-white animate-bounce" /> : activeToast.type === 'dispatch' ? <Truck className="h-6 w-6 text-slate-900 animate-pulse" /> : <Bell className="h-6 w-6 text-slate-900" />}
              </div>
              <div>
                <h4 className="text-base font-bold text-white">{activeToast.title}</h4>
                <p className="text-sm text-slate-300 mt-1 leading-relaxed max-w-4xl">{activeToast.message}</p>
              </div>
            </div>
            <button onClick={() => setActiveToast(null)} className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/20 hover:bg-black/40 text-slate-300 hover:text-white transition">✕</button>
          </div>
        )}

        {activeView === 'DASHBOARD' && (
          <section className="space-y-6 animate-fadeIn">
            <div className="max-w-5xl">
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#00d2ff] font-bold mb-2">Admin / Shift Lead</p>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Operations overview</h2>
            </div>
            <DashboardOverview stats={stats} calls={radioCalls} incidents={incidents} drivers={drivers} autonomousMode={autonomousMode} />
          </section>
        )}

        {activeView === 'MAP_FLEET' && (
          <section className="space-y-6 animate-fadeIn">
            <div className="max-w-5xl">
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#00d2ff] font-bold mb-2">Field coordination</p>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Drivers, status & field map</h2>
            </div>
            <div className="mx-auto w-full max-w-[1320px] space-y-6">
              <FleetManager drivers={drivers} onUpdateDriver={async (drv) => {
                await handleUpdateDriverStatus(drv.id, drv.status as Driver['status'], drv.active_incident_id || undefined);
              }} />
              <IncidentMap drivers={drivers} incidents={incidents} />
            </div>
          </section>
        )}

        {activeView === 'FEEDS_DISPATCH' && (
          <section className="space-y-6 animate-fadeIn">
            <div className="max-w-5xl">
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#00d2ff] font-bold mb-2">Dispatch operations</p>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Feeds, transcripts & dispatch</h2>
            </div>
            <div className="mx-auto w-full max-w-[1360px] space-y-6">
              <LiveTranscriptionFeed calls={radioCalls} incidents={incidents} onDispatchIncident={(call) => {
                if (call.extractedLocation) {
                  handleExecuteDispatch({ location_address: call.extractedLocation.address, location_lat: call.extractedLocation.lat, location_lng: call.extractedLocation.lng, signal_code: 'Signal 4', description: call.transcript, severity: 'CRITICAL', raw_transcript_id: call.id });
                }
              }} autonomousMode={autonomousMode} />
              <ActiveIncidentsBoard incidents={incidents} drivers={drivers} onAssignDriver={handleAssignDriver} onUpdateStatus={handleUpdateIncidentStatus} />
            </div>
          </section>
        )}

        {activeView === 'ADMIN' && (
          <section className="space-y-6 animate-fadeIn">
            <div className="max-w-5xl">
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#00d2ff] font-bold mb-2">Administration</p>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Admin tools, exports & KPIs</h2>
            </div>
            <AdminConsole twilioLogs={vonageLogs} calls={radioCalls} incidents={incidents} drivers={drivers} />
          </section>
        )}

        {activeView === 'DRIVER_PORTAL' && (
          <section className="space-y-6 animate-fadeIn">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-400 font-bold mb-2">Driver experience</p>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Driver dispatch terminal</h2>
            </div>
            <DriverPortal drivers={drivers} incidents={incidents} onUpdateDriverStatus={handleUpdateDriverStatus} onUpdateIncidentStatus={handleUpdateIncidentStatus} />
          </section>
        )}
      </main>

      <VonageSandboxModal isOpen={isTwilioModalOpen} onClose={() => setIsTwilioModalOpen(false)} config={vonageConfig} onUpdateConfig={setVonageConfig} logs={vonageLogs} onClearLogs={() => setVonageLogs([])} drivers={drivers} />
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} config={rangecastConfig} onUpdateConfig={setRangecastConfig} />
      <QuickIncidentModal isOpen={isNewIncidentModalOpen} onClose={() => setIsNewIncidentModalOpen(false)} onCreateIncident={handleExecuteDispatch} />
    </div>
  );
}
