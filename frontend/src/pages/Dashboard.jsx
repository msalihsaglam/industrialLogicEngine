import React from 'react';
import { Gauge, Thermometer, Activity, AlertTriangle, Cpu, CircleOff } from 'lucide-react';

const Dashboard = ({ liveData = {}, alarms = [], connections = [] }) => {
  
  const formatVal = (val) => {
    if (val === undefined || val === null) return "0.00";
    return Number(val).toFixed(2);
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

  // Sadece 'Enabled' olan bağlantıları filtreleyelim
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
          <p className="text-slate-600 text-sm mt-2 italic">Enable your connections in the Connectivity Manager to see live data.</p>
        </div>
      ) : (
        activeConnections.map((conn) => {
          // Bu bağlantıya ait verileri filtrele
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
                
                {/* Durum Göstergesi */}
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
                      {/* Arka Plan Süsleme (Opsiyonel) */}
                      <div className={`absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity`}>
                        {getIcon(tagName)}
                      </div>

                      <h2 className="text-slate-500 text-[10px] mb-4 flex items-center gap-2 uppercase font-black tracking-[0.2em]">
                        {getIcon(tagName)} {tagName}
                      </h2>
                      <div className={`text-5xl font-black tracking-tighter ${getColorClass(tagName)}`}>
                        {formatVal(liveData[fullKey])} 
                        <span className="text-sm text-slate-600 ml-2 font-bold uppercase tracking-widest">Val</span>
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

      {/* RECENT ALARMS - Sadece Aktif Kanalların Alarmlarını Görmek Mantıklı */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        <h2 className="text-slate-400 font-bold mb-8 flex items-center gap-2 text-amber-500 uppercase text-xs tracking-[0.3em]">
          <AlertTriangle size={18}/> Logic Engine Event Log
        </h2>
        <div className="space-y-4">
          {alarms.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/20 rounded-[2rem] border border-dashed border-slate-800">
                <p className="text-slate-600 italic text-sm">System parameters within normal range. No incidents reported.</p>
            </div>
          ) : (
            alarms.map((a, i) => (
              <div key={i} className="bg-red-500/5 border border-red-500/10 p-5 rounded-2xl flex justify-between items-center animate-in slide-in-from-right-4 transition-all hover:bg-red-500/10">
                <div className="flex items-center gap-5">
                  <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse" />
                  <div>
                    <div className="font-bold text-slate-200 text-sm tracking-tight">{a.message}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1 opacity-70 italic">{a.time}</div>
                  </div>
                </div>
                <div className="text-right">
                    <div className="text-red-400 font-black text-xl leading-none">{formatVal(a.value)}</div>
                    <div className="text-[9px] text-slate-600 font-bold uppercase mt-1 tracking-widest">Incident Val</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;