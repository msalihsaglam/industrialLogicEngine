import React, { useState, useMemo } from 'react';
import { 
  Activity, AlertCircle, AlertTriangle, Info, Layers, 
  Trash2, Search, Clock, ShieldAlert, Terminal, ArrowRight, 
  Activity as PulseIcon, CheckCircle2, Filter, BarChart3
} from 'lucide-react';

const Incidents = ({ alarms = [], onClearAlarms }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  // --- 📊 ANALYTICS CALCULATIONS ---
  const stats = useMemo(() => {
    return {
      total: alarms.length,
      critical: alarms.filter(a => a.severity?.toLowerCase() === 'critical').length,
      warning: alarms.filter(a => a.severity?.toLowerCase() === 'warning').length,
      info: alarms.filter(a => a.severity?.toLowerCase() === 'info').length
    };
  }, [alarms]);

  // --- 🔍 FILTERING LOGIC ---
  const filteredAlarms = useMemo(() => {
    return alarms
      .filter(a => {
        const matchesSearch = a.message?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             a.ruleName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSeverity = severityFilter === 'all' || a.severity?.toLowerCase() === severityFilter;
        return matchesSearch && matchesSeverity;
      })
      .sort((a, b) => {
        // Öncelik: Önce Kritikler, sonra uyarılar
        const priority = { critical: 1, warning: 2, info: 3 };
        return priority[a.severity?.toLowerCase()] - priority[b.severity?.toLowerCase()];
      });
  }, [alarms, searchTerm, severityFilter]);

  const getSeverityStyles = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': 
        return { 
          bg: 'bg-red-950/20', 
          border: 'border-red-500/30', 
          text: 'text-red-500', 
          accent: 'bg-red-600',
          icon: <AlertCircle size={32} className="text-red-500" /> 
        };
      case 'warning': 
        return { 
          bg: 'bg-amber-950/20', 
          border: 'border-amber-500/30', 
          text: 'text-amber-500', 
          accent: 'bg-amber-600',
          icon: <AlertTriangle size={32} className="text-amber-500" /> 
        };
      case 'info': 
        return { 
          bg: 'bg-[#009999]/5', 
          border: 'border-[#009999]/20', 
          text: 'text-[#00ffcc]', 
          accent: 'bg-[#009999]',
          icon: <Info size={32} className="text-[#00ffcc]" /> 
        };
      default: 
        return { 
          bg: 'bg-slate-900/40', 
          border: 'border-slate-800', 
          text: 'text-slate-400', 
          accent: 'bg-slate-700',
          icon: <Activity size={32} className="text-slate-500" /> 
        };
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-700 pb-20 px-6 pt-10 text-white font-sans">
      
      {/* 🏛️ HEADER & ANALYTICS BAR */}
      <div className="flex flex-col xl:flex-row justify-between items-start gap-10 border-b-2 border-slate-800 pb-12">
        <div className="space-y-1 min-w-[350px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-1 bg-[#00ffcc]"></div>
            <span className="text-[#00ffcc] text-[10px] font-black uppercase tracking-[0.5em]">Event Monitoring Engine</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Incident Log</h1>
          <p className="text-slate-500 text-[11px] font-bold tracking-[0.2em] uppercase flex items-center gap-2 mt-4 italic">
             <Terminal size={14} className="text-[#009999]" /> Real-Time Security Handshake
          </p>
          <button 
            onClick={onClearAlarms}
            className="mt-8 flex items-center gap-3 px-8 py-4 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border-2 border-red-600/20 rounded-2xl transition-all font-black text-[11px] uppercase tracking-widest active:scale-95 shadow-2xl group"
          >
            <Trash2 size={18} className="group-hover:rotate-12 transition-transform" /> Purge Analytics Cache
          </button>
        </div>

        {/* 📊 TOP ANALYTICS TILES */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <div className="bg-[#0b1117] border-2 border-red-500/20 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform"><AlertCircle size={80}/></div>
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 italic">Active Criticals</p>
                <h4 className="text-5xl font-black tracking-tighter italic">{stats.critical}</h4>
            </div>
            <div className="bg-[#0b1117] border-2 border-amber-500/20 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform"><AlertTriangle size={80}/></div>
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2 italic">Warnings Detected</p>
                <h4 className="text-5xl font-black tracking-tighter italic">{stats.warning}</h4>
            </div>
            <div className="bg-[#0b1117] border-2 border-[#009999]/20 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform"><CheckCircle2 size={80}/></div>
                <p className="text-[10px] font-black text-[#00ffcc] uppercase tracking-widest mb-2 italic">System Integrity</p>
                <h4 className="text-5xl font-black tracking-tighter italic">{stats.total}</h4>
            </div>
        </div>
      </div>

      {/* 🔍 SEARCH & QUICK FILTERS */}
      <div className="flex flex-col md:flex-row items-center gap-6 bg-slate-900/40 p-3 rounded-3xl border-2 border-slate-800 shadow-inner">
        <div className="flex-1 flex items-center gap-4 px-6 py-2 border-r-2 border-slate-800">
          <Search size={22} className="text-[#009999]" />
          <input 
            type="text" 
            placeholder="FILTER BY LOG MESSAGE, ENGINE OR CODE..." 
            className="bg-transparent border-none outline-none text-[11px] text-white w-full font-black uppercase tracking-[0.2em] placeholder:text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 px-4">
            {['all', 'critical', 'warning', 'info'].map((f) => (
                <button 
                    key={f}
                    onClick={() => setSeverityFilter(f)}
                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${severityFilter === f ? 'bg-[#009999] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    {f}
                </button>
            ))}
        </div>
      </div>

      {/* 📋 INCIDENT FEED */}
      <div className="space-y-6">
        {filteredAlarms.length === 0 ? (
          <div className="py-48 text-center bg-[#0b1117] border-2 border-dashed border-slate-800 rounded-[4rem] opacity-20 flex flex-col items-center gap-8">
            <Activity size={100} className="text-[#009999] animate-pulse" />
            <p className="text-white font-black uppercase tracking-[0.5em] text-xs italic">Zero Anomalies Discovered // System Idle</p>
          </div>
        ) : (
          filteredAlarms.map((a, i) => {
            const styles = getSeverityStyles(a.severity);
            const isComplex = a.is_complex === true || a.threshold === "DYNAMIC";
            
            return (
              <div key={i} className={`group ${styles.bg} ${styles.border} border-2 p-10 rounded-[3.5rem] flex flex-col xl:flex-row justify-between items-center gap-10 transition-all hover:bg-slate-900 hover:border-slate-600 relative overflow-hidden shadow-2xl`}>
                
                {/* Side Accent Bar */}
                <div className={`absolute top-0 left-0 w-2 h-full ${styles.accent} transition-transform duration-500 group-hover:w-3`} />
                
                <div className="flex items-center gap-10 w-full xl:w-auto">
                  <div className="p-8 bg-slate-950 rounded-[2rem] border-2 border-slate-800 shadow-2xl group-hover:border-[#009999]/30 transition-all flex items-center justify-center min-w-[100px] h-[100px]">
                    {isComplex ? <Layers size={44} className="text-purple-500 animate-pulse" /> : styles.icon}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-5">
                      <span className={`text-[10px] font-black px-4 py-2 rounded-lg border-2 uppercase italic tracking-[0.2em] shadow-inner ${styles.text} ${styles.border} bg-slate-950/80`}>
                        {a.severity?.toUpperCase()}
                      </span>
                      {isComplex && (
                        <span className="text-[10px] font-black px-4 py-2 rounded-lg border-2 border-purple-500/30 text-purple-400 bg-purple-500/20 uppercase italic tracking-widest">
                           Complex Logic Stack
                        </span>
                      )}
                      <div className="flex items-center gap-2 text-slate-500 font-black text-[10px] uppercase tracking-widest italic bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-800">
                        <Clock size={14} className="text-[#009999]" /> {a.time}
                      </div>
                    </div>
                    
                    <h3 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none group-hover:text-[#00ffcc] transition-colors">
                      {a.message}
                    </h3>
                    
                    <div className="flex items-center gap-4">
                        <Terminal size={14} className="text-slate-600" />
                        <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.1em] italic">
                          Deployment Engine: <span className="text-slate-300">{a.ruleName}</span>
                        </p>
                    </div>
                  </div>
                </div>

                {/* Values Visualization Panel */}
                <div className="flex flex-row xl:flex-col items-center xl:items-end justify-between w-full xl:w-auto gap-8 border-t-2 xl:border-t-0 xl:border-l-2 border-slate-800/50 pt-8 xl:pt-0 xl:pl-10">
                  <div className="flex flex-col items-end">
                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest mb-3 italic flex items-center gap-2">
                        <BarChart3 size={14} /> Recorded Node Value
                    </p>
                    <div className={`text-6xl font-black tracking-tighter font-mono italic leading-none ${styles.text}`}>
                      {isComplex ? <Layers size={48} className="opacity-20" /> : (isNaN(a.value) ? a.value : Number(a.value).toFixed(2))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 px-6 py-4 bg-slate-950 border-2 border-slate-800 rounded-[1.5rem] shadow-inner">
                      <div className="flex flex-col items-start mr-4">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Threshold</span>
                        <span className={`text-[13px] font-black uppercase ${isComplex ? "text-purple-400 italic" : "text-[#00ffcc] font-mono tracking-tighter"}`}>
                            {isComplex ? "LOGIC_STACK" : a.threshold}
                        </span>
                      </div>
                      <ArrowRight size={20} className="text-slate-700" />
                      <ShieldAlert size={20} className={styles.text} />
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