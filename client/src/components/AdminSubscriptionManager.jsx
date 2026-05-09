import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, User, Mail, CreditCard, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const API_BASE = isLocal ? 'http://localhost:5000/api' : '/api';

const AdminSubscriptionManager = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    VODAFONE_NUMBER: '',
    PAYPAL_EMAIL: '',
    PAYONEER_EMAIL: '',
    SUBSCRIPTION_COST: '100'
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchPending();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE}/settings`);
      const mapped = res.data.reduce((acc, s) => {
        acc[s.key] = s.value;
        return acc;
      }, {});
      setSettings(prev => ({ ...prev, ...mapped }));
    } catch (err) {
      console.error('Fetch settings error:', err);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const payload = Object.entries(settings).map(([key, value]) => ({ key, value }));
      await axios.post(`${API_BASE}/settings`, { settings: payload });
      setShowSettings(false);
      alert('Settings updated successfully!');
    } catch (err) {
      alert('Error updating settings: ' + (err.response?.data?.error || err.message));
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchPending = async () => {
    try {
      const res = await axios.get(`${API_BASE}/subscriptions/pending`);
      setPending(res.data);
    } catch (err) {
      console.error('Fetch pending error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this payment?`)) return;
    
    try {
      await axios.patch(`${API_BASE}/subscriptions/${id}/status`, { status });
      fetchPending();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black text-white">Subscription Management</h2>
          <p className="text-slate-400 text-sm">Review and approve user payment proofs for Vodafone Cash, PayPal, and Payoneer.</p>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
            showSettings 
            ? 'bg-white/10 text-white border border-white/20' 
            : 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105'
          }`}
        >
          <AlertCircle size={16} />
          {showSettings ? 'Hide Settings' : 'Payment Settings'}
        </button>
      </div>

      {showSettings && (
        <div className="bg-slate-900/50 border border-white/10 rounded-[2rem] p-8 shadow-2xl backdrop-blur-xl animate-in zoom-in fade-in duration-300">
          <h3 className="text-lg font-bold text-white mb-6">Receiving Accounts Configuration</h3>
          <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2">Vodafone Cash Number</label>
              <input 
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary transition-all"
                value={settings.VODAFONE_NUMBER}
                onChange={(e) => setSettings({...settings, VODAFONE_NUMBER: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2">PayPal Email</label>
              <input 
                type="email"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary transition-all"
                value={settings.PAYPAL_EMAIL}
                onChange={(e) => setSettings({...settings, PAYPAL_EMAIL: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2">Payoneer Email</label>
              <input 
                type="email"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary transition-all"
                value={settings.PAYONEER_EMAIL}
                onChange={(e) => setSettings({...settings, PAYONEER_EMAIL: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2">Monthly Fee (£)</label>
              <input 
                type="number"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary transition-all"
                value={settings.SUBSCRIPTION_COST}
                onChange={(e) => setSettings({...settings, SUBSCRIPTION_COST: e.target.value})}
              />
            </div>
            <div className="lg:col-span-4 pt-4">
              <button 
                type="submit"
                disabled={savingSettings}
                className="px-10 py-3 bg-emerald-500 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {savingSettings ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : pending.length === 0 ? (
        <div className="bg-slate-900/50 border border-white/10 rounded-[2.5rem] p-20 text-center flex flex-col items-center gap-6">
          <div className="p-6 bg-white/5 rounded-full">
            <CheckCircle2 size={48} className="text-emerald-500/50" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">All Caught Up!</h3>
            <p className="text-slate-500 text-sm italic">There are no pending subscription requests to review.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pending.map(req => (
            <div key={req.id} className="bg-slate-900/50 border border-white/10 rounded-[2rem] p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-2xl bg-primary/10 text-primary`}>
                    <CreditCard size={24} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Amount</p>
                    <p className="text-xl font-black text-white">£{req.amount.toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/5 rounded-lg">
                      <User size={14} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">User</p>
                      <p className="text-sm font-bold text-white">{req.user.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/5 rounded-lg">
                      <Mail size={14} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Email</p>
                      <p className="text-sm text-slate-300">{req.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/5 rounded-lg">
                      <Clock size={14} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Method</p>
                      <p className="text-sm font-bold text-primary">{req.method.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-black/20 rounded-2xl border border-white/5 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Transaction Ref</p>
                  <p className="text-xs font-mono text-white break-all">{req.transactionId || 'NO REFERENCE'}</p>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => handleAction(req.id, 'REJECTED')}
                  className="flex-1 py-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl font-bold text-xs hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <X size={14} />
                  REJECT
                </button>
                <button
                  onClick={() => handleAction(req.id, 'APPROVED')}
                  className="flex-[2] py-3 bg-emerald-500 text-white rounded-xl font-bold text-xs hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <Check size={14} />
                  APPROVE & UPGRADE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionManager;
