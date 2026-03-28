import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Zap, Plus, Download, FileText, Loader2, BarChart2, 
  Cpu, Database, TrendingUp, Clock, Info, Binary, LineChart as ChartIcon, ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';

const Reports = ({ liveData, userId }) => {
  // --- 🔒 CORE STATE (FULLY PRESERVED) ---
  const [activeReport, setActiveReport] = useState('energy'); 
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState([]); 
  const [selectedConnId, setSelectedConnId] = useState(""); 
  const [selectedTag, setSelectedTag] = useState(""); 
  const [dateRange, setDateRange] = useState({ 
    start: new Date(Date.now() - 86400000).toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });

  // --- ⚙️ LOGIC & API HANDLERS (PRESERVED) ---
  useEffect(() => {
    const loadConnections = async () => {
      try {
        const res = await api.getConnections();
        setConnections(Array.isArray(res.data) ? res.data : []);
      } catch (err) { console.error("Connection fetch error", err); }
    };
    loadConnections();
  }, []);

  const energyAnalyzers = useMemo(() => {
    return connections.filter(c => c.connection_type === 'energy_analyzer');
  }, [connections]);

  const stats = useMemo(() => {
    if (!reportData.length) return null;
    const values = reportData.map(d => Number(d.consumption) || Number(d.val) || 0);
    const total = values.reduce((acc, cur) => acc + cur, 0);
    const max = Math.max(...values);
    const avg = total / values.length;
    return {
      total: total.toFixed(2),
      max: max.toFixed(2),
      avg: avg.toFixed(2)
    };
  }, [reportData]);

  const generateReport = async () => {
    setLoading(true);
    try {
      let targetTagId = "";
      if (activeReport === 'energy') {
        const conn = connections.find(c => c.id === parseInt(selectedConnId));
        if (!conn) return;
        targetTagId = Object.keys(liveData).find(key => {
          const tag = liveData[key];
          return tag.sourceName?.trim().toLowerCase() === conn.name?.trim().toLowerCase() && 
                 (tag.unit?.toLowerCase() === 'kwh' || tag.tagName?.toLowerCase().includes('energy'));
        });
        if (!targetTagId) throw new Error("Energy tag mapping not found for this node.");
        const res = await api.getEnergyDelta(targetTagId, dateRange.start, dateRange.end);
        setReportData(res.data);
      } else {
        if (!selectedTag) return;
        const res = await api.getHistory(selectedTag, dateRange.start, dateRange.end);
        setReportData(res.data);
      }
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-20 px-6 pt-10 text-white animate-in fade-in duration-700">
      
      {/* 🏛️ SIEMENS STYLE HEADER (WITH INTEGRATED ANALYTICS GUIDE) */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-10 border-b-2 border-slate-800 pb-12">
        
        {/* Left: Title & Actions */}
        <div className="space-y-1 min-w-[380px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-1 bg-[#00ffcc]"></div>
            <span className="text-[#00ffcc] text-[10px] font-black uppercase tracking-[0.5em]">Data Intelligence Hub</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Insights</h1>
          <p className="text-slate-500 text-[11px] font-bold tracking-[0.2em] uppercase flex items-center gap-2 mt-4 italic">
             <Binary size={14} className="text-[#009999]" /> Proactive Data Mining & Engine Analytics
          </p>

          <button className="mt-8 bg-slate-900 border-2 border-slate-800 text-slate-400 px-8 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:border-[#009999] hover:text-[#00ffcc] transition-all shadow-2xl active:scale-95 group">
            <Download size={18} className="group-hover:translate-y-1 transition-transform" /> Export Analytics
          </button>
        </div>

        {/* 🎯 RIGHT: INTEGRATED ANALYTICAL INSIGHTS GUIDE */}
        <div className="flex-1 bg-slate-900/40 border-2 border-slate-800/50 p-6 rounded-[2.5rem] relative overflow-hidden flex flex-col md:flex-row gap-6">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><ChartIcon size={80}/></div>
            
            <div className="p-4 bg-[#009999]/10 text-[#00ffcc] rounded-2xl h-fit shadow-inner border border-[#009999]/20">
                <Info size={24}/>
            </div>

            <div className="space-y-4">
                <h5 className="text-[11px] font-black text-white uppercase italic tracking-widest border-b border-slate-800 pb-2 inline-block">
                    Analytical Insights Guide
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <p className="text-[10px] text-[#00ffcc] font-black uppercase tracking-tighter italic">Energy Delta ($\Delta$)</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight uppercase">Real-time hourly consumption differences derived from cumulative records.</p>
                    </div>
                    <div className="space-y-1 border-l-2 border-slate-800/50 pl-4">
                        <p className="text-[10px] text-rose-500 font-black uppercase tracking-tighter italic">Anomaly Detect</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight uppercase">Visual markers indicate peak loads exceeding 150% of the calculated average.</p>
                    </div>
                    <div className="space-y-1 border-l-2 border-slate-800/50 pl-4">
                        <p className="text-[10px] text-blue-400 font-black uppercase tracking-tighter italic">Historical Sync</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight uppercase">Data is pulled from the primary Historian DB for longitudinal trend analysis.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* 🎛️ MODE SELECTORS (Siemens Module Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <button 
          onClick={() => { setActiveReport('energy'); setReportData([]); setSelectedConnId(""); }}
          className={`p-10 rounded-[3rem] border-2 text-left transition-all duration-500 relative overflow-hidden group ${
            activeReport === 'energy' ? 'bg-[#009999]/10 border-[#00ffcc] shadow-[0_0_50px_rgba(0,255,204,0.1)] scale-[1.02]' : 'bg-slate-950/50 border-slate-800 opacity-40 hover:opacity-100'
          }`}
        >
          <div className={`mb-6 p-5 rounded-2xl w-fit shadow-2xl ${activeReport === 'energy' ? 'bg-[#009999] text-white' : 'bg-slate-900 text-slate-600'}`}>
            <Zap size={28}/>
          </div>
          <h3 className="text-white font-black text-2xl uppercase italic tracking-tighter">Energy Engine</h3>
          <p className="text-slate-500 text-[11px] mt-3 font-bold uppercase tracking-[0.1em] leading-relaxed">Automated device mapping & $\Delta$ consumption analysis</p>
          <div className={`absolute bottom-0 left-0 w-full h-1 ${activeReport === 'energy' ? 'bg-[#00ffcc]' : 'bg-transparent'}`} />
        </button>

        <button 
          onClick={() => { setActiveReport('custom'); setReportData([]); setSelectedTag(""); }}
          className={`p-10 rounded-[3rem] border-2 text-left transition-all duration-500 relative overflow-hidden group ${
            activeReport === 'custom' ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.1)] scale-[1.02]' : 'bg-slate-950/50 border-slate-800 opacity-40 hover:opacity-100'
          }`}
        >
          <div className={`mb-6 p-5 rounded-2xl w-fit shadow-2xl ${activeReport === 'custom' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-600'}`}>
            <Plus size={28}/>
          </div>
          <h3 className="text-white font-black text-2xl uppercase italic tracking-tighter">Custom Sandbox</h3>
          <p className="text-slate-500 text-[11px] mt-3 font-bold uppercase tracking-[0.1em] leading-relaxed">Manual historian trend & system behavior analysis</p>
          <div className={`absolute bottom-0 left-0 w-full h-1 ${activeReport === 'custom' ? 'bg-blue-500' : 'bg-transparent'}`} />
        </button>
      </div>

      {/* 📊 CONTROL CONSOLE */}
      <div className="bg-[#0b1117] border-2 border-slate-800 p-10 rounded-[4rem] shadow-2xl flex flex-wrap gap-8 items-end relative overflow-hidden shadow-inner">
        <div className={`absolute top-0 left-0 w-2 h-full ${activeReport === 'energy' ? 'bg-[#00ffcc]' : 'bg-blue-500'} transition-colors duration-500`} />
        
        <div className="flex-1 space-y-3">
          <label className="text-[10px] text-slate-600 uppercase font-black ml-2 tracking-widest italic">Target Control Node</label>
          <div className="relative">
            {activeReport === 'energy' ? <Cpu size={18} className="absolute left-5 top-5 text-[#00ffcc]" /> : <Database size={18} className="absolute left-5 top-5 text-blue-500" />}
            <select 
              className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 pl-14 text-white text-[12px] font-black outline-none focus:border-[#009999] appearance-none shadow-2xl uppercase tracking-tighter"
              value={activeReport === 'energy' ? selectedConnId : selectedTag}
              onChange={(e) => activeReport === 'energy' ? setSelectedConnId(e.target.value) : setSelectedTag(e.target.value)}
            >
              <option value="">SELECT INFRASTRUCTURE NODE...</option>
              {activeReport === 'energy' 
                ? energyAnalyzers.map(c => <option key={c.id} value={c.id} className="bg-slate-900">📍 {c.name.toUpperCase()}</option>)
                : Object.keys(liveData).map(key => <option key={key} value={key} className="bg-slate-900">{liveData[key]?.tagName.toUpperCase()} ({liveData[key]?.sourceName})</option>)
              }
            </select>
          </div>
        </div>

        <div className="w-80 space-y-3">
          <label className="text-[10px] text-slate-600 uppercase font-black ml-2 tracking-widest italic">Analytics Timeframe</label>
          <div className="flex gap-3">
            <input type="date" className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 text-white text-[11px] font-black w-full outline-none focus:border-[#009999] shadow-inner" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
            <input type="date" className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 text-white text-[11px] font-black w-full outline-none focus:border-[#009999] shadow-inner" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
          </div>
        </div>

        <button onClick={generateReport} disabled={loading} className={`px-12 py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-2xl flex items-center gap-4 disabled:opacity-30 active:scale-95 ${activeReport === 'energy' ? 'bg-[#009999] hover:bg-[#00cccc] text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
          {loading ? <Loader2 size={20} className="animate-spin"/> : <ShieldCheck size={20}/>} {loading ? 'Computing...' : 'Run Analytics'}
        </button>
      </div>

      {/* 📈 ANALYTICS ENGINE OUTPUT */}
      {reportData.length > 0 && (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-1000">
          
          {/* STATS MODULE */}
          {activeReport === 'energy' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-[#0b1117] border-2 border-slate-800 p-10 rounded-[3rem] flex items-center gap-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><Zap size={80}/></div>
                <div className="p-5 bg-[#009999]/10 text-[#00ffcc] rounded-2xl shadow-inner border border-[#009999]/20"><Zap size={32}/></div>
                <div>
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic mb-2">Total Net Consumption</p>
                  <h4 className="text-5xl font-black text-white tracking-tighter italic">{stats.total} <span className="text-xs font-bold text-[#009999] tracking-normal ml-1">kWh</span></h4>
                </div>
              </div>
              <div className="bg-[#0b1117] border-2 border-slate-800 p-10 rounded-[3rem] flex items-center gap-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingUp size={80}/></div>
                <div className="p-5 bg-rose-500/10 text-rose-500 rounded-2xl shadow-inner border border-rose-500/20"><TrendingUp size={32}/></div>
                <div>
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic mb-2">Operational Peak Load</p>
                  <h4 className="text-5xl font-black text-white tracking-tighter italic">{stats.max} <span className="text-xs font-bold text-rose-500 tracking-normal ml-1">kWh/h</span></h4>
                </div>
              </div>
              <div className="bg-[#0b1117] border-2 border-slate-800 p-10 rounded-[3rem] flex items-center gap-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><Clock size={80}/></div>
                <div className="p-5 bg-blue-500/10 text-blue-500 rounded-2xl shadow-inner border border-blue-500/20"><Clock size={32}/></div>
                <div>
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic mb-2">Engine Mean Average</p>
                  <h4 className="text-5xl font-black text-white tracking-tighter italic">{stats.avg} <span className="text-xs font-bold text-blue-400 tracking-normal ml-1">kWh/h</span></h4>
                </div>
              </div>
            </div>
          )}

          {/* MASTER GRAPH CANVAS */}
          <div className="bg-[#0b1117] border-2 border-slate-800 p-12 rounded-[5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] h-[600px] relative overflow-hidden">
            <div className="absolute top-6 left-12 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#00ffcc] animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Analytical Waveform Projection</span>
            </div>
            
            <ResponsiveContainer width="100%" height="100%">
              {activeReport === 'energy' ? (
                <BarChart data={reportData} barGap={12}>
                  <CartesianGrid strokeDasharray="10 10" stroke="#1e293b" vertical={false} opacity={0.3} />
                  <XAxis dataKey="period" stroke="#475569" fontSize={11} fontWeight="900" tickLine={false} axisLine={false} dy={15} tickFormatter={(t) => new Date(t).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})} />
                  <YAxis stroke="#475569" fontSize={11} fontWeight="900" tickLine={false} axisLine={false} dx={-15} />
                  <Tooltip cursor={{fill: '#00ffcc', opacity: 0.05}} contentStyle={{backgroundColor: '#020617', border: '2px solid #1e293b', borderRadius: '24px', fontSize: '11px', fontWeight: '900', color: '#fff', textTransform: 'uppercase'}} />
                  <Bar dataKey="consumption" barSize={24} radius={[6, 6, 0, 0]}>
                    {reportData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Number(entry.consumption) > (stats?.avg * 1.5) ? '#f43f5e' : '#00ffcc'} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <LineChart data={reportData}>
                  <CartesianGrid strokeDasharray="10 10" stroke="#1e293b" vertical={false} opacity={0.3} />
                  <XAxis dataKey="ts" stroke="#475569" fontSize={11} fontWeight="900" tickLine={false} axisLine={false} dy={15} tickFormatter={(t) => new Date(t).toLocaleTimeString()} />
                  <YAxis stroke="#475569" fontSize={11} fontWeight="900" tickLine={false} axisLine={false} dx={-15} />
                  <Tooltip contentStyle={{backgroundColor: '#020617', border: '2px solid #1e293b', borderRadius: '24px', fontSize: '11px', fontWeight: '900', color: '#fff', textTransform: 'uppercase'}} />
                  <Line type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={5} dot={false} activeDot={{ r: 8, strokeWidth: 0, fill: '#fff' }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;