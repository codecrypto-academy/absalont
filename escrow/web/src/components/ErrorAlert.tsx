'use client';

import { X, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export interface ErrorAlertProps {
  title?: string;
  message: string;
  onClose?: () => void;
  type?: 'error' | 'warning' | 'info' | 'success';
  dismissible?: boolean;
}

export function ErrorAlert({
  title,
  message,
  onClose,
  type = 'error',
  dismissible = true,
}: ErrorAlertProps) {
  const typeStyles = {
    error: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      icon: <AlertCircle className="w-5 h-5 text-rose-500" />,
      textTitle: 'text-rose-200',
      textMessage: 'text-rose-400/80',
    },
    warning: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      textTitle: 'text-amber-200',
      textMessage: 'text-amber-400/80',
    },
    info: {
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      icon: <Info className="w-5 h-5 text-indigo-500" />,
      textTitle: 'text-indigo-200',
      textMessage: 'text-indigo-400/80',
    },
    success: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      textTitle: 'text-emerald-200',
      textMessage: 'text-emerald-400/80',
    },
  };

  const style = typeStyles[type];

  return (
    <div
      className={`${style.bg} border ${style.border} rounded-2xl p-4 flex gap-4 items-start backdrop-blur-md`}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">{style.icon}</div>

      <div className="flex-1 min-w-0">
        {title && (
          <h3 className={`font-bold text-sm tracking-tight ${style.textTitle} mb-1`}>
            {title}
          </h3>
        )}
        <p className={`${style.textMessage} text-xs leading-relaxed font-medium`}>
          {message}
        </p>
      </div>

      {dismissible && onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-white/40 hover:text-white transition-colors p-1"
          aria-label="Cerrar alerta"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
