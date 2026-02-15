'use client';

import React, { useState, useEffect } from 'react';
import { 
  Droplet, 
  Activity, 
  Zap, 
  BarChart3,
  Waves,
  RefreshCw,
  Server
} from 'lucide-react';

const App = () => {
  // Real-time state simulation for "Live" feel
  const [codValue, setCodValue] = useState(418);
  const [absValue, setAbsValue] = useState(0.814);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCodValue(prev => +(prev + (Math.random() * 4 - 2)).toFixed(1));
      setAbsValue(prev => +(prev + (Math.random() * 0.02 - 0.01)).toFixed(3));
      setLastUpdate(new Date());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: 'Current COD', value: `${codValue} mg/L`, status: 'Normal', color: 'text-emerald-400' },
    { label: 'UV-254 Absorbance', value: absValue.toString(), status: 'Optimal', color: 'text-blue-400' },
    { label: 'Membrane Health', value: '98.4%', status: 'Safe', color: 'text-emerald-400' },
    { label: 'Predicted Shock', value: 'None', status: 'Clear', color: 'text-emerald-400' },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-lime-500/30">
      {/* Top Navigation */}
      <nav className="border-b border-white/5 bg-slate-900/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-lime-400 rounded-xl flex items-center justify-center text-slate-950 shadow-[0_0_20px_rgba(163,230,31,0.3)]">
              <Activity size={22} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tighter text-white">
              HYDRA<span className="text-lime-400">MIND</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <div className="flex items-center gap-2 text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
              <Server size={14} />
              <span>Node: NITK-STP-01</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-[11px] font-bold uppercase tracking-wider">Telemetry Active</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Industrial Header */}
        <header className="mb-8 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-lime-500/10 to-transparent rounded-3xl blur-2xl opacity-50" />
          <div className="relative bg-slate-900/40 border border-white/5 p-8 rounded-3xl backdrop-blur-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Industrial Effluent Monitor</h1>
                <p className="text-slate-400 max-w-xl text-sm leading-relaxed">
                  Edge-AI enabled spectroscopy system protecting downstream RO membranes at 
                  <span className="text-slate-200 font-semibold"> MCF Paradeep Phosphates</span>.
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Last Sample Sync</span>
                <span className="text-sm font-mono text-lime-400/80">{lastUpdate.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl hover:bg-white/[0.04] transition-all group">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">{stat.label}</p>
              <div className="flex items-end justify-between">
                <h2 className="text-2xl font-bold text-white tabular-nums tracking-tight">{stat.value}</h2>
                <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${stat.color} bg-current/10`}>
                  {stat.status}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Forecast Graph Area */}
          <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 p-8 rounded-3xl">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BarChart3 size={20} className="text-lime-400" />
                  Predictive Load Analysis
                </h3>
                <p className="text-xs text-slate-500 mt-1">LSTM Neural Network Inference (v2.4)</p>
              </div>
              <div className="flex gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5">
                {['1H', '6H', '24H'].map(t => (
                  <button key={t} className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${t === '1H' ? 'bg-lime-400 text-slate-950 shadow-lg shadow-lime-400/20' : 'text-slate-400 hover:text-white'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-72 flex items-center justify-center relative group">
               {/* Visualizing Signal Fluctuations */}
               <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100">
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#a3e635" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#a3e635" stopOpacity="1" />
                    </linearGradient>
                  </defs>
                  <path 
                    d="M0 70 C 50 70, 70 30, 120 40 S 180 80, 240 60 S 320 20, 400 50" 
                    fill="none" 
                    stroke="url(#lineGradient)" 
                    strokeWidth="3"
                    className="drop-shadow-[0_0_8px_rgba(163,230,31,0.5)]"
                  />
                  <circle cx="400" cy="50" r="4" fill="#a3e635" className="animate-ping" />
               </svg>
               <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] font-mono text-slate-600 pt-4 border-t border-white/5">
                  <span>T - 60m</span>
                  <span>T - 30m</span>
                  <span>CURRENT</span>
               </div>
            </div>
          </div>

          {/* Event Stream */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Zap size={16} className="text-yellow-400" />
                Live Feed
              </h3>
              <RefreshCw size={14} className="text-slate-600 animate-spin-slow" />
            </div>
            <div className="space-y-5">
              {[
                { time: '14:20', type: 'System', msg: 'Auto-Cleaning wiper cycle completed.' },
                { time: '13:45', type: 'Network', msg: 'Uplink established via SIM7600G.' },
                { time: '11:05', type: 'Warning', msg: 'Turbidity compensation active.' },
              ].map((alert, idx) => (
                <div key={idx} className="relative pl-6 border-l border-white/10 group">
                  <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-[#020617] ${alert.type === 'Warning' ? 'bg-yellow-400' : 'bg-lime-400'}`} />
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">{alert.time} — {alert.type}</span>
                  <p className="text-xs text-slate-300 leading-relaxed group-hover:text-white transition-colors">
                    {alert.msg}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Brand Footer */}
        <footer className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 opacity-40">
          <div className="flex items-center gap-6">
             <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Security Protocol</span>
                <span className="text-xs font-bold text-slate-300 italic">Hardware-Signed Data Packets</span>
             </div>
          </div>
          <div className="text-[10px] font-medium tracking-wide">
            HYDRA<span className="text-lime-400">MIND</span> INTELLIGENCE • SURATHKAL, INDIA
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;