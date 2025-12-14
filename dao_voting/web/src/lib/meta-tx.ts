import { ethers } from 'ethers';
import { ForwardRequest } from './contracts';

const FORWARD_REQUEST_TYPE = [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'gas', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'data', type: 'bytes' },
];

export async function signMetaTxRequest(
    signer: ethers.Signer,
    forwarder: ethers.Contract,
    input: Omit<ForwardRequest, 'nonce'>
): Promise<{ request: ForwardRequest; signature: string }> {
    const from = await signer.getAddress();

    // Always get fresh nonce to avoid race conditions
    console.log('🔢 About to get nonce for meta-transaction:');
    console.log('  Address:', from);

    const nonce = await forwarder.getNonce(from);

    console.log('🔢 Obtained FRESH nonce for meta-transaction:');
    console.log('  Current nonce:', nonce.toString());

    const request: ForwardRequest = {
        ...input,
        nonce: BigInt(nonce.toString()),
        from,
    };

    console.log('request', request);
    const provider = signer.provider;
    if (!provider) throw new Error('Provider not available');

    const network = await provider.getNetwork();
    const chainId = network.chainId;

    const domain = {
        name: 'MinimalForwarder',
        version: '0.0.1', // Updated to match current contract version
        chainId: chainId.toString(),
        verifyingContract: await forwarder.getAddress(),
    };

    const types = {
        ForwardRequest: FORWARD_REQUEST_TYPE,
    };

    const signature = await signer.signTypedData(domain, types, {
        from: request.from,
        to: request.to,
        value: request.value.toString(),
        gas: request.gas.toString(),
        nonce: request.nonce.toString(),
        data: request.data,
    });

    return { request, signature };
}

export async function buildVoteRequest(
    to: string,
    from: string, // Kept for interface compatibility, mostly unused as signMetaTxRequest fetches address
    proposalId: bigint,
    voteType: number
): Promise<Omit<ForwardRequest, 'nonce' | 'from'>> {
    const iface = new ethers.Interface([
        'function vote(uint256 _proposalId, uint8 _voteType)'
    ]);

    const data = iface.encodeFunctionData('vote', [proposalId, voteType]);

    return {
        to,
        value: BigInt(0),
        gas: BigInt(200000), // Adjusted to match VoteButtons.tsx original estimate
        data,
    };
}

export async function buildCreateProposalRequest(
    to: string,
    from: string, // Kept for interface compatibility
    recipient: string,
    amount: bigint,
    votingDuration: number, // Days usually passed as int, but contract expects full execution
    description: string
): Promise<Omit<ForwardRequest, 'nonce' | 'from'>> {
    // Note: The contracts use `createProposal(address,uint256,uint256,string)`
    // The third argument is `deadline` (timestamp), not `votingDuration`.
    // However, the caller usually calculates the deadline.
    // We will assume the caller passes the CALCULATED DEADLINE as `votingDuration` argument
    // OR we need to verify what the contract expects.
    // Looking at CreateProposal.tsx:
    // const deadline = currentTimestamp + parseInt(days) * ...
    // encodeFunctionData('createProposal', [recipient, amountWei, deadline, description]);

    const iface = new ethers.Interface([
        'function createProposal(address recipient, uint256 amount, uint256 deadline, string description)'
    ]);

    const data = iface.encodeFunctionData('createProposal', [
        recipient,
        amount,
        votingDuration, // This must be the deadline timestamp
        description
    ]);

    return {
        to,
        value: BigInt(0),
        gas: BigInt(1000000),
        data,
    };
}
