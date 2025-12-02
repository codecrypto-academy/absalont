import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { DAO_ABI, DAO_ADDRESS } from '@/lib/contracts';

export async function POST(request: NextRequest) {
  try {
    const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
    const rpcUrl = process.env.RPC_URL;

    if (!relayerPrivateKey || !rpcUrl) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const relayerWallet = new ethers.Wallet(relayerPrivateKey, provider);
    const dao = new ethers.Contract(DAO_ADDRESS, DAO_ABI, relayerWallet);

    console.log('Checking for executable proposals...');

    // Get total number of proposals
    const proposalCount = await dao.getProposalCount();
    const now = Math.floor(Date.now() / 1000);
    const executedProposals = [];

    // Check each proposal
    for (let i = 1; i <= Number(proposalCount); i++) {
      try {
        const proposal = await dao.getProposal(i);
        
        // Check if proposal can be executed
        const deadline = Number(proposal.deadline);
        const safetyPeriod = 3600; // 1 hour
        const isExecutable = 
          !proposal.executed &&
          now >= deadline + safetyPeriod &&
          proposal.votesAFavor > proposal.votesEnContra;

        if (isExecutable) {
          console.log(`Executing proposal ${i}...`);
          const tx = await dao.executeProposal(i, { gasLimit: 300000 });
          const receipt = await tx.wait();
          
          executedProposals.push({
            proposalId: i,
            txHash: receipt.hash,
          });
          
          console.log(`Proposal ${i} executed: ${receipt.hash}`);
        }
      } catch (error: any) {
        console.error(`Error processing proposal ${i}:`, error.message);
      }
    }

    return NextResponse.json({
      success: true,
      executedCount: executedProposals.length,
      proposals: executedProposals,
    });
  } catch (error: any) {
    console.error('Error in daemon:', error);
    return NextResponse.json(
      { error: error.message || 'Daemon execution failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST(new NextRequest('http://localhost/api/daemon'));
}
