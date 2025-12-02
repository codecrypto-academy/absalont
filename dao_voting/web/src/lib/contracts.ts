import { Contract } from 'ethers';

export const DAO_ADDRESS = process.env.NEXT_PUBLIC_DAO_ADDRESS || '';
export const FORWARDER_ADDRESS = process.env.NEXT_PUBLIC_FORWARDER_ADDRESS || '';
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '31337');

export const DAO_ABI = [
  'function fundDAO() external payable',
  'function createProposal(address recipient, uint256 amount, uint256 deadline) external returns (uint256)',
  'function vote(uint256 proposalId, uint8 voteType) external',
  'function executeProposal(uint256 proposalId) external',
  'function getProposal(uint256 proposalId) external view returns (tuple(uint256 id, address recipient, uint256 amount, uint256 deadline, uint256 votesAFavor, uint256 votesEnContra, uint256 votesAbstencion, bool executed, uint256 createdAt))',
  'function getUserBalance(address user) external view returns (uint256)',
  'function hasUserVoted(uint256 proposalId, address user) external view returns (bool)',
  'function getUserVote(uint256 proposalId, address user) external view returns (uint8)',
  'function getProposalCount() external view returns (uint256)',
  'function totalDAOBalance() external view returns (uint256)',
  'event DAOFunded(address indexed funder, uint256 amount)',
  'event ProposalCreated(uint256 indexed proposalId, address indexed recipient, uint256 amount, uint256 deadline)',
  'event Voted(uint256 indexed proposalId, address indexed voter, uint8 voteType)',
  'event ProposalExecuted(uint256 indexed proposalId, address indexed recipient, uint256 amount)',
];

export const FORWARDER_ABI = [
  'function getNonce(address from) public view returns (uint256)',
  'function verify(tuple(address from, address to, uint256 value, uint256 gas, uint256 nonce, bytes data) req, bytes calldata signature) public view returns (bool)',
  'function execute(tuple(address from, address to, uint256 value, uint256 gas, uint256 nonce, bytes data) req, bytes calldata signature) public payable returns (bool, bytes memory)',
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
