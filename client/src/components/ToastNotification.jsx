import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';


export const ToastContainer = ({ toasts = [], removeToast }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map((t) => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';
        const isWarning = t.type === 'warning';

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 ${
              isSuccess
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-100 shadow-emerald-950/40'
                : isError
                ? 'bg-rose-950/90 border-rose-500/30 text-rose-100 shadow-rose-950/40'
                : isWarning
                ? 'bg-amber-950/90 border-amber-500/30 text-amber-100 shadow-amber-950/40'
                : 'bg-slate-900/90 border-slate-700 text-slate-100 shadow-slate-950/40'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-indigo-400" />}
            </div>

            <div className="flex-1 text-sm font-medium leading-relaxed">
              {t.message}
            </div>

            {removeToast && (
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
