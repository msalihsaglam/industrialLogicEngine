import React, { useState, useEffect, useMemo } from 'react';
import { 
  Gauge as GaugeIcon, Activity, Cpu, Plus, 
  Settings2, X, Save, LineChart, Loader2, Zap, Database, Search,
  Terminal, Info, LayoutDashboard as DashboardIcon, Globe,
  ArrowUp, ArrowDown, Server
} from 'lucide-react';
import { api } from '../services/api';
import EnergyAnalyzerWidget from '../components/EnergyAnalyzerWidget'; 

// --- 🕹️ SETPOINT CONTROLLER SUB-COMPONENT (KORUNDU & GİYDİRİLDİ) ---
const SetpointController = ({ tagKey, nodeData, currentVal }) => {
  const safeVal = isNaN(currentVal) ? 0 : currentVal;
  const [inputValue, setInputValue] = useState(safeVal);
  useEffect(() => { if (!isNaN(currentVal)) setInputValue(currentVal); }, [currentVal]);

  const handleUpdate = async () => {
    try {
      const finalVal = isNaN(inputValue) ? 0 : inputValue;
      await api.updateTagValue({
        tagId: tagKey, tagName: nodeData?.tagName || 'SETPOINT', value: finalVal, sourceName: 'VIRTUAL WORKSPACE'
      });
    } catch (err) { console.error("❌ Update Error:", err); }
  };

  return (
    <div className="space-y-4 mt-4 animate-in fade-in duration-500">
      <div className="relative group">
        <input 
          type="number" 
          value={isNaN(inputValue) ? "" : inputValue} 
          onChange={(e) => { const val = parseFloat(e.target.value); setInputValue(isNaN(val) ? 0 : val); }} 
          className="w-full bg-[#0B1215] border-2 border-[#23333A] rounded-md p-6 text-center text-5xl font-bold text-amber-500 font-data outline-none focus:border-amber-600/50 transition-all shadow-inner" 
        />
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-[8px] font-bold px-3 py-0.5 rounded uppercase tracking-widest shadow-xl">Control Target</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setInputValue(prev => parseFloat(((prev || 0) - 1).toFixed(2)))} className="py-4 bg-[#141F24] rounded-md text-white font-bold hover:bg-slate-700 transition-all flex items-center justify-center border border-[#23333A]"> <ArrowDown size={18}/> </button>
          <button type="button" onClick={() => setInputValue(prev => parseFloat(((prev || 0) + 1).toFixed(2)))} className="py-4 bg-[#141F24] rounded-md text-white font-bold hover:bg-slate-700 transition-all flex items-center justify-center border border-[#23333A]"> <ArrowUp size={18}/> </button>
      </div>
      <button type="button" onClick={handleUpdate} className="w-full py-4 bg-[#006470] hover:bg-[#007a8a] text-white font-bold uppercase text-[10px] tracking-widest rounded-md shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 group">
        <Save size={16}/> Commit Setpoint
      </button>
    </div>
  );
};

// --- 🏷️ UNIFIED TAG SELECTOR ---
const TagSelector = ({ label, value, onChange, groupedTags, searchTerm }) => (
  <div className="space-y-2">
    <label className="label-caps flex items-center gap-2">
        <Database size={12} className="text-[#006470]"/> {label}
    </label>
    <div className="relative">
        <select className="w-full bg-[#0B1215] border border-[#23333A] rounded-md p-4 pl-5 text-white text-[11px] font-semibold focus:border-[#006470] outline-none appearance-none cursor-pointer uppercase tracking-tight shadow-inner transition-all" value={value} onChange={e => onChange(e.target.value)}>
          <option value="" className="bg-slate-900 font-sans">Select Infrastructure Node...</option>
          {Object.entries(groupedTags).map(([source, tags]) => {
            const filtered = tags.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
            if (filtered.length === 0) return null;
            return (
              <optgroup key={source} label={`SOURCE: ${source.toUpperCase()}`} className="bg-slate-900 text-[#006470] font-bold border-b border-slate-800">
                {filtered.map(t => ( <option key={t.id} value={t.id} className="text-white bg-slate-900 font-semibold font-sans py-2">{t.name.toUpperCase()}</option> ))}
              </optgroup>
            );
          })}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-700"> <Search size={14} /> </div>
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

  const systemStats = useMemo(() => {
    const physical = allSystemTags.filter(t => t.sourceName !== 'VIRTUAL WORKSPACE').length;
    const virtual = allSystemTags.filter(t => t.sourceName === 'VIRTUAL WORKSPACE').length;
    const activeConns = connections.filter(c => c.status).length || connections.length;
    
    return [
      { label: 'Infrastructure', val: `${activeConns}/${connections.length}`, sub: 'Active Links', color: 'text-[#00FFCC]', icon: <Globe size={20}/> },
      { label: 'Field Nodes', val: physical, sub: 'Physical Sensors', color: 'text-blue-400', icon: <Database size={20}/> },
      { label: 'Logic Layer', val: virtual, sub: 'Virtual Variables', color: 'text-purple-400', icon: <Cpu size={20}/> },
      { label: 'System Pulse', val: 'Active', sub: 'Live Telemetry', color: 'text-amber-500', icon: <Activity size={20}/> }
    ];
  }, [allSystemTags, connections]);

  const handleAutoMapEnergy = (connectionName) => {
    const sourceTags = allSystemTags.filter(t => t.sourceName === connectionName);
    const findTag = (kw) => sourceTags.find(t => t.name.toLowerCase().includes(kw.toLowerCase()))?.id || '';

    setNewWidget(prev => ({
      ...prev,
      title: connectionName.toUpperCase() + " ANALYZER",
      config: {
        voltageId: findTag('volt'),
        currentId: findTag('curr'),
        powerId: findTag('pow'),
        energyId: findTag('ener')
      }
    }));
  };

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
        const virtualTags = virtualRes.data.map(t => ({ id: t.id.toString(), name: t.tag_name, sourceName: 'VIRTUAL WORKSPACE' }));
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
    if (isEditMode) { try { await api.saveDashboard(userId, widgets); } catch (err) { alert("Sync failed."); } }
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

  const removeWidget = (id) => { setWidgets(widgets.filter(w => w.id !== id)); };

  const renderWidgetContent = (w) => {
    if (w.type === 'energy_analyzer') return <EnergyAnalyzerWidget title={w.title} config={w.config} liveData={liveData} />;
    const nodeData = liveData[w.tagKey];
    const currentVal = nodeData ? parseFloat(nodeData.value) : 0;
    const dataPoints = history[w.tagKey] || [];

    switch (w.type) {
      case 'numeric':
        return (
          <div className="flex items-baseline gap-4 mt-4">
            <span className="text-7xl font-bold tracking-tighter text-[#00FFCC] font-data drop-shadow-[0_10px_20px_rgba(0,255,204,0.1)]">{currentVal.toFixed(2)}</span>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{nodeData?.unit || 'Units'}</span>
          </div>
        );
      case 'setpoint': return <SetpointController tagKey={w.tagKey} nodeData={nodeData} currentVal={currentVal} />;
      case 'gauge':
        const radius = 45; const circumference = 2 * Math.PI * radius;
        const offset = circumference - (Math.min(currentVal, 100) / 100) * circumference;
        return (
          <div className="relative flex items-center justify-center h-40 mt-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-[#0B1215]" />
              <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} className="text-[#006470] transition-all duration-1000" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white font-data">{currentVal.toFixed(1)}</span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{nodeData?.unit}</span>
            </div>
          </div>
        );
      case 'sparkline':
        const max = Math.max(...dataPoints, 1) * 1.2; const min = Math.min(0, ...dataPoints);
        const range = max - min || 1;
        const points = dataPoints.map((val, i) => { const x = (i / 29) * 100; const y = 50 - ((val - min) / range) * 40; return `${x},${y}`; }).join(' ');
        return (
          <div className="h-32 w-full mt-6 bg-[#0B1215] rounded-md border border-[#23333A] p-4 relative overflow-hidden">
            <svg viewBox="0 0 100 50" className="w-full h-full relative z-10" preserveAspectRatio="none">
              <polyline fill="none" stroke="#00FFCC" strokeWidth="2.5" points={points} strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </div>
        );
      default: return null;
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-8 bg-[#0B1215]">
      <Loader2 className="animate-spin text-[#00FFCC]" size={48} />
      <div className="text-center space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white block">System Synchronizing</span>
          <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-600 block">Mapping Infrastructure Cluster...</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-20 px-8 pt-10 text-[#F1F5F9] font-['IBM_Plex_Sans']">
      
      {/* 🔡 INDUSTRIAL CORE STYLES */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
          .font-data { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
          .industrial-panel { background-color: #141F24; border: 1px solid #23333A; }
          .label-caps { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #94A3B8; }
        `}
      </style>

      {/* 🏛️ SYSTEM OVERVIEW HEADER */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-10 duration-700">
        {systemStats.map((stat, i) => (
          <div key={i} className="industrial-panel p-6 rounded-md shadow-sm relative overflow-hidden group hover:border-[#006470] transition-all">
            <div className={`absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity ${stat.color}`}>{stat.icon}</div>
            <div className="space-y-1">
              <p className="label-caps mb-2">{stat.label}</p>
              <h4 className={`text-3xl font-bold font-data tracking-tight ${stat.color}`}>{stat.val}</h4>
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-1.5 h-1.5 rounded-full ${stat.color.replace('text-', 'bg-')}`}></div>
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{stat.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 🏛️ HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-10 border-b border-[#23333A] pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3"><div className="w-1.5 h-6 bg-[#006470]"></div><span className="label-caps">Operation Terminal</span></div>
          <h1 className="text-4xl font-bold tracking-tight uppercase text-white leading-none">Control Dashboard</h1>
          <div className="flex gap-3 mt-8">
            <button onClick={toggleEditMode} className={`px-6 py-3 rounded-md flex items-center gap-3 transition-all font-bold text-[10px] uppercase tracking-widest border ${isEditMode ? 'bg-[#006470] text-white border-[#00FFCC]/20' : 'bg-[#141F24] text-slate-500 border-[#23333A] hover:text-[#00FFCC]'}`}> {isEditMode ? <Save size={16} /> : <Settings2 size={16} />} {isEditMode ? 'Lock Layout' : 'Modify Interface'} </button>
            {isEditMode && <button onClick={() => setIsAddModalOpen(true)} className="bg-[#006470] hover:bg-[#007a8a] text-white px-6 py-3 rounded-md flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all"> <Plus size={18} /> New Widget </button>}
          </div>
        </div>
        
        {/* Visual Orchestration Guide (Rigid Style) */}
        <div className="flex-1 industrial-panel p-6 rounded-md relative overflow-hidden flex flex-col md:flex-row gap-6 border-l-4 border-l-[#006470]">
            <div className="p-3 bg-[#006470]/10 text-[#00FFCC] rounded h-fit"><Info size={20}/></div>
            <div className="space-y-4">
                <h5 className="label-caps border-b border-[#23333A] pb-2 inline-block">Visualization Orchestration</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1"><p className="text-[#00FFCC] text-[10px] font-bold uppercase tracking-tighter">Telemetry</p><p className="text-[9px] text-slate-500 leading-relaxed font-medium">Live data push from Control Layer.</p></div>
                    <div className="space-y-1 border-l border-[#23333A] pl-4"><p className="text-amber-500 text-[10px] font-bold uppercase tracking-tighter">Overrides</p><p className="text-[9px] text-slate-500 leading-relaxed font-medium">Manual variables for logic engine.</p></div>
                    <div className="space-y-1 border-l border-[#23333A] pl-4"><p className="text-blue-400 text-[10px] font-bold uppercase tracking-tighter">Persistence</p><p className="text-[9px] text-slate-500 leading-relaxed font-medium">Unique layout per operator node.</p></div>
                </div>
            </div>
        </div>
      </div>

      {/* 🎛️ DASHBOARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {widgets.map((w) => (
          <div key={w.id} className={`group industrial-panel rounded-md p-8 shadow-sm relative transition-all overflow-hidden ${w.type === 'energy_analyzer' ? 'lg:col-span-2 border-[#006470]/30' : 'border-[#23333A]'}`}>
            {isEditMode && <button onClick={() => removeWidget(w.id)} className="absolute top-4 right-4 p-2 bg-red-600/10 text-red-500 rounded border border-red-500/20 z-20 hover:bg-red-600 hover:text-white transition-all"><X size={14} /></button>}
            
            <div className={`absolute top-0 left-0 w-16 h-1 ${w.type === 'gauge' ? 'bg-amber-500' : w.type === 'setpoint' ? 'bg-amber-600' : 'bg-[#006470]'}`} />
            
            {w.type !== 'energy_analyzer' && (
              <h2 className="label-caps mb-8 flex items-center gap-3 text-slate-500 group-hover:text-white transition-colors">
                <div className={`p-1.5 rounded bg-[#0B1215] border border-[#23333A] ${w.type === 'gauge' || w.type === 'setpoint' ? 'text-amber-500' : 'text-[#006470]'}`}> 
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

      {/* 📂 DEPLOY MODAL (Industrial Design) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-[#0B1215]/95 backdrop-blur-md flex items-center justify-center z-[500] p-6 animate-in fade-in duration-300">
          <div className="industrial-panel p-10 rounded-md w-full max-w-2xl shadow-2xl">
            <div className="flex items-center gap-5 mb-10 border-b border-[#23333A] pb-6">
                <div className="w-12 h-12 bg-[#006470]/20 text-[#00FFCC] rounded flex items-center justify-center border border-[#006470]/30"><DashboardIcon size={24}/></div>
                <div>
                  <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Deploy Logic Widget</h3>
                  <p className="label-caps opacity-50 mt-1 tracking-widest">Infrastructure Visualization Engine</p>
                </div>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="label-caps">Widget Type</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: 'numeric', icon: <Cpu size={20}/>, label: 'Value' },
                    { id: 'gauge', icon: <GaugeIcon size={20}/>, label: 'Gauge' },
                    { id: 'sparkline', icon: <LineChart size={20}/>, label: 'Trend' },
                    { id: 'setpoint', icon: <Settings2 size={20} className="text-amber-500"/>, label: 'Control' },
                    { id: 'energy_analyzer', icon: <Zap size={20} className="text-[#00FFCC]" />, label: 'Energy' }
                  ].map(item => (
                    <button key={item.id} onClick={() => setNewWidget({...newWidget, type: item.id})} className={`p-4 rounded border flex flex-col items-center gap-2 transition-all ${newWidget.type === item.id ? 'bg-[#006470]/20 border-[#00FFCC] text-[#00FFCC]' : 'bg-[#0B1215] border-[#23333A] text-slate-600'}`}>
                      {item.icon} <span className="text-[8px] font-bold uppercase tracking-wider">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                    <label className="label-caps">Display Label</label>
                    <input type="text" placeholder="e.g. PRESSURE_SET" className="w-full bg-[#0B1215] border border-[#23333A] rounded p-4 text-white font-bold uppercase text-[11px] outline-none focus:border-[#006470]" value={newWidget.title} onChange={e => setNewWidget({...newWidget, title: e.target.value})} />
                </div>
                {newWidget.type !== 'energy_analyzer' && (
                  <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#006470]" size={16} />
                      <input type="text" placeholder="Search infrastructure map..." className="w-full bg-[#0B1215] border border-[#23333A] rounded p-4 pl-12 text-[10px] text-[#00FFCC] font-semibold outline-none focus:border-[#006470] uppercase tracking-wider" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                )}
              </div>
              
              <div className="bg-[#0B1215] p-6 rounded border border-[#23333A] max-h-[250px] overflow-y-auto scrollbar-hide">
                 {newWidget.type === 'energy_analyzer' ? (
                   <div className="space-y-4 text-white">
                      <label className="label-caps flex items-center gap-2"> <Server size={14} className="text-[#00FFCC]"/> Target Device </label>
                      <select 
                        className="w-full bg-[#141F24] border border-[#23333A] rounded p-4 text-white font-bold outline-none focus:border-[#006470] uppercase text-[10px]"
                        onChange={(e) => handleAutoMapEnergy(e.target.value)}
                      >
                        <option value="">Select Source Device...</option>
                        {connections.map(c => <option key={c.id} value={c.name} className="bg-slate-900">{c.name.toUpperCase()}</option>)}
                      </select>
                   </div>
                 ) : (
                   <TagSelector label="Target Node" value={newWidget.tagKey} groupedTags={groupedTags} searchTerm={searchTerm} onChange={(val) => setNewWidget({...newWidget, tagKey: val})} />
                 )}
              </div>
              
              <div className="flex gap-3 pt-4">
                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 rounded bg-[#141F24] text-slate-500 font-bold uppercase text-[10px] tracking-widest border border-[#23333A]">Dismiss</button>
                <button onClick={addWidget} className="flex-[2] py-4 rounded bg-[#006470] text-white font-bold uppercase text-[10px] tracking-widest active:scale-95 transition-all">Establish Logic</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;