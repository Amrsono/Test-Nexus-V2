import React, { useState, useEffect } from 'react';
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
