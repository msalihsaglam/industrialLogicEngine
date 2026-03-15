import React, { useState, useEffect, useMemo } from 'react';
import { 
  Gauge as GaugeIcon, Thermometer, Activity, Cpu, Plus, 
  Settings2, X, Layout, Save, Move, LineChart, Radio, Loader2, Zap, Database, Search
} from 'lucide-react';
import { api } from '../services/api';
import EnergyAnalyzerWidget from '../components/EnergyAnalyzerWidget'; 

// 🎯 ÇÖZÜM: TagSelector artık Dashboard DIŞINDA. 
// Bu sayede liveData güncellense bile dropdown kapanmıyor.
const TagSelector = ({ label, value, onChange, groupedTags, searchTerm }) => (
  <div className="space-y-2">
    <label className="text-[9px] text-slate-500 uppercase font-black ml-1">{label}</label>
    <select 
      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-[10px] font-mono focus:border-blue-500 outline-none"
      value={value} 
      onChange={e => onChange(e.target.value)}
    >
      <option value="">Select Node...</option>
      {Object.entries(groupedTags).map(([source, tags]) => {
        // Arama filtresini burada da uyguluyoruz
        const filtered = tags.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
        if (filtered.length === 0) return null;
        
        return (
          <optgroup key={source} label={`📍 ${source.toUpperCase()}`} className="bg-slate-900 text-blue-400 font-black">
            {filtered.map(t => (
              <option key={t.id} value={t.id} className="text-white">
                {t.name}
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
    type: 'numeric', 
    tagKey: '', 
    title: '',
    config: { voltageId: '', currentId: '', powerId: '', energyId: '' } 
  });

  // 📥 Düzen Yükleme
  useEffect(() => {
    const fetchLayout = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const res = await api.getDashboard(userId);
        const layoutData = res.data.layout || res.data;
        if (Array.isArray(layoutData)) setWidgets(layoutData);
      } catch (err) { console.error("❌ Düzen yüklenemedi:", err); }
      finally { setLoading(false); }
    };
    fetchLayout();
  }, [userId]);

  // 💾 Düzen Kaydetme
  const toggleEditMode = async () => {
    if (isEditMode) {
      try {
        await api.saveDashboard(userId, widgets);
      } catch (err) { alert("Layout could not be synced."); }
    }
    setIsEditMode(!isEditMode);
  };

  // 📈 Trend Geçmişi (Sparkline)
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

  // 🎯 Gruplandırma Mantığı (useMemo ile performans koruması)
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
          <div className="flex items-baseline gap-3 mt-2">
            <span className="text-7xl font-black tracking-tighter text-blue-400 font-mono italic">
              {currentVal.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-700 font-black uppercase tracking-widest">{nodeData?.unit || 'Units'}</span>
          </div>
        );
      case 'gauge':
        const radius = 45;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (Math.min(currentVal, 100) / 100) * circumference;
        return (
          <div className="relative flex items-center justify-center h-40 mt-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800/50" />
              <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" 
                strokeDasharray={circumference} strokeDashoffset={offset} className="text-blue-500 transition-all duration-700" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white">{currentVal.toFixed(1)}</span>
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
          <div className="h-32 w-full mt-4 bg-slate-900/40 rounded-3xl border border-slate-800/50 p-4">
            <svg viewBox="0 0 100 50" className="w-full h-full" preserveAspectRatio="none">
              <polyline fill="none" stroke="currentColor" strokeWidth="2.5" points={points} className="text-emerald-500" />
            </svg>
          </div>
        );
      default: return null;
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-blue-500" size={48} />
      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Retrieving Secure Node Layout</span>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-20 px-4">
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Operations</h1>
          <p className="text-slate-500 text-[10px] font-black tracking-[0.4em] mt-2 uppercase">Operator ID: {userId} | Live Analytics</p>
        </div>
        <div className="flex gap-4">
          <button onClick={toggleEditMode} className={`px-6 py-3 rounded-2xl flex items-center gap-2 transition-all font-black text-[10px] uppercase border shadow-xl ${isEditMode ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
            {isEditMode ? <Save size={18} /> : <Settings2 size={18} />}
            {isEditMode ? 'Lock Config' : 'Customize Panel'}
          </button>
          {isEditMode && (
            <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg font-black text-[10px] uppercase tracking-widest">
              <Plus size={20} /> Add Widget
            </button>
          )}
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {widgets.map((w) => (
          <div key={w.id} className={`bg-slate-950/60 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden ${w.type === 'energy_analyzer' ? 'lg:col-span-2' : ''}`}>
            {isEditMode && (
              <button onClick={() => removeWidget(w.id)} className="absolute top-5 right-5 p-2 bg-red-500/10 text-red-500 rounded-xl z-20"><X size={16} /></button>
            )}
            {w.type !== 'energy_analyzer' && (
              <h2 className="text-slate-500 text-[10px] mb-6 flex items-center gap-3 uppercase font-black tracking-[0.3em]">
                {w.type === 'numeric' && <Cpu size={14} className="text-blue-500"/>}
                {w.type === 'gauge' && <GaugeIcon size={14} className="text-amber-500"/>}
                {w.type === 'sparkline' && <LineChart size={14} className="text-emerald-500"/>}
                {w.title || (w.tagKey && liveData[w.tagKey]?.tagName) || 'NODE'}
              </h2>
            )}
            <div className="min-h-[120px]">{renderWidgetContent(w)}</div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[500] p-6 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] w-full max-w-2xl shadow-2xl">
            <h3 className="text-3xl font-black text-white uppercase italic mb-8">Deploy New Widget</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { id: 'numeric', icon: <Cpu />, label: 'Value' },
                  { id: 'gauge', icon: <GaugeIcon />, label: 'Gauge' },
                  { id: 'sparkline', icon: <LineChart />, label: 'Trend' },
                  { id: 'energy_analyzer', icon: <Zap className="text-emerald-500" />, label: 'Energy' }
                ].map(item => (
                  <button key={item.id} onClick={() => setNewWidget({...newWidget, type: item.id})} className={`p-4 rounded-3xl border-2 flex flex-col items-center gap-2 transition-all ${newWidget.type === item.id ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-slate-800 border-transparent text-slate-600'}`}>
                    {item.icon} <span className="text-[9px] font-black uppercase">{item.label}</span>
                  </button>
                ))}
              </div>

              <input type="text" placeholder="Friendly Title" className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold italic"
                value={newWidget.title} onChange={e => setNewWidget({...newWidget, title: e.target.value})} />

              {/* 🔍 ARAMA FİLTRESİ */}
              <div className="relative">
                <Search className="absolute left-4 top-4 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Filter nodes by name or source..." 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pl-12 text-xs text-white outline-none focus:border-emerald-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Dinamik Input Alanları */}
              {newWidget.type === 'energy_analyzer' ? (
                <div className="grid grid-cols-2 gap-4 bg-slate-950/50 p-6 rounded-3xl border border-slate-800">
                  <TagSelector label="Voltage" value={newWidget.config.voltageId} groupedTags={groupedTags} searchTerm={searchTerm} onChange={(val) => setNewWidget({...newWidget, config: {...newWidget.config, voltageId: val}})} />
                  <TagSelector label="Current" value={newWidget.config.currentId} groupedTags={groupedTags} searchTerm={searchTerm} onChange={(val) => setNewWidget({...newWidget, config: {...newWidget.config, currentId: val}})} />
                  <TagSelector label="Active Power" value={newWidget.config.powerId} groupedTags={groupedTags} searchTerm={searchTerm} onChange={(val) => setNewWidget({...newWidget, config: {...newWidget.config, powerId: val}})} />
                  <TagSelector label="Total Energy" value={newWidget.config.energyId} groupedTags={groupedTags} searchTerm={searchTerm} onChange={(val) => setNewWidget({...newWidget, config: {...newWidget.config, energyId: val}})} />
                </div>
              ) : (
                <TagSelector label="Target Node" value={newWidget.tagKey} groupedTags={groupedTags} searchTerm={searchTerm} onChange={(val) => setNewWidget({...newWidget, tagKey: val})} />
              )}

              <div className="flex gap-4 pt-8">
                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-5 rounded-2xl bg-slate-800 text-slate-400 font-black uppercase text-[10px]">Cancel</button>
                <button onClick={addWidget} className="flex-[2] py-5 rounded-2xl bg-blue-600 text-white font-black uppercase text-[10px] shadow-lg">Establish Widget</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;