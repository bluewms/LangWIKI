import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

/**
 * Toast 全局反馈系统
 * 用法：
 *   const toast = useToast();
 *   toast.success('保存成功');
 *   toast.error('操作失败');
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, message, duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    if (type !== 'error' && duration > 0) {
      setTimeout(() => remove(id), duration);
    }
    return id;
  }, [remove]);

  const toast = {
    success: (msg, d) => push('success', msg, d),
    error: (msg, d) => push('error', msg, d ?? 0),
    info: (msg, d) => push('info', msg, d)
  };

  const iconMap = {
    success: <CheckCircle2 size={18} className="text-green-500" />,
    error: <AlertCircle size={18} className="text-red-500" />,
    info: <Info size={18} className="text-brand-500" />
  };
  const borderMap = {
    success: 'border-l-green-500',
    error: 'border-l-red-500',
    info: 'border-l-brand-500'
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`fade-in flex items-start gap-2 bg-white rounded-md shadow-popover border border-slate-200 border-l-4 ${borderMap[t.type]} px-4 py-3 text-sm text-slate-700`}
          >
            <span className="mt-0.5 shrink-0">{iconMap[t.type]}</span>
            <span className="flex-1 break-words">{t.message}</span>
            <button
              className="shrink-0 text-slate-400 hover:text-slate-600"
              onClick={() => remove(t.id)}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
