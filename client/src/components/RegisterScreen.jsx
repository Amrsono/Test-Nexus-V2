import React, { useState } from 'react';
import axios from 'axios';
import { Sparkles, CheckCircle2, Shield, Mail, User, Lock, ArrowRight } from 'lucide-react';
import { useTranslation } from '../i18n';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

const RegisterScreen = ({ onRegister, onSwitchToLogin }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/register`, formData);
      onRegister(res.data);
    } catch (err) {
      let errMsg = err.response?.data?.error || err.message || 'Registration failed.';
      if (typeof errMsg === 'object') errMsg = errMsg.message || JSON.stringify(errMsg);
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />

      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side: Info */}
        <div className="hidden md:block space-y-8 p-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-white leading-tight">
              {t('unlockPower')} <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Test Nexus</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              {t('registerSubtitle')}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4 glass p-4 rounded-2xl border border-white/5">
              <div className="bg-blue-500/20 p-2 rounded-xl text-blue-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-semibold">{t('trialFeatureTitle')}</h4>
                <p className="text-slate-400 text-sm">{t('trialFeatureDesc')}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 glass p-4 rounded-2xl border border-white/5">
              <div className="bg-purple-500/20 p-2 rounded-xl text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-semibold">{t('premiumFeatureTitle')}</h4>
                <p className="text-slate-400 text-sm">{t('premiumFeatureDesc')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="glass rounded-3xl p-8 shadow-2xl border border-white/10">
          <div className="text-center mb-8 md:hidden">
             <h1 className="text-2xl font-bold text-white">{t('registerTitle')}</h1>
          </div>
          
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            {t('createAccount')} <ArrowRight className="w-4 h-4 text-slate-500" />
          </h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 ml-1 uppercase tracking-wider">{t('fullName')}</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder={t('fullNamePlaceholder')}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 ml-1 uppercase tracking-wider">{t('emailAddress')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder={t('emailAddressPlaceholder')}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 ml-1 uppercase tracking-wider">{t('passwordLabel')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('createFreeAccount')}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center text-sm text-slate-400">
            <p>{t('alreadyHaveAccount')} <button onClick={onSwitchToLogin} className="text-blue-400 hover:underline">{t('login')}</button></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterScreen;
