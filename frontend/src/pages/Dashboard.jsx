import React, { useState, useEffect } from 'react';
import { 
  Gauge as GaugeIcon, Thermometer, Activity, Cpu, Plus, 
  Settings2, X, Layout, Save, Move, LineChart, Radio, Loader2
} from 'lucide-react';
import { api } from '../services/api'; // API servisimizi bağladık

const Dashboard = ({ liveData = {}, connections = [], userId }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // 1. WIDGET LİSTESİ (Artık DB'den gelecek)
  const [widgets, setWidgets] = useState([]);

  // 2. GEÇMİŞ VERİ (History) - Sparkline için
  const [history, setHistory] = useState({});

  // 📥 3. DÜZENİ VERİTABANINDAN YÜKLE
  useEffect(() => {
    const fetchLayout = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        console.log(`📡 [Dashboard] Düzen yükleniyor: User ${userId}`);
        const res = await api.getDashboard(userId);
        // Backend { layout: [...] } veya direkt [...] dönebilir, kontrol ediyoruz
        const layoutData = res.data.layout || res.data;
        if (Array.isArray(layoutData)) {
          setWidgets(layoutData);
        }
      } catch (err) {
        console.error("❌ Düzen yüklenemedi:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLayout();
  }, [userId]);

  // 💾 4. DÜZENİ VERİTABANINA KAYDET (Edit mode kapatıldığında tetiklenir)
  const toggleEditMode = async () => {
    if (isEditMode) {
      // Mod kapatılırken verileri DB'ye gönderiyoruz
      try {
        console.log("💾 [Dashboard] Düzen kaydediliyor...");
        await api.saveDashboard(userId, widgets);
        console.log("✅ [Dashboard] Kayıt başarılı.");
      } catch (err) {
        alert("Layout could not be synced with central server.");
        console.error(err);
      }
    }
    setIsEditMode(!isEditMode);
  };

  // Canlı veri geçmişini tutma (Sparkline)
  useEffect(() => {
    setHistory(prev => {
      const newHistory = { ...prev };
      Object.keys(liveData).forEach(key => {
        if (!newHistory[key]) newHistory[key] = [];
        newHistory[key] = [...newHistory[key], parseFloat(liveData[key] || 0)].slice(-30);
      });
      return newHistory;
    });
  }, [liveData]);

  const [newWidget, setNewWidget] = useState({ type: 'numeric', tagKey: '', title: '' });

  const addWidget = () => {
    if (!newWidget.tagKey) return;
    const id = Date.now().toString();
    setWidgets([...widgets, { ...newWidget, id }]);
    setIsAddModalOpen(false);
    setNewWidget({ type: 'numeric', tagKey: '', title: '' });
  };

  const removeWidget = (id) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  // --- WIDGET RENDER MOTORU ---
  const renderWidgetContent = (w) => {
    const currentVal = parseFloat(liveData[w.tagKey] || 0);
    const dataPoints = history[w.tagKey] || [];

    switch (w.type) {
      case 'numeric':
        return (
          <div className="flex items-baseline gap-3 mt-2">
            <span className="text-7xl font-black tracking-tighter text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.3)] font-mono">
              {currentVal.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-700 font-black uppercase tracking-[0.2em] italic">Units</span>
          </div>
        );

      case 'gauge':
        const radius = 45;
        const circumference = 2 * Math.PI * radius;
        const percentage = Math.min(Math.max(currentVal, 0), 100);
        const offset = circumference - (percentage / 100) * circumference;
        return (
          <div className="relative flex items-center justify-center h-40 mt-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800/50" />
              <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" 
                strokeDasharray={circumference} strokeDashoffset={offset}
                className="text-blue-500 transition-all duration-700 stroke-round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white">{currentVal.toFixed(1)}</span>
              <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-1">% SCALE</span>
            </div>
          </div>
        );

      case 'sparkline':
        const max = Math.max(...dataPoints, 1) * 1.2;
        const min = Math.min(...dataPoints, 0);
        const range = max - min;
        const points = dataPoints.map((val, i) => {
          const x = (i / (30 - 1)) * 100;
          const y = 50 - ((val - min) / range) * 40;
          return `${x},${y}`;
        }).join(' ');
        return (
          <div className="h-32 w-full mt-4 bg-slate-900/40 rounded-3xl border border-slate-800/50 p-4 relative overflow-hidden">
            <svg viewBox="0 0 100 50" className="w-full h-full" preserveAspectRatio="none">
              <polyline fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
                className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" points={points} 
              />
            </svg>
            <div className="absolute bottom-3 right-5 text-right">
              <div className="text-xl font-black text-emerald-400 leading-none">{currentVal.toFixed(2)}</div>
              <div className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mt-1">Live Trend</div>
            </div>
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
    <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20 px-4">
      
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Operations</h1>
          <p className="text-slate-500 text-[10px] font-black tracking-[0.4em] mt-2 italic uppercase">
            Operator ID: {userId} | Live Logic Monitoring
          </p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={toggleEditMode}
            className={`px-6 py-3 rounded-2xl flex items-center gap-2 transition-all font-black text-[10px] uppercase tracking-widest border shadow-xl ${
              isEditMode ? 'bg-amber-500 text-black border-amber-400 scale-105' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            {isEditMode ? <Save size={18} /> : <Settings2 size={18} />}
            {isEditMode ? 'Lock Config' : 'Customize Panel'}
          </button>

          {isEditMode && (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg transition-all font-black text-[10px] uppercase tracking-widest animate-in zoom-in"
            >
              <Plus size={20} /> Add Widget
            </button>
          )}
        </div>
      </div>

      {/* GRID */}
      {widgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-[3rem]">
          <Layout size={64} className="text-slate-800 mb-6 opacity-20" />
          <h3 className="text-xl font-black text-slate-600 tracking-tighter uppercase">No Dashboard Configured</h3>
          <p className="text-slate-700 text-xs mt-2 italic uppercase tracking-widest font-black">Switch to customize mode to deploy nodes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {widgets.map((w) => (
            <div key={w.id} className={`bg-slate-950/60 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative group transition-all hover:border-slate-600 overflow-hidden ${isEditMode ? 'ring-2 ring-amber-500/20' : ''}`}>
              
              {isEditMode && (
                <button onClick={() => removeWidget(w.id)} className="absolute top-5 right-5 p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all z-20"><X size={16} /></button>
              )}

              <h2 className="text-slate-500 text-[10px] mb-6 flex items-center gap-3 uppercase font-black tracking-[0.3em]">
                {w.type === 'numeric' && <Cpu size={14} className="text-blue-500"/>}
                {w.type === 'gauge' && <GaugeIcon size={14} className="text-amber-500"/>}
                {w.type === 'sparkline' && <LineChart size={14} className="text-emerald-500"/>}
                {w.title || w.tagKey.split(':')[1]}
              </h2>

              <div className="min-h-[120px] flex items-center">
                {renderWidgetContent(w)}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800/50 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <Radio size={12} className="text-slate-700 animate-pulse" />
                    <span className="text-[9px] font-mono text-slate-600 uppercase tracking-tighter">{w.tagKey.split(':')[0]}</span>
                 </div>
                 <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[500] p-6 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] w-full max-w-xl shadow-2xl animate-in zoom-in-95">
            <h3 className="text-3xl font-black text-white tracking-tighter uppercase mb-8 italic">Deploy New Widget</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] text-slate-500 block mb-3 uppercase font-black tracking-widest ml-1">Friendly Title</label>
                <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white outline-none focus:border-blue-500 transition-all font-bold uppercase placeholder:text-slate-600"
                  placeholder="e.g. PRESSURE_VALVE_04" value={newWidget.title} onChange={e => setNewWidget({...newWidget, title: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-3 uppercase font-black tracking-widest ml-1">Data Stream Source</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white outline-none focus:border-blue-500 transition-all font-mono text-[10px] font-black uppercase"
                  value={newWidget.tagKey} onChange={e => setNewWidget({...newWidget, tagKey: e.target.value})} >
                  <option value="">Select an active node...</option>
                  {Object.keys(liveData).map(key => <option key={key} value={key}>{key}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4">
                {[{ id: 'numeric', icon: <Cpu size={24}/>, label: 'Value' }, { id: 'gauge', icon: <GaugeIcon size={24}/>, label: 'Gauge' }, { id: 'sparkline', icon: <LineChart size={24}/>, label: 'Trend' }].map(item => (
                  <button key={item.id} onClick={() => setNewWidget({...newWidget, type: item.id})} className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${newWidget.type === item.id ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/20' : 'bg-slate-800 border-transparent text-slate-600'}`}>
                    {item.icon} <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-4 pt-8">
                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-5 rounded-2xl bg-slate-800 text-slate-400 font-black text-[10px] uppercase tracking-widest">Cancel</button>
                <button onClick={addWidget} className="flex-[2] py-5 rounded-2xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/40">Establish Widget</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;