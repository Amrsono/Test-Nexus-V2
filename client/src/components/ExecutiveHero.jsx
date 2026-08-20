import React from 'react';
import { ArrowUpRight, TrendingDown, CheckCircle2, AlertCircle, Clock, Bug, Shield } from 'lucide-react';

export const MetricCard = ({ label, value, icon, change, trend, isDark = true }) => (
  <div className={`p-6 rounded-3xl border-2 transition-all hover:scale-105 duration-300 ${
    isDark ? 'bg-white/5 border-white/10 shadow-lg' : 'bg-white border-slate-400 shadow-xl'
  }`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-100'} shadow-sm`}>
        {icon}
      </div>
      {change && (
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
          trend === 'up' ? 'text-emerald-500 bg-emerald-500/10' : 
          trend === 'down' ? 'text-rose-500 bg-rose-500/10' : 
          'text-slate-500 bg-slate-500/10'
        }`}>
          {trend === 'up' && <ArrowUpRight size={14} />}
          {trend === 'down' && <TrendingDown size={14} />}
          {change}
        </span>
      )}
    </div>
    <h3 className={`text-3xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</h3>
    <p className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
  </div>
);

export const ExecutiveHero = ({ stats = {}, isDark = true, projectName = 'Project' }) => {
  const total = stats.total || 0;
  const passed = stats.passed || 0;
  const failed = stats.failed || 0;
  const blocked = stats.blocked || 0;
  const pending = stats.pending || 0;

  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  const failRate = total > 0 ? Math.round((failed / total) * 100) : 0;

  const healthStatus =
    total === 0 ? 'NEUTRAL' :
    passRate >= 80 ? 'HEALTHY' :
    passRate >= 50 ? 'AT RISK' : 'CRITICAL';

  return (
    <div className="w-full mb-8">
      {/* Top Banner with Health */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Executive Overview — {projectName}
          </h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Real-time testing health status and quality gate progress.
          </p>
        </div>

        <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 font-black text-sm tracking-wide ${
          healthStatus === 'HEALTHY'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : healthStatus === 'AT RISK'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            : healthStatus === 'CRITICAL'
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            : 'bg-slate-500/10 border-slate-500/30 text-slate-400'
        }`}>
          <span className="w-2.5 h-2.5 rounded-full animate-pulse bg-current" />
          GATE STATUS: {healthStatus} ({passRate}%)
        </div>
      </div>

      {/* Hero Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          label="Total Scenarios"
          value={total}
          icon={<Shield className="w-6 h-6 text-indigo-400" />}
          change={`${total} cases`}
          trend="up"
          isDark={isDark}
        />
        <MetricCard
          label="Passed Journeys"
          value={passed}
          icon={<CheckCircle2 className="w-6 h-6 text-emerald-400" />}
          change={`${passRate}% pass`}
          trend="up"
          isDark={isDark}
        />
        <MetricCard
          label="Failed / Blocked"
          value={failed + blocked}
          icon={<Bug className="w-6 h-6 text-rose-400" />}
          change={`${failRate}% rate`}
          trend={failed + blocked > 0 ? "down" : "up"}
          isDark={isDark}
        />
        <MetricCard
          label="Pending Execution"
          value={pending}
          icon={<Clock className="w-6 h-6 text-amber-400" />}
          change={`${pending} remaining`}
          trend="neutral"
          isDark={isDark}
        />
      </div>
    </div>
  );
};

export default ExecutiveHero;
