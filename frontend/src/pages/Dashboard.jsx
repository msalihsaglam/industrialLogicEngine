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
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      
      {/* ÜST BİLGİ PANELİ: SİSTEM ÖZETİ */}
      <div className="flex justify-between items-end px-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Operations Dashboard</h1>
          <p className="text-slate-500 text-[10px] font-black tracking-[0.3em] mt-1">Real-time Telemetry Data Stream</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-lg">
             <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeConnections.length} Active Nodes</span>
          </div>
        </div>
      </div>

      {/* CANLI VERİ AKIŞI GRUPLARI */}
      {activeConnections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-[3rem]">
          <div className="p-6 bg-slate-800/50 rounded-full mb-4 text-slate-600">
            <CircleOff size={48} />
          </div>
          <h3 className="text-xl font-bold text-slate-400 tracking-tight">System Offline</h3>
          <p className="text-slate-600 text-sm mt-2 italic font-medium">Please activate your PLC connections in Connectivity Manager.</p>
        </div>
      ) : (
        activeConnections.map((conn) => {
          const connectionTags = Object.keys(liveData).filter(key => key.startsWith(`${conn.name}:`));

          return (
            <div key={conn.id} className="bg-slate-900/50 border border-slate-800/50 rounded-[3rem] p-8 shadow-inner transition-all hover:bg-slate-900/80">
              
              {/* Grup Başlığı ve Bağlantı Durumu */}
              <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${conn.status ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-blue-500/5' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                    <Cpu size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-100 tracking-tight leading-none">{conn.name}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {conn.endpoint_url}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className={`flex items-center gap-3 px-5 py-2 rounded-2xl border text-[10px] font-black tracking-[0.2em] transition-all ${
                  conn.status 
                    ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/20 shadow-emerald-500/5" 
                    : "bg-red-500/5 text-red-500 border-red-500/20 shadow-red-500/5"
                }`}>
                  <div className={`w-2 h-2 rounded-full ${conn.status ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  {conn.status ? "LIVE STREAMING" : "CONNECTION LOST"}
                </div>
              </div>

              {/* Sensör Kartları Grid Düzeni */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {connectionTags.map((fullKey) => {
                  const tagName = fullKey.split(':')[1];
                  return (
                    <div key={fullKey} className="bg-slate-950/80 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl group relative overflow-hidden transition-all hover:border-slate-600 hover:shadow-blue-500/5">
                      
                      {/* Kart Arkaplan Deseni (Hafif) */}
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                         {getIcon(tagName)}
                      </div>

                      <h2 className="text-slate-500 text-[10px] mb-6 flex items-center gap-2 uppercase font-black tracking-[0.3em]">
                        {getIcon(tagName)} {tagName}
                      </h2>

                      <div className={`text-6xl font-black tracking-tighter ${getColorClass(tagName)} flex items-baseline gap-2`}>
                        {formatVal(liveData[fullKey])} 
                        <span className="text-xs text-slate-700 font-black uppercase tracking-[0.2em] italic">Unit</span>
                      </div>

                      {/* Sinyal ve Güncelleme Bilgisi */}
                      <div className="mt-8 pt-6 border-t border-slate-800/50 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <Radio size={12} className={conn.status ? "text-emerald-500 animate-pulse" : "text-slate-700"} />
                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-tighter">
                              {conn.status ? "Signal: Optimal" : "Signal: Dead"}
                            </span>
                         </div>
                         <div className="text-[9px] text-slate-700 font-black font-mono">
                            SYNC_OK: {new Date().getSeconds()}S
                         </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Eğer Bağlantı Var Ama Tag Yoksa */}
                {conn.status && connectionTags.length === 0 && (
                  <div className="col-span-full py-16 bg-slate-950/40 rounded-[2.5rem] border-2 border-dashed border-slate-800/50 flex flex-col items-center justify-center gap-4 text-slate-600">
                    <Activity size={32} className="animate-spin duration-[3000ms]" />
                    <p className="italic font-bold text-sm tracking-widest uppercase opacity-50 text-[10px]">Awaiting Data Nodes...</p>
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