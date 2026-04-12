import React, { useMemo } from 'react';
import { 
  Zap, Activity, ShieldAlert, Globe, Gauge, Server, ZapOff
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EnergyIntelligence = ({ liveData = {}, connections = [], allTags = [] }) => {
  const { t } = useTranslation();

  // --- 🎯 DATA LOGIC (PRESERVED) ---
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
    <div className="max-w-[1600px] mx-auto space-y-12 pb-20 px-8 pt-10">
      
      {/* 🏛️ HEADER SECTION */}
      <div className="flex justify-between items-end border-b border-[var(--ind-border)] pb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[var(--ind-petroleum)]"></div>
            <span className="ind-label">Energy Management System</span>
          </div>
          <h1 className="ind-title">Plant Intelligence Hub</h1>
        </div>
        <div className="ind-panel flex items-center gap-2 px-4 py-2 opacity-80">
          <Globe size={14} className="text-[var(--ind-petroleum)]" /> 
          <span className="ind-label !text-[9px]">Live Network Data</span>
        </div>
      </div>

      {/* 📊 KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="ind-panel p-8 border-t-4 border-t-[var(--ind-amber)]">
          <p className="ind-label mb-4">Total Active Load</p>
          <div className="flex items-baseline">
            <span className="ind-value-lg text-white">{plantTotals.power}</span>
            <span className="ind-unit">kW</span>
          </div>
        </div>

        <div className={`ind-panel p-8 border-t-4 ${plantTotals.cosPhi < 0.95 ? 'border-t-[var(--ind-red)]' : 'border-t-[var(--ind-cyan)]'}`}>
          <p className="ind-label mb-4">Power Factor (AVG)</p>
          <div className="flex items-baseline">
            <span className={`ind-value-lg ${plantTotals.cosPhi < 0.95 ? 'text-[var(--ind-red)]' : 'text-white'}`}>{plantTotals.cosPhi}</span>
            <span className="ind-unit">cosφ</span>
          </div>
        </div>

        <div className={`ind-panel p-8 border-t-4 ${plantTotals.criticalAnalyzers > 0 ? 'border-t-[var(--ind-red)]' : 'border-t-[var(--ind-petroleum)]'}`}>
          <p className="ind-label mb-4">Operational Status</p>
          <div className="flex items-center gap-4">
             <div className={`w-3.5 h-3.5 rounded-full ${plantTotals.criticalAnalyzers > 0 ? 'bg-[var(--ind-red)] animate-pulse' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]'}`} />
             <span className="text-xl font-extrabold uppercase tracking-tight text-white">
               {plantTotals.criticalAnalyzers > 0 ? `${plantTotals.criticalAnalyzers} Critical Nodes` : 'All Nodes Stable'}
             </span>
          </div>
        </div>
      </div>

      {/* 📊 ANALYZER CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {energyMappedData.map((ea) => (
          <div key={ea.id} className="ind-panel group hover:border-[var(--ind-petroleum)] transition-all duration-300 overflow-hidden">
            
            {/* Analyzer Header */}
            <div className="bg-[var(--ind-header)] px-6 py-4 border-b border-[var(--ind-border)] flex justify-between items-center">
               <h3 className="ind-subtitle">{ea.name}</h3>
               <span className={`ind-status-badge ${ea.status ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20' : 'bg-red-500/5 text-red-500 border-red-500/20'}`}>
                 {ea.status ? 'CONNECTED' : 'DISCONNECTED'}
               </span>
            </div>

            <div className="p-8 space-y-8">
                {/* Main Power Metric */}
                <div>
                  <p className="ind-label mb-2 opacity-50">Active Power</p>
                  <div className="flex items-baseline">
                    <span className="ind-value-lg text-white tracking-tighter">
                      {ea.power.toFixed(1)}
                    </span>
                    <span className="ind-unit">kW</span>
                  </div>
                </div>

                {/* Sub Metrics Grid */}
                <div className="grid grid-cols-3 gap-4 pt-8 border-t border-[var(--ind-border)]">
                    <div>
                      <p className="ind-label !text-[8px] mb-2 opacity-40">Voltage</p>
                      <p className="ind-value-md text-slate-300">{ea.voltage.toFixed(0)} <span className="ind-unit">V</span></p>
                    </div>
                    <div>
                      <p className="ind-label !text-[8px] mb-2 opacity-40">Current</p>
                      <p className="ind-value-md text-slate-300">{ea.current.toFixed(1)} <span className="ind-unit">A</span></p>
                    </div>
                    <div>
                      <p className="ind-label !text-[8px] mb-2 opacity-40">cosφ</p>
                      <p className={`ind-value-md ${ea.cosPhi < 0.95 && ea.cosPhi > 0 ? 'text-[var(--ind-red)]' : 'text-[var(--ind-cyan)]'}`}>
                        {ea.cosPhi.toFixed(2)}
                      </p>
                    </div>
                </div>

                {/* Total Energy Counter */}
                <div className="bg-[var(--ind-bg)] p-4 border border-[var(--ind-border)] rounded flex justify-between items-center shadow-inner">
                    <span className="ind-label !text-[8px] opacity-50">Accumulated</span>
                    <div className="flex items-baseline">
                      <span className="ind-value-md text-[var(--ind-cyan)]">{ea.energy.toFixed(0)}</span>
                      <span className="ind-unit">kWh</span>
                    </div>
                </div>
            </div>

            {/* Load Capacity Bar */}
            <div className="h-1.5 w-full bg-[var(--ind-bg)]">
                <div 
                  className={`h-full transition-all duration-1000 ${ea.cosPhi < 0.95 && ea.cosPhi > 0 ? 'bg-[var(--ind-red)]' : 'bg-[var(--ind-petroleum)]'}`} 
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