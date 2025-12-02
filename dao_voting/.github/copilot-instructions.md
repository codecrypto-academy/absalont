# DAO Voting Project - AI Agent Instructions

## Project Overview
This is a gasless DAO voting system using EIP-2771 meta-transactions. Two main components:
- **Smart Contracts (`sc/`)**: Solidity contracts using Foundry (MinimalForwarder + DAO Voting)
- **Frontend (`web/`)**: Next.js 15 app with ethers.js for Web3 integration

## Architecture & Key Concepts

### Meta-Transaction Flow (EIP-2771)
1. User signs vote/action off-chain (no gas required)
2. Frontend sends signed message to `/api/relay`
3. Relayer backend validates signature and submits to `MinimalForwarder`
4. `MinimalForwarder` forwards call to `DAOVoting` with original `msg.sender`
5. User votes without paying gas - relayer covers transaction costs

### DAO Voting Rules
- **Funding**: Any user can deposit ETH via `fundDAO()`
- **Proposal Creation**: Requires ≥10% of total DAO balance
- **Voting**: Requires minimum balance, one vote per proposal (can change before deadline)
- **Vote Types**: A FAVOR (positive), EN CONTRA (negative), ABSTENCIÓN (neutral)
- **Execution**: After deadline passes, if positive > negative votes, proposal auto-executes after safety period

## Smart Contract Structure (Foundry)

### Setup Commands
```bash
forge init sc && cd sc
forge install OpenZeppelin/openzeppelin-contracts
forge build
forge test
```

### Contract Files
- `MinimalForwarder.sol`: EIP-2771 relayer with nonce management, signature verification (ECDSA)
- `DAOVoting.sol`: Inherits `ERC2771Context`, handles proposals/voting/execution
- Use `_msgSender()` (not `msg.sender`) in DAOVoting to get original user from meta-tx

### Testing Patterns
- Test both regular transactions AND gasless meta-transactions
- Coverage target: >80%
- Key test cases: double voting, insufficient balance, deadline checks, replay attacks

## Frontend Structure (Next.js 15)

### Setup Commands
```bash
npx create-next-app@latest web --typescript --tailwind --app
cd web && npm install ethers
npm run dev
```

### Required Components
- `ConnectWallet.tsx`: MetaMask connection + display user balance
- `FundingPanel.tsx`: Deposit ETH to DAO
- `CreateProposal.tsx`: Form with recipient/amount/deadline (validates 10% requirement)
- `ProposalList.tsx` + `ProposalCard.tsx`: Display all proposals with vote counts
- `VoteButtons.tsx`: Generate EIP-712 signature and call `/api/relay`

### Web3 Integration
- Use ethers.js v6 for contract interactions
- Custom hook for MetaMask state management
- EIP-712 typed data signing for gasless votes:
  ```typescript
  const domain = { name: "MinimalForwarder", version: "0.0.1", chainId, verifyingContract }
  const types = { ForwardRequest: [...] }
  const signature = await signer._signTypedData(domain, types, request)
  ```

### API Route: `/api/relay`
- Receives signed meta-transaction from frontend
- Uses relayer private key (from `RELAYER_PRIVATE_KEY` env var)
- Calls `MinimalForwarder.execute()` with user's signature
- Returns transaction hash to frontend

### Environment Variables (`.env.local`)
```
NEXT_PUBLIC_DAO_ADDRESS=0x...
NEXT_PUBLIC_FORWARDER_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=31337
RELAYER_PRIVATE_KEY=0x...
RPC_URL=http://127.0.0.1:8545
```

## Development Workflow

### Local Testing Setup
1. Start local blockchain: `anvil` (in terminal 1)
2. Deploy contracts: `cd sc && forge script script/Deploy.s.sol --broadcast --rpc-url http://127.0.0.1:8545` (terminal 2)
3. Copy deployed addresses to `web/.env.local`
4. Start frontend: `cd web && npm run dev` (terminal 3)
5. Fund relayer account with ETH for gas

### Daemon for Auto-Execution
Implement background process (API route with cron or separate Node.js script) that:
- Polls proposals every X seconds
- Checks if deadline passed AND positive votes > negative votes
- Calls `executeProposal()` automatically
- Logs execution attempts

## Code Conventions

### Solidity
- Use OpenZeppelin imports for security (ERC2771Context, ECDSA)
- Emit events for all state changes (ProposalCreated, Voted, ProposalExecuted)
- Custom errors preferred over require strings (gas optimization)
- Modifiers for repeated validations (e.g., `proposalExists`, `beforeDeadline`)

### TypeScript/React
- Use TypeScript strict mode
- App router (not pages router) for Next.js 15
- Tailwind CSS for styling
- Handle wallet disconnection and network switches gracefully
- Show transaction status with loading states

## Critical Edge Cases to Handle
- User votes twice (should update vote, not revert)
- Proposal execution before deadline (should revert)
- Creating proposal with <10% balance (should revert)
- Nonce mismatch in meta-transactions (replay attack prevention)
- Insufficient DAO funds to execute approved proposal
- Network changes during transaction signing

## Deployment Notes
- Deploy `MinimalForwarder` first, then pass its address to `DAOVoting` constructor
- Test on Anvil before deploying to testnet
- Fund relayer wallet adequately for gas costs
- Verify contracts on block explorer for transparency
