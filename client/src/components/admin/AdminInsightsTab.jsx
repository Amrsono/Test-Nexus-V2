import React from 'react';
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
