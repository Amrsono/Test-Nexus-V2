import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingDown, Calendar, ArrowUpRight } from 'lucide-react';

export const BurndownPanel = ({ 
  burndownData = [], 
  burndownMeta = {}, 
  isDark = true,
  onExportReport
}) => {
  const data = Array.isArray(burndownData) ? burndownData : [];
  const meta = burndownMeta || {};

  return (
    <div className={`p-6 rounded-3xl border-2 transition-all ${
      isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-xl'
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black">Execution Burndown</h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Ideal vs. Actual Journey Completion Timeline
            </p>
          </div>
        </div>

        {onExportReport && (
          <button
            onClick={onExportReport}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4" /> Export Status PPT
          </button>
        )}
      </div>

      {/* Chart Area */}
      <div className="h-72 w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm font-semibold opacity-60">
            No timeline data available for burndown plotting.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="idealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="label" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} />
              <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                  borderColor: isDark ? '#334155' : '#cbd5e1',
                  borderRadius: '12px',
                  color: isDark ? '#fff' : '#000'
                }} 
              />
              <Legend verticalAlign="top" height={36}/>
              <Area type="monotone" dataKey="ideal" name="Ideal Remaining" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#idealGrad)" />
              <Area type="monotone" dataKey="actual" name="Actual Remaining" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#actualGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10 text-center">
        <div>
          <span className="text-xs font-semibold block opacity-60">Total Target</span>
          <span className="text-base font-black">{meta.total || 0} Cases</span>
        </div>
        <div>
          <span className="text-xs font-semibold block opacity-60">Executed</span>
          <span className="text-base font-black text-indigo-400">{meta.currentExecuted || 0}</span>
        </div>
        <div>
          <span className="text-xs font-semibold block opacity-60">Remaining</span>
          <span className="text-base font-black text-amber-400">{meta.currentRemaining || 0}</span>
        </div>
        <div>
          <span className="text-xs font-semibold block opacity-60">Weeks Planned</span>
          <span className="text-base font-black">{meta.numWeeks || 8} Wks</span>
        </div>
      </div>
    </div>
  );
};

export default BurndownPanel;
