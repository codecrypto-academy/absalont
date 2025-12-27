import { NextRequest, NextResponse } from 'next/server'
import { Contract, JsonRpcProvider, Wallet, parseUnits } from 'ethers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

const ERC20_ABI = [
  'function mint(address to, uint256 amount) external',
  'function decimals() public view returns (uint8)',
  'function balanceOf(address account) external view returns (uint256)',
]

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId, walletAddress, amount } = await request.json()

    // Verificar que el pago fue exitoso
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not successful' },
        { status: 400 }
      )
    }

    // Conectar a blockchain
    const provider = new JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545')
    const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY!, provider)

    // Conectar al contrato EuroToken
    const tokenAddress = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS
    if (!tokenAddress) {
      throw new Error('Token contract address not configured')
    }

    const tokenContract = new Contract(tokenAddress, ERC20_ABI, wallet)

    // Mint tokens (6 decimales para EURT)
    const tokenAmount = parseUnits(amount.toString(), 6)
    const tx = await tokenContract.mint(walletAddress, tokenAmount)
    const receipt = await tx.wait()

    console.log('Tokens minted:', {
      to: walletAddress,
      amount: tokenAmount.toString(),
      txHash: receipt.hash,
    })

    return NextResponse.json({
      success: true,
      transactionHash: receipt.hash,
      amount: amount,
    })
  } catch (error: any) {
    console.error('Error minting tokens:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
