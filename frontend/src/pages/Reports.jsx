import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  Calendar, Download, Zap, Activity, Clock, 
  Plus, ChevronRight, FileText, Filter, Loader2,
  BarChart2, // 🎯 DÜZELTME: Bu eksikti, eklendi!
  Search     // 🔍 Arama ikonu eklendi
} from 'lucide-react';
import { api } from '../services/api';

// --- REUSABLE TAG SELECTOR COMPONENT ---
const TagSelector = ({ label, value, onChange, groupedTags, searchTerm }) => (
  <div className="space-y-2 flex-1">
    <label className="text-[9px] text-slate-500 uppercase font-black ml-1">{label}</label>
    <select 
      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-[10px] font-mono outline-none focus:border-blue-500 transition-all"
      value={value} 
      onChange={e => onChange(e.target.value)}
    >
      <option value="">Select Node...</option>
      {Object.entries(groupedTags).map(([source, tags]) => {
        const filtered = tags.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
        if (filtered.length === 0) return null;
        return (
          <optgroup key={source} label={`📍 ${source.toUpperCase()}`} className="bg-slate-900 text-blue-400 font-black">
            {filtered.map(t => <option key={t.id} value={t.id} className="text-white">{t.name}</option>)}
          </optgroup>
        );
      })}
    </select>
  </div>
);

const Reports = ({ liveData }) => {
  const [activeReport, setActiveReport] = useState('energy_daily'); 
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // 🔍 Arama state'i eklendi
  const [dateRange, setDateRange] = useState({ 
    start: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Dün
    end: new Date().toISOString().split('T')[0] // Bugün
  });

  const templates = [
    { id: 'energy_daily', title: 'Daily Energy', desc: 'Hourly kWh Consumption (Delta)', icon: <Zap size={20}/>, color: 'text-emerald-500', chartType: 'bar' },
    { id: 'voltage_stability', title: 'Power Stability', desc: 'Voltage & Current Fluctuations', icon: <Activity size={20}/>, color: 'text-blue-400', chartType: 'area' },
    { id: 'uptime_analysis', title: 'Machine Uptime', desc: 'Operational vs Downtime Hours', icon: <Clock size={20}/>, color: 'text-amber-500', chartType: 'bar' },
    { id: 'custom', title: 'Custom Builder', desc: 'Create your own analysis', icon: <Plus size={20}/>, color: 'text-purple-400', chartType: 'line' }
  ];

  const groupedTags = useMemo(() => {
    const groups = {};
    Object.keys(liveData).forEach(key => {
      const node = liveData[key];
      const source = node.sourceName || "Internal";
      if (!groups[source]) groups[source] = [];
      groups[source].push({ id: key, name: node.tagName || key });
    });
    return groups;
  }, [liveData]);

  const generateReport = async () => {
    if (!selectedTag) return alert("Please select a tag first!");
    setLoading(true);
    try {
      let res;
      if (activeReport === 'energy_daily') {
        res = await api.getEnergyDelta(selectedTag); 
      } else {
        res = await api.getHistory(selectedTag, dateRange.start, dateRange.end);
      }
      setReportData(res.data);
    } catch (err) {
      console.error("❌ Rapor Hatası:", err);
      alert("Could not retrieve historical data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 p-10 animate-in fade-in duration-700">
      
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-slate-800 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Intelligence</h1>
          <p className="text-slate-500 text-[10px] font-black tracking-[0.4em] mt-2 uppercase">Analytical Reporting & Historical Insight</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-slate-900 border border-slate-800 text-slate-400 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:border-slate-600 transition-all">
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* 📋 TEMPLATE GALLERY */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {templates.map(tmp => (
          <button 
            key={tmp.id}
            onClick={() => {
              setActiveReport(tmp.id);
              setReportData([]); // Şablon değişince eski grafiği temizleyelim
            }}
            className={`p-8 rounded-[2.5rem] border-2 text-left transition-all duration-500 group relative overflow-hidden ${
              activeReport === tmp.id ? 'bg-blue-600/10 border-blue-500 shadow-2xl shadow-blue-900/20' : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className={`mb-4 p-3 rounded-2xl w-fit ${activeReport === tmp.id ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-500'}`}>
              {tmp.icon}
            </div>
            <h3 className="text-white font-black text-sm uppercase italic tracking-tight">{tmp.title}</h3>
            <p className="text-slate-500 text-[9px] mt-2 font-bold uppercase leading-relaxed">{tmp.desc}</p>
            {activeReport === tmp.id && <div className="absolute top-4 right-4 text-blue-500"><ChevronRight size={20}/></div>}
          </button>
        ))}
      </div>

      {/* 🔍 FILTERS */}
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] shadow-xl flex flex-wrap gap-6 items-end">
        {/* Arama Kutusu */}
        <div className="space-y-2 w-full md:w-64">
           <label className="text-[9px] text-slate-500 uppercase font-black ml-1">Search Node</label>
           <div className="relative">
             <Search size={14} className="absolute left-3 top-3.5 text-slate-500" />
             <input 
               type="text" 
               placeholder="Filter list..."
               className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 pl-10 text-white text-[10px] outline-none focus:border-blue-500"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
        </div>

        <TagSelector 
          label="Target Node (Tag)" 
          value={selectedTag} 
          groupedTags={groupedTags} 
          searchTerm={searchTerm} 
          onChange={setSelectedTag} 
        />

        <div className="flex-1 space-y-2">
          <label className="text-[9px] text-slate-500 uppercase font-black ml-1">Date Interval</label>
          <div className="flex gap-2">
            <input 
              type="date" 
              className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-[10px] w-full outline-none focus:border-blue-500" 
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
            <input 
              type="date" 
              className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-[10px] w-full outline-none focus:border-blue-500" 
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
        </div>

        <button 
          onClick={generateReport}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-blue-900/40 flex items-center gap-3 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin"/> : <FileText size={16}/>}
          Generate Report
        </button>
      </div>

      {/* 📊 CHART AREA */}
      <div className="bg-slate-900/30 border border-slate-800 p-10 rounded-[4rem] shadow-2xl h-[550px] backdrop-blur-sm">
        {reportData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {templates.find(t => t.id === activeReport)?.chartType === 'bar' ? (
              <BarChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="period" stroke="#475569" fontSize={10} tickFormatter={(t) => new Date(t).toLocaleTimeString('tr-TR', {hour:'2-digit'})} />
                <YAxis stroke="#475569" fontSize={10} />
                <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px'}} />
                <Bar dataKey="consumption" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={reportData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="ts" stroke="#475569" fontSize={10} tickFormatter={(t) => new Date(t).toLocaleTimeString()} />
                <YAxis stroke="#475569" fontSize={10} />
                <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px'}} />
                <Area type="monotone" dataKey="val" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVal)" strokeWidth={3} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-700">
            <BarChart2 size={64} className="opacity-10 mb-4" />
            <p className="text-xs font-black uppercase tracking-[0.3em]">Configure and Run Query to Visualize Data</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;