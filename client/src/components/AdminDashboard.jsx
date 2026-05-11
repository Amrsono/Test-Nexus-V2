import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  CreditCard, 
  Layout, 
  Settings, 
  Search, 
  ChevronRight, 
  Check, 
  X, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Shield,
  Calendar,
  ExternalLink,
  Edit3,
  Trash2,
  Filter
} from 'lucide-react';

const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const API_BASE = isLocal ? 'http://localhost:5000/api' : '/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('insights');
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [projects, setProjects] = useState([]);
  const [settings, setSettings] = useState({
    VODAFONE_NUMBER: '',
    PAYPAL_EMAIL: '',
    PAYONEER_EMAIL: '',
    SUBSCRIPTION_COST: '100'
  });

  // Filter States
  const [userSearch, setUserSearch] = useState('');
  const [reqFilter, setReqFilter] = useState('ALL'); // ALL, PENDING, APPROVED, REJECTED

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [usersRes, reqsRes, projRes, settRes] = await Promise.all([
        axios.get(`${API_BASE}/users/all`),
        axios.get(`${API_BASE}/subscriptions/all`),
        axios.get(`${API_BASE}/projects`),
        axios.get(`${API_BASE}/settings`)
      ]);
      
      setUsers(usersRes.data);
      setRequests(reqsRes.data);
      setProjects(projRes.data);
      
      const mappedSettings = settRes.data.reduce((acc, s) => {
        acc[s.key] = s.value;
        return acc;
      }, {});
      setSettings(prev => ({ ...prev, ...mappedSettings }));
      
    } catch (err) {
      console.error('Fetch Admin Data Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this request?`)) return;
    try {
      await axios.patch(`${API_BASE}/subscriptions/${id}/status`, { status });
      fetchAllData();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const deleteProject = async (projectId) => {
    if (!window.confirm('PERMANENT ACTION: Are you sure you want to delete this project and ALL its data (suites, cases, defects)? This cannot be undone.')) return;
    try {
      await axios.delete(`${API_BASE}/projects/${projectId}`);
      fetchAllData();
      alert('Project deleted successfully');
    } catch (err) {
      alert('Deletion failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const updateUserProfile = async (userId, data) => {
    try {
      await axios.patch(`${API_BASE}/users/${userId}/admin`, data);
      fetchAllData();
      alert('User profile updated');
    } catch (err) {
      alert('Update failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      const payload = Object.entries(settings).map(([key, value]) => ({ key, value }));
      await axios.post(`${API_BASE}/settings`, { settings: payload });
      alert('Settings saved!');
    } catch (err) {
      alert('Error saving settings');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredRequests = requests.filter(r => 
    reqFilter === 'ALL' ? true : r.status === reqFilter
  );

  const stats = {
    totalUsers: users.length,
    activeSubs: users.filter(u => u.subscriptionStatus === 'ACTIVE').length,
    totalProjects: projects.length,
    pendingRequests: requests.filter(r => r.status === 'PENDING').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-2">Nexus Admin</h1>
            <p className="text-slate-400">System control and subscription oversight.</p>
          </div>
          <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
            {['insights', 'users', 'requests', 'projects', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                  activeTab === tab 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
                { label: 'Active Premium', value: stats.activeSubs, icon: Shield, color: 'text-emerald-500' },
                { label: 'Total Projects', value: stats.totalProjects, icon: Layout, color: 'text-purple-500' },
                { label: 'Pending Requests', value: stats.pendingRequests, icon: Clock, color: 'text-amber-500' },
              ].map((s, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-[2rem] p-8 flex flex-col gap-4">
                  <div className={`p-4 rounded-2xl bg-white/5 w-fit ${s.color}`}>
                    <s.icon size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{s.label}</p>
                    <p className="text-3xl font-black">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
                <h3 className="text-xl font-bold mb-6">Recent System Activity</h3>
                <div className="space-y-4">
                  {requests.slice(0, 5).map(req => (
                    <div key={req.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                          {req.user.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{req.user.name} submitted £{req.amount} via {req.method}</p>
                          <p className="text-[10px] text-slate-500">{new Date(req.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        req.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' :
                        req.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 border border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-between">
                <div>
                  <TrendingUp size={32} className="text-primary mb-6" />
                  <h3 className="text-2xl font-black mb-2">Growth Focus</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Nexus is growing. You currently have {stats.pendingRequests} pending requests awaiting your attention. Keep the momentum high!
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab('requests')}
                  className="mt-8 w-full py-4 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:scale-105 transition-all"
                >
                  Manage Requests
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between gap-4 bg-white/5 p-4 rounded-[2rem] border border-white/10">
              <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                <Search size={18} className="text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search users by name or email..."
                  className="bg-transparent border-none focus:outline-none text-sm w-full"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">User</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Role</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Usage</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center font-black">
                            {u.name[0]}
                          </div>
                          <div>
                            <p className="font-bold">{u.name}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <select 
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                          value={u.role}
                          onChange={(e) => updateUserProfile(u.id, { role: e.target.value })}
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="TESTER">TESTER</option>
                          <option value="LEAD">LEAD</option>
                        </select>
                      </td>
                      <td className="px-8 py-6">
                        <select 
                          className={`bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none ${
                            u.subscriptionStatus === 'ACTIVE' ? 'text-emerald-400' : 
                            u.subscriptionStatus === 'TRIAL' ? 'text-blue-400' : 'text-slate-400'
                          }`}
                          value={u.subscriptionStatus}
                          onChange={(e) => updateUserProfile(u.id, { subscriptionStatus: e.target.value })}
                        >
                          <option value="NONE">NONE</option>
                          <option value="TRIAL">TRIAL</option>
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="EXPIRED">EXPIRED</option>
                        </select>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Layout size={12} /> {u._count?.projects || 0} Projects
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Edit3 size={12} /> {u._count?.assignments || 0} Tasks
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            title="Set Expiry"
                            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                            onClick={() => {
                              const date = window.prompt('Enter expiry date (YYYY-MM-DD):', u.subscriptionExpiresAt?.split('T')[0] || '');
                              if (date) updateUserProfile(u.id, { subscriptionExpiresAt: date });
                            }}
                          >
                            <Calendar size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-[2rem] border border-white/10 overflow-x-auto">
              <Filter size={18} className="text-slate-500 ml-4" />
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
                <button
                  key={f}
                  onClick={() => setReqFilter(f)}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                    reqFilter === f ? 'bg-white text-black border-white' : 'text-slate-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.map(req => (
                <div key={req.id} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-between group hover:border-primary/50 transition-all duration-500">
                  <div className="space-y-8">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                          <CreditCard size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Request Amount</p>
                          <p className="text-2xl font-black">£{req.amount.toFixed(2)}</p>
                        </div>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase ${
                        req.status === 'APPROVED' ? 'bg-emerald-500 text-white' :
                        req.status === 'REJECTED' ? 'bg-rose-500 text-white' :
                        'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Subscriber</span>
                        <span className="text-xs font-bold">{req.user.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Payment Method</span>
                        <span className="text-xs font-bold text-primary">{req.method.replace('_', ' ')}</span>
                      </div>
                      <div className="flex flex-col gap-2 pt-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Transaction Ref</span>
                        <div className="px-4 py-3 bg-black/40 rounded-xl border border-white/5 font-mono text-[10px] text-slate-300 break-all">
                          {req.transactionId || 'NO REFERENCE'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {req.status === 'PENDING' && (
                    <div className="mt-10 flex gap-3">
                      <button
                        onClick={() => handleRequestAction(req.id, 'REJECTED')}
                        className="flex-1 py-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 transition-all hover:text-white"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleRequestAction(req.id, 'APPROVED')}
                        className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                      >
                        Approve & Upgrade
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(proj => (
                <div key={proj.id} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/[0.08] transition-all">
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/10">
                      {proj.logoUrl ? (
                        <img src={proj.logoUrl} alt={proj.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-black" style={{ color: proj.themeColor }}>
                          {proj.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: proj.themeColor }} />
                    </div>
                  </div>
                  <h3 className="text-xl font-black mb-1">{proj.name}</h3>
                  <div className="flex items-center gap-2 text-slate-500 text-xs mb-6">
                    <Calendar size={12} />
                    Created {new Date(proj.createdAt).toLocaleDateString()}
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
                    <div className="bg-white/5 rounded-2xl p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Suites</p>
                      <p className="text-xl font-black">{proj._count?.testSuites || 0}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="bg-white/5 rounded-2xl p-4 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Status</p>
                        <p className="text-xs font-bold text-emerald-500">LIVE</p>
                      </div>
                      <button 
                        onClick={() => deleteProject(proj.id)}
                        className="p-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-4 mb-10">
                <div className="p-4 bg-primary/20 rounded-3xl text-primary">
                  <Settings size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black">Payment Configuration</h3>
                  <p className="text-slate-400 text-sm">Update where you receive user payments.</p>
                </div>
              </div>

              <form onSubmit={saveSettings} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Vodafone Cash Number</label>
                    <input 
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                      value={settings.VODAFONE_NUMBER}
                      onChange={(e) => setSettings({...settings, VODAFONE_NUMBER: e.target.value})}
                      placeholder="e.g. 01012345678"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Monthly Fee (£)</label>
                    <input 
                      type="number"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                      value={settings.SUBSCRIPTION_COST}
                      onChange={(e) => setSettings({...settings, SUBSCRIPTION_COST: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">PayPal Email</label>
                    <input 
                      type="email"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                      value={settings.PAYPAL_EMAIL}
                      onChange={(e) => setSettings({...settings, PAYPAL_EMAIL: e.target.value})}
                      placeholder="billing@yourdomain.com"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Payoneer Email</label>
                    <input 
                      type="email"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                      value={settings.PAYONEER_EMAIL}
                      onChange={(e) => setSettings({...settings, PAYONEER_EMAIL: e.target.value})}
                      placeholder="payouts@yourdomain.com"
                    />
                  </div>
                </div>

                <div className="pt-8">
                  <button 
                    type="submit"
                    className="w-full py-5 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/30"
                  >
                    Save System Configuration
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
