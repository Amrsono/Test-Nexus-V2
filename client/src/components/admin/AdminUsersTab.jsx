import React from 'react';
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
