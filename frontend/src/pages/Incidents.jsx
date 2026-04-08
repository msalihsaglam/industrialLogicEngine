import React, { useState, useMemo } from 'react';
import { 
  Activity, AlertCircle, AlertTriangle, Info, Layers, 
  Trash2, Search, Clock, ShieldAlert, Terminal, ArrowRight, 
  CheckCircle2, BarChart3
} from 'lucide-react';

const Incidents = ({ alarms = [], onClearAlarms }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  // --- 📊 ANALYTICS (PRESERVED) ---
  const stats = useMemo(() => {
    return {
      total: alarms.length,
      critical: alarms.filter(a => a.severity?.toLowerCase() === 'critical').length,
      warning: alarms.filter(a => a.severity?.toLowerCase() === 'warning').length,
      info: alarms.filter(a => a.severity?.toLowerCase() === 'info').length
    };
  }, [alarms]);

  // --- 🔍 FILTERING (PRESERVED) ---
  const filteredAlarms = useMemo(() => {
    return alarms
      .filter(a => {
        const matchesSearch = a.message?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             a.ruleName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSeverity = severityFilter === 'all' || a.severity?.toLowerCase() === severityFilter;
        return matchesSearch && matchesSeverity;
      })
      .sort((a, b) => {
        const priority = { critical: 1, warning: 2, info: 3 };
        return priority[a.severity?.toLowerCase()] - priority[b.severity?.toLowerCase()];
      });
  }, [alarms, searchTerm, severityFilter]);

  const getSeverityStyles = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': 
        return { 
          bg: 'bg-[#141F24]', 
          border: 'border-red-600/30', 
          text: 'text-red-500', 
          accent: 'bg-red-600',
          icon: <AlertCircle size={24} className="text-red-500" /> 
        };
      case 'warning': 
        return { 
          bg: 'bg-[#141F24]', 
          border: 'border-amber-600/30', 
          text: 'text-amber-500', 
          accent: 'bg-amber-600',
          icon: <AlertTriangle size={24} className="text-amber-500" /> 
        };
      case 'info': 
        return { 
          bg: 'bg-[#141F24]', 
          border: 'border-[#006470]/30', 
          text: 'text-[#00FFCC]', 
          accent: 'bg-[#006470]',
          icon: <Info size={24} className="text-[#00FFCC]" /> 
        };
      default: 
        return { 
          bg: 'bg-[#141F24]', 
          border: 'border-[#23333A]', 
          text: 'text-slate-400', 
          accent: 'bg-slate-700',
          icon: <Activity size={24} className="text-slate-500" /> 
        };
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-20 px-8 pt-10 text-[#F1F5F9] font-['IBM_Plex_Sans']">
      
      {/* 🔡 INDUSTRIAL STYLES */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
          .font-data { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
          .industrial-panel { background-color: #141F24; border: 1px solid #23333A; }
          .label-caps { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #94A3B8; }
          .input-field { background-color: #0B1215; border: 1px solid #23333A; padding: 12px 16px; border-radius: 4px; font-weight: 600; outline: none; }
        `}
      </style>

      {/* 🏛️ HEADER & ANALYTICS BAR */}
      <div className="flex flex-col xl:flex-row justify-between items-start gap-10 border-b border-[#23333A] pb-10">
        <div className="space-y-4 min-w-[350px]">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[#00FFCC]"></div>
            <span className="label-caps">Event Monitoring Engine</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight uppercase text-white">Incident Log</h1>
          <button 
            onClick={onClearAlarms}
            className="flex items-center gap-2 px-6 py-3 bg-[#141F24] hover:bg-red-900/20 text-red-500 border border-red-900/30 rounded-md transition-all font-bold text-[10px] uppercase tracking-widest"
          >
            <Trash2 size={16} /> Purge Analytics Cache
          </button>
        </div>

        {/* KPI TILES (Sert ve Net) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            <div className="industrial-panel p-6 rounded-md border-t-4 border-t-red-600">
                <p className="label-caps mb-4 !text-red-500">Critical Alarms</p>
                <h4 className="text-4xl font-bold font-data">{stats.critical}</h4>
            </div>
            <div className="industrial-panel p-6 rounded-md border-t-4 border-t-amber-600">
                <p className="label-caps mb-4 !text-amber-500">Warnings</p>
                <h4 className="text-4xl font-bold font-data">{stats.warning}</h4>
            </div>
            <div className="industrial-panel p-6 rounded-md border-t-4 border-t-[#006470]">
                <p className="label-caps mb-4 !text-[#00FFCC]">Total Events</p>
                <h4 className="text-4xl font-bold font-data">{stats.total}</h4>
            </div>
        </div>
      </div>

      {/* 🔍 SEARCH & FILTERS */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-[#141F24] p-2 rounded-md border border-[#23333A]">
        <div className="flex-1 flex items-center gap-4 px-4 py-2 border-r border-[#23333A]">
          <Search size={18} className="text-[#006470]" />
          <input 
            type="text" 
            placeholder="FILTER BY LOG MESSAGE, ENGINE OR CODE..." 
            className="bg-transparent border-none outline-none text-[10px] text-white w-full font-bold uppercase tracking-widest placeholder:text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-1 px-2">
            {['all', 'critical', 'warning', 'info'].map((f) => (
                <button 
                    key={f}
                    onClick={() => setSeverityFilter(f)}
                    className={`px-4 py-2 rounded text-[9px] font-bold uppercase tracking-widest transition-all ${severityFilter === f ? 'bg-[#006470] text-white' : 'text-slate-500 hover:text-white'}`}
                >
                    {f}
                </button>
            ))}
        </div>
      </div>

      {/* 📋 INCIDENT FEED */}
      <div className="space-y-4">
        {filteredAlarms.length === 0 ? (
          <div className="py-32 text-center industrial-panel border-dashed rounded-md opacity-30 flex flex-col items-center gap-6">
            <CheckCircle2 size={48} className="text-[#006470]" />
            <p className="label-caps tracking-[0.3em]">Zero Anomalies Discovered // System Idle</p>
          </div>
        ) : (
          filteredAlarms.map((a, i) => {
            const styles = getSeverityStyles(a.severity);
            const isComplex = a.is_complex === true || a.threshold === "DYNAMIC";
            
            return (
              <div key={i} className={`industrial-panel p-0 rounded-md flex flex-col xl:flex-row transition-all hover:border-slate-500 overflow-hidden`}>
                
                {/* Status Indicator Bar */}
                <div className={`w-full xl:w-1.5 h-1.5 xl:h-auto ${styles.accent}`} />
                
                <div className="flex-1 p-6 flex flex-col xl:flex-row justify-between items-center gap-8">
                  
                  <div className="flex items-center gap-6 w-full xl:w-auto">
                    <div className="p-4 bg-[#0B1215] rounded border border-[#23333A] flex items-center justify-center min-w-[64px]">
                      {isComplex ? <Layers size={24} className="text-purple-500" /> : styles.icon}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest bg-[#0B1215] ${styles.text} ${styles.border}`}>
                          {a.severity?.toUpperCase()}
                        </span>
                        {isComplex && (
                          <span className="text-[8px] font-bold px-2 py-0.5 rounded border border-purple-500/30 text-purple-400 bg-purple-500/10 uppercase tracking-widest">
                             Complex Logic
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[#64748B] font-bold text-[9px] uppercase tracking-widest bg-[#0B1215] px-2 py-0.5 rounded border border-[#23333A]">
                          <Clock size={10} /> {a.time}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-white tracking-tight uppercase">
                        {a.message}
                      </h3>
                      
                      <div className="flex items-center gap-2">
                          <Terminal size={12} className="text-[#006470]" />
                          <p className="text-[9px] text-[#64748B] font-bold uppercase tracking-widest">
                            Source: <span className="text-slate-300">{a.ruleName}</span>
                          </p>
                      </div>
                    </div>
                  </div>

                  {/* Values Data Cell (Monospace) */}
                  <div className="flex items-center gap-8 w-full xl:w-auto border-t xl:border-t-0 xl:border-l border-[#23333A] pt-6 xl:pt-0 xl:pl-8">
                    <div className="flex flex-col items-end">
                      <p className="label-caps mb-2 flex items-center gap-2">
                          <BarChart3 size={12} /> Live Value
                      </p>
                      <div className={`text-4xl font-bold font-data tracking-tighter ${styles.text}`}>
                        {isComplex ? "STACK" : (isNaN(a.value) ? a.value : Number(a.value).toFixed(2))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 px-4 py-2 bg-[#0B1215] border border-[#23333A] rounded">
                        <div className="flex flex-col">
                          <span className="text-[7px] font-bold text-[#64748B] uppercase tracking-widest">Threshold</span>
                          <span className={`text-[11px] font-bold uppercase font-data ${isComplex ? "text-purple-400" : "text-[#00FFCC]"}`}>
                              {isComplex ? "LOGIC" : a.threshold}
                          </span>
                        </div>
                        <ArrowRight size={14} className="text-slate-700" />
                        <ShieldAlert size={14} className={styles.text} />
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Incidents;