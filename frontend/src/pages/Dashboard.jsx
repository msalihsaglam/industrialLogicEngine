import React from 'react';
import { 
  Gauge, Thermometer, Activity, AlertTriangle, Cpu, 
  CircleOff, AlertCircle, Info, Radio, Layers, Zap 
} from 'lucide-react';

const Dashboard = ({ liveData = {}, alarms = [], connections = [] }) => {
  
  const formatVal = (val) => {
    if (val === undefined || val === null) return "0.00";
    // Eğer değer bir sayı değilse (Complex modda "MULTIPLE" gibi bir string gelebilir) doğrudan döndür
    if (isNaN(val)) return val;
    return Number(val).toFixed(2);
  };

  const getSeverityStyles = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return {
          border: 'border-red-500/30',
          bg: 'bg-red-500/10',
          text: 'text-red-400',
          icon: <AlertCircle size={20} className="text-red-500" />
        };
      case 'warning':
        return {
          border: 'border-amber-500/30',
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          icon: <AlertTriangle size={20} className="text-amber-500" />
        };
      case 'info':
        return {
          border: 'border-blue-500/30',
          bg: 'bg-blue-500/10',
          text: 'text-blue-400',
          icon: <Info size={20} className="text-blue-500" />
        };
      default:
        return {
          border: 'border-slate-800',
          bg: 'bg-slate-800/20',
          text: 'text-slate-400',
          icon: <Activity size={20} className="text-slate-500" />
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
      
      {/* 1. CANLI VERİ KARTLARI (Mevcut yapın korundu) */}
      {activeConnections.map((conn) => {
        const connectionTags = Object.keys(liveData).filter(key => key.startsWith(`${conn.name}:`));
        return (
          <div key={conn.id} className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/50 pb-3 mx-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${conn.status ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                  <Cpu size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100">{conn.name}</h2>
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest block">{conn.endpoint_url}</span>
                </div>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black tracking-tighter ${conn.status ? "bg-green-500/5 text-green-500 border-green-500/20" : "bg-red-500/5 text-red-500 border-red-500/20"}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${conn.status ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                {conn.status ? "STREAMING" : "CONNECTING..."}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {connectionTags.map((fullKey) => {
                const tagName = fullKey.split(':')[1];
                return (
                  <div key={fullKey} className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-xl group relative overflow-hidden transition-all hover:border-slate-600">
                    <h2 className="text-slate-500 text-[10px] mb-4 flex items-center gap-2 uppercase font-black tracking-[0.2em]">
                      {getIcon(tagName)} {tagName}
                    </h2>
                    <div className={`text-5xl font-black tracking-tighter ${getColorClass(tagName)}`}>
                      {formatVal(liveData[fullKey])} 
                      <span className="text-sm text-slate-600 ml-2 font-bold uppercase tracking-widest italic">Live</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* 2. LOGIC ENGINE EVENT LOG (GÜNCELLENEN KISIM) */}
      <div className="bg-slate-900 rounded-[3rem] p-10 border border-slate-800 shadow-2xl">
        <div className="flex justify-between items-center mb-10">
           <h2 className="text-slate-400 font-black flex items-center gap-3 uppercase text-xs tracking-[0.4em]">
             <Zap size={20} className="text-blue-500 shadow-blue-500/20"/> Logic Engine Incidents
           </h2>
           <span className="text-[10px] bg-slate-800 text-slate-500 px-4 py-1.5 rounded-full font-black tracking-widest">
             TOTAL: {alarms.length} EVENTS
           </span>
        </div>

        <div className="space-y-4">
          {alarms.length === 0 ? (
            <div className="text-center py-20 bg-slate-800/20 rounded-[2.5rem] border-2 border-dashed border-slate-800/50">
                <p className="text-slate-600 italic font-medium">No logic breaches detected. System nominal.</p>
            </div>
          ) : (
alarms.map((a, i) => {
  const styles = getSeverityStyles(a.severity);
  
  // KURALIN TİPİNİ BELİRLEME (Gelen veriye göre)
  // Eğer Backend'den is_complex true gelmişse veya threshold yazıyla "DYNAMIC" ise
  const isTopic3 = a.is_complex === true || a.threshold === "DYNAMIC";

  return (
    <div key={i} className={`group ${styles.bg} ${styles.border} border-2 p-6 rounded-[2rem] flex justify-between items-center transition-all`}>
      <div className="flex items-center gap-6">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
           {isTopic3 ? <Layers size={24} className="text-purple-500" /> : styles.icon}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border uppercase ${styles.text}`}>
              {a.severity}
            </span>
            {isTopic3 && (
              <span className="text-[9px] font-black px-2 py-0.5 rounded-md border border-purple-500/30 text-purple-400 bg-purple-500/5 uppercase">
                Topic 3 Logic
              </span>
            )}
            <span className="text-[10px] text-slate-600 font-bold ml-2 italic">{a.time}</span>
          </div>
          <div className="font-black text-xl text-slate-100">{a.message}</div>
          <div className="text-xs text-slate-500 font-bold mt-1 opacity-60">
            Rule: {a.ruleName}
          </div>
        </div>
      </div>

      <div className="text-right">
        {/* DEĞER GÖSTERİMİ */}
        <div className={`font-black text-3xl leading-none mb-1 ${styles.text}`}>
          {isTopic3 ? <Activity size={24} className="inline opacity-30" /> : formatVal(a.value)}
        </div>
        
        {/* EŞİK (THRESHOLD) GÖSTERİMİ */}
        <div className="text-[11px] font-black uppercase tracking-widest flex items-center justify-end gap-2">
          <span className="text-slate-600">LIMIT:</span>
          {isTopic3 ? (
            <span className="text-purple-400 animate-pulse">DYNAMIC TREE</span>
          ) : (
            <span className="text-slate-400 font-mono">{formatVal(a.threshold)}</span>
          )}
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