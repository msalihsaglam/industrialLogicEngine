import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Zap, Plus, Download, FileText, Loader2, BarChart2, 
  Cpu, Database, TrendingUp, Clock, Info, Binary, LineChart as ChartIcon, ShieldCheck,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';

const Reports = ({ liveData, userId }) => {
  // --- 🔒 CORE STATE (DATETIME & VIRTUAL SYNC) ---
  const [activeReport, setActiveReport] = useState('energy'); 
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState([]); 
  const [allSystemTags, setAllSystemTags] = useState([]); // Sanal + Fiziksel Tag Havuzu
  const [selectedConnId, setSelectedConnId] = useState(""); 
  const [selectedTag, setSelectedTag] = useState(""); 

  // Başlangıç değerleri: Bugün 00:00 ve Şu an
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().setHours(0,0,0,0)).toISOString().slice(0, 16), 
    end: new Date().toISOString().slice(0, 16) 
  });

  // --- ⚙️ UNIFIED INFRASTRUCTURE SYNC ---
  useEffect(() => {
    const loadInfrastructure = async () => {
      try {
        const connRes = await api.getConnections();
        const activeConns = Array.isArray(connRes.data) ? connRes.data : [];
        setConnections(activeConns);

        // Tüm fiziksel tagleri çek
        const tagPromises = activeConns.map(c => api.getTags(c.id));
        const physicalResults = await Promise.all(tagPromises);
        const physicalTags = physicalResults.flatMap((res, index) => 
          res.data.map(t => ({ ...t, sourceName: activeConns[index].name, type: 'physical' }))
        );
        
        // Sanal tagleri (Virtual Workspace ID: 0) çek
        const virtualRes = await api.getTags(0);
        const virtualTags = virtualRes.data.map(t => ({ 
          ...t, sourceName: 'VIRTUAL WORKSPACE', type: 'virtual' 
        }));

        setAllSystemTags([...physicalTags, ...virtualTags]);
      } catch (err) { console.error("Infrastructure sync error", err); }
    };
    loadInfrastructure();
  }, [connections.length]);

  const energyAnalyzers = useMemo(() => {
    return connections.filter(c => c.connection_type === 'energy_analyzer');
  }, [connections]);

  const stats = useMemo(() => {
    if (!reportData.length) return null;
    const values = reportData.map(d => Number(d.consumption) || Number(d.val) || 0);
    const total = values.reduce((acc, cur) => acc + cur, 0);
    return {
      total: total.toFixed(2),
      max: Math.max(...values).toFixed(2),
      avg: (total / values.length).toFixed(2)
    };
  }, [reportData]);

  const generateReport = async () => {
    setLoading(true);
    try {
      // API uyumu için ISO formatına geri dönüyoruz
      const startTime = new Date(dateRange.start).toISOString();
      const endTime = new Date(dateRange.end).toISOString();

      if (activeReport === 'energy') {
        if (!selectedConnId) return;
        const conn = connections.find(c => c.id === parseInt(selectedConnId));
        const targetTag = allSystemTags.find(t => 
          t.sourceName?.trim().toLowerCase() === conn.name?.trim().toLowerCase() && 
          (t.unit?.toLowerCase() === 'kwh' || t.tag_name?.toLowerCase().includes('energy'))
        );
        if (!targetTag) throw new Error("Energy tag mapping failed.");
        const res = await api.getEnergyDelta(targetTag.id, startTime, endTime);
        setReportData(res.data);
      } else {
        if (!selectedTag) return;
        const res = await api.getHistory(selectedTag, startTime, endTime);
        setReportData(res.data);
      }
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-20 px-6 pt-10 text-white animate-in fade-in duration-700 font-['Inter',_sans-serif]">
      
      {/* 🏛️ HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-10 border-b-2 border-slate-800 pb-12">
        <div className="space-y-1 min-w-[380px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-1 bg-[#00ffcc]"></div>
            <span className="text-[#00ffcc] text-[10px] font-bold uppercase tracking-[0.4em]">Analytics Engine</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Insights</h1>
          <p className="text-slate-500 text-[12px] font-semibold tracking-wide flex items-center gap-2 mt-4 italic">
             <Clock size={14} className="text-[#009999]" /> Micro-Interval Data Orchestration
          </p>
        </div>

        {/* 🎯 ANALYTICAL INSIGHTS GUIDE */}
        <div className="flex-1 bg-slate-900/40 border-2 border-slate-800/50 p-6 rounded-[2.5rem] relative overflow-hidden flex flex-col md:flex-row gap-6 shadow-2xl">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><ChartIcon size={80}/></div>
            <div className="p-4 bg-[#009999]/10 text-[#00ffcc] rounded-2xl h-fit shadow-inner border border-[#009999]/20"><Info size={24}/></div>
            <div className="space-y-4">
                <h5 className="text-[11px] font-bold text-white uppercase italic tracking-widest border-b border-slate-800 pb-2 inline-block">Heuristic Analytics Guide</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[9px] font-semibold uppercase text-slate-500">
                    <div className="space-y-1">
                        <p className="text-[#00ffcc] font-bold italic text-[10px]">Precision Time</p>
                        <p>Detailed sub-hour analysis using granular UTC timestamps.</p>
                    </div>
                    <div className="space-y-1 border-l border-slate-800/50 pl-4">
                        <p className="text-rose-500 font-bold italic text-[10px]">Peak Pulse</p>
                        <p>Identify transient loads with automated anomaly detection markers.</p>
                    </div>
                    <div className="space-y-1 border-l border-slate-800/50 pl-4">
                        <p className="text-blue-400 font-bold italic text-[10px]">Node Sync</p>
                        <p>Real-time mapping of Physical and Virtual node historical data.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* 🎛️ MODE SELECTORS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <button 
          onClick={() => { setActiveReport('energy'); setReportData([]); setSelectedConnId(""); }}
          className={`p-10 rounded-[3rem] border-2 text-left transition-all duration-500 relative overflow-hidden group ${activeReport === 'energy' ? 'bg-[#009999]/10 border-[#00ffcc] shadow-[0_0_50px_rgba(0,153,153,0.1)]' : 'bg-slate-950/50 border-slate-800 opacity-40 hover:opacity-100'}`}
        >
          <div className={`mb-6 p-5 rounded-2xl w-fit shadow-2xl ${activeReport === 'energy' ? 'bg-[#009999] text-white' : 'bg-slate-900 text-slate-600'}`}>
            <Zap size={28}/>
          </div>
          <h3 className="text-white font-bold text-2xl uppercase italic tracking-tighter">Energy Engine</h3>
          <p className="text-slate-500 text-[11px] mt-3 font-semibold uppercase tracking-wide leading-relaxed">Automated device mapping & delta consumption analysis</p>
          <div className={`absolute bottom-0 left-0 w-full h-1.5 ${activeReport === 'energy' ? 'bg-[#00ffcc]' : 'bg-transparent'}`} />
        </button>

        <button 
          onClick={() => { setActiveReport('custom'); setReportData([]); setSelectedTag(""); }}
          className={`p-10 rounded-[3rem] border-2 text-left transition-all duration-500 relative overflow-hidden group ${activeReport === 'custom' ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_50px_rgba(37,99,235,0.1)]' : 'bg-slate-950/50 border-slate-800 opacity-40 hover:opacity-100'}`}
        >
          <div className={`mb-6 p-5 rounded-2xl w-fit shadow-2xl ${activeReport === 'custom' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-600'}`}>
            <Plus size={28}/>
          </div>
          <h3 className="text-white font-bold text-2xl uppercase italic tracking-tighter">Custom Sandbox</h3>
          <p className="text-slate-500 text-[11px] mt-3 font-semibold uppercase tracking-wide leading-relaxed">Manual historian trend & virtual node behavior analysis</p>
          <div className={`absolute bottom-0 left-0 w-full h-1.5 ${activeReport === 'custom' ? 'bg-blue-500' : 'bg-transparent'}`} />
        </button>
      </div>

      {/* 📊 CONTROL CONSOLE (TIMEFRAME UPDATED) */}
      <div className="bg-[#0b1117] border-2 border-slate-800 p-10 rounded-[4rem] shadow-2xl flex flex-col xl:flex-row gap-8 items-end relative overflow-hidden shadow-inner">
        <div className={`absolute top-0 left-0 w-2 h-full ${activeReport === 'energy' ? 'bg-[#00ffcc]' : 'bg-blue-600'} transition-colors duration-500`} />
        
        <div className="flex-1 w-full space-y-3">
          <label className="text-[10px] text-slate-600 uppercase font-bold ml-2 tracking-widest italic flex items-center gap-2">
            <Database size={12}/> Target Infrastructure Node
          </label>
          <div className="relative">
            <select 
              className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 text-white text-[12px] font-semibold outline-none focus:border-[#009999] appearance-none shadow-2xl uppercase tracking-tight cursor-pointer"
              value={activeReport === 'energy' ? selectedConnId : selectedTag}
              onChange={(e) => activeReport === 'energy' ? setSelectedConnId(e.target.value) : setSelectedTag(e.target.value)}
            >
              <option value="">SELECT NODE...</option>
              {activeReport === 'energy' 
                ? energyAnalyzers.map(c => <option key={c.id} value={c.id} className="bg-slate-900 font-sans">🔌 {c.name.toUpperCase()}</option>)
                : allSystemTags.map(tag => (
                    <option key={tag.id} value={tag.id} className="bg-slate-900 font-sans">
                      {tag.type === 'virtual' ? '🧠' : '🔌'} {tag.tag_name.toUpperCase()} ({tag.sourceName})
                    </option>
                  ))
              }
            </select>
          </div>
        </div>

        {/* 🕒 TIME SELECTION (DATETIME-LOCAL) */}
        <div className="w-full xl:w-fit space-y-3">
          <label className="text-[10px] text-slate-600 uppercase font-bold ml-2 tracking-widest italic flex items-center gap-2">
            <Calendar size={12}/> Analytical Timeframe (Precision Mode)
          </label>
          <div className="flex flex-col md:flex-row gap-4">
<div className="relative group">
    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] font-black text-[#00ffcc] opacity-40 z-10 italic pointer-events-none">FROM</span>
    <input 
        type="datetime-local" 
        // [color-scheme:dark] sınıfı ikonun beyaza dönmesini sağlar
        className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 pl-14 text-white text-[13px] font-bold outline-none focus:border-[#009999] shadow-inner transition-all w-full md:w-64 [color-scheme:dark]" 
        value={dateRange.start} 
        onChange={e => setDateRange({...dateRange, start: e.target.value})} 
    />
</div>
<div className="relative group">
    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] font-black text-[#00ffcc] opacity-40 z-10 italic pointer-events-none">TO</span>
    <input 
        type="datetime-local" 
        // [color-scheme:dark] ekledik
        className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 pl-12 text-white text-[13px] font-bold outline-none focus:border-[#009999] shadow-inner transition-all w-full md:w-64 [color-scheme:dark]" 
        value={dateRange.end} 
        onChange={e => setDateRange({...dateRange, end: e.target.value})} 
    />
</div>
          </div>
        </div>

        <button onClick={generateReport} disabled={loading} className={`w-full xl:w-64 h-[66px] rounded-2xl font-bold uppercase text-[11px] tracking-widest transition-all shadow-2xl flex items-center justify-center gap-4 disabled:opacity-30 active:scale-95 ${activeReport === 'energy' ? 'bg-[#009999] hover:bg-[#00cccc] text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
          {loading ? <Loader2 size={20} className="animate-spin"/> : <ShieldCheck size={20}/>} {loading ? 'COMPUTING...' : 'RUN ANALYTICS'}
        </button>
      </div>

      {/* 📈 ANALYTICS ENGINE OUTPUT */}
      {reportData.length > 0 && (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-1000">
          
          {activeReport === 'energy' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-[#0b1117] border-2 border-slate-800 p-10 rounded-[3rem] flex items-center gap-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><Zap size={80}/></div>
                <div className="p-5 bg-[#009999]/10 text-[#00ffcc] rounded-2xl shadow-inner border border-[#009999]/20"><Zap size={32}/></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic mb-2">Net Consumption</p>
                  <h4 className="text-5xl font-bold text-white tracking-tighter italic">{stats.total} <span className="text-xs font-semibold text-[#009999] tracking-normal ml-1">kWh</span></h4>
                </div>
              </div>
              <div className="bg-[#0b1117] border-2 border-slate-800 p-10 rounded-[3rem] flex items-center gap-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingUp size={80}/></div>
                <div className="p-5 bg-rose-500/10 text-rose-500 rounded-2xl shadow-inner border border-rose-500/20"><TrendingUp size={32}/></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic mb-2">Operational Peak</p>
                  <h4 className="text-5xl font-bold text-white tracking-tighter italic">{stats.max} <span className="text-xs font-semibold text-rose-500 tracking-normal ml-1">kWh/h</span></h4>
                </div>
              </div>
              <div className="bg-[#0b1117] border-2 border-slate-800 p-10 rounded-[3rem] flex items-center gap-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><Clock size={80}/></div>
                <div className="p-5 bg-blue-500/10 text-blue-500 rounded-2xl shadow-inner border border-blue-500/20"><Clock size={32}/></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic mb-2">Engine Average</p>
                  <h4 className="text-5xl font-bold text-white tracking-tighter italic">{stats.avg} <span className="text-xs font-semibold text-blue-400 tracking-normal ml-1">kWh/h</span></h4>
                </div>
              </div>
            </div>
          )}

          <div className="bg-[#0b1117] border-2 border-slate-800 p-12 rounded-[5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] h-[600px] relative">
            <div className="absolute top-8 left-12 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#00ffcc] animate-pulse shadow-[0_0_10px_rgba(0,255,204,0.5)]"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 italic">Analytical Waveform Projection // High-Res Mode</span>
            </div>
            
            <ResponsiveContainer width="100%" height="100%">
              {activeReport === 'energy' ? (
                <BarChart data={reportData} barGap={12}>
                  <CartesianGrid strokeDasharray="10 10" stroke="#1e293b" vertical={false} opacity={0.3} />
                  <XAxis dataKey="period" stroke="#475569" fontSize={11} fontWeight="700" tickLine={false} axisLine={false} dy={15} tickFormatter={(t) => new Date(t).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})} />
                  <YAxis stroke="#475569" fontSize={11} fontWeight="700" tickLine={false} axisLine={false} dx={-15} />
                  <Tooltip cursor={{fill: '#00ffcc', opacity: 0.05}} contentStyle={{backgroundColor: '#020617', border: '2px solid #1e293b', borderRadius: '24px', fontSize: '12px', fontWeight: '600', color: '#fff'}} />
                  <Bar dataKey="consumption" barSize={24} radius={[6, 6, 0, 0]}>
                    {reportData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Number(entry.consumption) > (stats?.avg * 1.5) ? '#f43f5e' : '#00ffcc'} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <LineChart data={reportData}>
                  <CartesianGrid strokeDasharray="10 10" stroke="#1e293b" vertical={false} opacity={0.3} />
                  <XAxis dataKey="ts" stroke="#475569" fontSize={11} fontWeight="700" tickLine={false} axisLine={false} dy={15} tickFormatter={(t) => new Date(t).toLocaleTimeString()} />
                  <YAxis stroke="#475569" fontSize={11} fontWeight="700" tickLine={false} axisLine={false} dx={-15} />
                  <Tooltip contentStyle={{backgroundColor: '#020617', border: '2px solid #1e293b', borderRadius: '24px', fontSize: '12px', fontWeight: '600', color: '#fff'}} />
                  <Line type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={4} dot={false} activeDot={{ r: 8, strokeWidth: 0, fill: '#fff' }} />
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