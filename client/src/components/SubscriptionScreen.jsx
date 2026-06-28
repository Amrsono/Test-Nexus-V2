import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  CreditCard, Smartphone, Globe, CheckCircle2, Clock,
  AlertCircle, ArrowLeft, Send, Sparkles, RefreshCw, Star, ShieldCheck, Zap
} from 'lucide-react';
import { useTranslation } from '../i18n';

const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const API_BASE = isLocal ? 'http://localhost:5000/api' : '/api';

const SubscriptionScreen = ({ user, onBack, onStatusUpdate }) => {
  const { t } = useTranslation();
  const [method, setMethod] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState([]);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState({
    VODAFONE_NUMBER: '...',
    PAYPAL_EMAIL: '...',
    PAYONEER_EMAIL: '...',
    SUBSCRIPTION_COST: '100'
  });

  const isPremium = user.subscriptionStatus === 'ACTIVE';
  const isTrial = user.subscriptionStatus === 'TRIAL';
  const isExpired = user.subscriptionStatus === 'EXPIRED' || user.subscriptionStatus === 'NONE';

  useEffect(() => {
    fetchRequests();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE}/settings/public`);
      setSettings(res.data);
    } catch (err) {
      console.error('Fetch settings error:', err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API_BASE}/subscriptions/my`);
      setRequests(res.data);
    } catch (err) {
      console.error('Fetch subs error:', err);
    }
  };

  // Refresh user status from server (called after payment approval)
  const handleRefreshStatus = async () => {
    setRefreshing(true);
    try {
      const res = await axios.get(`${API_BASE}/auth/me`);
      onStatusUpdate(res.data);
      localStorage.setItem('nexus_user', JSON.stringify(res.data));
      await fetchRequests();
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/subscriptions`, { method, transactionId });
      setSuccess(true);
      setMethod(null);
      setTransactionId('');
      fetchRequests();
    } catch (err) {
      alert('Error submitting request: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'REJECTED': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default: return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getDaysRemaining = (dateStr) => {
    if (!dateStr) return null;
    const diff = new Date(dateStr) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Success Banner */}
      {success && (
        <div className="flex items-center gap-4 p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl animate-in fade-in zoom-in duration-300">
          <div className="p-3 bg-emerald-500/20 rounded-2xl">
            <CheckCircle2 size={24} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-emerald-400 font-black text-sm uppercase tracking-widest">{t('paymentProofSubmitted')}</p>
            <p className="text-emerald-500/70 text-xs mt-0.5">{t('paymentProofDesc')}</p>
          </div>
          <button onClick={() => setSuccess(false)} className="ml-auto text-emerald-500/50 hover:text-emerald-400 transition-colors text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-white transition-all group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold uppercase tracking-widest text-[10px]">{t('backToDashboard')}</span>
        </button>
        <button
          onClick={handleRefreshStatus}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {t('refreshStatus')}
        </button>
      </div>

      {/* === PREMIUM ACTIVE BANNER === */}
      {isPremium && (
        <div className="relative overflow-hidden rounded-[2.5rem] border border-emerald-500/40 shadow-2xl shadow-emerald-500/10">
          {/* Background glow layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/80 via-slate-900/90 to-slate-950/80" />
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/20 blur-3xl rounded-full" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-600/10 blur-3xl rounded-full" />

          <div className="relative p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Star size={28} className="text-white fill-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={12} className="text-emerald-900" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">{t('premiumSubscription')}</span>
                  <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full">{t('active')}</span>
                </div>
                <h2 className="text-2xl font-black text-white">{t('allFeaturesUnlocked')}</h2>
                <p className="text-emerald-400/70 text-sm mt-0.5">
                  {t('premiumFeaturesDesc')}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              {user.subscriptionExpiresAt && (
                <>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('renewsExpires')}</p>
                    <p className="text-sm font-black text-white">{formatDate(user.subscriptionExpiresAt)}</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl text-xs font-black ${
                    getDaysRemaining(user.subscriptionExpiresAt) <= 7
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {t('daysRemaining', { count: getDaysRemaining(user.subscriptionExpiresAt) })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Feature pills */}
          <div className="relative border-t border-emerald-500/20 px-8 py-4 flex flex-wrap gap-3">
            {[
              { icon: <Zap size={12} />, label: t('aiScenarioLab') },
              { icon: <CheckCircle2 size={12} />, label: t('bulkImports') },
              { icon: <ShieldCheck size={12} />, label: t('execPdfReports') },
              { icon: <Sparkles size={12} />, label: t('multiProjectAnalytics') },
              { icon: <Star size={12} />, label: t('teamManagement') },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                {f.icon} {f.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === TRIAL / EXPIRED STATUS CARD === */}
      {!isPremium && (
        <div className={`flex items-center gap-4 p-5 rounded-3xl border ${
          isTrial
            ? 'bg-amber-500/5 border-amber-500/20'
            : 'bg-rose-500/5 border-rose-500/20'
        }`}>
          <div className={`p-3 rounded-2xl ${isTrial ? 'bg-amber-500/10' : 'bg-rose-500/10'}`}>
            <AlertCircle size={22} className={isTrial ? 'text-amber-400' : 'text-rose-400'} />
          </div>
          <div>
            <p className={`font-black text-sm uppercase tracking-widest ${isTrial ? 'text-amber-400' : 'text-rose-400'}`}>
              {isTrial ? t('trialActive', { date: formatDate(user.trialEndsAt) }) : t('trialExpired')}
            </p>
            <p className="text-slate-500 text-xs mt-0.5">
              {isTrial
                ? t('importExportRestricted')
                : t('trialEndedDesc')}
            </p>
          </div>
          <div className={`ml-auto px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
            isTrial ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-rose-400 border-rose-500/30 bg-rose-500/10'
          }`}>
            {user.subscriptionStatus}
          </div>
        </div>
      )}

      {/* Upgrade form — hide if already premium */}
      {!isPremium && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Payment Form */}
          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-xl">
              <h2 className="text-2xl font-black text-white mb-2">{t('upgradeToPremium')}</h2>
              <p className="text-slate-400 text-sm mb-8">{t('unlockFullAutomation')}</p>

              <div className="bg-primary/10 border border-primary/20 rounded-3xl p-6 mb-8 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
                <div className="relative">
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-4xl font-black text-white">£{settings.SUBSCRIPTION_COST || '100'}</span>
                    <span className="text-slate-500 font-bold">{t('monthly')}</span>
                  </div>
                  <ul className="space-y-3">
                    {['fullAiGeneration', 'bulkImports', 'execPdfReports', 'multiProjectAnalytics', 'teamManagement'].map(fKey => (
                      <li key={fKey} className="flex items-center gap-3 text-sm text-slate-300">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        {t(fKey)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2">{t('choosePaymentMethod')}</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'VODAFONE_CASH', name: 'Vodafone', icon: <Smartphone size={20} /> },
                    { id: 'PAYPAL', name: 'PayPal', icon: <Globe size={20} /> },
                    { id: 'PAYONEER', name: 'Payoneer', icon: <CreditCard size={20} /> }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${
                        method === m.id
                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {m.icon}
                      <span className="text-[10px] font-black uppercase">{m.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {method && (
                <div className="mt-8 p-6 bg-black/40 rounded-3xl border border-white/10 animate-in fade-in zoom-in duration-300">
                  <div className="space-y-4">
                    {method === 'VODAFONE_CASH' && (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-300">Send <span className="text-white font-bold">£{settings.SUBSCRIPTION_COST || '100'} (equivalent)</span> to this number:</p>
                        <div className="bg-slate-800 p-3 rounded-xl border border-white/10 text-center font-mono text-lg text-primary tracking-widest">
                          {settings.VODAFONE_NUMBER}
                        </div>
                        <p className="text-[10px] text-slate-500 italic">Please paste the transaction ID below.</p>
                      </div>
                    )}
                    {(method === 'PAYPAL' || method === 'PAYONEER') && (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-300">Send <span className="text-white font-bold">£{settings.SUBSCRIPTION_COST || '100'}</span> to:</p>
                        <div className="bg-slate-800 p-3 rounded-xl border border-white/10 text-center font-mono text-sm text-primary">
                          {method === 'PAYPAL' ? settings.PAYPAL_EMAIL : settings.PAYONEER_EMAIL}
                        </div>
                        <p className="text-[10px] text-slate-500 italic">Reference: {user.email}</p>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2">Transaction ID / Reference</label>
                        <input
                          type="text"
                          placeholder="Paste transaction ID here..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary transition-all"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-primary/80 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {loading ? t('processing') : (
                          <>
                            <Send size={16} />
                            {t('submitPaymentProof')}
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Payment History */}
          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-xl h-full">
              <h3 className="text-lg font-bold text-white mb-6">{t('paymentHistory')}</h3>

              {requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="p-4 bg-white/5 rounded-full">
                    <Clock size={32} className="text-slate-600" />
                  </div>
                  <p className="text-slate-500 text-sm italic">{t('noPaymentRequests')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map(req => (
                    <div key={req.id} className={`bg-white/5 border rounded-2xl p-4 flex items-center justify-between ${getStatusColor(req.status)}`}>
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-white/5 text-slate-400">
                          {req.method === 'VODAFONE_CASH' ? <Smartphone size={16} /> : <Globe size={16} />}
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{req.method.replace(/_/g, ' ')}</p>
                          <p className="text-xs font-bold text-white">£{req.amount.toFixed(2)}</p>
                          <p className="text-[10px] text-slate-600 font-mono mt-1">{req.transactionId || 'No Ref'}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${getStatusColor(req.status)}`}>
                        {req.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3">
                <AlertCircle size={18} className="text-amber-500 shrink-0" />
                <p className="text-[10px] text-amber-500/80 leading-relaxed uppercase font-bold">
                  {t('manualVerificationNote')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === PREMIUM: Renewal section === */}
      {isPremium && (
        <div className="bg-slate-900/50 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white mb-6">{t('paymentHistory')}</h3>
          {requests.length === 0 ? (
            <p className="text-slate-500 text-sm italic text-center py-8">{t('noPaymentRequests')}</p>
          ) : (
            <div className="space-y-4">
              {requests.map(req => (
                <div key={req.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                      {req.method === 'VODAFONE_CASH' ? <Smartphone size={16} /> : <Globe size={16} />}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{req.method.replace(/_/g, ' ')}</p>
                      <p className="text-xs font-bold text-white">£{req.amount.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-600 font-mono mt-1">{req.transactionId || 'No Ref'} · {new Date(req.createdAt).toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${
                    req.status === 'APPROVED' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
                    req.status === 'REJECTED' ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' :
                    'text-amber-400 bg-amber-500/10 border-amber-500/30'
                  }`}>
                    {req.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubscriptionScreen;
