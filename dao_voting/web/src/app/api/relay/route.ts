import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { FORWARDER_ABI, FORWARDER_ADDRESS } from '@/lib/contracts';

export async function POST(request: NextRequest) {
  try {
    const { request: forwardRequest, signature } = await request.json();

    // Validate request
    if (!forwardRequest || !signature) {
      return NextResponse.json(
        { error: 'Missing request or signature' },
        { status: 400 }
      );
    }

    // Get relayer private key from env
    const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
    const rpcUrl = process.env.RPC_URL;

    if (!relayerPrivateKey || !rpcUrl) {
      console.error('Missing RELAYER_PRIVATE_KEY or RPC_URL environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Connect to provider
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const relayerWallet = new ethers.Wallet(relayerPrivateKey, provider);

    // Create forwarder contract instance
    const forwarder = new ethers.Contract(
      FORWARDER_ADDRESS,
      FORWARDER_ABI,
      relayerWallet
    );

    // Convert request to proper format
    const req = {
      from: forwardRequest.from,
      to: forwardRequest.to,
      value: BigInt(forwardRequest.value),
      gas: BigInt(forwardRequest.gas),
      nonce: BigInt(forwardRequest.nonce),
      data: forwardRequest.data,
    };

    console.log('Executing meta-transaction for:', req.from);
    console.log('Target contract:', req.to);
    console.log('Nonce:', req.nonce.toString());

    // Execute the meta-transaction
    const tx = await forwarder.execute(req, signature, {
      gasLimit: 500000,
    });

    console.log('Transaction sent:', tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();

    console.log('Transaction confirmed:', receipt.hash);

    return NextResponse.json({
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error: any) {
    console.error('Error in relay:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute meta-transaction' },
      { status: 500 }
    );
  }
}
