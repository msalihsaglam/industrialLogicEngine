import React, { useState, useEffect, useMemo } from 'react';
import { 
  Gauge as GaugeIcon, Thermometer, Activity, Cpu, Plus, 
  Settings2, X, Layout, Save, Move, LineChart, Radio, Loader2, Zap, Database, Search,
  LayoutDashboard, Terminal, Info, LayoutDashboard as DashboardIcon, MousePointer2, Globe,
  ArrowUp, ArrowDown
} from 'lucide-react';
import { api } from '../services/api';
import EnergyAnalyzerWidget from '../components/EnergyAnalyzerWidget'; 

// --- 🕹️ SETPOINT CONTROLLER SUB-COMPONENT ---
const SetpointController = ({ tagKey, nodeData, currentVal }) => {
  // 🛡️ GÜVENLİK: currentVal NaN ise 0 kabul et
  const safeVal = isNaN(currentVal) ? 0 : currentVal;
  const [inputValue, setInputValue] = useState(safeVal);

  // Canlı veri değişimini takip et (NaN değilse güncelle)
  useEffect(() => {
    if (!isNaN(currentVal)) {
      setInputValue(currentVal);
    }
  }, [currentVal]);

  const handleUpdate = async () => {
    try {
      // 🛡️ Göndermeden önce de bir kontrol
      const finalVal = isNaN(inputValue) ? 0 : inputValue;
      
      await api.updateTagValue({
        tagId: tagKey,
        tagName: nodeData?.tagName || 'SETPOINT',
        value: finalVal,
        sourceName: 'VIRTUAL WORKSPACE'
      });
      // console.log("✅ Değer başarıyla gönderildi");
    } catch (err) {
      console.error("❌ Update Error:", err);
    }
  };

  return (
    <div className="space-y-6 mt-4 animate-in fade-in duration-500">
      <div className="relative group">
        <input 
          type="number" 
          // 🛡️ Input değeri NaN ise boş string veya 0 bas
          value={isNaN(inputValue) ? "" : inputValue}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            // Eğer input tamamen silinirse (e.target.value === "") NaN gelir, onu 0 yapalım
            setInputValue(isNaN(val) ? 0 : val);
          }}
          className="w-full bg-slate-950 border-4 border-slate-800 rounded-[2.5rem] p-8 text-center text-6xl font-black text-amber-500 italic font-mono outline-none focus:border-amber-600/50 transition-all shadow-inner"
        />
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-[9px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-xl">
           Control Value
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
          <button 
            type="button"
            onClick={() => setInputValue(prev => parseFloat(((prev || 0) - 1).toFixed(2)))}
            className="py-5 bg-slate-800 rounded-2xl text-white font-black hover:bg-slate-700 transition-all shadow-lg active:scale-95 flex items-center justify-center border-b-4 border-slate-950"
          > <ArrowDown size={20}/> </button>
          <button 
            type="button"
            onClick={() => setInputValue(prev => parseFloat(((prev || 0) + 1).toFixed(2)))}
            className="py-5 bg-slate-800 rounded-2xl text-white font-black hover:bg-slate-700 transition-all shadow-lg active:scale-95 flex items-center justify-center border-b-4 border-slate-950"
          > <ArrowUp size={20}/> </button>
      </div>

      <button 
        type="button"
        onClick={handleUpdate}
        className="w-full py-6 bg-amber-600 hover:bg-amber-500 text-white font-black uppercase text-[11px] tracking-[0.3em] rounded-[1.5rem] shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 group"
      >
        <Save size={18} className="group-hover:rotate-12 transition-transform"/> Commit Setpoint
      </button>
    </div>
  );
};

