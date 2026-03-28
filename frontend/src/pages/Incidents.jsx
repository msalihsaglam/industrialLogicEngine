import React from 'react';
import { 
  Activity, AlertCircle, AlertTriangle, Info, Layers, 
  Trash2, Search, Clock, ShieldAlert, Terminal, ArrowRight, Activity as PulseIcon
} from 'lucide-react';

const Incidents = ({ alarms, onClearAlarms }) => {
  const getSeverityStyles = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': 
        return { 
          bg: 'bg-red-950/20', 
          border: 'border-red-500/30', 
          text: 'text-red-500', 
          accent: 'bg-red-600',
          icon: <AlertCircle size={28} className="text-red-500" /> 
        };
      case 'warning': 
        return { 
          bg: 'bg-amber-950/20', 
          border: 'border-amber-500/30', 
          text: 'text-amber-500', 
          accent: 'bg-amber-600',
          icon: <AlertTriangle size={28} className="text-amber-500" /> 
        };
      case 'info': 
        return { 
          bg: 'bg-[#009999]/5', 
          border: 'border-[#009999]/20', 
          text: 'text-[#00ffcc]', 
          accent: 'bg-[#009999]',
          icon: <Info size={28} className="text-[#00ffcc]" /> 
        };
      default: 
        return { 
          bg: 'bg-slate-900/40', 
          border: 'border-slate-800', 
          text: 'text-slate-400', 
          accent: 'bg-slate-700',
          icon: <Activity size={28} className="text-slate-500" /> 
        };
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-700 pb-20 px-6 pt-10 text-white">
      
      {/* 🏛️ SIEMENS STYLE HEADER (WITH INTEGRATED GUIDE) */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-10 border-b-2 border-slate-800 pb-12">
        
        {/* Left: Title Section */}
        <div className="space-y-1 min-w-[300px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-1 bg-[#00ffcc]"></div>
            <span className="text-[#00ffcc] text-[10px] font-black uppercase tracking-[0.5em]">Event History Broker</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Incident Log</h1>
          <p className="text-slate-500 text-[11px] font-bold tracking-[0.2em] uppercase flex items-center gap-2 mt-4 italic">
             <Terminal size={14} className="text-[#009999]" /> Sequence of Events
          </p>
          
          <button 
            onClick={onClearAlarms}
            className="mt-6 flex items-center gap-3 px-6 py-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border-2 border-red-600/20 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 shadow-2xl"
          >
            <Trash2 size={16} /> Purge Session Records
          </button>
        </div>

        {/* 🎯 RIGHT: INTEGRATED LOG INTERPRETATION GUIDE (Next to Title) */}
        <div className="flex-1 bg-slate-900/40 border-2 border-slate-800/50 p-6 rounded-[2.5rem] relative overflow-hidden flex flex-col md:flex-row gap-6">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><ShieldAlert size={80}/></div>
            
            <div className="p-4 bg-[#009999]/10 text-[#00ffcc] rounded-2xl h-fit shadow-inner">
                <Info size={24}/>
            </div>

            <div className="space-y-4">
                <h5 className="text-[11px] font-black text-white uppercase italic tracking-widest border-b border-slate-800 pb-2 inline-block">
                    Log Interpretation Guide
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <p className="text-[10px] text-[#00ffcc] font-black uppercase tracking-tighter italic">Integrity</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight">Records are timestamped directly from the PLC Control Layer.</p>
                    </div>
                    <div className="space-y-1 border-l-2 border-slate-800/50 pl-4">
                        <p className="text-[10px] text-red-500 font-black uppercase tracking-tighter italic">Criticality</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight">Red logs indicate hardware failure or logic breaches.</p>
                    </div>
                    <div className="space-y-1 border-l-2 border-slate-800/50 pl-4">
                        <p className="text-[10px] text-purple-400 font-black uppercase tracking-tighter italic">Multi-Logic</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight">Incidents triggered by dynamic node-to-node comparisons.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* 🔍 FILTER & STATUS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2 bg-[#0b1117] border-2 border-slate-800 p-5 rounded-2xl flex items-center gap-4 focus-within:border-[#009999] transition-all shadow-inner">
          <Search size={22} className="text-[#009999]" />
          <input 
            type="text" 
            placeholder="FILTER BY LOG MESSAGE OR RULE..." 
            className="bg-transparent border-none outline-none text-xs text-white w-full font-black uppercase tracking-widest placeholder:text-slate-700" 
          />
        </div>
        <div className="bg-slate-900/40 border-2 border-slate-800 p-5 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black text-slate-500 uppercase tracking-widest italic">
            <PulseIcon size={16} className="text-[#00ffcc] animate-pulse" /> Status: Live Feed
        </div>
        <div className="bg-slate-900/40 border-2 border-slate-800 p-5 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black text-[#00ffcc] uppercase tracking-widest italic">
            <Layers size={16} /> Data Stack: {alarms.length} Items
        </div>
      </div>

      {/* 📋 INCIDENT LIST */}
      <div className="space-y-6">
        {alarms.length === 0 ? (
          <div className="py-40 text-center bg-[#0b1117] border-2 border-dashed border-slate-800 rounded-[4rem] transition-all opacity-30">
            <Activity size={80} className="mx-auto text-[#009999] mb-8" />
            <p className="text-white font-black uppercase tracking-[0.5em] text-xs italic">System Clear // No Anomalies Detected</p>
          </div>
        ) : (
          alarms.map((a, i) => {
            const styles = getSeverityStyles(a.severity);
            const isComplex = a.is_complex === true || a.threshold === "DYNAMIC";
            
            return (
              <div key={i} className={`group ${styles.bg} ${styles.border} border-2 p-8 rounded-[3rem] flex flex-col md:flex-row justify-between items-center gap-8 transition-all hover:bg-slate-900 hover:border-slate-700 relative overflow-hidden`}>
                
                {/* Side Accent Bar */}
                <div className={`absolute top-0 left-0 w-2 h-full ${styles.accent} transition-transform duration-500`} />
                
                <div className="flex items-center gap-8 w-full md:w-auto">
                  <div className="p-6 bg-slate-950 rounded-3xl border-2 border-slate-800 shadow-2xl group-hover:border-[#009999]/30 transition-all">
                    {isComplex ? <Layers size={32} className="text-purple-500" /> : styles.icon}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg border-2 uppercase italic tracking-widest ${styles.text} ${styles.border} bg-slate-950/50`}>
                        {a.severity?.toUpperCase()}
                      </span>
                      {isComplex && (
                        <span className="text-[10px] font-black px-3 py-1.5 rounded-lg border-2 border-purple-500/30 text-purple-400 bg-purple-500/10 uppercase italic">
                          Multi-Logic
                        </span>
                      )}
                      <div className="flex items-center gap-2 text-slate-600 font-black text-[10px] uppercase tracking-widest opacity-60 italic">
                        <Clock size={12} /> {a.time}
                      </div>
                    </div>
                    
                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-tight group-hover:text-[#00ffcc] transition-colors">
                      {a.message}
                    </h3>
                    
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-[1px] bg-slate-800"></div>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">
                          Source Engine: <span className="text-slate-300 italic">{a.ruleName}</span>
                        </p>
                    </div>
                  </div>
                </div>

                {/* Values Panel */}
                <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 border-t-2 md:border-t-0 border-slate-800/50 pt-6 md:pt-0">
                  <div className="flex flex-col items-end">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 italic">Recorded Value</p>
                    <div className={`text-5xl font-black tracking-tighter font-mono italic ${styles.text}`}>
                      {isComplex ? <Activity size={40} className="opacity-20" /> : (isNaN(a.value) ? a.value : Number(a.value).toFixed(2))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-950 border-2 border-slate-800 rounded-xl">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Threshold</span>
                        <ArrowRight size={14} className="text-[#009999]" />
                        <span className={`text-[11px] font-black ${isComplex ? "text-purple-400 italic" : "text-[#00ffcc] font-mono"}`}>
                          {isComplex ? "LOGIC_MAP" : a.threshold}
                        </span>
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