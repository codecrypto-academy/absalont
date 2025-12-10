import { Contract } from 'ethers';

export const DAO_ADDRESS = process.env.NEXT_PUBLIC_DAO_ADDRESS || '';
export const FORWARDER_ADDRESS = process.env.NEXT_PUBLIC_FORWARDER_ADDRESS || '';
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '31337');

export const DAO_ABI = [
  {
    type: 'constructor',
    inputs: [{ name: 'trustedForwarder', type: 'address', internalType: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'fundDAO',
    inputs: [],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'createProposal',
    inputs: [
      { name: 'recipient', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
      { name: 'deadline', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'vote',
    inputs: [
      { name: 'proposalId', type: 'uint256', internalType: 'uint256' },
      { name: 'voteType', type: 'uint8', internalType: 'enum DAOVoting.VoteType' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'executeProposal',
    inputs: [{ name: 'proposalId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getProposal',
    inputs: [{ name: 'proposalId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct DAOVoting.Proposal',
        components: [
          { name: 'id', type: 'uint256', internalType: 'uint256' },
          { name: 'recipient', type: 'address', internalType: 'address' },
          { name: 'amount', type: 'uint256', internalType: 'uint256' },
          { name: 'deadline', type: 'uint256', internalType: 'uint256' },
          { name: 'votesAFavor', type: 'uint256', internalType: 'uint256' },
          { name: 'votesEnContra', type: 'uint256', internalType: 'uint256' },
          { name: 'votesAbstencion', type: 'uint256', internalType: 'uint256' },
          { name: 'executed', type: 'bool', internalType: 'bool' },
          { name: 'createdAt', type: 'uint256', internalType: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getUserBalance',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'hasUserVoted',
    inputs: [
      { name: 'proposalId', type: 'uint256', internalType: 'uint256' },
      { name: 'user', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getUserVote',
    inputs: [
      { name: 'proposalId', type: 'uint256', internalType: 'uint256' },
      { name: 'user', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'uint8', internalType: 'enum DAOVoting.VoteType' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getProposalCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalDAOBalance',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'MIN_PROPOSAL_PERCENTAGE',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'SAFETY_PERIOD',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isTrustedForwarder',
    inputs: [{ name: 'forwarder', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'DAOFunded',
    inputs: [
      { name: 'funder', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'ProposalCreated',
    inputs: [
      { name: 'proposalId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'recipient', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'deadline', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'Voted',
    inputs: [
      { name: 'proposalId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'voter', type: 'address', indexed: true, internalType: 'address' },
      { name: 'voteType', type: 'uint8', indexed: false, internalType: 'enum DAOVoting.VoteType' },
    ],
  },
  {
    type: 'event',
    name: 'ProposalExecuted',
    inputs: [
      { name: 'proposalId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'recipient', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
];

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
}

export interface ForwardRequest {
  from: string;
  to: string;
  value: bigint;
  gas: bigint;
  nonce: bigint;
  data: string;
}
