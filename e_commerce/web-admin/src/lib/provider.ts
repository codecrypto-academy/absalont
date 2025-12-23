import { BrowserProvider, JsonRpcProvider, Provider } from 'ethers'

/**
 * Obtiene un provider válido para leer datos del blockchain
 * Intenta usar window.ethereum si está en la red correcta (Anvil), 
 * de lo contrario cae a JsonRpcProvider para asegurar lectura de datos.
 */
export async function getReadProvider(): Promise<Provider> {
    const ANVIL_CHAIN_ID = '0x7a69' // 31337

    // 1. Intentar con BrowserProvider si está en la red correcta
    if (typeof window !== 'undefined' && window.ethereum) {
        try {
            const chainId = await (window.ethereum as any).request({ method: 'eth_chainId' })

            if (chainId === ANVIL_CHAIN_ID) {
                const provider = new BrowserProvider(window.ethereum as any)
                return provider
            } else {
                console.warn('Wallet on wrong network, using JsonRpcProvider for read-only data')
            }
        } catch (error) {
            console.warn('Error checking wallet network:', error)
        }
    }

    // 2. Fallback a JsonRpcProvider (Localhost hardcoded o ENV)
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545'
    return new JsonRpcProvider(rpcUrl)
}
