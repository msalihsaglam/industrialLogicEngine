import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Zap, Plus, Download, FileText, Loader2, BarChart2, Search, Cpu, Database } from 'lucide-react';
import { api } from '../services/api';

const Reports = ({ liveData, userId }) => {
  const [activeReport, setActiveReport] = useState('energy'); 
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState([]); // Tüm bağlantıları tutacak
  
  // Seçim State'leri
  const [selectedConnId, setSelectedConnId] = useState(""); // Enerji Raporu için Cihaz ID
  const [selectedTag, setSelectedTag] = useState(""); // Custom Rapor için Tag ID
  
  const [dateRange, setDateRange] = useState({ 
    start: new Date(Date.now() - 86400000).toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });

  // 1. Cihaz Listesini (Connections) Çek
  useEffect(() => {
    const loadConnections = async () => {
      try {
        const res = await api.getConnections();
        setConnections(Array.isArray(res.data) ? res.data : []);
      } catch (err) { console.error("Bağlantılar yüklenemedi", err); }
    };
    loadConnections();
  }, []);

  // 2. Enerji Analizörlerini Filtrele (Bağlantı Tipine Göre)
  const energyAnalyzers = useMemo(() => {
    return connections.filter(c => c.connection_type === 'energy_analyzer');
  }, [connections]);

  // 3. Raporu Oluştur (Akıllı Cihaz Eşleşme Mantığı)
  const generateReport = async () => {
    setLoading(true);
    try {
      if (activeReport === 'energy') {
        if (!selectedConnId) return alert("Lütfen bir Enerji Analizörü seçin!");
        
        const conn = connections.find(c => c.id === parseInt(selectedConnId));
        
        // 🎯 OTOMATİK TAG BULUCU: 
        // Seçilen bağlantıya ait, birimi 'kWh' olan veya isminde 'energy' geçen tag'i bul
        const autoTagId = Object.keys(liveData).find(key => {
          const tag = liveData[key];
          return tag.sourceName === conn.name && 
                 (tag.unit?.toLowerCase() === 'kwh' || tag.tagName?.toLowerCase().includes('energy'));
        });

        if (!autoTagId) {
          throw new Error(`'${conn.name}' cihazı için uygun bir enerji (kWh) tag'i bulunamadı. Lütfen tag tanımlarını kontrol edin.`);
        }

        const res = await api.getEnergyDelta(autoTagId);
        setReportData(res.data);
      } else {
        if (!selectedTag) return alert("Lütfen bir Tag seçin!");
        const res = await api.getHistory(selectedTag, dateRange.start, dateRange.end);
        setReportData(res.data);
      }
    } catch (err) {
      alert(err.message || "Rapor verisi alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 p-10 animate-in fade-in duration-700">
      
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-slate-800 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Intelligence Hub</h1>
          <p className="text-slate-500 text-[10px] font-black tracking-[0.4em] mt-4 uppercase">Device-Centric Analytical Engine</p>
        </div>
        <button className="bg-slate-900 border border-slate-800 text-slate-400 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:border-slate-600 transition-all shadow-lg">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* 📋 TEMPLATES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button 
          onClick={() => { setActiveReport('energy'); setReportData([]); setSelectedConnId(""); }}
          className={`p-10 rounded-[3rem] border-2 text-left transition-all duration-500 relative overflow-hidden group ${
            activeReport === 'energy' ? 'bg-emerald-600/10 border-emerald-500 shadow-2xl' : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className={`mb-4 p-4 rounded-2xl w-fit ${activeReport === 'energy' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-500 group-hover:text-slate-300'}`}>
            <Zap size={24}/>
          </div>
          <h3 className="text-white font-black text-xl uppercase italic tracking-tight">Energy Analytics</h3>
          <p className="text-slate-500 text-[10px] mt-2 font-bold uppercase tracking-widest leading-relaxed">Automatic device mapping & consumption delta analysis</p>
        </button>

        <button 
          onClick={() => { setActiveReport('custom'); setReportData([]); setSelectedTag(""); }}
          className={`p-10 rounded-[3rem] border-2 text-left transition-all duration-500 relative overflow-hidden group ${
            activeReport === 'custom' ? 'bg-blue-600/10 border-blue-500 shadow-2xl' : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className={`mb-4 p-4 rounded-2xl w-fit ${activeReport === 'custom' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-500 group-hover:text-slate-300'}`}>
            <Plus size={24}/>
          </div>
          <h3 className="text-white font-black text-xl uppercase italic tracking-tight">User Defined</h3>
          <p className="text-slate-500 text-[10px] mt-2 font-bold uppercase tracking-widest leading-relaxed">Multi-node historical trend & behavior analysis</p>
        </button>
      </div>

      {/* 🔍 FİLTRE PANELİ */}
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] shadow-xl flex flex-wrap gap-6 items-end relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-1 h-full ${activeReport === 'energy' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
        
        {activeReport === 'energy' ? (
          /* ⚡ ENERJİ İÇİN: CİHAZ (CONNECTION) SEÇİCİ */
          <div className="flex-1 space-y-2">
            <label className="text-[9px] text-emerald-500 uppercase font-black ml-1 tracking-widest">Select Registered Analyzer</label>
            <div className="relative">
              <Cpu size={14} className="absolute left-4 top-4 text-slate-500" />
              <select 
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 pl-12 text-white text-[11px] font-bold outline-none focus:border-emerald-500 appearance-none"
                value={selectedConnId}
                onChange={(e) => setSelectedConnId(e.target.value)}
              >
                <option value="">Search Intelligence Nodes...</option>
                {energyAnalyzers.map(conn => (
                  <option key={conn.id} value={conn.id}>📍 {conn.name.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          /* 🛠️ CUSTOM İÇİN: TAG SEÇİCİ */
          <div className="flex-1 space-y-2">
            <label className="text-[9px] text-blue-500 uppercase font-black ml-1 tracking-widest">Select Target Node</label>
            <div className="relative">
              <Database size={14} className="absolute left-4 top-4 text-slate-500" />
              <select 
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 pl-12 text-white text-[11px] font-mono outline-none focus:border-blue-500 appearance-none"
                value={selectedTag} 
                onChange={(e) => setSelectedTag(e.target.value)}
              >
                <option value="">Browse Historian Nodes...</option>
                {Object.keys(liveData).map(key => (
                  <option key={key} value={key}>{liveData[key]?.tagName || key} ({liveData[key]?.sourceName})</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="w-64 space-y-2">
          <label className="text-[9px] text-slate-500 uppercase font-black ml-1 tracking-widest">Report Interval</label>
          <div className="flex gap-2">
            <input type="date" className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-[10px] w-full outline-none focus:border-blue-500 shadow-inner" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
            <input type="date" className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-[10px] w-full outline-none focus:border-blue-500 shadow-inner" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
          </div>
        </div>

        <button 
          onClick={generateReport}
          disabled={loading}
          className={`px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg flex items-center gap-3 disabled:opacity-50 ${
            activeReport === 'energy' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40'
          }`}
        >
          {loading ? <Loader2 size={16} className="animate-spin"/> : <FileText size={16}/>}
          Establish Report
        </button>
      </div>

      {/* 📊 GRAFİK ALANI */}
      <div className="bg-slate-900/30 border border-slate-800 p-10 rounded-[4rem] shadow-2xl h-[550px] backdrop-blur-sm relative">
        {reportData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {activeReport === 'energy' ? (
              <BarChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="period" stroke="#475569" fontSize={10} tickFormatter={(t) => new Date(t).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})} />
                <YAxis stroke="#475569" fontSize={10} />
                <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '10px'}} />
                <Bar dataKey="consumption" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="ts" stroke="#475569" fontSize={10} tickFormatter={(t) => new Date(t).toLocaleTimeString()} />
                <YAxis stroke="#475569" fontSize={10} />
                <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '10px'}} />
                <Line type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={3} dot={false} />
              </LineChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-700 border-2 border-dashed border-slate-800/20 rounded-[3rem]">
            <BarChart2 size={64} className="opacity-10 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">
              {activeReport === 'energy' ? 'Select an Intelligence Node to reveal consumption delta' : 'Select a Target Node for manual historical mining'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;