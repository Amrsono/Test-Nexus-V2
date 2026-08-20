import os

admin_dir = "client/src/components/admin"
comp_dir = "client/src/components"

# 1. AdminInsightsTab.jsx
insights_tab = """import React from 'react';
import { Users, CreditCard, Layout, Shield, TrendingUp, Calendar, Trash2 } from 'lucide-react';

export const AdminInsightsTab = ({
  users = [],
  requests = [],
  projects = [],
  deleteProject
}) => {
  const activeSubs = users.filter(u => u.subscriptionStatus === 'ACTIVE').length;
  const trialUsers = users.filter(u => u.subscriptionStatus === 'TRIAL').length;
  const expiredUsers = users.filter(u => u.subscriptionStatus === 'EXPIRED').length;
  const totalRevenue = activeSubs * 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              {users.length} Total
            </span>
          </div>
          <h3 className="text-3xl font-black text-white">{users.length}</h3>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Registered Accounts</p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              £100 / mo
            </span>
          </div>
          <h3 className="text-3xl font-black text-white">£{totalRevenue}</h3>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Run Rate</p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
              <Shield className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">
              {activeSubs} Active
            </span>
          </div>
          <h3 className="text-3xl font-black text-white">{activeSubs} / {users.length}</h3>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Paid Subscribers</p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
              <Layout className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full">
              Workspace
            </span>
          </div>
          <h3 className="text-3xl font-black text-white">{projects.length}</h3>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Projects</p>
        </div>
      </div>

      {/* Projects Management Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <h3 className="text-xl font-black text-white mb-4">Global Projects Overview</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Project Name</th>
                <th className="py-3 px-4">Owner ID</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.themeColor || '#6366f1' }} />
                    {p.name}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs font-mono">{p.ownerId || 'System'}</td>
                  <td className="py-3 px-4 text-slate-400 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => deleteProject(p.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

export default AdminInsightsTab;
"""
with open(os.path.join(admin_dir, "AdminInsightsTab.jsx"), "w", encoding="utf-8") as f:
    f.write(insights_tab)

# 2. AdminUsersTab.jsx
users_tab = """import React from 'react';
import { Search, Shield, Trash2, Edit3, UserCheck, AlertCircle } from 'lucide-react';

export const AdminUsersTab = ({
  users = [],
  userSearch,
  setUserSearch,
  updateUserProfile,
  deleteUser
}) => {
  const filteredUsers = users.filter(
    u => (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
         (u.name || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-black text-white">User Accounts</h3>
          <p className="text-xs text-slate-400">Manage account roles, permissions, and status</p>
        </div>
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search email or name..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Subscription</th>
              <th className="py-3 px-4">Trial / Expiry</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredUsers.map((u) => {
              const isSubActive = u.subscriptionStatus === 'ACTIVE';
              const isTrial = u.subscriptionStatus === 'TRIAL';
              return (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white">{u.name || 'Anonymous User'}</div>
                    <div className="text-xs text-slate-400">{u.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={u.role}
                      onChange={(e) => updateUserProfile(u.id, { role: e.target.value })}
                      className="px-2 py-1 text-xs font-bold rounded-lg bg-slate-800 border border-slate-700 text-white"
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      isSubActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      isTrial ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {u.subscriptionStatus || 'TRIAL'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-400">
                    {u.trialEndsAt ? new Date(u.trialEndsAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {deleteUser && (
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsersTab;
"""
with open(os.path.join(admin_dir, "AdminUsersTab.jsx"), "w", encoding="utf-8") as f:
    f.write(users_tab)

# 3. AdminSettingsTab.jsx
settings_tab = """import React from 'react';
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
"""
with open(os.path.join(admin_dir, "AdminSettingsTab.jsx"), "w", encoding="utf-8") as f:
    f.write(settings_tab)

# 4. Refactored AdminDashboard.jsx (<250 LOC)
admin_dashboard = """import React, { useState, useEffect } from 'react';
import api from '../services/api';
import useToast from '../hooks/useToast';
import { Users, CreditCard, Layout, Settings, Shield } from 'lucide-react';
import AdminInsightsTab from './admin/AdminInsightsTab';
import AdminUsersTab from './admin/AdminUsersTab';
import AdminSettingsTab from './admin/AdminSettingsTab';
import AdminSubscriptionManager from './AdminSubscriptionManager';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('insights');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Data States
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [projects, setProjects] = useState([]);
  const [settings, setSettings] = useState({
    VODAFONE_NUMBER: '',
    PAYPAL_EMAIL: '',
    PAYONEER_EMAIL: '',
    SUBSCRIPTION_COST: '100',
    GEMINI_API_KEY: '',
  });

  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [usersRes, reqsRes, projRes, settRes] = await Promise.all([
        api.get('/users/all'),
        api.get('/subscriptions/all'),
        api.get('/projects'),
        api.get('/settings'),
      ]);

      setUsers(usersRes.data);
      setRequests(reqsRes.data);
      setProjects(projRes.data);

      const mappedSettings = (settRes.data || []).reduce((acc, s) => {
        acc[s.key] = s.value;
        return acc;
      }, {});
      setSettings((prev) => ({ ...prev, ...mappedSettings }));
    } catch (err) {
      toast.error('Failed to load admin dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (id, status) => {
    try {
      await api.patch(`/subscriptions/${id}/status`, { status });
      toast.success(`Subscription request ${status.toLowerCase()} successfully`);
      fetchAllData();
    } catch (err) {
      toast.error(err.formattedMessage || 'Error updating subscription status');
    }
  };

  const deleteProject = async (projectId) => {
    if (!window.confirm('PERMANENT ACTION: Delete this project and ALL its data?')) return;
    try {
      await api.delete(`/projects/${projectId}`);
      toast.success('Project deleted successfully');
      fetchAllData();
    } catch (err) {
      toast.error(err.formattedMessage || 'Failed to delete project');
    }
  };

  const updateUserProfile = async (userId, data) => {
    try {
      await api.patch(`/users/${userId}/admin`, data);
      toast.success('User updated successfully');
      fetchAllData();
    } catch (err) {
      toast.error(err.formattedMessage || 'Failed to update user');
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/settings', { settings });
      toast.success('System settings saved successfully');
    } catch (err) {
      toast.error(err.formattedMessage || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header with Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-500" /> Admin Command Center
          </h1>
          <p className="text-sm text-slate-400">System metrics, billing, user access, and global configuration</p>
        </div>

        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'insights' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layout className="w-4 h-4" /> Overview
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'subscriptions' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Subscriptions
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> Users
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'insights' && (
        <AdminInsightsTab
          users={users}
          requests={requests}
          projects={projects}
          deleteProject={deleteProject}
        />
      )}

      {activeTab === 'subscriptions' && (
        <AdminSubscriptionManager
          requests={requests}
          handleRequestAction={handleRequestAction}
        />
      )}

      {activeTab === 'users' && (
        <AdminUsersTab
          users={users}
          userSearch={userSearch}
          setUserSearch={setUserSearch}
          updateUserProfile={updateUserProfile}
        />
      )}

      {activeTab === 'settings' && (
        <AdminSettingsTab
          settings={settings}
          setSettings={setSettings}
          saveSettings={saveSettings}
          loading={loading}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
"""
with open(os.path.join(comp_dir, "AdminDashboard.jsx"), "w", encoding="utf-8") as f:
    f.write(admin_dashboard)

print('AdminDashboard modularized successfully!')
