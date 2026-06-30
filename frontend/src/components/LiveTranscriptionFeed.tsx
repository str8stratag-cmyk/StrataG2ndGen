import React, { useState } from 'react';
import { Radio, CheckCircle2, AlertTriangle } from 'lucide-react';
import { RadioCall, Incident } from '../types/dispatch';

interface LiveTranscriptionFeedProps {
  calls: RadioCall[];
  incidents: Incident[];
  onDispatchIncident: (call: RadioCall) => void;
  autonomousMode: boolean;
}

export const LiveTranscriptionFeed: React.FC<LiveTranscriptionFeedProps> = ({ calls, incidents, onDispatchIncident }) => {
  const signal4Calls = calls.filter(c => c.is_signal4);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="glass-panel-dark flex flex-col h-[500px] shadow-xl overflow-hidden">
        <div className="bg-[#172236]/90 px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white tracking-tight">Rangecast Intake</h3>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-300">{calls.length} events</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs">
          {calls.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
              <Radio className="h-8 w-8 animate-bounce opacity-40" />
              <p>Waiting for live radio scanner bursts...</p>
            </div>
          ) : (
            calls.map((call) => (
              <div key={call.id} className={`p-4 rounded-2xl border transition-all duration-300 ${call.is_signal4 ? 'bg-red-500/10 border-red-500/40' : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-600 text-slate-300'}`}>
                <div className="flex items-center justify-between text-xs mb-2 text-slate-400">
                  <span className="font-bold text-slate-200">{call.agency}</span>
                  <span>{new Date(call.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="leading-relaxed text-white font-sans text-sm mb-3">{call.transcript}</p>
                <div className="flex flex-wrap gap-2">
                  {call.detected_keywords?.map((kw, i) => (
                    <span key={i} className={`px-3 py-1 rounded-full text-[10px] font-bold ${call.is_signal4 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>{kw}</span>
                  )) || call.ai_analysis?.keywords?.map((kw: string, i: number) => (
                    <span key={i} className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">{kw}</span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="glass-panel-dark flex flex-col h-[500px] shadow-xl overflow-hidden relative">
        <div className="bg-[#172236]/90 px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Filtered Accident Calls</h3>
            <p className="text-xs text-slate-400 mt-0.5">Only Signal 4, 10-50, crash, MVA traffic promoted.</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs">
          {signal4Calls.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 p-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500/60 animate-pulse" />
              <p className="font-sans text-sm text-slate-300 font-semibold">No Auto Accidents in Radio Feed</p>
              <p className="font-sans text-xs text-slate-500 max-w-sm">When Signal 4 or 10-50 is detected, it appears here for dispatch.</p>
            </div>
          ) : (
            signal4Calls.map((call) => {
              const existingIncident = incidents.find(i => i.raw_transcript_id === call.id);
              return (
                <div key={call.id} className="bg-slate-900/40 rounded-3xl border border-[#00d2ff]/40 p-5 shadow-lg flex flex-col justify-between transition group relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-xs font-mono">{new Date(call.timestamp).toLocaleTimeString()}</span>
                    <span className="px-3 py-1 rounded-full bg-red-400/20 text-red-400 border border-red-400/30 text-[10px] font-bold">PENDING</span>
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">{call.ai_analysis?.location || 'City Intersections, Tampa'}</h4>
                  <p className="text-sm text-slate-300 mb-4 leading-relaxed line-clamp-3">{call.transcript}</p>
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-white">Auto Accident</span>
                      <span className="px-3 py-1 rounded-full bg-red-800/30 border border-red-700/30 text-[10px] font-bold text-red-400">{call.ai_analysis?.severity || 'CRITICAL'}</span>
                    </div>
                    {!existingIncident && (
                      <button onClick={() => onDispatchIncident(call)} className="px-4 py-1.5 bg-[#00d2ff] hover:bg-[#00b8e6] text-slate-900 text-xs font-bold rounded-full shadow-lg transition">
                        Dispatch
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
