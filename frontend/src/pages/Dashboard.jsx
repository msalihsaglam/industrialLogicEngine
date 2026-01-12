import React from 'react';
import { Gauge, Thermometer } from 'lucide-react';

const Dashboard = ({ liveData, alarms }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl">
        <h2 className="text-slate-400 text-sm mb-2 flex items-center gap-2 uppercase tracking-widest font-semibold"><Gauge size={16}/> Pressure</h2>
        <div className="text-6xl font-black text-blue-400">{liveData.Pressure.toFixed(2)} <span className="text-xl text-slate-600">PSI</span></div>
      </div>

      <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl">
        <h2 className="text-slate-400 text-sm mb-2 flex items-center gap-2 uppercase tracking-widest font-semibold"><Thermometer size={16}/> Temperature</h2>
        <div className="text-6xl font-black text-orange-400">{liveData.Temperature.toFixed(2)} <span className="text-xl text-slate-600">°C</span></div>
      </div>

      <div className="md:col-span-2 bg-slate-900 rounded-2xl p-6 border border-slate-800">
        <h2 className="text-slate-400 font-medium mb-6 flex items-center gap-2 text-amber-500 uppercase text-xs tracking-widest">Recent Alarms</h2>
        <div className="space-y-4">
          {alarms.length === 0 ? (
            <p className="text-slate-600 italic text-sm text-center py-4">Safe operation. No alarms detected.</p>
          ) : (
            alarms.map((a, i) => (
              <div key={i} className="bg-red-500/5 border-l-2 border-red-500 p-3 text-xs flex justify-between items-center">
                <div>
                  <div className="font-bold text-red-400">{a.message}</div>
                  <div className="text-slate-500 mt-1">{a.time}</div>
                </div>
                <div className="text-red-300 font-mono">Val: {a.value?.toFixed(2)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;