// --- 🏷️ UNIFIED TAG SELECTOR ---
const TagSelector = ({ label, value, onChange, groupedTags, searchTerm }) => (
  <div className="space-y-2">
    <label className="text-[10px] text-slate-500 uppercase font-black ml-1 tracking-widest italic flex items-center gap-2">
        <Database size={12} className="text-[#009999]"/> {label}
    </label>
    <div className="relative">
        <select 
          className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 pl-5 text-white text-[12px] font-semibold focus:border-[#009999] outline-none appearance-none cursor-pointer uppercase tracking-tight shadow-inner transition-all"
          value={value} 
          onChange={e => onChange(e.target.value)}
        >
          <option value="" className="bg-slate-900 font-sans">SELECT INFRASTRUCTURE NODE...</option>
          {Object.entries(groupedTags).map(([source, tags]) => {
            const filtered = tags.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
            if (filtered.length === 0) return null;
            const isVirtual = source === 'VIRTUAL WORKSPACE';
            return (
              <optgroup key={source} label={`${isVirtual ? '🧠' : '📍'} SOURCE: ${source.toUpperCase()}`} className="bg-slate-900 text-[#009999] font-black italic border-b border-slate-800">
                {filtered.map(t => (
                  <option key={t.id} value={t.id} className="text-white bg-slate-900 font-semibold font-sans py-2">
                    {t.name.toUpperCase()}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-700">
            <Search size={16} />
        </div>
    </div>
  </div>
);

const Dashboard = ({ liveData = {}, connections = [], userId }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [widgets, setWidgets] = useState([]);
  const [history, setHistory] = useState({});
  const [searchTerm, setSearchTerm] = useState(""); 
  const [allSystemTags, setAllSystemTags] = useState([]);

  const [newWidget, setNewWidget] = useState({ 
    type: 'numeric', tagKey: '', title: '',
    config: { voltageId: '', currentId: '', powerId: '', energyId: '' } 
  });

  useEffect(() => {
    const syncInfrastructure = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const dashRes = await api.getDashboard(userId);
        const layoutData = dashRes.data.layout || dashRes.data;
        if (Array.isArray(layoutData)) setWidgets(layoutData);

        const tagPromises = connections.map(c => api.getTags(c.id));
        const physicalResults = await Promise.all(tagPromises);
        const physicalTags = physicalResults.flatMap((res, index) => 
          res.data.map(t => ({ id: t.id.toString(), name: t.tag_name, sourceName: connections[index].name }))
        );
        
        const virtualRes = await api.getTags(0);
        const virtualTags = virtualRes.data.map(t => ({ 
          id: t.id.toString(), name: t.tag_name, sourceName: 'VIRTUAL WORKSPACE' 
        }));

        setAllSystemTags([...physicalTags, ...virtualTags]);
      } catch (err) { console.error("Sync Error", err); }
      finally { setLoading(false); }
    };
    syncInfrastructure();
  }, [userId, connections.length]);

  const groupedTags = useMemo(() => {
    const groups = {};
    allSystemTags.forEach(tag => {
      const source = tag.sourceName || "INTERNAL_CORE";
      if (!groups[source]) groups[source] = [];
      groups[source].push(tag);
    });
    return groups;
  }, [allSystemTags]);

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

  const addWidget = () => {
    if (newWidget.type !== 'energy_analyzer' && !newWidget.tagKey) return;
    const id = Date.now().toString();
    setWidgets([...widgets, { ...newWidget, id }]);
    setIsAddModalOpen(false);
    setNewWidget({ type: 'numeric', tagKey: '', title: '', config: { voltageId: '', currentId: '', powerId: '', energyId: '' } });
  };

  const removeWidget = (id) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const renderWidgetContent = (w) => {
    if (w.type === 'energy_analyzer') {
      return <EnergyAnalyzerWidget title={w.title} config={w.config} liveData={liveData} />;
    }

    const nodeData = liveData[w.tagKey];
    const currentVal = nodeData ? parseFloat(nodeData.value) : 0;
    const dataPoints = history[w.tagKey] || [];

    switch (w.type) {
      case 'numeric':
        return (
          <div className="flex items-baseline gap-4 mt-4">
            <span className="text-8xl font-black tracking-tighter text-[#00ffcc] font-mono italic drop-shadow-[0_10px_20px_rgba(0,255,204,0.15)]">
              {currentVal.toFixed(2)}
            </span>
            <span className="text-[12px] text-slate-600 font-bold uppercase tracking-[0.3em] italic">{nodeData?.unit || 'Units'}</span>
          </div>
        );
      case 'setpoint': // 🔔 YENİ: Setpoint Kontrolcü
        return <SetpointController tagKey={w.tagKey} nodeData={nodeData} currentVal={currentVal} />;
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
              <span className="text-4xl font-bold text-white italic tracking-tighter">{currentVal.toFixed(1)}</span>
              <span className="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{nodeData?.unit}</span>
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
          <div className="h-36 w-full mt-6 bg-slate-950/50 rounded-[2rem] border-2 border-slate-900 p-6 relative overflow-hidden">
            <svg viewBox="0 0 100 50" className="w-full h-full relative z-10" preserveAspectRatio="none">
              <polyline fill="none" stroke="#00ffcc" strokeWidth="3" points={points} strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </div>
        );
      default: return null;
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-8 bg-[#020617] font-['Inter']">
      <Loader2 className="animate-spin text-[#00ffcc]" size={64} />
      <div className="text-center space-y-2">
          <span className="text-[12px] font-bold uppercase tracking-[0.5em] text-white block">System Synchronizing</span>
          <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-600 block italic">Mapping Infrastructure Cluster...</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-20 px-6 pt-10 text-white font-['Inter',_sans-serif]">
      
      {/* 🏛️ HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-10 border-b-2 border-slate-800 pb-12 text-white">
        <div className="space-y-1 min-w-[350px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-1 bg-[#00ffcc]"></div>
            <span className="text-[#00ffcc] text-[10px] font-bold uppercase tracking-[0.4em]">Real-Time Core</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Operations</h1>
          <p className="text-slate-500 text-[11px] font-semibold tracking-wide flex items-center gap-2 mt-4 italic">
             <Terminal size={14} className="text-[#009999]" /> Operator Node Identity: {userId}
          </p>

          <div className="flex gap-4 mt-8">
            <button 
              onClick={toggleEditMode} 
              className={`px-8 py-4 rounded-xl flex items-center gap-3 transition-all font-bold text-[11px] uppercase tracking-widest border-2 shadow-2xl ${
                  isEditMode ? 'bg-[#009999] text-white border-[#00ffcc]/30' : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-[#009999]/30 hover:text-[#00ffcc]'
              }`}
            >
              {isEditMode ? <Save size={18} /> : <Settings2 size={18} />}
              {isEditMode ? 'Lock Protocol' : 'Customize UI'}
            </button>
            {isEditMode && (
              <button 
                  onClick={() => setIsAddModalOpen(true)} 
                  className="bg-[#009999] hover:bg-[#00cccc] text-white px-8 py-4 rounded-xl flex items-center gap-3 shadow-2xl text-[11px] font-bold uppercase tracking-widest transition-all"
              >
                <Plus size={20} /> Add Widget
              </button>
            )}
          </div>
        </div>

        {/* 🎯 RIGHT: GUIDE BOX */}
        <div className="flex-1 bg-slate-900/40 border-2 border-slate-800/50 p-6 rounded-[2.5rem] relative overflow-hidden flex flex-col md:flex-row gap-6 shadow-2xl text-white">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><DashboardIcon size={80}/></div>
            <div className="p-4 bg-[#009999]/10 text-[#00ffcc] rounded-2xl h-fit shadow-inner border border-[#009999]/20"><Info size={24}/></div>
            <div className="space-y-4">
                <h5 className="text-[11px] font-bold text-white uppercase italic tracking-widest border-b border-slate-800 pb-2 inline-block">Visual Orchestration Guide</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[9px] font-semibold uppercase text-slate-500">
                    <div className="space-y-1"><p className="text-[#00ffcc] font-bold italic text-[10px]">Telemetry</p><p>Live data push from Control Layer nodes.</p></div>
                    <div className="space-y-1 border-l border-slate-800/50 pl-4"><p className="text-amber-500 font-bold italic text-[10px]">Setpoints</p><p>Manual override variables linked to logic engine.</p></div>
                    <div className="space-y-1 border-l border-slate-800/50 pl-4"><p className="text-blue-400 font-bold italic text-[10px]">Persistence</p><p>Layout signatures are unique per operator node.</p></div>
                </div>
            </div>
        </div>
      </div>

      {/* 🎛️ DASHBOARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pt-4">
        {widgets.map((w) => (
          <div 
            key={w.id} 
            className={`group bg-slate-900/30 border-2 rounded-[3rem] p-10 shadow-2xl relative transition-all duration-500 overflow-hidden hover:border-[#009999]/30 hover:bg-slate-900/50 ${
                w.type === 'energy_analyzer' ? 'lg:col-span-2 border-[#009999]/20' : 
                w.type === 'setpoint' ? 'border-amber-600/30 shadow-amber-900/10' : 'border-slate-800'
            }`}
          >
            {isEditMode && (
              <button onClick={() => removeWidget(w.id)} className="absolute top-6 right-6 p-3 bg-red-600/10 text-red-500 rounded-2xl z-20 border border-red-500/20 shadow-xl transition-all hover:bg-red-600 hover:text-white">
                <X size={18} />
              </button>
            )}
            <div className={`absolute top-0 left-0 w-24 h-1 transition-colors duration-500 ${w.type === 'gauge' ? 'bg-amber-500' : w.type === 'setpoint' ? 'bg-amber-600 shadow-[0_0_15px_rgba(217,119,6,0.4)]' : 'bg-[#00ffcc]'}`} />
            {w.type !== 'energy_analyzer' && (
              <h2 className="text-slate-500 text-[11px] mb-8 flex items-center gap-3 uppercase font-bold tracking-[0.3em] italic group-hover:text-[#00ffcc] transition-colors">
                <div className={`p-2 bg-slate-950 rounded-lg shadow-inner ${w.type === 'gauge' || w.type === 'setpoint' ? 'text-amber-500' : 'text-[#009999]'}`}>
                    {w.type === 'numeric' && <Cpu size={14} />}
                    {w.type === 'gauge' && <GaugeIcon size={14} />}
                    {w.type === 'sparkline' && <LineChart size={14} />}
                    {w.type === 'setpoint' && <Settings2 size={14} />}
                </div>
                {w.title || (w.tagKey && liveData[w.tagKey]?.tagName) || 'NODE_DEFINITION'}
              </h2>
            )}
            <div className="min-h-[140px] flex flex-col justify-center">{renderWidgetContent(w)}</div>
          </div>
        ))}
      </div>

      {/* 📂 DEPLOY MODAL (Setpoint Seçeneği Eklendi) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-3xl flex items-center justify-center z-[500] p-6 animate-in fade-in duration-300">
          <div className="bg-[#0b1117] border-2 border-slate-800 p-12 rounded-[4rem] w-full max-w-3xl shadow-[0_0_100px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-5 mb-12">
                <div className="w-16 h-16 bg-[#009999]/20 text-[#00ffcc] rounded-[2rem] flex items-center justify-center shadow-inner border border-[#009999]/20">
                    <DashboardIcon size={32}/>
                </div>
                <div>
                    <h3 className="text-4xl font-bold text-white uppercase italic tracking-tighter">Deploy New Logic</h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-1 italic">Infrastructure Visualization Engine</p>
                </div>
            </div>
            
            <div className="space-y-10">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic ml-2">Display Mode</label>
                <div className="grid grid-cols-5 gap-4">
                  {[
                    { id: 'numeric', icon: <Cpu size={24}/>, label: 'Value' },
                    { id: 'gauge', icon: <GaugeIcon size={24}/>, label: 'Gauge' },
                    { id: 'sparkline', icon: <LineChart size={24}/>, label: 'Trend' },
                    { id: 'setpoint', icon: <Settings2 size={24} className="text-amber-500"/>, label: 'Setpoint' }, // 🔔 Yeni
                    { id: 'energy_analyzer', icon: <Zap size={24} className="text-[#00ffcc]" />, label: 'Energy' }
                  ].map(item => (
                    <button key={item.id} onClick={() => setNewWidget({...newWidget, type: item.id})} className={`p-6 rounded-[2.5rem] border-2 flex flex-col items-center gap-4 transition-all ${newWidget.type === item.id ? 'bg-[#009999]/15 border-[#00ffcc] text-[#00ffcc] shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-700'}`}>
                      {item.icon} <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] text-slate-600 block ml-2 uppercase font-bold italic tracking-widest">Logic Identifier</label>
                    <input type="text" placeholder="e.g. PRESSURE_THRESHOLD_SET" className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 text-white font-bold uppercase text-sm outline-none focus:border-[#009999] shadow-inner" value={newWidget.title} onChange={e => setNewWidget({...newWidget, title: e.target.value})} />
                </div>
                <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#009999]" size={20} />
                    <input type="text" placeholder="Search infrastructure map..." className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 pl-16 text-xs text-[#00ffcc] font-semibold outline-none focus:border-[#009999] shadow-inner uppercase tracking-wider" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
              
              <div className="bg-slate-950/50 p-10 rounded-[3rem] border-2 border-slate-800/50 shadow-inner">
                 <TagSelector label="Infrastructure Target Node" value={newWidget.tagKey} groupedTags={groupedTags} searchTerm={searchTerm} onChange={(val) => setNewWidget({...newWidget, tagKey: val})} />
              </div>
              
              <div className="flex gap-4 pt-6">
                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-5 rounded-2xl bg-slate-800 text-slate-400 font-bold uppercase text-[11px] tracking-widest">Dismiss</button>
                <button onClick={addWidget} className="flex-[2] py-5 rounded-2xl bg-[#009999] text-white font-bold uppercase text-[11px] tracking-widest shadow-2xl active:scale-95 transition-all">Establish Logic</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;