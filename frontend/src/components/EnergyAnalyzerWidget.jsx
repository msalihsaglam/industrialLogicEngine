import React from 'react';
import { Zap, Activity, Gauge, Database } from 'lucide-react';

const EnergyAnalyzerWidget = ({ title, config, liveData }) => {
  // Config içindeki ID'lere göre canlı verileri eşleştirelim
  const getVal = (id) => liveData[id]?.value !== undefined ? liveData[id].value : '---';

  const metrics = [
    { label: 'Voltage', val: getVal(config.voltageId), unit: 'V', icon: <Gauge size={14} />, color: 'text-blue-400' },
    { label: 'Current', val: getVal(config.currentId), unit: 'A', icon: <Activity size={14} />, color: 'text-amber-400' },
    { label: 'Power', val: getVal(config.powerId), unit: 'kW', icon: <Zap size={14} />, color: 'text-emerald-400' },
    { label: 'Energy', val: getVal(config.energyId), unit: 'kWh', icon: <Database size={14} />, color: 'text-purple-400' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group hover:border-blue-500/50 transition-all duration-500">
      {/* Arka plan süsü */}
      <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Zap size={120} />
      </div>

      {/* Başlık */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">{title || 'Power Analyzer'}</h3>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          <div className="w-1 h-1 rounded-full bg-emerald-500/30" />
        </div>
      </div>

      {/* Ana Güç Göstergesi (Aktif Güç) */}
      <div className="mb-8">
        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1">Active Power</span>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-black text-white tracking-tighter">
            {typeof metrics[2].val === 'number' ? metrics[2].val.toFixed(2) : metrics[2].val}
          </span>
          <span className="text-emerald-500 font-black italic text-sm">kW</span>
        </div>
      </div>

      {/* Alt Izgara (V, I, kWh) */}
      <div className="grid grid-cols-3 gap-4 border-t border-slate-800/50 pt-6">
        {metrics.filter(m => m.label !== 'Power').map((m, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500">
              {m.icon}
              <span className="text-[8px] font-black uppercase tracking-tighter">{m.label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-black text-slate-200">
                {typeof m.val === 'number' ? m.val.toFixed(idx === 2 ? 2 : 1) : m.val}
              </span>
              <span className={`text-[8px] font-bold italic ${m.color}`}>{m.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnergyAnalyzerWidget;