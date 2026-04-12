import React, { useState, useMemo } from 'react';
import { 
  Activity, AlertCircle, AlertTriangle, Info, Layers, 
  Trash2, Search, Clock, ShieldAlert, Terminal, ArrowRight, 
  CheckCircle2, BarChart3
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Incidents = ({ alarms = [], onClearAlarms }) => {
  const { t } = useTranslation();
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
          text: 'text-[var(--ind-red)]', 
          accent: 'bg-[var(--ind-red)]',
          border: 'border-[var(--ind-red)]/30',
          icon: <AlertCircle size={22} className="text-[var(--ind-red)]" /> 
        };
      case 'warning': 
        return { 
          text: 'text-[var(--ind-amber)]', 
          accent: 'bg-[var(--ind-amber)]',
          border: 'border-[var(--ind-amber)]/30',
          icon: <AlertTriangle size={22} className="text-[var(--ind-amber)]" /> 
        };
      case 'info': 
        return { 
          text: 'text-[var(--ind-cyan)]', 
          accent: 'bg-[var(--ind-petroleum)]',
          border: 'border-[var(--ind-petroleum)]/30',
          icon: <Info size={22} className="text-[var(--ind-cyan)]" /> 
        };
      default: 
        return { 
          text: 'text-[var(--ind-slate)]', 
          accent: 'bg-slate-700',
          border: 'border-[var(--ind-border)]',
          icon: <Activity size={22} className="text-slate-500" /> 
        };
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-20 px-8 pt-10 font-sans">
      
      {/* 🏛️ HEADER & ANALYTICS BAR */}
      <div className="flex flex-col xl:flex-row justify-between items-start gap-10 border-b border-[var(--ind-border)] pb-10">
        <div className="space-y-4 min-w-[350px]">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[var(--ind-cyan)]"></div>
            <span className="ind-label">Event Monitoring Engine</span>
          </div>
          <h1 className="ind-title">Incident Log</h1>
          <button 
            onClick={onClearAlarms}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-950/10 hover:bg-red-600 hover:text-white text-[var(--ind-red)] border border-red-900/20 rounded-[var(--ind-radius)] transition-all text-[9px] font-black uppercase tracking-[0.2em]"
          >
            <Trash2 size={14} /> Purge Analytics Cache
          </button>
        </div>

        {/* KPI TILES (IDS Layout) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            <div className="ind-panel p-6 border-t-4 border-t-[var(--ind-red)]">
                <p className="ind-label mb-4 !text-[var(--ind-red)]">Critical Alarms</p>
                <h4 className="ind-value-lg text-white">{stats.critical}</h4>
            </div>
            <div className="ind-panel p-6 border-t-4 border-t-[var(--ind-amber)]">
                <p className="ind-label mb-4 !text-[var(--ind-amber)]">Warnings</p>
                <h4 className="ind-value-lg text-white">{stats.warning}</h4>
            </div>
            <div className="ind-panel p-6 border-t-4 border-t-[var(--ind-petroleum)]">
                <p className="ind-label mb-4 !text-[var(--ind-cyan)]">Total Events</p>
                <h4 className="ind-value-lg text-white">{stats.total}</h4>
            </div>
        </div>
      </div>

      {/* 🔍 SEARCH & FILTERS (Industrial Input) */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-[var(--ind-panel)] p-2 rounded-[var(--ind-radius)] border border-[var(--ind-border)]">
        <div className="flex-1 flex items-center gap-4 px-4 py-2 border-r border-[var(--ind-border)]">
          <Search size={16} className="text-[var(--ind-petroleum)]" />
          <input 
            type="text" 
            placeholder="FILTER BY LOG MESSAGE, ENGINE OR CODE..." 
            className="bg-transparent border-none outline-none text-[10px] text-white w-full font-bold uppercase tracking-[0.2em] placeholder:text-slate-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-1 px-2">
            {['all', 'critical', 'warning', 'info'].map((f) => (
                <button 
                    key={f}
                    onClick={() => setSeverityFilter(f)}
                    className={`px-4 py-2 rounded-[var(--ind-radius)] text-[9px] font-black uppercase tracking-widest transition-all ${severityFilter === f ? 'bg-[var(--ind-petroleum)] text-white' : 'text-slate-600 hover:text-white'}`}
                >
                    {f}
                </button>
            ))}
        </div>
      </div>

      {/* 📋 INCIDENT FEED (IDS List Style) */}
      <div className="space-y-4">
        {filteredAlarms.length === 0 ? (
          <div className="py-32 text-center ind-panel border-dashed opacity-30 flex flex-col items-center gap-6">
            <CheckCircle2 size={48} className="text-[var(--ind-petroleum)]" />
            <p className="ind-label tracking-[0.3em]">Zero Anomalies Discovered // System Idle</p>
          </div>
        ) : (
          filteredAlarms.map((a, i) => {
            const styles = getSeverityStyles(a.severity);
            const isComplex = a.is_complex === true || a.threshold === "DYNAMIC";
            
            return (
              <div key={i} className="ind-panel p-0 flex flex-col xl:flex-row transition-all hover:border-slate-600 group overflow-hidden">
                
                {/* Status Indicator Bar */}
                <div className={`w-full xl:w-1.5 h-1.5 xl:h-auto ${styles.accent}`} />
                
                <div className="flex-1 p-6 flex flex-col xl:flex-row justify-between items-center gap-8">
                  
                  <div className="flex items-center gap-8 w-full xl:w-auto">
                    {/* Icon Cell */}
                    <div className="p-4 bg-[var(--ind-bg)] rounded border border-[var(--ind-border)] flex items-center justify-center min-w-[68px] shadow-inner group-hover:border-[var(--ind-slate)]/20 transition-all">
                      {isComplex ? <Layers size={24} className="text-purple-500" /> : styles.icon}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className={`ind-status-badge ${styles.text} ${styles.border} bg-[var(--ind-bg)]`}>
                          {a.severity?.toUpperCase()}
                        </span>
                        {isComplex && (
                          <span className="ind-status-badge text-purple-400 border-purple-500/20 bg-purple-500/5">
                             Complex Logic
                          </span>
                        )}
                        <span className="flex items-center gap-2 text-[var(--ind-slate)] ind-data text-[10px] uppercase tracking-tighter bg-[var(--ind-bg)] px-2.5 py-0.5 rounded border border-[var(--ind-border)]">
                          <Clock size={10} /> {a.time}
                        </span>
                      </div>
                      
                      <h3 className="ind-subtitle !text-lg !text-white !normal-case tracking-tight">
                        {a.message}
                      </h3>
                      
                      <div className="flex items-center gap-2">
                          <Terminal size={12} className="text-[var(--ind-petroleum)]" />
                          <p className="ind-label !text-[9px] !text-[var(--ind-slate)] opacity-60 lowercase">
                            engine_node: <span className="text-slate-300 font-bold">{a.ruleName}</span>
                          </p>
                      </div>
                    </div>
                  </div>

                  {/* Values Data Cell (IDS Mono Style) */}
                  <div className="flex items-center gap-10 w-full xl:w-auto border-t xl:border-t-0 xl:border-l border-[var(--ind-border)] pt-6 xl:pt-0 xl:pl-10">
                    <div className="flex flex-col items-end">
                      <p className="ind-label mb-2 flex items-center gap-2 opacity-50">
                          <BarChart3 size={12} /> Live Capture
                      </p>
                      <div className={`ind-value-md !text-4xl ${styles.text}`}>
                        {isComplex ? "STACK" : (isNaN(a.value) ? a.value : Number(a.value).toFixed(2))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 px-4 py-2.5 bg-[var(--ind-bg)] border border-[var(--ind-border)] rounded shadow-inner">
                        <div className="flex flex-col">
                          <span className="text-[7px] font-black text-[var(--ind-slate)] uppercase tracking-[0.2em]">Threshold</span>
                          <span className={`text-[12px] ind-data uppercase ${isComplex ? "text-purple-400" : "text-[var(--ind-cyan)]"}`}>
                              {isComplex ? "LOGIC" : a.threshold}
                          </span>
                        </div>
                        <ArrowRight size={14} className="text-slate-800" />
                        <ShieldAlert size={16} className={styles.text} />
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