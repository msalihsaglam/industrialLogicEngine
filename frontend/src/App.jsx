import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { Activity, AlertTriangle, Settings, Database } from 'lucide-react';

const socket = io('http://localhost:3001');

function App() {
  const [liveData, setLiveData] = useState(0);
  const [rules, setRules] = useState([]);
  const [alarms, setAlarms] = useState([]);

  useEffect(() => {
    // 1. Mevcut Kuralları Getir
    axios.get('http://localhost:3001/api/rules')
      .then(res => setRules(res.data))
      .catch(err => console.error("Rules fetch error:", err));

    // 2. Canlı Veriyi Dinle
    socket.on('liveData', (data) => {
      setLiveData(data.value);
    });

    // 3. Alarmları Dinle
    socket.on('alarm', (newAlarm) => {
      setAlarms(prev => [newAlarm, ...prev].slice(0, 5)); // Son 5 alarmı tut
    });

    return () => socket.off();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      {/* Header */}
      <header className="flex justify-between items-center mb-10 border-b border-slate-700 pb-5">
        <div className="flex items-center gap-3">
          <Activity className="text-blue-400 w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-tight">Industrial Logic Engine</h1>
        </div>
        <div className="flex gap-4">
          <span className="flex items-center gap-2 bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-sm border border-green-500/20">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            System Online
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Gauge Card */}
        <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-xl">
          <h2 className="text-slate-400 font-medium mb-6 flex items-center gap-2">
            <Database className="w-4 h-4" /> Real-time Pressure Monitoring
          </h2>
          <div className="flex flex-col items-center justify-center py-10">
            <div className={`text-8xl font-black mb-2 transition-colors duration-300 ${liveData > 35 ? 'text-red-500' : 'text-blue-400'}`}>
              {liveData.toFixed(2)}
            </div>
            <div className="text-slate-500 text-xl tracking-widest uppercase">PSI</div>
            
            {/* Simple Progress Bar as a Gauge */}
            <div className="w-full max-w-md bg-slate-700 h-4 rounded-full mt-10 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${liveData > 35 ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min((liveData / 60) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Alarms Sidebar */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
          <h2 className="text-slate-400 font-medium mb-6 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Recent Alarms
          </h2>
          <div className="space-y-4">
            {alarms.length === 0 ? (
              <p className="text-slate-500 italic text-sm text-center py-10">No alarms detected</p>
            ) : (
              alarms.map((alarm, index) => (
                <div key={index} className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <div className="text-red-400 text-sm font-bold">{alarm.message}</div>
                  <div className="text-slate-400 text-xs mt-1">{alarm.time} - Value: {alarm.value.toFixed(2)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Rules Table */}
        <div className="lg:col-span-3 bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
          <h2 className="text-slate-400 font-medium mb-6 flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-400" /> Active Logic Rules
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-sm border-b border-slate-700">
                  <th className="pb-4 px-4">Tag Name</th>
                  <th className="pb-4 px-4">Condition</th>
                  <th className="pb-4 px-4">Threshold</th>
                  <th className="pb-4 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 px-4 font-medium text-blue-300">{rule.tag_name}</td>
                    <td className="py-4 px-4">Is {rule.operator === '>' ? 'Greater than' : 'Less than'}</td>
                    <td className="py-4 px-4 font-mono">{rule.threshold} PSI</td>
                    <td className="py-4 px-4">
                      <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;