"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  Droplets, Activity, Zap, Server, AlertTriangle, CheckCircle, Wind
} from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState<{ time: string; ph: number; cod: number; dosage: number }[]>([]);


  // --- SIMULATION ENGINE (Replaces Python Backend for Demo) ---

  const [metrics, setMetrics] = useState({
    ph: 7.0, cod: 0, phenol: 0, oil: 0, dosage: 0, flow: 0
  });
  const [status, setStatus] = useState("CONNECTING...");
  const [alert, setAlert] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(true); // AI Auto-Pilot toggle

  // FETCH DATA FROM PYTHON BACKEND
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Connect to your local Python Backend
        const res = await axios.get('http://localhost:5000/api/telemetry');
        const d = res.data;

        setMetrics({
          ph: parseFloat(d.sensors.ph.toFixed(1)),
          cod: parseFloat(d.sensors.cod.toFixed(0)),
          phenol: parseFloat(d.sensors.phenol.toFixed(2)), // Vital for MRPL
          oil: parseFloat(d.sensors.oil_grease.toFixed(1)), // Vital for MRPL
          dosage: d.ai_prediction.recommended_dosing_ml_min,
          flow: parseFloat(d.sensors.flow?.toFixed(1) || '0') // Backend uses 'flow' not 'flow_rate'
        });

        // Set alert based on system status - detect CRITICAL scenarios
        const isCritical = d.system_status?.includes('CRITICAL') ||
          d.sensors.cod > 500 ||
          d.sensors.phenol > 5 ||
          d.sensors.oil_grease > 50;
        setAlert(isCritical);

        setStatus(d.system_status);

        // Update Graph Data (Keep last 20 points)
        setData(prev => {
          const newData = [...prev, {
            time: new Date().toLocaleTimeString(),
            ph: d.sensors.ph,
            cod: d.sensors.cod,
            dosage: d.ai_prediction.recommended_dosing_ml_min
          }];
          if (newData.length > 20) newData.shift();
          return newData;
        });

      } catch (error) {
        console.error("Backend Offline - Start app.py!", error);
        setStatus("SCADA LINK OFFLINE");
      }
    };

    fetchData(); // Fetch immediately on mount
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  // FUNCTION TO TRIGGER DEMO SCENARIOS
  const triggerDemo = async (type: 'DESALTER_FAIL' | 'SOUR_WATER_FAIL' | 'RESET') => {
    try {
      await axios.post('http://localhost:5000/api/simulation/trigger', { scenario: type });
      // Force immediate refresh to show changes
      const res = await axios.get('http://localhost:5000/api/telemetry');
      const d = res.data;
      setMetrics({
        ph: parseFloat(d.sensors.ph.toFixed(1)),
        cod: parseFloat(d.sensors.cod.toFixed(0)),
        phenol: parseFloat(d.sensors.phenol.toFixed(2)),
        oil: parseFloat(d.sensors.oil_grease.toFixed(1)),
        dosage: d.ai_prediction.recommended_dosing_ml_min,
        flow: parseFloat(d.sensors.flow?.toFixed(1) || '0')
      });
      const isCritical = d.system_status?.includes('CRITICAL') ||
        d.sensors.cod > 500 ||
        d.sensors.phenol > 5 ||
        d.sensors.oil_grease > 50;
      setAlert(isCritical);
      setStatus(d.system_status);
    } catch (error) {
      console.error("Failed to trigger scenario:", error);
    }
  };
  return (
    <div className="min-h-screen text-cyan-50 font-sans selection:bg-cyan-500/30" style={{ backgroundColor: '#1e1e1e' }}>

      {/* --- TOP BAR --- */}
      <nav className="border-b border-slate-700 backdrop-blur-md sticky top-0 z-50" style={{ backgroundColor: 'rgba(30, 30, 30, 0.9)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Droplets className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wider text-white">HYDRAMIND</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">AI-Driven ETP Controller</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* AI Auto-Pilot / Manual Override Toggle */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-600" style={{ backgroundColor: '#2a2a2a' }}>
              <span className={`text-xs font-bold ${!isAutoMode ? 'text-orange-400' : 'text-slate-500'}`}>MANUAL</span>
              <button
                onClick={() => setIsAutoMode(!isAutoMode)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${isAutoMode ? 'bg-cyan-600' : 'bg-orange-600'}`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${isAutoMode ? 'translate-x-7' : 'translate-x-1'}`}
                />
              </button>
              <span className={`text-xs font-bold ${isAutoMode ? 'text-cyan-400' : 'text-slate-500'}`}>AI AUTO</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 max-w-[200px] truncate ${alert ? 'bg-red-500/10 border-red-500 text-red-400 animate-pulse' : 'bg-green-500/10 border-green-500 text-green-400'}`}>
              {alert ? <AlertTriangle className="w-3 h-3 flex-shrink-0" /> : <CheckCircle className="w-3 h-3 flex-shrink-0" />}
              <span className="truncate">{status === 'NORMAL' ? 'SYSTEM OPTIMAL' : status}</span>
            </div>
            <div className="text-right hidden md:block">
              <div className="text-xs text-slate-400">Plant ID</div>
              <div className="text-sm font-mono text-cyan-200">MRPL-ETP-04</div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* --- LEFT COLUMN: 3D TWIN & METRICS (8 cols) --- */}
        <div className="lg:col-span-8 space-y-6">

          {/* DIGITAL TWIN P&ID SCHEMATIC */}
          <div className="relative h-[400px] rounded-2xl border border-slate-700 overflow-hidden shadow-2xl shadow-cyan-900/10 group" style={{ backgroundColor: '#252525' }}>
            <div className="absolute top-4 left-4 z-10 backdrop-blur px-3 py-1 rounded border border-slate-600 text-xs text-cyan-400" style={{ backgroundColor: 'rgba(30, 30, 30, 0.9)' }}>
              ● LIVE TWIN FEED
            </div>

            {/* ANIMATED SVG DIGITAL TWIN */}
            <DigitalTwinSchematic metrics={metrics} alert={alert} isAutoMode={isAutoMode} />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>

            {/* Floating Status text over 3D model */}
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
              <div>
                <p className="text-slate-400 text-xs mb-1">CONTROL MODE</p>
                <p className="text-xl text-white font-bold flex items-center gap-2">
                  <Zap className={`w-4 h-4 ${isAutoMode ? 'text-cyan-400' : 'text-orange-400'}`} />
                  {isAutoMode ? 'AI-Dynamic Dosing' : 'Manual Override Active'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-xs mb-1">EST. SAVINGS</p>
                <p className="text-2xl text-green-400 font-mono font-bold">-18.5%</p>
              </div>
            </div>
          </div>

          {/* MAIN CHARTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard title="Chemical Oxygen Demand (COD)" color="#22d3ee" data={data} dataKey="cod" unit="mg/L" />
            <ChartCard title="AI Optimized Dosage" color="#34d399" data={data} dataKey="dosage" unit="mL/min" />
          </div>

          {/* SIMULATION CONTROL PANEL */}
          <div className="p-4 rounded-xl border border-slate-600 mt-6" style={{ backgroundColor: '#252525' }}>
            <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase">Simulation Controls (Demo Mode)</h3>
            <div className="flex gap-4">
              <button onClick={() => triggerDemo('DESALTER_FAIL')} className="px-4 py-2 bg-red-900/50 border border-red-500 text-red-200 text-xs rounded hover:bg-red-900">
                TRIGGER: DESALTER UPSET
              </button>
              <button onClick={() => triggerDemo('SOUR_WATER_FAIL')} className="px-4 py-2 bg-yellow-900/50 border border-yellow-500 text-yellow-200 text-xs rounded hover:bg-yellow-900">
                TRIGGER: PHENOL SHOCK
              </button>
              <button onClick={() => triggerDemo('RESET')} className="px-4 py-2 bg-green-900/50 border border-green-500 text-green-200 text-xs rounded hover:bg-green-900">
                SYSTEM RESET
              </button>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: SENSOR ARRAY (4 cols) --- */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Real-Time Sensors</h2>

          <SensorCard
            tagId="TIT-101"
            label="Inlet pH Level"
            value={metrics.ph}
            unit="pH"
            icon={<Droplets className="text-purple-400" />}
            color="purple"
            isAlert={metrics.ph < 6 || metrics.ph > 9}
          />
          <SensorCard
            tagId="FIT-102"
            label="Inlet Flow Rate"
            value={metrics.flow}
            unit="m³/hr"
            icon={<Wind className="text-blue-400" />}
            color="blue"
            isAlert={false}
          />
          <SensorCard
            tagId="AIT-201"
            label="Phenol Level"
            value={metrics.phenol}
            unit="mg/L"
            icon={<AlertTriangle className={metrics.phenol > 5 ? "text-red-400" : "text-cyan-400"} />}
            color={metrics.phenol > 5 ? "red" : "blue"}
            isAlert={metrics.phenol > 5}
          />
          <SensorCard
            tagId="AIT-202"
            label="Oil & Grease"
            value={metrics.oil}
            unit="mg/L"
            icon={<Droplets className={metrics.oil > 50 ? "text-red-400" : "text-amber-400"} />}
            color={metrics.oil > 50 ? "red" : "amber"}
            isAlert={metrics.oil > 50}
          />

          {/* AI INSIGHT BOX */}
          <div className="rounded-2xl p-6 border border-cyan-800/50 mt-4 relative overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #1a3a4a, #252525)' }}>
            <div className="absolute top-0 right-0 p-3 opacity-20">
              <Server className="w-24 h-24 text-cyan-400" />
            </div>
            <h3 className="text-cyan-400 font-bold mb-2 flex items-center gap-2">
              <Server className="w-4 h-4" /> HYDRA-CORE AI
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {status?.includes('DESALTER')
                ? "🚨 DESALTER UPSET: Oil & Grease spike detected! AI has increased coagulant dosage to handle oil carryover."
                : status?.includes('SOUR WATER')
                  ? "🚨 SOUR WATER FAILURE: Toxic phenol levels detected! Bio-reactor nutrients increased 300% for emergency treatment."
                  : alert
                    ? "⚠️ HIGH LOAD DETECTED. System has automatically increased dosage to prevent compliance failure."
                    : "✅ System Stable. Dosing optimized for minimum chemical usage. Predicted effluent COD: < 50 mg/L."}
            </p>
            <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full ${alert ? 'bg-red-500' : 'bg-cyan-500'} animate-pulse`} style={{ width: alert ? '100%' : '66%' }}></div>
            </div>
          </div>
        </div>

      </main>

      {/* === TECH METHODOLOGY SECTION === */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-700">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Technical Methodology</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Industrial-grade sensors deployed at strategic points across the ETP for real-time monitoring and AI-driven optimization.
          </p>
        </div>

        {/* Sensor Table */}
        <div className="rounded-2xl border border-slate-700 overflow-hidden" style={{ backgroundColor: '#252525' }}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: '#1e1e1e' }}>
                <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Tag ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Sensor Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Parameter</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Range</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Make/Model</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              <tr className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-mono text-cyan-300 text-sm">FIT-101</td>
                <td className="px-6 py-4 text-slate-300 text-sm">Electromagnetic Flow Meter</td>
                <td className="px-6 py-4 text-slate-300 text-sm">Flow Rate</td>
                <td className="px-6 py-4 text-slate-400 text-sm">Inlet Header</td>
                <td className="px-6 py-4 text-slate-400 text-sm">0-500 m³/hr</td>
                <td className="px-6 py-4 text-slate-400 text-sm">Endress+Hauser Promag W</td>
              </tr>
              <tr className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-mono text-purple-400 text-sm">TIT-101</td>
                <td className="px-6 py-4 text-slate-300 text-sm">pH/ORP Analyzer</td>
                <td className="px-6 py-4 text-slate-300 text-sm">pH Level</td>
                <td className="px-6 py-4 text-slate-400 text-sm">Equalization Tank</td>
                <td className="px-6 py-4 text-slate-400 text-sm">0-14 pH</td>
                <td className="px-6 py-4 text-slate-400 text-sm">Hach SC200 + pHD sensor</td>
              </tr>
              <tr className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-mono text-amber-400 text-sm">AIT-201</td>
                <td className="px-6 py-4 text-slate-300 text-sm">UV-Vis Spectrophotometer</td>
                <td className="px-6 py-4 text-slate-300 text-sm">COD (Continuous)</td>
                <td className="px-6 py-4 text-slate-400 text-sm">Aeration Basin Inlet</td>
                <td className="px-6 py-4 text-slate-400 text-sm">0-2000 mg/L</td>
                <td className="px-6 py-4 text-slate-400 text-sm">Hach UVAS Plus SC</td>
              </tr>
              <tr className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-mono text-red-400 text-sm">AIT-202</td>
                <td className="px-6 py-4 text-slate-300 text-sm">Oil-in-Water Analyzer</td>
                <td className="px-6 py-4 text-slate-300 text-sm">Oil & Grease</td>
                <td className="px-6 py-4 text-slate-400 text-sm">API Separator Outlet</td>
                <td className="px-6 py-4 text-slate-400 text-sm">0-500 ppm</td>
                <td className="px-6 py-4 text-slate-400 text-sm">Turner TD-4100XDC</td>
              </tr>
              <tr className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-mono text-pink-400 text-sm">AIT-203</td>
                <td className="px-6 py-4 text-slate-300 text-sm">Phenol Analyzer</td>
                <td className="px-6 py-4 text-slate-300 text-sm">Phenol</td>
                <td className="px-6 py-4 text-slate-400 text-sm">Sour Water Collector</td>
                <td className="px-6 py-4 text-slate-400 text-sm">0-50 mg/L</td>
                <td className="px-6 py-4 text-slate-400 text-sm">AppliTek EnviroLyzer</td>
              </tr>
              <tr className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-mono text-green-400 text-sm">AIT-301</td>
                <td className="px-6 py-4 text-slate-300 text-sm">Turbidity Sensor</td>
                <td className="px-6 py-4 text-slate-300 text-sm">TSS / Turbidity</td>
                <td className="px-6 py-4 text-slate-400 text-sm">Clarifier Outlet</td>
                <td className="px-6 py-4 text-slate-400 text-sm">0-1000 NTU</td>
                <td className="px-6 py-4 text-slate-400 text-sm">Hach TSS SC</td>
              </tr>
              <tr className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-mono text-blue-400 text-sm">DIT-401</td>
                <td className="px-6 py-4 text-slate-300 text-sm">Dissolved Oxygen Probe</td>
                <td className="px-6 py-4 text-slate-300 text-sm">DO Level</td>
                <td className="px-6 py-4 text-slate-400 text-sm">Aeration Basin</td>
                <td className="px-6 py-4 text-slate-400 text-sm">0-20 mg/L</td>
                <td className="px-6 py-4 text-slate-400 text-sm">Hach LDO2</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Sensor Placement Diagram */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl border border-slate-700" style={{ backgroundColor: '#252525' }}>
            <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
              <Activity className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Inlet Monitoring</h3>
            <p className="text-slate-400 text-sm mb-4">Real-time tracking of influent quality to detect shock loads before they impact treatment.</p>
            <ul className="text-sm text-slate-300 space-y-2">
              <li className="flex items-center gap-2"><span className="font-mono text-cyan-400 text-xs">FIT-101</span> Flow Rate</li>
              <li className="flex items-center gap-2"><span className="font-mono text-purple-400 text-xs">TIT-101</span> pH Level</li>
              <li className="flex items-center gap-2"><span className="font-mono text-red-400 text-xs">AIT-202</span> Oil & Grease</li>
            </ul>
          </div>

          <div className="p-6 rounded-xl border border-slate-700" style={{ backgroundColor: '#252525' }}>
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Treatment Zone</h3>
            <p className="text-slate-400 text-sm mb-4">Continuous biological process monitoring for optimal aeration and nutrient dosing.</p>
            <ul className="text-sm text-slate-300 space-y-2">
              <li className="flex items-center gap-2"><span className="font-mono text-amber-400 text-xs">AIT-201</span> COD Load</li>
              <li className="flex items-center gap-2"><span className="font-mono text-pink-400 text-xs">AIT-203</span> Phenol Level</li>
              <li className="flex items-center gap-2"><span className="font-mono text-blue-400 text-xs">DIT-401</span> Dissolved O₂</li>
            </ul>
          </div>

          <div className="p-6 rounded-xl border border-slate-700" style={{ backgroundColor: '#252525' }}>
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Effluent Quality</h3>
            <p className="text-slate-400 text-sm mb-4">Compliance verification before discharge to ensure regulatory standards are met.</p>
            <ul className="text-sm text-slate-300 space-y-2">
              <li className="flex items-center gap-2"><span className="font-mono text-green-400 text-xs">AIT-301</span> TSS/Turbidity</li>
              <li className="flex items-center gap-2"><span className="font-mono text-cyan-400 text-xs">AIT-302</span> Final COD</li>
              <li className="flex items-center gap-2"><span className="font-mono text-amber-400 text-xs">TIT-301</span> Final pH</li>
            </ul>
          </div>
        </div>
      </section>

      {/* === PRICING SECTION === */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-700">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Pricing Plans</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Flexible deployment options tailored to your plant capacity and monitoring requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Starter Plan */}
          <div className="rounded-2xl border border-slate-700 p-8 relative" style={{ backgroundColor: '#252525' }}>
            <div className="absolute -top-3 left-6 px-3 py-1 bg-green-500 text-xs font-bold text-black rounded-full">
              SME FRIENDLY
            </div>
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Starter</div>
            <div className="text-4xl font-bold text-white mb-1">₹2.5L</div>
            <div className="text-slate-500 text-sm mb-6">One-time setup + ₹4K/month</div>
            <p className="text-slate-400 text-sm mb-6">Perfect for small ETPs up to 50 m³/day capacity.</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                4 Core Sensors (pH, Flow, COD, TSS)
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                Basic AI Dosing Recommendations
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                Dashboard Access (2 Users)
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                Email Alerts
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-500">
                <AlertTriangle className="w-4 h-4 text-slate-600 flex-shrink-0" />
                <span className="line-through">Predictive Maintenance</span>
              </li>
            </ul>
            <button className="w-full py-3 rounded-lg border border-slate-600 text-slate-300 font-bold hover:bg-slate-700 transition-colors">
              Get Quote
            </button>
          </div>

          {/* Professional Plan */}
          <div className="rounded-2xl border-2 border-cyan-500 p-8 relative" style={{ backgroundColor: '#1a3a4a' }}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-cyan-500 text-xs font-bold text-black rounded-full">
              BEST VALUE
            </div>
            <div className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-2">Professional</div>
            <div className="text-4xl font-bold text-white mb-1">₹5.5L</div>
            <div className="text-slate-400 text-sm mb-6">One-time setup + ₹5K/month</div>
            <p className="text-slate-300 text-sm mb-6">For medium ETPs (50-200 m³/day) with industry-specific needs.</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm text-slate-200">
                <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                7 Sensors (+ Oil, Phenol, DO)
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-200">
                <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                Advanced AI with Auto-Dosing
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-200">
                <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                Digital Twin Visualization
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-200">
                <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                Dashboard Access (10 Users)
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-200">
                <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                SMS + WhatsApp Alerts
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-200">
                <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                Monthly Performance Reports
              </li>
            </ul>
            <button className="w-full py-3 rounded-lg bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition-colors">
              Contact Sales
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="rounded-2xl border border-slate-700 p-8 relative" style={{ backgroundColor: '#252525' }}>
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Enterprise</div>
            <div className="text-4xl font-bold text-white mb-1">₹12L+</div>
            <div className="text-slate-500 text-sm mb-6">Custom pricing based on requirements</div>
            <p className="text-slate-400 text-sm mb-6">For large plants (200+ m³/day) with multi-unit monitoring.</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                Unlimited Sensors & Parameters
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                Multi-Plant Dashboard
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                SCADA/DCS Integration
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                Predictive Maintenance AI
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                On-Site Support Team
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                Regulatory Compliance Reports
              </li>
            </ul>
            <button className="w-full py-3 rounded-lg border border-slate-600 text-slate-300 font-bold hover:bg-slate-700 transition-colors">
              Schedule Demo
            </button>
          </div>
        </div>

        {/* ROI Calculator Teaser */}
        <div className="mt-12 p-8 rounded-2xl border border-cyan-800/50 text-center" style={{ background: 'linear-gradient(to right, #1a3a4a, #252525)' }}>
          <h3 className="text-xl font-bold text-white mb-2">Typical ROI: 12-18 Months</h3>
          <p className="text-slate-400 max-w-xl mx-auto mb-4">
            Clients report 15-25% reduction in chemical costs and 40% fewer compliance incidents after HydraMind deployment.
          </p>
          <div className="flex justify-center gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-green-400">-18%</div>
              <div className="text-xs text-slate-500 uppercase">Chemical Savings</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cyan-400">99.2%</div>
              <div className="text-xs text-slate-500 uppercase">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400">0</div>
              <div className="text-xs text-slate-500 uppercase">Compliance Failures</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-8 text-center">
        <p className="text-slate-500 text-sm">© 2024 HydraMind Technologies. AI-Powered ETP Solutions for Refineries.</p>
      </footer>

    </div>
  );
}

