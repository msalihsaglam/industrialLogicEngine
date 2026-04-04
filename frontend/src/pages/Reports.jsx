import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Loader2, Cpu, Database, TrendingUp, Clock, Info, LineChart as ChartIcon, 
  ShieldCheck, Calendar, Activity, ArrowDown, ArrowUp
} from 'lucide-react';
import { api } from '../services/api';

const Reports = ({ userId }) => {
  // --- 🔒 CORE STATE ---
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState([]); 
  const [allSystemTags, setAllSystemTags] = useState([]); 
  const [selectedTag, setSelectedTag] = useState(""); 

  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().setHours(new Date().getHours() - 24)).toISOString().slice(0, 16), // Son 24 saat
    end: new Date().toISOString().slice(0, 16) 
  });

  // --- ⚙️ UNIFIED INFRASTRUCTURE SYNC ---
  useEffect(() => {
    const loadInfrastructure = async () => {
      try {
        const connRes = await api.getConnections();
        const activeConns = Array.isArray(connRes.data) ? connRes.data : [];
        setConnections(activeConns);

        const tagPromises = activeConns.map(c => api.getTags(c.id));
        const physicalResults = await Promise.all(tagPromises);
        const physicalTags = physicalResults.flatMap((res, index) => 
          res.data.map(t => ({ ...t, sourceName: activeConns[index].name, type: 'physical' }))
        );
        
        const virtualRes = await api.getTags(0);
        const virtualTags = virtualRes.data.map(t => ({ 
          ...t, sourceName: 'VIRTUAL WORKSPACE', type: 'virtual' 
        }));

        setAllSystemTags([...physicalTags, ...virtualTags]);
      } catch (err) { console.error("Infrastructure sync error", err); }
    };
    loadInfrastructure();
  }, [connections.length]);

  // --- 📊 ANALYTICAL STATS ---
  const stats = useMemo(() => {
    if (!reportData.length) return null;
    const values = reportData.map(d => Number(d.val) || 0);
    const total = values.reduce((acc, cur) => acc + cur, 0);
    return {
      max: Math.max(...values).toFixed(2),
      min: Math.min(...values).toFixed(2),
      avg: (total / values.length).toFixed(2)
    };
  }, [reportData]);

  const generateReport = async () => {
    if (!selectedTag) return;
    setLoading(true);
    try {
      const startTime = new Date(dateRange.start).toISOString();
      const endTime = new Date(dateRange.end).toISOString();
      const res = await api.getHistory(selectedTag, startTime, endTime);
      setReportData(res.data);
    } catch (err) { 
      alert("Data retrieval failed: " + err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-20 px-6 pt-10 text-white animate-in fade-in duration-700 font-['Inter',_sans-serif]">
      
      {/* 🏛️ HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-10 border-b-2 border-slate-800 pb-12">
        <div className="space-y-1 min-w-[380px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-1 bg-blue-500"></div>
            <span className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.4em]">Data Historian</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Historian</h1>
          <p className="text-slate-500 text-[12px] font-semibold tracking-wide flex items-center gap-2 mt-4 italic">
             <Clock size={14} className="text-blue-500" /> Granular Time-Series Analysis
          </p>
        </div>

        {/* 🎯 ANALYTICAL INSIGHTS GUIDE */}
        <div className="flex-1 bg-slate-900/40 border-2 border-slate-800/50 p-6 rounded-[2.5rem] relative overflow-hidden flex flex-col md:flex-row gap-6 shadow-2xl">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><ChartIcon size={80}/></div>
            <div className="p-4 bg-blue-600/10 text-blue-400 rounded-2xl h-fit shadow-inner border border-blue-600/20"><Info size={24}/></div>
            <div className="space-y-4">
                <h5 className="text-[11px] font-bold text-white uppercase italic tracking-widest border-b border-slate-800 pb-2 inline-block">Historical Intelligence Guide</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[9px] font-semibold uppercase text-slate-500">
                    <div className="space-y-1">
                        <p className="text-blue-400 font-bold italic text-[10px]">Node Analysis</p>
                        <p>Analyze behavior across Physical sensors and Virtual logic nodes.</p>
                    </div>
                    <div className="space-y-1 border-l border-slate-800/50 pl-4">
                        <p className="text-purple-400 font-bold italic text-[10px]">Trend Projection</p>
                        <p>Identify long-term patterns and operational drifts in your infrastructure.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* 📊 CONTROL CONSOLE */}
      <div className="bg-[#0b1117] border-2 border-slate-800 p-10 rounded-[4rem] shadow-2xl flex flex-col xl:flex-row gap-8 items-end relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-blue-600 transition-colors duration-500" />
        
        <div className="flex-1 w-full space-y-3">
          <label className="text-[10px] text-slate-600 uppercase font-bold ml-2 tracking-widest italic flex items-center gap-2">
            <Database size={12}/> Target Infrastructure Node
          </label>
          <div className="relative">
            <select 
              className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 text-white text-[12px] font-semibold outline-none focus:border-blue-500 appearance-none shadow-2xl uppercase tracking-tight cursor-pointer"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
            >
              <option value="">SELECT TAG TO ANALYZE...</option>
              {allSystemTags.map(tag => (
                <option key={tag.id} value={tag.id} className="bg-slate-900 font-sans">
                  {tag.type === 'virtual' ? '🧠' : '📍'} {tag.tag_name.toUpperCase()} — [{tag.sourceName}]
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 🕒 TIME SELECTION */}
        <div className="w-full xl:w-fit space-y-3">
          <label className="text-[10px] text-slate-600 uppercase font-bold ml-2 tracking-widest italic flex items-center gap-2">
            <Calendar size={12}/> Analysis Timeframe
          </label>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[11px] font-black text-blue-500 opacity-40 z-10 italic pointer-events-none">FROM</span>
              <input 
                type="datetime-local" 
                className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 pl-14 text-white text-[13px] font-bold outline-none focus:border-blue-500 shadow-inner w-full md:w-64 [color-scheme:dark]" 
                value={dateRange.start} 
                onChange={e => setDateRange({...dateRange, start: e.target.value})} 
              />
            </div>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[11px] font-black text-blue-500 opacity-40 z-10 italic pointer-events-none">TO</span>
              <input 
                type="datetime-local" 
                className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 pl-12 text-white text-[13px] font-bold outline-none focus:border-blue-500 shadow-inner w-full md:w-64 [color-scheme:dark]" 
                value={dateRange.end} 
                onChange={e => setDateRange({...dateRange, end: e.target.value})} 
              />
            </div>
          </div>
        </div>

        <button 
          onClick={generateReport} 
          disabled={loading || !selectedTag} 
          className="w-full xl:w-64 h-[66px] rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase text-[11px] tracking-widest transition-all shadow-2xl flex items-center justify-center gap-4 disabled:opacity-30 active:scale-95"
        >
          {loading ? <Loader2 size={20} className="animate-spin"/> : <Activity size={20}/>} 
          {loading ? 'ANALYZING...' : 'RUN HISTORY'}
        </button>
      </div>

      {/* 📈 ANALYTICS ENGINE OUTPUT */}
      {reportData.length > 0 && (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-1000">
          
          {/* STATS CARDS */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-[#0b1117] border-2 border-slate-800 p-10 rounded-[3rem] flex items-center gap-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><ArrowUp size={80}/></div>
                <div className="p-5 bg-rose-500/10 text-rose-500 rounded-2xl shadow-inner border border-rose-500/20"><TrendingUp size={32}/></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic mb-2">Maximum Value</p>
                  <h4 className="text-5xl font-bold text-white tracking-tighter italic">{stats.max}</h4>
                </div>
              </div>
              <div className="bg-[#0b1117] border-2 border-slate-800 p-10 rounded-[3rem] flex items-center gap-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Activity size={80}/></div>
                <div className="p-5 bg-blue-500/10 text-blue-500 rounded-2xl shadow-inner border border-blue-500/20"><Activity size={32}/></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic mb-2">Average Trend</p>
                  <h4 className="text-5xl font-bold text-white tracking-tighter italic">{stats.avg}</h4>
                </div>
              </div>
              <div className="bg-[#0b1117] border-2 border-slate-800 p-10 rounded-[3rem] flex items-center gap-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><ArrowDown size={80}/></div>
                <div className="p-5 bg-emerald-500/10 text-emerald-500 rounded-2xl shadow-inner border border-emerald-500/20"><ArrowDown size={32}/></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic mb-2">Minimum Value</p>
                  <h4 className="text-5xl font-bold text-white tracking-tighter italic">{stats.min}</h4>
                </div>
              </div>
            </div>
          )}

          {/* MAIN CHART */}
          <div className="bg-[#0b1117] border-2 border-slate-800 p-12 rounded-[5rem] shadow-inner h-[600px] relative">
            <div className="absolute top-8 left-12 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 italic">Temporal Waveform Reconstruction // High-Precision</span>
            </div>
            
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportData} margin={{ top: 40, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="10 10" stroke="#1e293b" vertical={false} opacity={0.3} />
                  <XAxis 
                    dataKey="ts" 
                    stroke="#475569" 
                    fontSize={11} 
                    fontWeight="700" 
                    tickLine={false} 
                    axisLine={false} 
                    dy={15} 
                    tickFormatter={(t) => new Date(t).toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})} 
                  />
                  <YAxis stroke="#475569" fontSize={11} fontWeight="700" tickLine={false} axisLine={false} dx={-15} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#020617', border: '2px solid #1e293b', borderRadius: '24px', fontSize: '12px', fontWeight: '600', color: '#fff'}}
                    labelFormatter={(label) => new Date(label).toLocaleString()}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="val" 
                    stroke="#3b82f6" 
                    strokeWidth={4} 
                    dot={false} 
                    activeDot={{ r: 8, strokeWidth: 0, fill: '#fff' }} 
                    animationDuration={1500}
                  />
                </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;