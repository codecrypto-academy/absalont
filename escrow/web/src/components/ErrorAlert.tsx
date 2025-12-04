'use client';

export interface ErrorAlertProps {
  title?: string;
  message: string;
  onClose?: () => void;
  type?: 'error' | 'warning' | 'info' | 'success';
  dismissible?: boolean;
}

/**
 * Componente reutilizable para mostrar alertas de error, advertencia, info o éxito
 * 
 * Ejemplo de uso:
 * <ErrorAlert 
 *   title="Error de conexión"
 *   message="No se pudo conectar al contrato inteligente"
 *   type="error"
 *   onClose={() => setError(null)}
 * />
 */
export function ErrorAlert({
  title,
  message,
  onClose,
  type = 'error',
  dismissible = true,
}: ErrorAlertProps) {
  // Mapeo de colores por tipo
  const typeStyles = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: '❌',
      textTitle: 'text-red-900',
      textMessage: 'text-red-700',
      button: 'hover:bg-red-100',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: '⚠️',
      textTitle: 'text-yellow-900',
      textMessage: 'text-yellow-700',
      button: 'hover:bg-yellow-100',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'ℹ️',
      textTitle: 'text-blue-900',
      textMessage: 'text-blue-700',
      button: 'hover:bg-blue-100',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: '✅',
      textTitle: 'text-green-900',
      textMessage: 'text-green-700',
      button: 'hover:bg-green-100',
    },
  };

  const style = typeStyles[type];

  return (
    <div
      className={`${style.bg} border ${style.border} rounded-lg p-4 mb-4 flex gap-3 items-start`}
      role="alert"
    >
      {/* Icon */}
      <div className="text-lg flex-shrink-0">{style.icon}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className={`font-semibold ${style.textTitle} mb-1`}>
            {title}
          </h3>
        )}
        <div className={`${style.textMessage} text-sm break-words`}>
          {message}
        </div>
      </div>

      {/* Close Button */}
      {dismissible && onClose && (
        <button
          onClick={onClose}
          className={`flex-shrink-0 text-lg ${style.button} rounded p-1 transition-colors`}
          aria-label="Cerrar alerta"
        >
          ✕
        </button>
      )}
    </div>
  );
}
