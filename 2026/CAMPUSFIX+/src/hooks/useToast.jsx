/**
 * useToast — toast notification hook.
 *
 * Usage:
 *   const { toasts, toast } = useToast();
 *   toast.success('Complaint submitted!');
 *   toast.error('Something went wrong.');
 *   toast.info('Assignment updated.');
 *   toast.warning('Deadline approaching.');
 *
 * Wrap your app with <ToastProvider> and place <ToastContainer> anywhere.
 */
import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((type, message, duration = 4000) => {
    const id = ++_id;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => add('success', msg, dur),
    error:   (msg, dur) => add('error',   msg, dur),
    info:    (msg, dur) => add('info',    msg, dur),
    warning: (msg, dur) => add('warning', msg, dur),
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>.');
  return ctx;
}
