import React from 'react';
import { Activity, AlertCircle, AlertTriangle, Info, Layers, Trash2, Search } from 'lucide-react';

const Incidents = ({ alarms, onClearAlarms }) => {
  const getSeverityStyles = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': 
        return { 
          bg: 'bg-red-500/5', 
          border: 'border-red-500/20', 
          text: 'text-red-400', 
          icon: <AlertCircle size={24} className="text-red-500" /> 
        };
      case 'warning': 
        return { 
          bg: 'bg-amber-500/5', 
          border: 'border-amber-500/20', 
          text: 'text-amber-400', 
          icon: <AlertTriangle size={24} className="text-amber-500" /> 
        };
      case 'info': 
        return { 
          bg: 'bg-blue-500/5', 
          border: 'border-blue-500/20', 
          text: 'text-blue-400', 
          icon: <Info size={24} className="text-blue-500" /> 
        };
      default: 
        return { 
          bg: 'bg-slate-800/20', 
          border: 'border-slate-800', 
          text: 'text-slate-400', 
          icon: <Activity size={24} className="text-slate-500" /> 
        };
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 pb-20 px-4">
      
      {/* STANDART SAYFA BAŞLIĞI */}
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Incident Log</h1>
          <p className="text-slate-500 text-[10px] font-black tracking-[0.4em] mt-2 italic uppercase">
            System Events & Logic Engine History Records
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={onClearAlarms}
            className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 shadow-lg shadow-red-900/10"
          >
            <Trash2 size={16} /> Clear Session Logs
          </button>
        </div>
      </div>

      {/* FİLTRELEME VE ARAMA ALANI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
        <div className="md:col-span-2 bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 focus-within:border-blue-500/50 transition-all shadow-inner">
          <Search size={18} className="text-slate-600" />
          <input 
            type="text" 
            placeholder="Search by rule name or message..." 
            className="bg-transparent border-none outline-none text-sm text-slate-300 w-full font-medium" 
          />
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
           Status: Real-time Monitoring
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest">
           Total: {alarms.length} Incidents
        </div>
      </div>

      {/* OLAY LİSTESİ */}
      <div className="space-y-4">
        {alarms.length === 0 ? (
          <div className="py-32 text-center bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-[3rem] transition-all">
            <Activity size={56} className="mx-auto text-slate-800 mb-6 opacity-20" />
            <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-xs italic">No incidents recorded in the current session</p>
          </div>
        ) : (
          alarms.map((a, i) => {
            const styles = getSeverityStyles(a.severity);
            const isComplex = a.is_complex === true || a.threshold === "DYNAMIC" || a.threshold === "Complex Logic";
            
            return (
              <div key={i} className={`group ${styles.bg} ${styles.border} border-2 p-6 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 transition-all hover:scale-[1.01] hover:shadow-2xl hover:bg-slate-900/40 relative overflow-hidden`}>
                
                {/* Sol Kısım: İkon ve Mesaj */}
                <div className="flex items-center gap-6 w-full md:w-auto">
                  <div className="p-5 bg-slate-950 rounded-[1.5rem] border border-slate-800 shadow-xl group-hover:border-slate-700 transition-colors">
                    {isComplex ? <Layers size={28} className="text-purple-500" /> : styles.icon}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg border uppercase shadow-sm ${styles.text} ${styles.border} bg-slate-950/50`}>
                        {a.severity}
                      </span>
                      {isComplex && (
                        <span className="text-[9px] font-black px-2.5 py-1 rounded-lg border border-purple-500/30 text-purple-400 bg-purple-500/10 uppercase tracking-tighter">
                          Complex
                        </span>
                      )}
                      <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest ml-2 opacity-60">
                        {a.time}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-100 tracking-tight leading-tight group-hover:text-white transition-colors">
                      {a.message}
                    </h3>
                    <div className="flex items-center gap-2">
                       <Activity size={12} className="text-slate-700" />
                       <p className="text-xs text-slate-600 font-bold uppercase tracking-widest opacity-80">
                         Rule: {a.ruleName}
                       </p>
                    </div>
                  </div>
                </div>

                {/* Sağ Kısım: Değerler */}
                <div className="text-right border-t md:border-t-0 border-slate-800/50 pt-4 md:pt-0 w-full md:w-auto flex md:flex-col justify-between items-end">
                  <div className={`text-4xl font-black tracking-tighter ${styles.text} leading-none mb-1`}>
                    {isComplex ? <Activity size={32} className="inline opacity-20" /> : (isNaN(a.value) ? a.value : Number(a.value).toFixed(2))}
                  </div>
                  <div className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="opacity-50">Limit:</span>
                    <span className={isComplex ? "text-purple-500/50 italic" : "text-slate-400 font-mono"}>
                      {isComplex ? "COMPLEX_MAPPING" : a.threshold}
                    </span>
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