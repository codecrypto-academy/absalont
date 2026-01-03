import { ethers } from 'ethers';

export const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS || '0x1613beB3B2C4f22Ee086B2b38C1476A3cE7f78E8';
export const TOKEN_A_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_A_ADDRESS || '0x851356ae760d987E095750cCeb3bC6014560891C';
export const TOKEN_B_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_B_ADDRESS || '0xf5059a5D33d5853360D16C683c16e67980206f36';
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545';
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '31337', 10);

if (typeof window !== 'undefined') {
  console.log('Contract Addresses Loaded:', {
    ESCROW: ESCROW_ADDRESS,
    TOKEN_A: TOKEN_A_ADDRESS,
    TOKEN_B: TOKEN_B_ADDRESS,
    CHAIN_ID: CHAIN_ID
  });
}

// ABI del contrato Escrow (simplificado)
export const ESCROW_ABI = [
  'function createOperation(uint256 _amountA, address _recipient, uint256 _amountB, address _tokenA, address _tokenB) external returns (uint256)',
  'function completeOperation(uint256 _operationId, uint256 _amountB) external',
  'function cancelOperation(uint256 _operationId) external',
  'function getOperation(uint256 _operationId) external view returns (tuple(address initiator, address recipient, uint256 amountA, uint256 amountB, address tokenA, address tokenB, uint8 status, uint256 createdAt, uint256 closedAt))',
  'function getOperationCount() external view returns (uint256)',
  'function isTokenAllowed(address _token) external view returns (bool)',
  'function addToken(address _token) external',
  'function getAllOperations() external view returns (tuple(address initiator, address recipient, uint256 amountA, uint256 amountB, address tokenA, address tokenB, uint8 status, uint256 createdAt, uint256 closedAt)[])',
  'function getAllowedTokens() external view returns (address[])',
];

// ABI del token ERC20
export const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function mint(address to, uint256 amount) external',
];

export function getProvider(): ethers.BrowserProvider {
  if (!window.ethereum) {
    throw new Error('MetaMask not found');
  }
  return new ethers.BrowserProvider(window.ethereum);
}

export async function getSigner(): Promise<ethers.Signer> {
  const provider = getProvider();
  return provider.getSigner();
}
