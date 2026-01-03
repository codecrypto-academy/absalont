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

  // Extraer mensaje detallado si existe (Ethers V6 / Provider errors)
  const detail = (error as any)?.reason ||
    (error as any)?.info?.error?.message ||
    (error as any)?.error?.message ||
    (error as any)?.message ||
    errorStr;
  const detailLower = detail.toLowerCase();

  // Usuario rechazó la transacción
  if (
    errorLower.includes('user rejected') ||
    detailLower.includes('user rejected') ||
    errorLower.includes('rejected')
  ) {
    return {
      type: ErrorType.USER_REJECTED,
      message: 'Rechazaste la transacción en tu wallet.',
      originalError: error,
    };
  }

  // Fondos insuficientes (ETH o Tokens)
  if (
    errorLower.includes('insufficient') ||
    detailLower.includes('insufficient balance') ||
    detailLower.includes('insufficient funds') ||
    detailLower.includes('transfer amount exceeds balance')
  ) {
    return {
      type: ErrorType.INSUFFICIENT_FUNDS,
      message: 'Saldo insuficiente para completar la transacción.',
      originalError: error,
    };
  }

  // Errores de red
  if (
    errorLower.includes('network') ||
    detailLower.includes('network') ||
    errorLower.includes('timeout')
  ) {
    return {
      type: ErrorType.NETWORK_ERROR,
      message: 'Error de conexión. Verifica tu red.',
      originalError: error,
    };
  }

  // Error de contrato específico (revert con mensaje)
  if (errorLower.includes('revert') || errorLower.includes('execution reverted')) {
    // Intentar limpiar el mensaje de revert
    let cleanMessage = detail;
    if (detail.includes('reverted with reason string')) {
      cleanMessage = detail.split("'")[1] || detail;
    }

    return {
      type: ErrorType.CONTRACT_ERROR,
      message: `Contrato: ${cleanMessage}`,
      originalError: error,
    };
  }

  // Error desconocido pero con detalle
  return {
    type: ErrorType.UNKNOWN,
    message: detail.length < 100 ? detail : `Error: ${detail.substring(0, 100)}...`,
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
    title: titles[parsed.type] || '❌ Error',
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

  // Usamos warn para evitar disparar el overlay de Next.js en desarrollo
  console.group(`[LOG: ${context}]`);
  console.warn("Type:", parsed.type);
  console.warn("Message:", parsed.message);
  console.warn("Original error:", error);
  if (extra) console.warn("Extra info:", extra);
  console.groupEnd();
}

/**
 * Espera un tiempo específico (útil para pausas entre transacciones)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
