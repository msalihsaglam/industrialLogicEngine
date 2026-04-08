import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Loader2, Database, TrendingUp, Clock, Info, LineChart as ChartIcon, 
  Calendar, Activity, ArrowDown, ArrowUp
} from 'lucide-react';
import { api } from '../services/api';

const Reports = ({ userId }) => {
  // --- 🔒 CORE STATE (FULLY PRESERVED) ---
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState([]); 
  const [allSystemTags, setAllSystemTags] = useState([]); 
  const [selectedTag, setSelectedTag] = useState(""); 

  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().setHours(new Date().getHours() - 24)).toISOString().slice(0, 16),
    end: new Date().toISOString().slice(0, 16) 
  });

  // --- ⚙️ INFRASTRUCTURE SYNC (PRESERVED) ---
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
          ...t, sourceName: 'VIRTUAL', type: 'virtual' 
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
    <div className="max-w-[1600px] mx-auto space-y-10 pb-20 px-8 pt-10 text-[#F1F5F9] font-['IBM_Plex_Sans']">
      
      {/* 🔡 INDUSTRIAL CORE STYLES */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
          .font-data { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
          .industrial-panel { background-color: #141F24; border: 1px solid #23333A; }
          .label-caps { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #94A3B8; }
          .input-field { background-color: #0B1215; border: 1px solid #23333A; padding: 12px 16px; border-radius: 4px; font-weight: 600; outline: none; color: #fff; }
          .input-field:focus { border-color: #3b82f6; }
        `}
      </style>

      {/* 🏛️ HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-10 border-b border-[#23333A] pb-10">
        <div className="space-y-4 min-w-[380px]">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-blue-500"></div>
            <span className="label-caps">Data Historian Engine</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight uppercase text-white leading-none">Historian</h1>
          <div className="flex items-center gap-2 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">
             <Clock size={14} className="text-blue-500" /> Granular Time-Series Analysis
          </div>
        </div>

        {/* 🎯 ANALYTICAL INSIGHTS GUIDE (Sert & Net) */}
        <div className="flex-1 industrial-panel p-6 rounded-md relative overflow-hidden flex flex-col md:flex-row gap-6 border-l-4 border-l-blue-600 shadow-sm">
            <div className="p-3 bg-blue-600/10 text-blue-400 rounded h-fit"><Info size={20}/></div>
            <div className="space-y-4">
                <h5 className="label-caps border-b border-[#23333A] pb-2 inline-block">Historical Intelligence Protocol</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1">
                        <p className="text-blue-400 text-[10px] font-bold uppercase tracking-tighter">Node Analysis</p>
                        <p className="text-[9px] text-slate-500 font-medium leading-relaxed uppercase">Compare behavior across physical sensors and virtual logic variables.</p>
                    </div>
                    <div className="space-y-1 border-l border-[#23333A] pl-4">
                        <p className="text-purple-400 text-[10px] font-bold uppercase tracking-tighter">Trend Projection</p>
                        <p className="text-[9px] text-slate-500 font-medium leading-relaxed uppercase">Identify long-term patterns and operational drifts in infrastructure.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* 📊 CONTROL CONSOLE */}
      <div className="bg-[#0B1215] border border-[#23333A] p-8 rounded-md shadow-inner flex flex-col xl:flex-row gap-6 items-end relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
        
        <div className="flex-1 w-full space-y-2">
          <label className="label-caps opacity-50 ml-1">Target Infrastructure Node</label>
          <select 
            className="w-full input-field text-[11px] uppercase tracking-wider cursor-pointer"
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
          >
            <option value="">SELECT TAG TO ANALYZE...</option>
            {allSystemTags.map(tag => (
              <option key={tag.id} value={tag.id} className="bg-[#141F24]">
                {tag.type === 'virtual' ? 'CORE' : 'FIELD'} // {tag.tag_name.toUpperCase()} — [{tag.sourceName}]
              </option>
            ))}
          </select>
        </div>

        {/* 🕒 TIME SELECTION */}
        <div className="w-full xl:w-fit space-y-2">
          <label className="label-caps opacity-50 ml-1">Analysis Timeframe</label>
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-blue-500/50 z-10 pointer-events-none">FROM</span>
              <input 
                type="datetime-local" 
                className="input-field pl-12 text-[11px] w-full md:w-56 [color-scheme:dark]" 
                value={dateRange.start} 
                onChange={e => setDateRange({...dateRange, start: e.target.value})} 
              />
            </div>
            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-blue-500/50 z-10 pointer-events-none">TO</span>
              <input 
                type="datetime-local" 
                className="input-field pl-10 text-[11px] w-full md:w-56 [color-scheme:dark]" 
                value={dateRange.end} 
                onChange={e => setDateRange({...dateRange, end: e.target.value})} 
              />
            </div>
          </div>
        </div>

        <button 
          onClick={generateReport} 
          disabled={loading || !selectedTag} 
          className="w-full xl:w-48 py-3.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-[10px] tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-20 active:scale-95"
        >
          {loading ? <Loader2 size={16} className="animate-spin"/> : <Activity size={16}/>} 
          {loading ? 'ANALYZING...' : 'RUN HISTORY'}
        </button>
      </div>

      {/* 📈 ANALYTICS ENGINE OUTPUT */}
      {reportData.length > 0 && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          
          {/* STATS CARDS (Tabular Numbers) */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="industrial-panel p-6 rounded-md flex items-center gap-6 shadow-sm border-t-2 border-t-rose-600">
                <div className="p-3 bg-rose-500/5 text-rose-500 rounded"><TrendingUp size={24}/></div>
                <div>
                  <p className="label-caps !text-[8px] mb-1">Maximum Recorded</p>
                  <h4 className="text-3xl font-bold font-data text-white">{stats.max}</h4>
                </div>
              </div>
              <div className="industrial-panel p-6 rounded-md flex items-center gap-6 shadow-sm border-t-2 border-t-blue-600">
                <div className="p-3 bg-blue-500/5 text-blue-500 rounded"><Activity size={24}/></div>
                <div>
                  <p className="label-caps !text-[8px] mb-1">Mean Average</p>
                  <h4 className="text-3xl font-bold font-data text-white">{stats.avg}</h4>
                </div>
              </div>
              <div className="industrial-panel p-6 rounded-md flex items-center gap-6 shadow-sm border-t-2 border-t-emerald-600">
                <div className="p-3 bg-emerald-500/5 text-emerald-500 rounded"><ArrowDown size={24}/></div>
                <div>
                  <p className="label-caps !text-[8px] mb-1">Minimum Recorded</p>
                  <h4 className="text-3xl font-bold font-data text-white">{stats.min}</h4>
                </div>
              </div>
            </div>
          )}

          {/* MAIN CHART CONTAINER */}
          <div className="bg-[#0B1215] border border-[#23333A] p-10 rounded-md shadow-inner h-[550px] relative overflow-hidden">
            <div className="absolute top-6 left-10 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3B82F6]"></div>
                <span className="label-caps !text-[8px] opacity-40">Temporal Waveform Reconstruction // 1:1 Precision</span>
            </div>
            
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportData} margin={{ top: 40, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="0" stroke="#1E293B" vertical={false} opacity={0.2} />
                  <XAxis 
                    dataKey="ts" 
                    stroke="#475569" 
                    fontSize={10} 
                    fontWeight="700" 
                    tickLine={false} 
                    axisLine={false} 
                    dy={15} 
                    tickFormatter={(t) => new Date(t).toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})} 
                  />
                  <YAxis stroke="#475569" fontSize={10} fontWeight="700" tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#141F24', border: '1px solid #23333A', borderRadius: '4px', fontSize: '11px', color: '#fff'}}
                    itemStyle={{fontWeight: 'bold', textTransform: 'uppercase'}}
                    labelFormatter={(label) => new Date(label).toLocaleString('tr-TR')}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="val" 
                    stroke="#3b82f6" 
                    strokeWidth={2.5} 
                    dot={false} 
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }} 
                    animationDuration={1000}
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