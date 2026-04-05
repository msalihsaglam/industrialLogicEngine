import React, { useState, useEffect, useMemo } from 'react';
import { 
  Zap, Activity, ShieldAlert, BatteryCharging, TrendingUp, 
  ArrowUpRight, ArrowDownRight, Globe, Gauge, Cpu, Info, 
  Lightbulb, AlertTriangle, ZapOff, Server
} from 'lucide-react';

const EnergyIntelligence = ({ liveData = {}, connections = [], allTags = [] }) => {
  // --- 🎯 1. ENERJİ CİHAZLARINI VE TAGLERİ FİLTRELE ---
  const energyAnalyzers = useMemo(() => {
    return connections.filter(c => c.connection_type === 'energy_analyzer' && c.enabled);
  }, [connections]);

  const energyMappedData = useMemo(() => {
    return energyAnalyzers.map(conn => {
      const connTags = allTags.filter(t => t.connection_id === conn.id);
      
      // Roller üzerinden canlı veriye erişim fonksiyonu
      const getVal = (role) => {
        const tag = connTags.find(t => t.tag_role === role);
        return tag ? parseFloat(liveData[tag.id]?.value || 0) : 0;
      };

      return {
        id: conn.id,
        name: conn.name,
        voltage: getVal('voltage'),
        current: getVal('current'),
        power: getVal('power'),
        energy: getVal('energy'),
        cosPhi: getVal('power_factor') || getVal('cosphi'), // Alternatif isim desteği
        reactive: getVal('reactive_power'),
        status: String(conn.status).toLowerCase() === 'connected' || conn.status === true
      };
    });
  }, [energyAnalyzers, allTags, liveData]);

  // --- 📈 2. FABRİKA GENELİ TOPLAM HESAPLAMALARI ---
  const plantTotals = useMemo(() => {
    const totalPower = energyMappedData.reduce((acc, curr) => acc + curr.power, 0);
    const totalEnergy = energyMappedData.reduce((acc, curr) => acc + curr.energy, 0);
    const avgCosPhi = energyMappedData.length > 0 
      ? energyMappedData.reduce((acc, curr) => acc + curr.cosPhi, 0) / energyMappedData.length 
      : 1.0;

    return {
      power: totalPower.toFixed(1),
      energy: totalEnergy.toFixed(1),
      cosPhi: avgCosPhi.toFixed(2),
      criticalAnalyzers: energyMappedData.filter(d => d.cosPhi < 0.95 && d.cosPhi > 0).length
    };
  }, [energyMappedData]);

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-20 px-6 pt-10 text-white font-['Inter'] animate-in fade-in duration-700">
      
      {/* 🏛️ HEADER & PLANT TOTALS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-amber-500"></div>
            <span className="text-amber-500 text-[10px] font-black uppercase tracking-[0.4em]">Energy Intelligence</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic">Plant Core</h1>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest italic flex items-center gap-2">
            <Globe size={14} className="text-[#009999]" /> Real-Time Grid Analytics
          </p>
        </div>

        {/* Toplam Aktif Güç */}
        <div className="bg-slate-900/40 border-2 border-slate-800 p-8 rounded-[2.5rem] flex items-center gap-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Zap size={80}/></div>
          <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20"><Zap size={32}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-1">Total Active Load</p>
            <h4 className="text-4xl font-black italic">{plantTotals.power} <span className="text-sm font-bold text-amber-600">kW</span></h4>
          </div>
        </div>

        {/* Ortalama CosPhi */}
        <div className="bg-slate-900/40 border-2 border-slate-800 p-8 rounded-[2.5rem] flex items-center gap-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Gauge size={80}/></div>
          <div className={`p-4 rounded-2xl border ${plantTotals.cosPhi < 0.95 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-[#00ffcc]/10 text-[#00ffcc] border-[#00ffcc]/20'}`}>
            <Activity size={32}/>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-1">Avg. Power Factor</p>
            <h4 className={`text-4xl font-black italic ${plantTotals.cosPhi < 0.95 ? 'text-red-500' : 'text-white'}`}>{plantTotals.cosPhi} <span className="text-sm font-bold opacity-40">cosφ</span></h4>
          </div>
        </div>

        {/* Reaktif Uyarı Paneli */}
        <div className={`p-8 rounded-[2.5rem] border-2 shadow-2xl flex items-center gap-6 transition-all ${plantTotals.criticalAnalyzers > 0 ? 'bg-red-600/10 border-red-500 animate-pulse' : 'bg-slate-900/40 border-slate-800'}`}>
           <div className={`p-4 rounded-2xl ${plantTotals.criticalAnalyzers > 0 ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-600'}`}>
              <ShieldAlert size={32}/>
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest italic mb-1">Penalty Risk</p>
              <h4 className="text-xl font-black uppercase italic">{plantTotals.criticalAnalyzers > 0 ? `${plantTotals.criticalAnalyzers} Nodes Critical` : 'System Secure'}</h4>
           </div>
        </div>
      </div>

      {/* 📊 ANALYZER CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {energyMappedData.map((ea) => (
          <div key={ea.id} className="bg-slate-900/40 border-2 border-slate-800 rounded-[3rem] p-10 relative overflow-hidden group hover:border-[#00ffcc]/30 transition-all duration-500">
            <div className={`absolute top-0 left-0 w-24 h-1.5 ${ea.cosPhi < 0.95 && ea.cosPhi > 0 ? 'bg-red-500' : 'bg-[#00ffcc]'}`} />
            
            {/* Analyzer Header */}
            <div className="flex justify-between items-start mb-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                   <Server size={14} className="text-[#009999]"/>
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{ea.status ? 'ONLINE' : 'OFFLINE'}</span>
                </div>
                <h3 className="text-2xl font-black italic text-white uppercase">{ea.name}</h3>
              </div>
              <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border-2 ${ea.cosPhi < 0.95 && ea.cosPhi > 0 ? 'border-red-500/30 text-red-500 bg-red-500/5' : 'border-[#00ffcc]/30 text-[#00ffcc] bg-[#00ffcc]/5'}`}>
                cosφ: {ea.cosPhi || '0.00'}
              </div>
            </div>

            {/* Real-Time Metrics */}
            <div className="grid grid-cols-2 gap-8">
               <div className="space-y-1">
                  <p className="text-[9px] font-bold text-slate-500 uppercase italic">Active Power</p>
                  <p className="text-4xl font-black text-white italic">{ea.power.toFixed(1)} <span className="text-xs text-slate-600">kW</span></p>
               </div>
               <div className="space-y-1">
                  <p className="text-[9px] font-bold text-slate-500 uppercase italic">Current L1</p>
                  <p className="text-4xl font-black text-white italic">{ea.current.toFixed(1)} <span className="text-xs text-slate-600">A</span></p>
               </div>
               <div className="space-y-1">
                  <p className="text-[9px] font-bold text-slate-500 uppercase italic">Bus Voltage</p>
                  <p className="text-2xl font-black text-slate-300 italic">{ea.voltage.toFixed(0)} <span className="text-xs text-slate-600">V</span></p>
               </div>
               <div className="space-y-1">
                  <p className="text-[9px] font-bold text-slate-500 uppercase italic">Total Consumption</p>
                  <p className="text-2xl font-black text-[#00ffcc] italic">{ea.energy.toFixed(0)} <span className="text-xs text-slate-600">kWh</span></p>
               </div>
            </div>

            {/* Micro Chart / Waveform Placeholder */}
            <div className="mt-10 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
               <div 
                className={`h-full transition-all duration-1000 ${ea.cosPhi < 0.95 && ea.cosPhi > 0 ? 'bg-red-500' : 'bg-[#00ffcc]'}`} 
                style={{ width: `${Math.min((ea.power / 100) * 100, 100)}%` }}
               />
            </div>
            <div className="flex justify-between mt-3">
               <span className="text-[8px] font-black text-slate-600 uppercase italic">Load Distribution</span>
               <span className="text-[8px] font-black text-slate-400 uppercase italic">{ea.power > 0 ? 'Dynamic' : 'Idle'}</span>
            </div>
          </div>
        ))}

        {energyMappedData.length === 0 && (
          <div className="col-span-full py-32 text-center border-4 border-dashed border-slate-900 rounded-[4rem] opacity-20">
             <ZapOff size={64} className="mx-auto mb-6"/>
             <p className="text-xl font-black uppercase italic tracking-widest">No Energy Analyzers Detected</p>
             <p className="text-xs mt-2">Configure connection types and roles in Connectivity Page</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default EnergyIntelligence;