// --- SUB-COMPONENTS ---

function SensorCard({ tagId, label, value, unit, icon, color, isAlert = false }: {
  tagId: string;
  label: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  color: 'purple' | 'blue' | 'amber' | 'red';
  isAlert?: boolean;
}) {
  const colors = {
    purple: "border-purple-500/30",
    blue: "border-blue-500/30",
    amber: "border-amber-500/30",
    red: "border-red-500/50",
  };

  return (
    <div className={`p-4 rounded-xl border ${isAlert ? 'border-red-500 animate-pulse' : colors[color]} flex items-center justify-between transition-all hover:scale-[1.02]`} style={{ backgroundColor: isAlert ? '#3a1a1a' : '#252525' }}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg border ${isAlert ? 'border-red-700 bg-red-950' : 'border-slate-700'}`} style={{ backgroundColor: isAlert ? undefined : '#1e1e1e' }}>
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${isAlert ? 'bg-red-900 text-red-300 border-red-700' : 'bg-slate-700 text-cyan-300 border-slate-600'}`}>{tagId}</span>
            {isAlert && <span className="text-[10px] font-bold text-red-400 animate-pulse">⚠ CRITICAL</span>}
          </div>
          <p className="text-xs text-slate-400 font-bold uppercase">{label}</p>
          <p className={`text-2xl font-mono font-bold ${isAlert ? 'text-red-400' : 'text-white'}`}>{value} <span className="text-xs text-slate-500 font-sans">{unit}</span></p>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, color, data, dataKey, unit }: {
  title: string;
  color: string;
  data: { time: string; ph: number; cod: number; dosage: number }[];
  dataKey: 'ph' | 'cod' | 'dosage';
  unit: string;
}) {
  return (
    <div className="p-5 rounded-2xl border border-slate-700 shadow-lg" style={{ backgroundColor: '#252525' }}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase">{title}</h3>
        <span className="text-[10px] px-2 py-1 bg-slate-800 rounded text-slate-400">LAST 30s</span>
      </div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
              itemStyle={{ color: color }}
            />
            <Area type="monotone" dataKey={dataKey} stroke={color} fillOpacity={1} fill={`url(#color${dataKey})`} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- DIGITAL TWIN P&ID SCHEMATIC ---
function DigitalTwinSchematic({ metrics, alert, isAutoMode }: {
  metrics: { ph: number; cod: number; phenol: number; oil: number; dosage: number; flow: number };
  alert: boolean;
  isAutoMode: boolean;
}) {
  return (
    <div className="w-full h-full relative">
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes flowRight {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes flowDown {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes bubble1 {
          0%, 100% { transform: translateY(0); opacity: 0.6; }
          50% { transform: translateY(-8px); opacity: 1; }
        }
        @keyframes bubble2 {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-12px); opacity: 0.8; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .flow-pipe {
          stroke-dasharray: 8 4;
          animation: flowRight 0.8s linear infinite;
        }
        .flow-pipe-down {
          stroke-dasharray: 8 4;
          animation: flowDown 0.8s linear infinite;
        }
        .tank-water {
          animation: pulse 3s ease-in-out infinite;
        }
        .bubble {
          animation: bubble1 2s ease-in-out infinite;
        }
        .bubble-alt {
          animation: bubble2 2.5s ease-in-out infinite 0.5s;
        }
      `}</style>

      <svg viewBox="0 0 800 350" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Background Grid */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#333" strokeWidth="0.5" opacity="0.3" />
          </pattern>
          <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="alertWater" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="cleanWater" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <rect width="800" height="350" fill="url(#grid)" />

        {/* === INLET SECTION === */}
        <g transform="translate(30, 120)">
          {/* Inlet Pipe */}
          <rect x="0" y="40" width="60" height="20" fill="#374151" stroke="#4b5563" strokeWidth="2" rx="2" />
          <line x1="0" y1="50" x2="60" y2="50" className="flow-pipe" stroke={alert ? "#f97316" : "#0ea5e9"} strokeWidth="4" />

          {/* Pump Symbol */}
          <circle cx="80" cy="50" r="20" fill="#1f2937" stroke="#6b7280" strokeWidth="2" />
          <path d="M70 50 L90 50 M80 40 L80 60" stroke="#22d3ee" strokeWidth="2" />
          <text x="80" y="85" textAnchor="middle" fill="#9ca3af" fontSize="10" fontFamily="monospace">P-101</text>

          {/* Sensor Tag */}
          <rect x="5" y="5" width="50" height="20" fill="#1e1e1e" stroke="#4b5563" strokeWidth="1" rx="3" />
          <text x="30" y="18" textAnchor="middle" fill="#22d3ee" fontSize="9" fontFamily="monospace">FIT-101</text>
          <text x="30" y="115" textAnchor="middle" fill="#10b981" fontSize="11" fontFamily="monospace">{metrics.flow} m³/hr</text>
        </g>

        {/* === EQUALIZATION TANK === */}
        <g transform="translate(140, 80)">
          <rect x="0" y="0" width="120" height="140" fill="#1f2937" stroke="#4b5563" strokeWidth="2" rx="4" />
          <text x="60" y="-10" textAnchor="middle" fill="#9ca3af" fontSize="11" fontWeight="bold">EQUALIZATION</text>

          {/* Water Level */}
          <rect x="4" y="40" width="112" height="96" fill={alert ? "url(#alertWater)" : "url(#waterGrad)"} className="tank-water" rx="2" />

          {/* Bubbles */}
          <circle cx="30" cy="100" r="4" fill="#0ea5e9" opacity="0.6" className="bubble" />
          <circle cx="60" cy="110" r="3" fill="#0ea5e9" opacity="0.5" className="bubble-alt" />
          <circle cx="90" cy="95" r="5" fill="#0ea5e9" opacity="0.4" className="bubble" />

          {/* pH Sensor */}
          <rect x="35" y="20" width="50" height="18" fill="#1e1e1e" stroke="#a855f7" strokeWidth="1" rx="3" />
          <text x="60" y="32" textAnchor="middle" fill="#a855f7" fontSize="9" fontFamily="monospace">TIT-102</text>
          <text x="60" y="155" textAnchor="middle" fill="#a855f7" fontSize="12" fontFamily="monospace">pH {metrics.ph}</text>
        </g>

        {/* Connecting Pipe 1 */}
        <line x1="260" y1="150" x2="300" y2="150" className="flow-pipe" stroke={alert ? "#f97316" : "#0ea5e9"} strokeWidth="4" />
        <rect x="260" y="142" width="40" height="16" fill="#374151" stroke="#4b5563" strokeWidth="1" />

        {/* === AERATION BASIN === */}
        <g transform="translate(300, 60)">
          <rect x="0" y="0" width="150" height="160" fill="#1f2937" stroke="#4b5563" strokeWidth="2" rx="4" />
          <text x="75" y="-10" textAnchor="middle" fill="#9ca3af" fontSize="11" fontWeight="bold">AERATION BASIN</text>

          {/* Water */}
          <rect x="4" y="30" width="142" height="126" fill="url(#waterGrad)" className="tank-water" rx="2" />

          {/* Aeration Bubbles - more intense */}
          <circle cx="25" cy="130" r="4" fill="#fff" opacity="0.7" className="bubble" />
          <circle cx="45" cy="140" r="3" fill="#fff" opacity="0.6" className="bubble-alt" />
          <circle cx="65" cy="125" r="5" fill="#fff" opacity="0.5" className="bubble" />
          <circle cx="85" cy="135" r="4" fill="#fff" opacity="0.6" className="bubble-alt" />
          <circle cx="105" cy="130" r="3" fill="#fff" opacity="0.7" className="bubble" />
          <circle cx="125" cy="140" r="4" fill="#fff" opacity="0.5" className="bubble-alt" />

          {/* Blower Symbol */}
          <rect x="55" y="165" width="40" height="25" fill="#1f2937" stroke="#6b7280" strokeWidth="1.5" rx="3" />
          <text x="75" y="182" textAnchor="middle" fill="#22d3ee" fontSize="9" fontFamily="monospace">BL-201</text>

          {/* COD Sensor Tag */}
          <rect x="50" y="5" width="50" height="18" fill="#1e1e1e" stroke="#22d3ee" strokeWidth="1" rx="3" />
          <text x="75" y="17" textAnchor="middle" fill="#22d3ee" fontSize="9" fontFamily="monospace">AIT-201</text>
          <text x="75" y="210" textAnchor="middle" fill="#f59e0b" fontSize="12" fontFamily="monospace">COD {metrics.cod}</text>
        </g>

        {/* Connecting Pipe 2 */}
        <line x1="450" y1="140" x2="490" y2="140" className="flow-pipe" stroke="#0ea5e9" strokeWidth="4" />
        <rect x="450" y="132" width="40" height="16" fill="#374151" stroke="#4b5563" strokeWidth="1" />

        {/* === CLARIFIER === */}
        <g transform="translate(490, 70)">
          <rect x="0" y="0" width="120" height="140" fill="#1f2937" stroke="#4b5563" strokeWidth="2" rx="4" />
          <text x="60" y="-10" textAnchor="middle" fill="#9ca3af" fontSize="11" fontWeight="bold">CLARIFIER</text>

          {/* Settling Water Layers */}
          <rect x="4" y="80" width="112" height="56" fill="url(#cleanWater)" rx="2" />
          <rect x="4" y="100" width="112" height="36" fill="#78350f" opacity="0.4" rx="2" />

          {/* Scraper */}
          <line x1="20" y1="90" x2="100" y2="110" stroke="#6b7280" strokeWidth="2" />

          {/* Sensor */}
          <rect x="35" y="10" width="50" height="18" fill="#1e1e1e" stroke="#22c55e" strokeWidth="1" rx="3" />
          <text x="60" y="22" textAnchor="middle" fill="#22c55e" fontSize="9" fontFamily="monospace">AIT-301</text>
        </g>

        {/* === DOSING SYSTEM === */}
        <g transform="translate(360, 260)">
          <rect x="0" y="0" width="80" height="50" fill="#1f2937" stroke={isAutoMode ? "#22d3ee" : "#f97316"} strokeWidth="2" rx="4" />
          <text x="40" y="-8" textAnchor="middle" fill={isAutoMode ? "#22d3ee" : "#f97316"} fontSize="10" fontWeight="bold">
            {isAutoMode ? "AI DOSING" : "MANUAL"}
          </text>
          <text x="40" y="22" textAnchor="middle" fill="#fff" fontSize="14" fontFamily="monospace" fontWeight="bold">{metrics.dosage}</text>
          <text x="40" y="38" textAnchor="middle" fill="#9ca3af" fontSize="10">mL/min</text>

          {/* Dosing Pipe */}
          <line x1="40" y1="-20" x2="40" y2="0" className="flow-pipe-down" stroke="#a855f7" strokeWidth="3" />
          <line x1="40" y1="-60" x2="40" y2="-20" stroke="#a855f7" strokeWidth="2" />
        </g>

        {/* === OUTLET === */}
        <g transform="translate(630, 100)">
          <rect x="0" y="40" width="80" height="20" fill="#374151" stroke="#4b5563" strokeWidth="2" rx="2" />
          <line x1="0" y1="50" x2="80" y2="50" className="flow-pipe" stroke="#22c55e" strokeWidth="4" />

          {/* Final Reading */}
          <rect x="90" y="25" width="70" height="50" fill="#1e1e1e" stroke="#22c55e" strokeWidth="2" rx="4" />
          <text x="125" y="45" textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="bold">OUTLET</text>
          <text x="125" y="65" textAnchor="middle" fill="#22c55e" fontSize="12" fontFamily="monospace">&lt;50 mg/L</text>

          <text x="40" y="30" textAnchor="middle" fill="#9ca3af" fontSize="10">TO DISCHARGE</text>
        </g>

        {/* === LEGEND === */}
        <g transform="translate(650, 280)">
          <rect x="0" y="0" width="120" height="60" fill="#1e1e1e" stroke="#4b5563" strokeWidth="1" rx="4" />
          <text x="60" y="15" textAnchor="middle" fill="#9ca3af" fontSize="9" fontWeight="bold">LEGEND</text>
          <circle cx="15" cy="30" r="6" fill="#0ea5e9" />
          <text x="30" y="33" fill="#9ca3af" fontSize="8">Influent</text>
          <circle cx="75" cy="30" r="6" fill="#22c55e" />
          <text x="90" y="33" fill="#9ca3af" fontSize="8">Effluent</text>
          <circle cx="15" cy="48" r="6" fill="#f97316" />
          <text x="30" y="51" fill="#9ca3af" fontSize="8">Alert</text>
          <circle cx="75" cy="48" r="6" fill="#a855f7" />
          <text x="90" y="51" fill="#9ca3af" fontSize="8">Chemical</text>
        </g>
      </svg>
    </div>
  );
}