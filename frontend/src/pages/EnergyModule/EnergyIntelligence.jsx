import React, { useMemo } from 'react';
import { 
  Zap, Activity, ShieldAlert, Globe, Gauge, Server, ZapOff
} from 'lucide-react';

const EnergyIntelligence = ({ liveData = {}, connections = [], allTags = [] }) => {
  
  // --- 🎯 DATA LOGIC ---
  const energyAnalyzers = useMemo(() => {
    return connections.filter(c => c.connection_type === 'energy_analyzer' && c.enabled);
  }, [connections]);

  const energyMappedData = useMemo(() => {
    return energyAnalyzers.map(conn => {
      const connTags = allTags.filter(t => t.connection_id === conn.id);
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
        cosPhi: getVal('power_factor') || getVal('cosphi'),
        status: String(conn.status).toLowerCase() === 'connected' || conn.status === true
      };
    });
  }, [energyAnalyzers, allTags, liveData]);

  const plantTotals = useMemo(() => {
    const totalPower = energyMappedData.reduce((acc, curr) => acc + curr.power, 0);
    const totalEnergy = energyMappedData.reduce((acc, curr) => acc + curr.energy, 0);
    const avgCosPhi = energyMappedData.length > 0 
      ? energyMappedData.reduce((acc, curr) => acc + curr.cosPhi, 0) / energyMappedData.length 
      : 1.0;

    return {
      power: totalPower.toLocaleString('tr-TR', { minimumFractionDigits: 1 }),
      energy: totalEnergy.toLocaleString('tr-TR', { minimumFractionDigits: 0 }),
      cosPhi: avgCosPhi.toFixed(2),
      criticalAnalyzers: energyMappedData.filter(d => d.cosPhi < 0.95 && d.cosPhi > 0).length
    };
  }, [energyMappedData]);

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-20 px-8 pt-10 text-[#F1F5F9] font-['IBM_Plex_Sans']">
      
      {/* 🔡 INDUSTRIAL TYPOGRAPHY SETTINGS */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
          .font-data { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
          .industrial-panel { background-color: #141F24; border: 1px solid #23333A; }
          .label-caps { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #94A3B8; }
        `}
      </style>

      {/* 🏛️ HEADER SECTION */}
      <div className="flex justify-between items-end border-b border-[#23333A] pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-6 bg-[#006470]"></div>
            <span className="label-caps">Energy Management System</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white uppercase">Plant Intelligence Hub</h1>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest bg-[#141F24] px-4 py-2 border border-[#23333A]">
          <Globe size={14} className="text-[#006470]" /> 
          Live Network Data
        </div>
      </div>

      {/* 📊 KPI ROW (Clean & Stable) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Power */}
        <div className="industrial-panel p-6 rounded-md border-t-4 border-t-amber-600">
          <p className="label-caps mb-4">Total Active Load</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold font-data text-white">{plantTotals.power}</span>
            <span className="text-xs font-semibold text-[#94A3B8]">kW</span>
          </div>
        </div>

        {/* Avg CosPhi */}
        <div className={`industrial-panel p-6 rounded-md border-t-4 ${plantTotals.cosPhi < 0.95 ? 'border-t-red-600' : 'border-t-[#00FFCC]'}`}>
          <p className="label-caps mb-4">Power Factor (AVG)</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-bold font-data ${plantTotals.cosPhi < 0.95 ? 'text-red-500' : 'text-white'}`}>{plantTotals.cosPhi}</span>
            <span className="text-xs font-semibold text-[#94A3B8]">cosφ</span>
          </div>
        </div>

        {/* System Health */}
        <div className={`industrial-panel p-6 rounded-md border-t-4 ${plantTotals.criticalAnalyzers > 0 ? 'border-t-red-600' : 'border-t-[#006470]'}`}>
          <p className="label-caps mb-4">Operational Status</p>
          <div className="flex items-center gap-3">
             <div className={`w-3 h-3 rounded-full ${plantTotals.criticalAnalyzers > 0 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
             <span className="text-lg font-bold uppercase tracking-tight">
               {plantTotals.criticalAnalyzers > 0 ? `${plantTotals.criticalAnalyzers} Critical Points` : 'All Nodes Stable'}
             </span>
          </div>
        </div>
      </div>

      {/* 📊 ANALYZER CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {energyMappedData.map((ea) => (
          <div key={ea.id} className="industrial-panel rounded-md overflow-hidden hover:border-[#006470] transition-colors">
            
            {/* Analyzer Header: Static & Clean */}
            <div className="bg-[#1C262B] px-5 py-3 border-b border-[#23333A] flex justify-between items-center">
               <span className="text-[10px] font-bold text-white uppercase tracking-wider">{ea.name}</span>
               <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded ${ea.status ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {ea.status ? 'CONNECTED' : 'DISCONNECTED'}
                  </span>
               </div>
            </div>

            <div className="p-6 space-y-8">
                {/* Main Power Metric */}
                <div>
                  <p className="label-caps mb-2 opacity-60">Active Power</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold font-data text-white tracking-tighter">
                      {ea.power.toFixed(1)}
                    </span>
                    <span className="text-sm font-semibold text-[#94A3B8]">kW</span>
                  </div>
                </div>

                {/* Sub Metrics: Grid Layout */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#23333A]">
                   <div>
                      <p className="label-caps mb-1 opacity-40">Voltage</p>
                      <p className="text-lg font-bold font-data text-slate-300">{ea.voltage.toFixed(0)} <span className="text-[10px] text-[#94A3B8]">V</span></p>
                   </div>
                   <div>
                      <p className="label-caps mb-1 opacity-40">Current</p>
                      <p className="text-lg font-bold font-data text-slate-300">{ea.current.toFixed(1)} <span className="text-[10px] text-[#94A3B8]">A</span></p>
                   </div>
                   <div>
                      <p className="label-caps mb-1 opacity-40">cosφ</p>
                      <p className={`text-lg font-bold font-data ${ea.cosPhi < 0.95 && ea.cosPhi > 0 ? 'text-red-500' : 'text-[#00FFCC]'}`}>
                        {ea.cosPhi.toFixed(2)}
                      </p>
                   </div>
                </div>

                {/* Total Energy Counter (Analog Meter Style) */}
                <div className="bg-[#0B1215] p-3 border border-[#23333A] rounded flex justify-between items-center">
                   <span className="label-caps opacity-50">Accumulated</span>
                   <span className="text-xl font-bold font-data text-[#00FFCC]">{ea.energy.toFixed(0)} <span className="text-[9px] text-[#94A3B8]">kWh</span></span>
                </div>
            </div>

            {/* Load Line: Minimalist */}
            <div className="h-1 w-full bg-[#0B1215]">
               <div 
                className={`h-full transition-all duration-1000 ${ea.cosPhi < 0.95 && ea.cosPhi > 0 ? 'bg-red-500' : 'bg-[#006470]'}`} 
                style={{ width: `${Math.min((ea.power / 100) * 100, 100)}%` }}
               />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default EnergyIntelligence;