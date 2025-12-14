import { Contract } from 'ethers';
import DAOVotingABI from './DAOVoting.abi.json';

export const DAO_ADDRESS = process.env.NEXT_PUBLIC_DAO_ADDRESS || '';
export const FORWARDER_ADDRESS = process.env.NEXT_PUBLIC_FORWARDER_ADDRESS || '';
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '31337');

export const DAO_ABI = DAOVotingABI;

export const FORWARDER_ABI = [
  {
    type: 'function',
    name: 'getNonce',
    inputs: [{ name: 'from', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'verify',
    inputs: [
      {
        name: 'req',
        type: 'tuple',
        internalType: 'struct MinimalForwarder.ForwardRequest',
        components: [
          { name: 'from', type: 'address', internalType: 'address' },
          { name: 'to', type: 'address', internalType: 'address' },
          { name: 'value', type: 'uint256', internalType: 'uint256' },
          { name: 'gas', type: 'uint256', internalType: 'uint256' },
          { name: 'nonce', type: 'uint256', internalType: 'uint256' },
          { name: 'data', type: 'bytes', internalType: 'bytes' },
        ],
      },
      { name: 'signature', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'execute',
    inputs: [
      {
        name: 'req',
        type: 'tuple',
        internalType: 'struct MinimalForwarder.ForwardRequest',
        components: [
          { name: 'from', type: 'address', internalType: 'address' },
          { name: 'to', type: 'address', internalType: 'address' },
          { name: 'value', type: 'uint256', internalType: 'uint256' },
          { name: 'gas', type: 'uint256', internalType: 'uint256' },
          { name: 'nonce', type: 'uint256', internalType: 'uint256' },
          { name: 'data', type: 'bytes', internalType: 'bytes' },
        ],
      },
      { name: 'signature', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' },
      { name: '', type: 'bytes', internalType: 'bytes' },
    ],
    stateMutability: 'payable',
  },
];

export enum VoteType {
  A_FAVOR = 0,
  EN_CONTRA = 1,
  ABSTENCION = 2,
}

export interface Proposal {
  id: bigint;
  recipient: string;
  amount: bigint;
  deadline: bigint;
  votesAFavor: bigint;
  votesEnContra: bigint;
  votesAbstencion: bigint;
  executed: boolean;
  createdAt: bigint;
  description: string;
}

export interface ForwardRequest {
  from: string;
  to: string;
  value: bigint;
  gas: bigint;
  nonce: bigint;
  data: string;
}
