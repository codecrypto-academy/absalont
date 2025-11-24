// Type definitions for Ethereum-related types

export interface AnvilAccount {
  address: string;
  privateKey: string;
}

export interface DocumentInfo {
  hash: string;
  timestamp: bigint;
  signer: string;
  signature: string;
  exists: boolean;
}

export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string;
  chainId: number | null;
}

// Contract function return types
export interface StoreDocumentParams {
  hash: string;
  timestamp: number;
  signature: string;
}

export interface VerifyDocumentParams {
  hash: string;
  signer: string;
  signature: string;
}

// Event types
export interface DocumentStoredEvent {
  hash: string;
  signer: string;
  timestamp: bigint;
}

export interface DocumentVerifiedEvent {
  hash: string;
  signer: string;
  isValid: boolean;
}
