import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Zap, Plus, Download, FileText, Loader2, BarChart2, 
  Cpu, Database, TrendingUp, Clock, Info 
} from 'lucide-react';
import { api } from '../services/api';

const Reports = ({ liveData, userId }) => {
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

  useEffect(() => {
    const loadConnections = async () => {
      try {
        const res = await api.getConnections();
        setConnections(Array.isArray(res.data) ? res.data : []);
      } catch (err) { console.error("Bağlantılar yüklenemedi", err); }
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
        if (!targetTagId) throw new Error("Energy tag not found.");
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
    <div className="max-w-[1600px] mx-auto space-y-10 p-10 animate-in fade-in duration-700">
      
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-slate-800 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
            <TrendingUp className="text-blue-500" /> Intelligence Hub
          </h1>
          <p className="text-slate-500 text-[10px] font-black tracking-[0.4em] mt-4 uppercase italic">Proactive Data Mining & Insights</p>
        </div>
        <button className="bg-slate-900 border border-slate-800 text-slate-400 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:border-slate-600 transition-all shadow-lg">
          <Download size={16} /> Export Analysis
        </button>
      </div>

      {/* MODE SELECTORS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button 
          onClick={() => { setActiveReport('energy'); setReportData([]); setSelectedConnId(""); }}
          className={`p-10 rounded-[3rem] border-2 text-left transition-all duration-500 relative overflow-hidden group ${
            activeReport === 'energy' ? 'bg-emerald-600/10 border-emerald-500 shadow-2xl scale-[1.02]' : 'bg-slate-950/50 border-slate-800 opacity-50 hover:opacity-100'
          }`}
        >
          <div className={`mb-4 p-4 rounded-2xl w-fit ${activeReport === 'energy' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-500'}`}>
            <Zap size={24}/>
          </div>
          <h3 className="text-white font-black text-xl uppercase italic tracking-tight">Energy Analytics</h3>
          <p className="text-slate-500 text-[10px] mt-2 font-bold uppercase tracking-widest leading-relaxed">Automated device mapping & consumption analysis</p>
        </button>

        <button 
          onClick={() => { setActiveReport('custom'); setReportData([]); setSelectedTag(""); }}
          className={`p-10 rounded-[3rem] border-2 text-left transition-all duration-500 relative overflow-hidden group ${
            activeReport === 'custom' ? 'bg-blue-600/10 border-blue-500 shadow-2xl scale-[1.02]' : 'bg-slate-950/50 border-slate-800 opacity-50 hover:opacity-100'
          }`}
        >
          <div className={`mb-4 p-4 rounded-2xl w-fit ${activeReport === 'custom' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-500'}`}>
            <Plus size={24}/>
          </div>
          <h3 className="text-white font-black text-xl uppercase italic tracking-tight">User Defined</h3>
          <p className="text-slate-500 text-[10px] mt-2 font-bold uppercase tracking-widest leading-relaxed">Manual historian trend & behavior analysis</p>
        </button>
      </div>

      {/* CONTROL PANEL */}
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] shadow-xl flex flex-wrap gap-6 items-end relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-1.5 h-full ${activeReport === 'energy' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
        <div className="flex-1 space-y-2">
          <label className="text-[9px] text-slate-500 uppercase font-black ml-1 tracking-widest italic">Target Node</label>
          <div className="relative">
            {activeReport === 'energy' ? <Cpu size={14} className="absolute left-4 top-4 text-emerald-500" /> : <Database size={14} className="absolute left-4 top-4 text-blue-500" />}
            <select 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 pl-12 text-white text-[11px] font-bold outline-none focus:border-slate-500 appearance-none shadow-inner"
              value={activeReport === 'energy' ? selectedConnId : selectedTag}
              onChange={(e) => activeReport === 'energy' ? setSelectedConnId(e.target.value) : setSelectedTag(e.target.value)}
            >
              <option value="">Select Resource...</option>
              {activeReport === 'energy' 
                ? energyAnalyzers.map(c => <option key={c.id} value={c.id}>📍 {c.name.toUpperCase()}</option>)
                : Object.keys(liveData).map(key => <option key={key} value={key}>{liveData[key]?.tagName} ({liveData[key]?.sourceName})</option>)
              }
            </select>
          </div>
        </div>

        <div className="w-64 space-y-2">
          <label className="text-[9px] text-slate-500 uppercase font-black ml-1 tracking-widest italic">Timeframe</label>
          <div className="flex gap-2">
            <input type="date" className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-[10px] w-full outline-none" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
            <input type="date" className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-[10px] w-full outline-none" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
          </div>
        </div>

        <button onClick={generateReport} disabled={loading} className={`px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg flex items-center gap-3 disabled:opacity-50 ${activeReport === 'energy' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
          {loading ? <Loader2 size={16} className="animate-spin"/> : <FileText size={16}/>} Run Analytics
        </button>
      </div>

      {/* RESULTS AREA */}
      {reportData.length > 0 && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-1000">
          
          {/* 🎯 STATS SADECE ENERJİDE */}
          {activeReport === 'energy' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/40 border border-slate-800/50 p-8 rounded-[2.5rem] flex items-center gap-6 backdrop-blur-md">
                <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl"><Zap size={28}/></div>
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Consumption</p>
                  <h4 className="text-3xl font-black text-white tracking-tighter">{stats.total} <span className="text-xs font-normal text-slate-500 italic">kWh</span></h4>
                </div>
              </div>
              <div className="bg-slate-900/40 border border-slate-800/50 p-8 rounded-[2.5rem] flex items-center gap-6 backdrop-blur-md">
                <div className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl"><TrendingUp size={28}/></div>
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Peak Load</p>
                  <h4 className="text-3xl font-black text-white tracking-tighter">{stats.max} <span className="text-xs font-normal text-slate-500 italic">kWh/h</span></h4>
                </div>
              </div>
              <div className="bg-slate-900/40 border border-slate-800/50 p-8 rounded-[2.5rem] flex items-center gap-6 backdrop-blur-md">
                <div className="p-4 bg-blue-500/10 text-blue-500 rounded-2xl"><Clock size={28}/></div>
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Average</p>
                  <h4 className="text-3xl font-black text-white tracking-tighter">{stats.avg} <span className="text-xs font-normal text-slate-500 italic">kWh/h</span></h4>
                </div>
              </div>
            </div>
          )}

          {/* 📊 CLEAN GRAPH AREA */}
          <div className="bg-slate-950/40 border border-slate-800/50 p-10 rounded-[4rem] shadow-2xl h-[500px] backdrop-blur-xl">
            <ResponsiveContainer width="100%" height="100%">
              {activeReport === 'energy' ? (
                <BarChart data={reportData} barGap={12}>
                  <CartesianGrid strokeDasharray="8 8" stroke="#1e293b" vertical={false} opacity={0.2} />
                  <XAxis dataKey="period" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dy={10} tickFormatter={(t) => new Date(t).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip cursor={{fill: '#1e293b', opacity: 0.1}} contentStyle={{backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px'}} />
                  {/* 🎯 DEĞİŞİKLİK: Barlar inceltildi (barSize) ve dolgu yumuşatıldı */}
                  <Bar dataKey="consumption" barSize={20} radius={[4, 4, 0, 0]}>
                    {reportData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Number(entry.consumption) > (stats?.avg * 1.5) ? '#f43f5e' : '#3b82f6'} fillOpacity={0.9} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <LineChart data={reportData}>
                  <CartesianGrid strokeDasharray="8 8" stroke="#1e293b" vertical={false} opacity={0.2} />
                  <XAxis dataKey="ts" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(t) => new Date(t).toLocaleTimeString()} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px'}} />
                  {/* 🎯 DEĞİŞİKLİK: Dolgu kaldırıldı, sadece keskin bir çizgi */}
                  <Line type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* 🎯 INSIGHTS SADECE ENERJİDE */}
          {activeReport === 'energy' && (
            <div className="bg-slate-950/50 border border-slate-800/50 p-8 rounded-[3rem] flex gap-6 items-start">
              <div className="p-3 bg-blue-600/10 text-blue-500 rounded-xl mt-1"><Info size={24}/></div>
              <div className="space-y-3 text-[11px] text-slate-400 font-bold leading-relaxed">
                <p>● <span className="text-white uppercase tracking-widest">Delta:</span> Real-time hourly consumption differences ($\Delta$).</p>
                <p>● <span className="text-rose-500 uppercase tracking-widest">Anomalies:</span> Red indicators reflect spikes above 150% average load.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;