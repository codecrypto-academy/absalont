export interface Operation {
  initiator: string;
  recipient: string;
  amountA: bigint;
  amountB: bigint;
  tokenA: string;
  tokenB: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: bigint;
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
