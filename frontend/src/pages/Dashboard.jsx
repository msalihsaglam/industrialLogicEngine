import React, { useState, useEffect, useMemo } from 'react';
import { 
  Gauge as GaugeIcon, Thermometer, Activity, Cpu, Plus, 
  Settings2, X, Layout, Save, Move, LineChart, Radio, Loader2, Zap, Database, Search,
  LayoutDashboard, Terminal, Info, LayoutDashboard as DashboardIcon, MousePointer2
} from 'lucide-react';
import { api } from '../services/api';
import EnergyAnalyzerWidget from '../components/EnergyAnalyzerWidget'; 

const TagSelector = ({ label, value, onChange, groupedTags, searchTerm }) => (
  <div className="space-y-2">
    <label className="text-[10px] text-[#00ffcc] uppercase font-black ml-1 tracking-widest italic">{label}</label>
    <select 
      className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl p-4 text-white text-[11px] font-bold focus:border-[#009999] outline-none appearance-none cursor-pointer uppercase tracking-tighter shadow-inner"
      value={value} 
      onChange={e => onChange(e.target.value)}
    >
      <option value="" className="bg-slate-900">Select Interface Node...</option>
      {Object.entries(groupedTags).map(([source, tags]) => {
        const filtered = tags.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
        if (filtered.length === 0) return null;
        return (
          <optgroup key={source} label={`📍 SOURCE: ${source.toUpperCase()}`} className="bg-slate-900 text-[#009999] font-black italic border-b border-slate-800">
            {filtered.map(t => (
              <option key={t.id} value={t.id} className="text-white bg-slate-900 font-bold">
                {t.name.toUpperCase()}
              </option>
            ))}
          </optgroup>
        );
      })}
    </select>
  </div>
);

const Dashboard = ({ liveData = {}, connections = [], userId }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [widgets, setWidgets] = useState([]);
  const [history, setHistory] = useState({});
  const [searchTerm, setSearchTerm] = useState(""); 

  const [newWidget, setNewWidget] = useState({ 
    type: 'numeric', tagKey: '', title: '',
    config: { voltageId: '', currentId: '', powerId: '', energyId: '' } 
  });

  // --- LOGIC FUNCTIONS (Aynı Kaldı) ---
  useEffect(() => {
    const fetchLayout = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const res = await api.getDashboard(userId);
        const layoutData = res.data.layout || res.data;
        if (Array.isArray(layoutData)) setWidgets(layoutData);
      } catch (err) { console.error("❌ Layout error:", err); }
      finally { setLoading(false); }
    };
    fetchLayout();
  }, [userId]);

  const toggleEditMode = async () => {
    if (isEditMode) {
      try { await api.saveDashboard(userId, widgets); } 
      catch (err) { alert("Sync failed."); }
    }
    setIsEditMode(!isEditMode);
  };

  useEffect(() => {
    setHistory(prev => {
      const newHistory = { ...prev };
      Object.keys(liveData).forEach(key => {
        if (!newHistory[key]) newHistory[key] = [];
        const val = parseFloat(liveData[key]?.value || 0);
        newHistory[key] = [...newHistory[key], val].slice(-30);
      });
      return newHistory;
    });
  }, [liveData]);

  const groupedTags = useMemo(() => {
    const groups = {};
    Object.keys(liveData).forEach(key => {
      const node = liveData[key];
      const source = node.sourceName || "Internal System";
      if (!groups[source]) groups[source] = [];
      groups[source].push({ id: key, name: node.tagName || key });
    });
    return groups;
  }, [liveData]);

  const addWidget = () => {
    if (newWidget.type !== 'energy_analyzer' && !newWidget.tagKey) return;
    const id = Date.now().toString();
    setWidgets([...widgets, { ...newWidget, id }]);
    setIsAddModalOpen(false);
    setNewWidget({ type: 'numeric', tagKey: '', title: '', config: { voltageId: '', currentId: '', powerId: '', energyId: '' } });
    setSearchTerm("");
  };

  const removeWidget = (id) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const renderWidgetContent = (w) => {
    if (w.type === 'energy_analyzer') {
      return <EnergyAnalyzerWidget title={w.title} config={w.config} liveData={liveData} />;
    }
    const nodeData = liveData[w.tagKey];
    const currentVal = parseFloat(nodeData?.value || 0);
    const dataPoints = history[w.tagKey] || [];

    switch (w.type) {
      case 'numeric':
        return (
          <div className="flex items-baseline gap-4 mt-4">
            <span className="text-8xl font-black tracking-tighter text-[#00ffcc] font-mono italic drop-shadow-xl">
              {currentVal.toFixed(2)}
            </span>
            <span className="text-[12px] text-slate-600 font-black uppercase tracking-[0.3em] italic">{nodeData?.unit || 'Units'}</span>
          </div>
        );
      case 'gauge':
        const radius = 45;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (Math.min(currentVal, 100) / 100) * circumference;
        return (
          <div className="relative flex items-center justify-center h-44 mt-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-900" />
              <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" 
                strokeDasharray={circumference} strokeDashoffset={offset} className="text-[#009999] transition-all duration-1000" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white italic tracking-tighter">{currentVal.toFixed(1)}</span>
              <span className="text-[8px] text-slate-500 font-black uppercase mt-1 tracking-widest">{nodeData?.unit}</span>
            </div>
          </div>
        );
      case 'sparkline':
        const max = Math.max(...dataPoints, 1) * 1.2;
        const min = Math.min(0, ...dataPoints);
        const range = max - min || 1;
        const points = dataPoints.map((val, i) => {
          const x = (i / (30 - 1)) * 100;
          const y = 50 - ((val - min) / range) * 40;
          return `${x},${y}`;
        }).join(' ');
        return (
          <div className="h-36 w-full mt-6 bg-slate-950/50 rounded-3xl border-2 border-slate-900 p-6 relative overflow-hidden">
            <svg viewBox="0 0 100 50" className="w-full h-full relative z-10" preserveAspectRatio="none">
              <polyline fill="none" stroke="#00ffcc" strokeWidth="3" points={points} strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </div>
        );
      default: return null;
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-6 bg-[#020617]">
      <Loader2 className="animate-spin text-[#00ffcc]" size={60} />
      <span className="text-[11px] font-black uppercase tracking-[0.6em] text-white">System Synchronizing</span>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-20 px-6 pt-10 text-white">
      
      {/* 🏛️ SIEMENS STYLE HEADER (WITH INTEGRATED GUIDE) */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-10 border-b-2 border-slate-800 pb-12">
        
        {/* Left: Title & Actions */}
        <div className="space-y-1 min-w-[350px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-1 bg-[#00ffcc]"></div>
            <span className="text-[#00ffcc] text-[10px] font-black uppercase tracking-[0.5em]">Real-Time Core</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Operations</h1>
          <p className="text-slate-500 text-[11px] font-bold tracking-[0.2em] uppercase flex items-center gap-2 mt-4 italic">
             <Terminal size={14} className="text-[#009999]" /> Operator Node: {userId}
          </p>

          <div className="flex gap-4 mt-8">
            <button 
              onClick={toggleEditMode} 
              className={`px-8 py-4 rounded-xl flex items-center gap-3 transition-all font-black text-[11px] uppercase tracking-widest border-2 shadow-2xl ${
                  isEditMode ? 'bg-[#009999] text-white border-[#00ffcc]/50' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-[#009999]/50'
              }`}
            >
              {isEditMode ? <Save size={18} /> : <Settings2 size={18} />}
              {isEditMode ? 'Lock Config' : 'Customize'}
            </button>
            {isEditMode && (
              <button 
                  onClick={() => setIsAddModalOpen(true)} 
                  className="bg-[#009999] hover:bg-[#00cccc] text-white px-8 py-4 rounded-xl flex items-center gap-3 shadow-2xl text-[11px] font-black uppercase tracking-widest transition-all"
              >
                <Plus size={20} /> Add Widget
              </button>
            )}
          </div>
        </div>

        {/* 🎯 RIGHT: INTEGRATED DASHBOARD OPERATIONS GUIDE */}
        <div className="flex-1 bg-slate-900/40 border-2 border-slate-800/50 p-6 rounded-[2.5rem] relative overflow-hidden flex flex-col md:flex-row gap-6">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><DashboardIcon size={80}/></div>
            
            <div className="p-4 bg-[#009999]/10 text-[#00ffcc] rounded-2xl h-fit shadow-inner">
                <Info size={24}/>
            </div>

            <div className="space-y-4">
                <h5 className="text-[11px] font-black text-white uppercase italic tracking-widest border-b border-slate-800 pb-2 inline-block">
                    Operational Visualization Guide
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <p className="text-[10px] text-[#00ffcc] font-black uppercase tracking-tighter italic">Live Telemetry</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight">Data is pushed in real-time from the Control Layer nodes.</p>
                    </div>
                    <div className="space-y-1 border-l-2 border-slate-800/50 pl-4">
                        <p className="text-[10px] text-amber-500 font-black uppercase tracking-tighter italic">Persistence</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight">Widget layouts are saved and synced per unique operator node.</p>
                    </div>
                    <div className="space-y-1 border-l-2 border-slate-800/50 pl-4">
                        <p className="text-[10px] text-blue-400 font-black uppercase tracking-tighter italic">Orchestration</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight">Use 'Customize' to remap field nodes or modify UI architecture.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* 🎛️ DASHBOARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pt-4">
        {widgets.map((w) => (
          <div 
            key={w.id} 
            className={`group bg-slate-900/40 border-2 rounded-[2.5rem] p-10 shadow-2xl relative transition-all duration-500 overflow-hidden hover:border-[#009999]/30 hover:bg-slate-900 ${
                w.type === 'energy_analyzer' ? 'lg:col-span-2 border-[#009999]/20' : 'border-slate-800'
            }`}
          >
            {isEditMode && (
              <button onClick={() => removeWidget(w.id)} className="absolute top-6 right-6 p-3 bg-red-600/10 text-red-500 rounded-2xl z-20 border border-red-500/20 shadow-xl">
                <X size={18} />
              </button>
            )}
            <div className={`absolute top-0 left-0 w-24 h-1 transition-colors duration-500 ${w.type === 'gauge' ? 'bg-amber-500' : 'bg-[#00ffcc]'}`} />
            {w.type !== 'energy_analyzer' && (
              <h2 className="text-slate-500 text-[11px] mb-8 flex items-center gap-3 uppercase font-black tracking-[0.4em] italic group-hover:text-white transition-colors">
                <div className="p-2 bg-slate-950 rounded-lg">
                    {w.type === 'numeric' && <Cpu size={14} className="text-[#00ffcc]"/>}
                    {w.type === 'gauge' && <GaugeIcon size={14} className="text-amber-500"/>}
                    {w.type === 'sparkline' && <LineChart size={14} className="text-[#00ffcc]"/>}
                </div>
                {w.title || (w.tagKey && liveData[w.tagKey]?.tagName) || 'NODE DEFINITION'}
              </h2>
            )}
            <div className="min-h-[140px] flex flex-col justify-center">{renderWidgetContent(w)}</div>
          </div>
        ))}
      </div>

      {/* 📂 DEPLOY MODAL (Siemens Style) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center z-[500] p-6 animate-in fade-in">
          <div className="bg-[#0b1117] border-2 border-slate-800 p-12 rounded-[4rem] w-full max-w-3xl">
            <div className="flex items-center gap-5 mb-12">
                <div className="w-16 h-16 bg-[#009999]/20 text-[#00ffcc] rounded-[2rem] flex items-center justify-center shadow-inner">
                    <DashboardIcon size={32}/>
                </div>
                <div>
                    <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">Deploy New Logic</h3>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Operational Visualization Engine</p>
                </div>
            </div>
            
            <div className="space-y-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-2">Display Mode</label>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { id: 'numeric', icon: <Cpu size={24}/>, label: 'Float Value' },
                    { id: 'gauge', icon: <GaugeIcon size={24}/>, label: 'Analog Gauge' },
                    { id: 'sparkline', icon: <LineChart size={24}/>, label: 'Trend Graph' },
                    { id: 'energy_analyzer', icon: <Zap size={24} className="text-[#00ffcc]" />, label: 'Energy Hub' }
                  ].map(item => (
                    <button key={item.id} onClick={() => setNewWidget({...newWidget, type: item.id})} className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-4 transition-all ${newWidget.type === item.id ? 'bg-[#009999]/10 border-[#009999] text-[#00ffcc]' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                      {item.icon} <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <input type="text" placeholder="e.g. Main Compressor Load" className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl p-5 text-white font-black uppercase text-sm outline-none focus:border-[#009999]" value={newWidget.title} onChange={e => setNewWidget({...newWidget, title: e.target.value})} />
                <div className="relative">
                    <Search className="absolute left-5 top-5 text-[#009999]" size={20} />
                    <input type="text" placeholder="Filter mapped nodes..." className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 pl-14 text-xs text-[#00ffcc] font-bold outline-none focus:border-[#009999]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <div className="bg-slate-950/50 p-8 rounded-[2.5rem] border-2 border-slate-800">
                {newWidget.type === 'energy_analyzer' ? (
                  <div className="grid grid-cols-2 gap-8">
                    <TagSelector label="Voltage Reference" value={newWidget.config.voltageId} groupedTags={groupedTags} searchTerm={searchTerm} onChange={(val) => setNewWidget({...newWidget, config: {...newWidget.config, voltageId: val}})} />
                    <TagSelector label="Current Reference" value={newWidget.config.currentId} groupedTags={groupedTags} searchTerm={searchTerm} onChange={(val) => setNewWidget({...newWidget, config: {...newWidget.config, currentId: val}})} />
                    <TagSelector label="Active Power" value={newWidget.config.powerId} groupedTags={groupedTags} searchTerm={searchTerm} onChange={(val) => setNewWidget({...newWidget, config: {...newWidget.config, powerId: val}})} />
                    <TagSelector label="Cumulative Energy" value={newWidget.config.energyId} groupedTags={groupedTags} searchTerm={searchTerm} onChange={(val) => setNewWidget({...newWidget, config: {...newWidget.config, energyId: val}})} />
                  </div>
                ) : (
                  <TagSelector label="Primary Target Node" value={newWidget.tagKey} groupedTags={groupedTags} searchTerm={searchTerm} onChange={(val) => setNewWidget({...newWidget, tagKey: val})} />
                )}
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-5 rounded-2xl bg-slate-800 text-slate-400 font-black uppercase text-[11px]">Dismiss</button>
                <button onClick={addWidget} className="flex-[2] py-5 rounded-2xl bg-[#009999] text-white font-black uppercase text-[11px] shadow-2xl">Establish Logic</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;