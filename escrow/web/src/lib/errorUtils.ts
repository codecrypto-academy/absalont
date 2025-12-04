/**
 * Utilidades para manejo de errores en la DApp
 * Ayuda a parsear, categorizar y mostrar errores de forma amigable
 */

export enum ErrorType {
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  USER_REJECTED = 'USER_REJECTED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  TOKEN_NOT_FOUND = 'TOKEN_NOT_FOUND',
  UNKNOWN = 'UNKNOWN',
}

export interface ParsedError {
  type: ErrorType;
  message: string;
  originalError: unknown;
}

/**
 * Parsea un error y devuelve información estructurada
 * Detecta tipos comunes de errores de blockchain y MetaMask
 */
export function parseContractError(error: unknown): ParsedError {
  const errorStr = String(error);
  const errorLower = errorStr.toLowerCase();

  // Usuario rechazó la transacción
  if (
    errorLower.includes('user rejected') ||
    errorLower.includes('user denied') ||
    errorLower.includes('rejected')
  ) {
    return {
      type: ErrorType.USER_REJECTED,
      message: 'Rechazaste la transacción. Por favor, intenta de nuevo.',
      originalError: error,
    };
  }

  // Fondos insuficientes
  if (
    errorLower.includes('insufficient') ||
    errorLower.includes('insufficient balance') ||
    errorLower.includes('insufficient funds') ||
    errorLower.includes('insufficient allowance')
  ) {
    return {
      type: ErrorType.INSUFFICIENT_FUNDS,
      message:
        'Saldo o allowance insuficiente. Asegúrate de tener suficientes tokens.',
      originalError: error,
    };
  }

  // Errores de red
  if (
    errorLower.includes('network') ||
    errorLower.includes('timeout') ||
    errorLower.includes('enotfound')
  ) {
    return {
      type: ErrorType.NETWORK_ERROR,
      message:
        'Error de conexión a la red. Verifica tu conexión a internet.',
      originalError: error,
    };
  }

  // Token no encontrado
  if (errorLower.includes('token') && errorLower.includes('not found')) {
    return {
      type: ErrorType.TOKEN_NOT_FOUND,
      message: 'Token no encontrado. Verifica la dirección del token.',
      originalError: error,
    };
  }

  // Error de contrato (revert)
  if (errorLower.includes('revert') || errorLower.includes('execution revert')) {
    return {
      type: ErrorType.CONTRACT_ERROR,
      message:
        'La transacción fue rechazada por el contrato. Verifica los datos.',
      originalError: error,
    };
  }

  // Validación de entrada
  if (
    errorLower.includes('invalid') ||
    errorLower.includes('invalid address')
  ) {
    return {
      type: ErrorType.INVALID_INPUT,
      message: 'Datos inválidos. Por favor, verifica tu entrada.',
      originalError: error,
    };
  }

  // Error desconocido
  return {
    type: ErrorType.UNKNOWN,
    message: `Error: ${errorStr.substring(0, 100)}`,
    originalError: error,
  };
}

/**
 * Obtiene un mensaje de error amigable para el usuario
 */
export function getErrorMessage(error: unknown): string {
  const parsed = parseContractError(error);
  return parsed.message;
}

/**
 * Formatea el error para mostrar en la UI
 */
export function formatErrorDisplay(error: unknown): {
  title: string;
  message: string;
} {
  const parsed = parseContractError(error);

  const titles: Record<ErrorType, string> = {
    [ErrorType.INSUFFICIENT_FUNDS]: '💰 Saldo Insuficiente',
    [ErrorType.USER_REJECTED]: '❌ Transacción Rechazada',
    [ErrorType.NETWORK_ERROR]: '🌐 Error de Red',
    [ErrorType.CONTRACT_ERROR]: '⚙️ Error del Contrato',
    [ErrorType.INVALID_INPUT]: '⚠️ Datos Inválidos',
    [ErrorType.TOKEN_NOT_FOUND]: '🔍 Token No Encontrado',
    [ErrorType.UNKNOWN]: '❌ Error',
  };

  return {
    title: titles[parsed.type],
    message: parsed.message,
  };
}

/**
 * Valida que una dirección sea válida (formato básico)
 */
export function isValidAddress(address: string): boolean {
  if (!address) return false;
  // Verifica que sea una dirección Ethereum válida (0x + 40 caracteres hex)
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Valida que un monto sea un número válido positivo
 */
export function isValidAmount(amount: string): boolean {
  if (!amount) return false;
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
}

/**
 * Trunca una dirección para mostrar: 0x1234...5678
 */
export function truncateAddress(address: string, chars = 4): string {
  if (!isValidAddress(address)) return address;
  return `${address.substring(0, chars + 2)}...${address.substring(42 - chars)}`;
}

/**
 * Log estructurado para debugging
 */
export function logError(
  context: string,
  error: unknown,
  extra?: Record<string, unknown>
): void {
  const parsed = parseContractError(error);
  console.error(`[${context}]`, {
    type: parsed.type,
    message: parsed.message,
    originalError: parsed.originalError,
    ...extra,
  });
}

/**
 * Espera un tiempo específico (útil para pausas entre transacciones)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
