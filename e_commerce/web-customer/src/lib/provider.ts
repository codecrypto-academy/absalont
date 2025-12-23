import { BrowserProvider, JsonRpcProvider, Provider } from 'ethers'

/**
 * Obtiene un provider válido para leer datos del blockchain
 * Intenta usar window.ethereum primero, luego cae a JsonRpcProvider
 */
export async function getReadProvider(): Promise<Provider> {
    // Primero intentar con BrowserProvider si está disponible
    if (typeof window !== 'undefined' && window.ethereum) {
        try {
            const provider = new BrowserProvider(window.ethereum as any)
            // Verificar que funciona
            await provider.getNetwork()
            return provider
        } catch (error) {
            console.warn('BrowserProvider failed, falling back to JsonRpcProvider:', error)
        }
    }

    // Fallback a JsonRpcProvider
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545'
    return new JsonRpcProvider(rpcUrl)
}
