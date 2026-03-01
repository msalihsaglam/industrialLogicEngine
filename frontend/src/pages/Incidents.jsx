import React from 'react';
import { Activity, AlertCircle, AlertTriangle, Info, Layers, Trash2, Search } from 'lucide-react';

const Incidents = ({ alarms, onClearAlarms }) => {
  const getSeverityStyles = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: <AlertCircle size={20} /> };
      case 'warning': return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: <AlertTriangle size={20} /> };
      case 'info': return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: <Info size={20} /> };
      default: return { bg: 'bg-slate-800/20', border: 'border-slate-800', text: 'text-slate-400', icon: <Activity size={20} /> };
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-right duration-500 pb-20 px-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter">INCIDENT LOG</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] mt-1">Logic Engine Event History</p>
        </div>
        <button 
          onClick={onClearAlarms}
          className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-2xl transition-all font-black text-xs"
        >
          <Trash2 size={16} /> CLEAR SESSION LOGS
        </button>
      </div>

      {/* FİLTRELEME ALANI (Placeholder) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
          <Search size={18} className="text-slate-600" />
          <input type="text" placeholder="Search incidents..." className="bg-transparent border-none outline-none text-sm text-slate-300 w-full" />
        </div>
        {/* Buraya ileride tarih seçici vb. gelecek */}
      </div>

      <div className="space-y-4">
        {alarms.length === 0 ? (
          <div className="py-32 text-center bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-[3rem]">
            <Activity size={48} className="mx-auto text-slate-800 mb-4" />
            <p className="text-slate-500 font-bold italic">No incidents recorded in the current session.</p>
          </div>
        ) : (
          alarms.map((a, i) => {
            const styles = getSeverityStyles(a.severity);
            const isComplex = a.is_complex === true || a.threshold === "DYNAMIC";
            return (
              <div key={i} className={`${styles.bg} ${styles.border} border-2 p-6 rounded-[2rem] flex justify-between items-center group transition-all hover:scale-[1.01]`}>
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                    {isComplex ? <Layers size={24} className="text-purple-500" /> : styles.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${styles.text} ${styles.border}`}>{a.severity}</span>
                      <span className="text-[10px] text-slate-600 font-mono">{a.time}</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-100">{a.message}</h3>
                    <p className="text-xs text-slate-500 font-bold mt-1 opacity-70 uppercase tracking-tighter">Rule: {a.ruleName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-black ${styles.text} leading-none mb-1`}>
                    {isComplex ? "---" : Number(a.value).toFixed(2)}
                  </div>
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    Limit: {isComplex ? "COMPLEX" : a.threshold}
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