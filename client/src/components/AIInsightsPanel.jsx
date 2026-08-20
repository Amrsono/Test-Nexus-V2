import React from 'react';
import { Brain, AlertTriangle, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';

export const AIInsightsPanel = ({ 
  insights = [], 
  isDark = true,
  onTriggerAnalysis
}) => {
  const items = Array.isArray(insights) ? insights : [];

  return (
    <div className={`p-6 rounded-3xl border-2 transition-all ${
      isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-xl'
    }`}>
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black flex items-center gap-2">
              AI Quality Advisor <Sparkles className="w-4 h-4 text-amber-400" />
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Continuous risk, slippage, and bottleneck heuristics
            </p>
          </div>
        </div>

        {onTriggerAnalysis && (
          <button
            onClick={onTriggerAnalysis}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 transition-colors"
          >
            Refresh
          </button>
        )}
      </div>

      {/* Feed List */}
      <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-white/10 text-center text-sm opacity-60">
            No active risk alerts. Quality velocity is on track.
          </div>
        ) : (
          items.map((ins, i) => {
            const isHigh = ins.severity === 'HIGH' || ins.type === 'SLIPPAGE';
            const isMedium = ins.severity === 'MEDIUM';

            return (
              <div
                key={ins.id || i}
                className={`p-4 rounded-2xl border transition-all ${
                  isHigh
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-200'
                    : isMedium
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {isHigh ? (
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                    ) : isMedium ? (
                      <TrendingUp className="w-5 h-5 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold leading-snug mb-1">
                      {ins.title || ins.category || 'Strategic Insight'}
                    </h4>
                    <p className="text-xs opacity-90 leading-relaxed">
                      {ins.message || ins.description || ins.content}
                    </p>
                    {ins.action && (
                      <div className="mt-2 text-xs font-bold underline opacity-80 cursor-pointer">
                        Suggested Action: {ins.action}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AIInsightsPanel;
