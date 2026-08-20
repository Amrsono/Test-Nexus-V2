import React from 'react';
import { Save } from 'lucide-react';

export const AdminSettingsTab = ({
  settings = {},
  setSettings,
  saveSettings,
  loading = false
}) => {
  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-2xl p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl animate-in fade-in duration-300">
      <h3 className="text-xl font-black text-white mb-2">Platform Configuration</h3>
      <p className="text-xs text-slate-400 mb-6">Payment gateways, AI API keys, and subscription pricing.</p>

      <form onSubmit={saveSettings} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
            Subscription Monthly Fee (£)
          </label>
          <input
            type="number"
            value={settings.SUBSCRIPTION_COST || '100'}
            onChange={(e) => handleChange('SUBSCRIPTION_COST', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
            PayPal Email
          </label>
          <input
            type="email"
            value={settings.PAYPAL_EMAIL || ''}
            onChange={(e) => handleChange('PAYPAL_EMAIL', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
            Payoneer Recipient Email
          </label>
          <input
            type="email"
            value={settings.PAYONEER_EMAIL || ''}
            onChange={(e) => handleChange('PAYONEER_EMAIL', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
            Vodafone Cash Wallet Number
          </label>
          <input
            type="text"
            value={settings.VODAFONE_NUMBER || ''}
            onChange={(e) => handleChange('VODAFONE_NUMBER', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white"
          />
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettingsTab;
