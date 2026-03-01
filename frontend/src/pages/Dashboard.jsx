import React from 'react';
import { 
  Gauge, Thermometer, Activity, Cpu, 
  CircleOff, Radio, ChevronRight 
} from 'lucide-react';

const Dashboard = ({ liveData = {}, connections = [] }) => {
  
  const formatVal = (val) => {
    if (val === undefined || val === null) return "0.00";
    if (isNaN(val)) return val;
    return Number(val).toFixed(2);
  };

  const getIcon = (tagName) => {
    const name = tagName.toLowerCase();
    if (name.includes('pres')) return <Gauge size={18} className="text-blue-400" />;
    if (name.includes('temp')) return <Thermometer size={18} className="text-orange-400" />;
    return <Activity size={18} className="text-emerald-400" />;
  };

  const getColorClass = (tagName) => {
    const name = tagName.toLowerCase();
    if (name.includes('pres')) return "text-blue-400";
    if (name.includes('temp')) return "text-orange-400";
    return "text-emerald-400";
  };

  const activeConnections = connections.filter(c => c.enabled);

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20 px-4">
      
      {/* STANDART SAYFA BAŞLIĞI */}
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Operations</h1>
          <p className="text-slate-500 text-[10px] font-black tracking-[0.4em] mt-2 italic uppercase">
            Real-time Telemetry & Live System Monitoring
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-900 border border-slate-800 px-5 py-2 rounded-2xl flex items-center gap-3 shadow-xl">
             <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
               {activeConnections.length} Active Nodes
             </span>
          </div>
        </div>
      </div>

      {/* CANLI VERİ AKIŞI GRUPLARI */}
      {activeConnections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-[3rem]">
          <div className="p-8 bg-slate-800/50 rounded-full mb-6 text-slate-700">
            <CircleOff size={56} />
          </div>
          <h3 className="text-2xl font-black text-slate-400 tracking-tighter uppercase">System Offline</h3>
          <p className="text-slate-600 text-sm mt-2 italic font-medium">Please activate your PLC connections in Connectivity Manager.</p>
        </div>
      ) : (
        activeConnections.map((conn) => {
          const connectionTags = Object.keys(liveData).filter(key => key.startsWith(`${conn.name}:`));

          return (
            <div key={conn.id} className="bg-slate-900/40 border border-slate-800/50 rounded-[3rem] p-8 shadow-inner transition-all hover:bg-slate-900/60 group">
              
              {/* Grup Başlığı ve Bağlantı Durumu */}
              <div className="flex items-center justify-between mb-10 px-2">
                <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-[1.5rem] transition-all shadow-xl ${
                    conn.status 
                    ? 'bg-blue-600 text-white shadow-blue-600/20' 
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}>
                    <Cpu size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-100 tracking-tight leading-none uppercase">{conn.name}</h2>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-lg border border-slate-800/50 group-hover:border-slate-700 transition-colors">
                        {conn.endpoint_url}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl border text-[10px] font-black tracking-[0.2em] transition-all shadow-lg ${
                  conn.status 
                    ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/20 shadow-emerald-500/5" 
                    : "bg-red-500/5 text-red-500 border-red-500/20 shadow-red-500/5"
                }`}>
                  <div className={`w-2 h-2 rounded-full ${conn.status ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  {conn.status ? "LIVE STREAMING" : "CONNECTION LOST"}
                </div>
              </div>

              {/* Sensör Kartları Grid Düzeni */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {connectionTags.map((fullKey) => {
                  const tagName = fullKey.split(':')[1];
                  return (
                    <div key={fullKey} className="bg-slate-950/60 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl group/card relative overflow-hidden transition-all hover:border-slate-600 hover:scale-[1.02]">
                      
                      {/* Kart Arkaplan İkonu */}
                      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover/card:opacity-10 transition-opacity transform group-hover/card:rotate-12 duration-500">
                         {getIcon(tagName)}
                      </div>

                      <h2 className="text-slate-500 text-[10px] mb-8 flex items-center gap-3 uppercase font-black tracking-[0.3em]">
                        <span className="p-1.5 bg-slate-900 rounded-lg">{getIcon(tagName)}</span> {tagName}
                      </h2>

                      <div className={`text-7xl font-black tracking-tighter ${getColorClass(tagName)} flex items-baseline gap-3`}>
                        {formatVal(liveData[fullKey])} 
                        <span className="text-xs text-slate-700 font-black uppercase tracking-[0.2em] italic">Unit</span>
                      </div>

                      {/* Alt Bilgi Barı */}
                      <div className="mt-10 pt-6 border-t border-slate-800/50 flex items-center justify-between">
                         <div className="flex items-center gap-2.5">
                            <Radio size={14} className={conn.status ? "text-emerald-500 animate-pulse" : "text-slate-800"} />
                            <span className="text-[10px] text-slate-600 font-black uppercase tracking-tighter">
                              {conn.status ? "Signal Stable" : "Link Interrupted"}
                            </span>
                         </div>
                         <div className="text-[10px] text-slate-800 font-black font-mono tracking-widest">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                         </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Boş Durum: Veri Bekleniyor */}
                {conn.status && connectionTags.length === 0 && (
                  <div className="col-span-full py-20 bg-slate-950/20 rounded-[2.5rem] border-2 border-dashed border-slate-800/30 flex flex-col items-center justify-center gap-5 text-slate-700">
                    <Activity size={40} className="animate-spin duration-[4000ms] opacity-20" />
                    <p className="font-black text-xs tracking-[0.5em] uppercase opacity-30">Synchronizing Data Nodes...</p>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default Dashboard;