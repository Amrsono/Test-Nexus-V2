import os

services_dir = "client/src/services"
os.makedirs(services_dir, exist_ok=True)
hooks_dir = "client/src/hooks"
os.makedirs(hooks_dir, exist_ok=True)
components_dir = "client/src/components"
os.makedirs(components_dir, exist_ok=True)

# 1. api.js
api_code = """import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Attach bearer token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Normalize error responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    
    // Attach clean formatted message
    error.formattedMessage = message;
    return Promise.reject(error);
  }
);

export default api;
"""
with open(os.path.join(services_dir, "api.js"), "w", encoding="utf-8") as f:
    f.write(api_code)

# 2. useToast.js
use_toast_code = """import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    remove: removeToast,
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if not wrapped in provider
    return {
      success: (msg) => console.log('[Toast:success]', msg),
      error: (msg) => console.error('[Toast:error]', msg),
      info: (msg) => console.log('[Toast:info]', msg),
      warning: (msg) => console.warn('[Toast:warning]', msg),
      toasts: [],
      removeToast: () => {},
    };
  }
  return context.toast;
};

export default useToast;
"""
with open(os.path.join(hooks_dir, "useToast.js"), "w", encoding="utf-8") as f:
    f.write(use_toast_code)

# 3. ToastNotification.jsx
toast_comp_code = """import React, { useContext } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import useToast from '../hooks/useToast';

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
"""
with open(os.path.join(components_dir, "ToastNotification.jsx"), "w", encoding="utf-8") as f:
    f.write(toast_comp_code)

print('Client API & Toast service created successfully!')
