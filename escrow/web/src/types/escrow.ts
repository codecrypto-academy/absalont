export interface Operation {
  id?: number;
  initiator: string;
  recipient: string;
  amountA: bigint | string;
  amountB: bigint | string;
  tokenA: string;
  tokenB: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: bigint | number;
}

export interface OperationInput {
  amountA: string;
  amountB: string;
  recipient: string;
  tokenA: string;
  tokenB: string;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  balance: bigint;
}

export interface TransactionResult {
  hash: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
}
