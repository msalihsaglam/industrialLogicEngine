import React, { useState } from 'react';
import { Activity, Lock, User, LogIn, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 🔍 DEBUG: İstek öncesi kontrol
    console.log(`🚀 [Auth] Mod: ${isLogin ? "LOGIN" : "REGISTER"} | User: ${formData.username}`);

    try {
      // 💡 ÖNEMLİ: api.js'de baseURL zaten /api ile bittiği için sadece /auth ekliyoruz
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      
      const res = await api.post(endpoint, formData);
      
      console.log("✅ [Auth] Başarılı Yanıt:", res.data);

      if (isLogin) {
        // App.jsx'teki handleLogin fonksiyonuna veriyi gönder
        onLogin(res.data);
      } else {
        // Kayıt başarılı, kullanıcıyı giriş moduna geçir
        setIsLogin(true);
        setError('');
        alert("Account established. You can now initialize your session.");
      }
    } catch (err) {
      console.error("❌ [Auth] Hata Yakalandı:", err);
      
      // Axios hata detaylarını operatöre göster
      if (err.response) {
        console.error("📡 Sunucu Mesajı:", err.response.data);
        setError(err.response.data.error || "Authentication failure.");
      } else if (err.request) {
        console.error("🌐 Ağ Hatası: Sunucuya ulaşılamıyor.");
        setError("Network error. Logic Server is unreachable.");
      } else {
        setError("Initialization failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dekoratif Endüstriyel Işıklar */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-[450px] z-10 animate-in zoom-in-95 duration-500">
        
        {/* LOGIC.IO BRANDING */}
        <div className="flex flex-col items-center mb-10">
          <div className="p-4 bg-blue-600 rounded-[2rem] shadow-2xl shadow-blue-900/40 mb-4 transition-transform hover:scale-110 duration-500">
            <Activity size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic">LOGIC.IO</h1>
          <p className="text-slate-500 text-[10px] font-black tracking-[0.4em] uppercase mt-2 opacity-70">
            Heuristic Management Terminal
          </p>
        </div>

        {/* AUTH CARD */}
        <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl shadow-black/50 backdrop-blur-sm">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">
              {isLogin ? 'Access Point' : 'Enrollment'}
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">
              {isLogin ? 'Verify your identity to proceed.' : 'Create a new operator profile.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* HATA PANELİ */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-black animate-in shake duration-300">
                <AlertCircle size={18} /> {error.toUpperCase()}
              </div>
            )}

            <div className="space-y-4">
              <div className="group">
                <label className="text-[10px] text-slate-500 block mb-2 uppercase font-black tracking-widest ml-1 transition-colors group-focus-within:text-blue-400">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    required 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pl-12 text-sm text-white outline-none focus:border-blue-500 transition-all font-bold placeholder:text-slate-800"
                    placeholder="OPERATOR_NAME" 
                    value={formData.username} 
                    onChange={e => setFormData({...formData, username: e.target.value})} 
                  />
                </div>
              </div>

              <div className="group">
                <label className="text-[10px] text-slate-500 block mb-2 uppercase font-black tracking-widest ml-1 transition-colors group-focus-within:text-blue-400">Security Key</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input 
                    type="password" 
                    required 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pl-12 text-sm text-white outline-none focus:border-blue-500 transition-all font-bold placeholder:text-slate-800"
                    placeholder="••••••••" 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-900/20 active:scale-95 text-xs uppercase tracking-[0.2em]"
            >
              {loading ? (
                <Activity size={20} className="animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn size={20} /> : <ShieldCheck size={20} />}
                  {isLogin ? 'Initialize Session' : 'Establish Node'}
                </>
              )}
            </button>
          </form>

          {/* TOGGLE AUTH MODE */}
          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <p className="text-slate-500 text-xs font-bold">
              {isLogin ? "Unauthorized user?" : "Existing operative?"}
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }} 
                className="ml-2 text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest text-[10px] font-black underline-offset-4 hover:underline"
              >
                {isLogin ? 'Register Node' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 text-[9px] font-black text-slate-700 uppercase tracking-[0.4em]">
            <ShieldCheck size={12} /> Secure Auth Protocol 2.4.0
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;