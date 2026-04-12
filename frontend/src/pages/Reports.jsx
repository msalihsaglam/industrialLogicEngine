import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Loader2, Database, TrendingUp, Clock, Info,
  Calendar, Activity, ArrowDown, ArrowUp
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';

const Reports = ({ userId }) => {
  const { t } = useTranslation();

  // --- 🔒 CORE STATE (PRESERVED) ---
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

  // --- 📊 ANALYTICAL STATS (IDS MONO) ---
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
    <div className="max-w-[1600px] mx-auto space-y-12 pb-20 px-8 pt-10 font-sans">
      
      {/* 🏛️ HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-10 border-b border-[var(--ind-border)] pb-10">
        <div className="space-y-4 min-w-[380px]">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[var(--ind-petroleum)]"></div>
            <span className="ind-label">Data Historian Engine</span>
          </div>
          <h1 className="ind-title">Historian Hub</h1>
          <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--ind-slate)] uppercase tracking-widest">
             <Clock size={14} className="text-[var(--ind-cyan)]" /> Granular Time-Series Analysis
          </div>
        </div>

        {/* 🎯 ANALYTICAL INSIGHTS GUIDE */}
        <div className="flex-1 ind-panel p-6 border-l-4 border-l-[var(--ind-petroleum)] relative overflow-hidden flex flex-col md:flex-row gap-6">
            <div className="p-3 bg-[var(--ind-petroleum)]/10 text-[var(--ind-cyan)] rounded h-fit"><Info size={20}/></div>
            <div className="space-y-4">
                <h5 className="ind-label border-b border-[var(--ind-border)] pb-2 inline-block">Historical Intelligence Protocol</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-1">
                        <p className="ind-label !text-[var(--ind-cyan)]">Node Analysis</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">Behavioral sync across sensors & logic.</p>
                    </div>
                    <div className="space-y-1 border-l border-[var(--ind-border)] pl-4">
                        <p className="ind-label !text-purple-400">Trend Projection</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">Long-term operational drift patterns.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* 📊 CONTROL CONSOLE (IDS Input Mode) */}
      <div className="ind-panel p-8 bg-[var(--ind-bg)] shadow-inner flex flex-col xl:flex-row gap-6 items-end relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--ind-petroleum)]" />
        
        <div className="flex-1 w-full space-y-3">
          <label className="ind-label opacity-40 ml-1">Target Infrastructure Node</label>
          <select 
            className="w-full ind-input !bg-[var(--ind-panel)] cursor-pointer"
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
          >
            <option value="">SELECT TAG TO ANALYZE...</option>
            {allSystemTags.map(tag => (
              <option key={tag.id} value={tag.id} className="bg-slate-900">
                {tag.type === 'virtual' ? 'CORE' : 'FIELD'} // {tag.tag_name.toUpperCase()} — [{tag.sourceName}]
              </option>
            ))}
          </select>
        </div>

        {/* 🕒 TIME SELECTION */}
        <div className="w-full xl:w-fit space-y-3">
          <label className="ind-label opacity-40 ml-1">Analysis Timeframe</label>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-[var(--ind-petroleum)] z-10 pointer-events-none">FROM</span>
              <input 
                type="datetime-local" 
                className="ind-input !pl-12 !w-full md:!w-60 [color-scheme:dark]" 
                value={dateRange.start} 
                onChange={e => setDateRange({...dateRange, start: e.target.value})} 
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-[var(--ind-petroleum)] z-10 pointer-events-none">TO</span>
              <input 
                type="datetime-local" 
                className="ind-input !pl-10 !w-full md:!w-60 [color-scheme:dark]" 
                value={dateRange.end} 
                onChange={e => setDateRange({...dateRange, end: e.target.value})} 
              />
            </div>
          </div>
        </div>

        <button 
          onClick={generateReport} 
          disabled={loading || !selectedTag} 
          className="w-full xl:w-56 ind-btn-primary !py-4 flex items-center justify-center gap-3 disabled:opacity-20"
        >
          {loading ? <Loader2 size={16} className="animate-spin"/> : <Activity size={16}/>} 
          {loading ? 'ANALYZING...' : 'RUN HISTORY'}
        </button>
      </div>

      {/* 📈 ANALYTICS ENGINE OUTPUT */}
      {reportData.length > 0 && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          
          {/* STATS CARDS (IDS Value Mode) */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="ind-panel p-8 flex items-center gap-8 shadow-lg border-t-2 border-t-[var(--ind-red)]">
                <div className="p-4 bg-[var(--ind-red)]/5 text-[var(--ind-red)] rounded border border-[var(--ind-red)]/10"><TrendingUp size={28}/></div>
                <div>
                  <p className="ind-label !text-[8px] mb-2 opacity-50">Maximum Recorded</p>
                  <h4 className="ind-value-lg !text-4xl text-white">{stats.max}</h4>
                </div>
              </div>
              <div className="ind-panel p-8 flex items-center gap-8 shadow-lg border-t-2 border-t-[var(--ind-cyan)]">
                <div className="p-4 bg-[var(--ind-cyan)]/5 text-[var(--ind-cyan)] rounded border border-[var(--ind-cyan)]/10"><Activity size={28}/></div>
                <div>
                  <p className="ind-label !text-[8px] mb-2 opacity-50">Mean Average</p>
                  <h4 className="ind-value-lg !text-4xl text-white">{stats.avg}</h4>
                </div>
              </div>
              <div className="ind-panel p-8 flex items-center gap-8 shadow-lg border-t-2 border-t-emerald-600">
                <div className="p-4 bg-emerald-500/5 text-emerald-500 rounded border border-emerald-500/10"><ArrowDown size={28}/></div>
                <div>
                  <p className="ind-label !text-[8px] mb-2 opacity-50">Minimum Recorded</p>
                  <h4 className="ind-value-lg !text-4xl text-white">{stats.min}</h4>
                </div>
              </div>
            </div>
          )}

          {/* MAIN CHART CONTAINER (Industrial Chart) */}
          <div className="ind-panel p-10 h-[600px] relative overflow-hidden bg-[var(--ind-bg)]/50 shadow-inner">
            <div className="absolute top-6 left-10 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[var(--ind-cyan)] shadow-[0_0_10px_#00FFCC]"></div>
                <span className="ind-label !text-[9px] opacity-40 lowercase">Temporal Waveform Reconstruction // 1:1 precision mapping</span>
            </div>
            
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportData} margin={{ top: 60, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="0" stroke="var(--ind-border)" vertical={false} opacity={0.3} />
                  <XAxis 
                    dataKey="ts" 
                    stroke="var(--ind-slate)" 
                    fontSize={10} 
                    fontWeight="700" 
                    tickLine={false} 
                    axisLine={false} 
                    dy={20} 
                    tickFormatter={(t) => new Date(t).toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})} 
                  />
                  <YAxis 
                    stroke="var(--ind-slate)" 
                    fontSize={10} 
                    fontWeight="700" 
                    tickLine={false} 
                    axisLine={false} 
                    dx={-10} 
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'var(--ind-panel)', 
                      border: '1px solid var(--ind-border)', 
                      borderRadius: '4px', 
                      fontSize: '11px', 
                      color: '#fff',
                      fontFamily: 'var(--font-data)'
                    }}
                    itemStyle={{fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--ind-cyan)'}}
                    labelFormatter={(label) => new Date(label).toLocaleString('tr-TR')}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="val" 
                    stroke="var(--ind-cyan)" 
                    strokeWidth={3} 
                    dot={false} 
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }} 
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