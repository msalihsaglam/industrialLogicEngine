import React from 'react';
import { Gauge, Thermometer, Activity, AlertTriangle, Cpu, CircleOff, AlertCircle, Info, Radio } from 'lucide-react';

const Dashboard = ({ liveData = {}, alarms = [], connections = [] }) => {
  
  const formatVal = (val) => {
    if (val === undefined || val === null) return "0.00";
    return Number(val).toFixed(2);
  };

  // --- SEVERITY STİL YARDIMCISI ---
  const getSeverityStyles = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return {
          border: 'border-red-500/30',
          bg: 'bg-red-500/5',
          text: 'text-red-400',
          icon: <AlertCircle size={18} className="text-red-500" />
        };
      case 'warning':
        return {
          border: 'border-amber-500/30',
          bg: 'bg-amber-500/5',
          text: 'text-amber-400',
          icon: <AlertTriangle size={18} className="text-amber-500" />
        };
      case 'info':
        return {
          border: 'border-blue-500/30',
          bg: 'bg-blue-500/5',
          text: 'text-blue-400',
          icon: <Info size={18} className="text-blue-500" />
        };
      default:
        return {
          border: 'border-slate-800',
          bg: 'bg-slate-800/20',
          text: 'text-slate-400',
          icon: <Activity size={18} className="text-slate-500" />
        };
    }
  };

  const getIcon = (tagName) => {
    const name = tagName.toLowerCase();
    if (name.includes('pres')) return <Gauge size={18} className="text-blue-400" />;
    if (name.includes('temp')) return <Thermometer size={18} className="text-orange-400" />;
    return <Activity size={18} className="text-green-400" />;
  };

  const getColorClass = (tagName) => {
    const name = tagName.toLowerCase();
    if (name.includes('pres')) return "text-blue-400";
    if (name.includes('temp')) return "text-orange-400";
    return "text-green-400";
  };

  const activeConnections = connections.filter(c => c.enabled);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* AKTİF SİSTEMLER VE VERİ AKIŞLARI */}
      {activeConnections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-slate-900/40 border border-dashed border-slate-800 rounded-[3rem]">
          <div className="p-5 bg-slate-800/50 rounded-full mb-4 text-slate-600">
            <CircleOff size={48} />
          </div>
          <h3 className="text-xl font-bold text-slate-400">No Active Gateways</h3>
          <p className="text-slate-600 text-sm mt-2 italic">Enable your connections in the Connectivity Manager.</p>
        </div>
      ) : (
        activeConnections.map((conn) => {
          const connectionTags = Object.keys(liveData).filter(key => key.startsWith(`${conn.name}:`));

          return (
            <div key={conn.id} className="space-y-5">
              {/* Grup Başlığı */}
              <div className="flex items-center justify-between border-b border-slate-800/50 pb-3 mx-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${conn.status ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Cpu size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-100 tracking-tight leading-none">{conn.name}</h2>
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1 block">
                      {conn.endpoint_url}
                    </span>
                  </div>
                </div>
                
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black tracking-tighter ${
                  conn.status 
                    ? "bg-green-500/5 text-green-500 border-green-500/20" 
                    : "bg-red-500/5 text-red-500 border-red-500/20"
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${conn.status ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  {conn.status ? "STREAMING" : "CONNECTING..."}
                </div>
              </div>

              {/* Sensör Kartları */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {connectionTags.map((fullKey) => {
                  const tagName = fullKey.split(':')[1];
                  return (
                    <div key={fullKey} className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-xl hover:border-slate-700 transition-all group relative overflow-hidden">
                      <h2 className="text-slate-500 text-[10px] mb-4 flex items-center gap-2 uppercase font-black tracking-[0.2em]">
                        {getIcon(tagName)} {tagName}
                      </h2>
                      <div className={`text-5xl font-black tracking-tighter ${getColorClass(tagName)}`}>
                        {formatVal(liveData[fullKey])} 
                        <span className="text-sm text-slate-600 ml-2 font-bold uppercase tracking-widest italic">Live</span>
                      </div>

                      {/* YENİ: KÜÇÜK METRİKLER (Health & Sync) */}
                      <div className="mt-6 pt-4 border-t border-slate-800/50 flex items-center justify-between">
                         <div className="flex items-center gap-1.5">
                            <Radio size={10} className="text-green-500 animate-pulse" />
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Signal: Stable</span>
                         </div>
                         <div className="text-[9px] text-slate-600 font-mono italic">
                            Updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                         </div>
                      </div>
                    </div>
                  );
                })}
                
                {conn.status && connectionTags.length === 0 && (
                  <div className="col-span-full py-10 bg-slate-900/30 rounded-[2rem] border border-dashed border-slate-800 flex items-center justify-center gap-3">
                    <Activity size={18} className="text-slate-700 animate-spin" />
                    <p className="text-slate-600 italic text-sm">Synchronizing data nodes...</p>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* RECENT ALARMS - SEVERITY BAZLI RENKLENDİRME */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        <h2 className="text-slate-400 font-bold mb-8 flex items-center gap-2 uppercase text-xs tracking-[0.3em]">
          <Activity size={18} className="text-blue-500"/> Logic Engine Event Log
        </h2>
        <div className="space-y-3">
          {alarms.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/20 rounded-[2rem] border border-dashed border-slate-800">
                <p className="text-slate-600 italic text-sm">Safe operation. No logic incidents reported.</p>
            </div>
          ) : (
alarms.map((a, i) => {
  const styles = getSeverityStyles(a.severity);
  return (
    <div key={i} className={`${styles.bg} ${styles.border} border p-5 rounded-2xl flex justify-between items-center transition-all`}>
      <div className="flex items-center gap-5">
        {styles.icon}
        <div>
          {/* 1. ANA MESAJ: text-sm -> text-base veya text-lg yapabilirsin */}
          <div className={`font-bold text-lg tracking-tight ${styles.text}`}>
            {a.message}
          </div>
          
          {/* 2. ALT BİLGİ (Kural & Zaman): text-[10px] -> text-xs yapabilirsin */}
          <div className="text-xs text-slate-500 font-mono mt-1 opacity-70">
            {a.ruleName || 'Custom Logic'} • {a.time}
          </div>
        </div>
      </div>

      <div className="text-right">
          {/* 3. TETİKLEYEN DEĞER: text-xl -> text-2xl veya text-3xl yapabilirsin */}
          <div className={`${styles.text} font-black text-2xl leading-none`}>
            {formatVal(a.value)}
          </div>
          
          {/* 4. EŞİK DEĞERİ: text-[9px] -> text-[11px] veya text-xs yapabilirsin */}
          <div className="text-[11px] text-slate-600 font-bold uppercase mt-1 tracking-widest">
            Threshold: {a.threshold || 'N/A'}
          </div>
      </div>
    </div>
  );
})
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;