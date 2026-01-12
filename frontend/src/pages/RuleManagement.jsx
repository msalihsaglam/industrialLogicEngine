import React, { useState } from 'react';
import { PlusCircle, Save, Play, Trash2 } from 'lucide-react';
import { api } from '../services/api';

const RuleManagement = ({ rules, onRefresh }) => {
  const [newRule, setNewRule] = useState({ tag_name: 'Pressure', operator: '>', threshold: '', alert_message: '' });

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!newRule.threshold || !newRule.alert_message) return alert("Lütfen tüm alanları doldurun.");
    await api.addRule(newRule);
    setNewRule({ tag_name: 'Pressure', operator: '>', threshold: '', alert_message: '' });
    onRefresh();
  };

  const deleteRule = async (id) => {
    if (window.confirm("Bu kuralı silmek istediğinize emin misiniz?")) {
      await api.deleteRule(id);
      onRefresh();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Bölümü */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-blue-400"><PlusCircle size={20} /> New Logic Rule</h3>
          <form onSubmit={handleAddRule} className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider font-semibold">Sensor</label>
              <select value={newRule.tag_name} onChange={(e) => setNewRule({...newRule, tag_name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm outline-none">
                <option value="Pressure">Pressure</option>
                <option value="Temperature">Temperature</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider font-semibold">Operator</label>
                <select value={newRule.operator} onChange={(e) => setNewRule({...newRule, operator: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm outline-none">
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider font-semibold">Threshold</label>
                <input type="number" placeholder="45" value={newRule.threshold} onChange={(e) => setNewRule({...newRule, threshold: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider font-semibold">Message</label>
              <textarea placeholder="Alert text..." value={newRule.alert_message} onChange={(e) => setNewRule({...newRule, alert_message: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm outline-none h-24" />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"><Save size={18} /> Save</button>
          </form>
        </div>

        {/* Tablo Bölümü */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold mb-6 text-slate-400 uppercase text-xs tracking-widest flex items-center gap-2"><Play size={16}/> Active Systems Logic</h3>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase border-b border-slate-800">
                <th className="pb-4">Tag</th>
                <th className="pb-4">Condition</th>
                <th className="pb-4">Message</th>
                <th className="pb-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-800/30">
                  <td className="py-4 text-blue-400 font-mono">{rule.tag_name}</td>
                  <td className="py-4 font-medium">{rule.operator} {rule.threshold}</td>
                  <td className="py-4 text-xs text-slate-400">{rule.alert_message}</td>
                  <td className="py-4 text-right">
                    <button onClick={() => deleteRule(rule.id)} className="p-2 text-slate-500 hover:text-red-500"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RuleManagement;