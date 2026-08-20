import React, { createContext, useContext, useState, useCallback } from 'react';

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

  return React.createElement(
    ToastContext.Provider,
    { value: { toasts, toast, removeToast } },
    children
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
