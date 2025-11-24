import { ethers, JsonRpcProvider, Wallet, Contract, Signer } from 'ethers';

// ABI del contrato DocumentRegistry
export const DOCUMENT_REGISTRY_ABI = [
  "function storeDocumentHash(bytes32 hash, uint256 timestamp, bytes signature, address signer) external",
  "function verifyDocument(bytes32 hash, address signer, bytes signature) external view returns (bool)",
  "function verifyDocumentWithEvent(bytes32 hash, address signer, bytes signature) external returns (bool)",
  "function getDocumentInfo(bytes32 hash) external view returns (tuple(bytes32 hash, uint256 timestamp, address signer, bytes signature))",
  "function getUserDocuments(address user) external view returns (bytes32[])",
  "function getDocumentCount() external view returns (uint256)",
  "function isDocumentStored(bytes32 hash) external view returns (bool)",
  "function getDocumentHashByIndex(uint256 index) external view returns (bytes32)",
  "event DocumentStored(bytes32 indexed hash, address indexed signer, uint256 timestamp, bytes signature)",
  "event DocumentVerified(bytes32 indexed hash, address indexed signer, bool isValid)"
];

// Wallets de prueba de Anvil (10 cuentas predefinidas)
export const ANVIL_ACCOUNTS = [
  { address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" },
  { address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d" },
  { address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", privateKey: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a" },
  { address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", privateKey: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6" },
  { address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", privateKey: "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a" },
  { address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc", privateKey: "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba" },
  { address: "0x976EA74026E726554dB657fA54763abd0C3a0aa9", privateKey: "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e" },
  { address: "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955", privateKey: "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356" },
  { address: "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f", privateKey: "0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97" },
  { address: "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720", privateKey: "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6" }
];

// Configuración del provider
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545';
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

export class EthersUtils {
  private provider: JsonRpcProvider;
  private contract: Contract | null = null;

  constructor() {
    this.provider = new JsonRpcProvider(RPC_URL);
  }

  // Obtener el provider
  getProvider(): JsonRpcProvider {
    return this.provider;
  }

  // Crear wallet desde clave privada
  createWallet(privateKey: string): Wallet {
    return new Wallet(privateKey, this.provider);
  }

  // Obtener contrato con signer
  getContract(signer: Signer): Contract {
    if (!CONTRACT_ADDRESS) {
      throw new Error('Contract address not configured');
    }
    return new Contract(CONTRACT_ADDRESS, DOCUMENT_REGISTRY_ABI, signer);
  }

  // Obtener contrato de solo lectura
  getReadOnlyContract(): Contract {
    if (!CONTRACT_ADDRESS) {
      throw new Error('Contract address not configured');
    }
    return new Contract(CONTRACT_ADDRESS, DOCUMENT_REGISTRY_ABI, this.provider);
  }

  // Obtener balance de una cuenta
  async getBalance(address: string): Promise<string> {
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  // Firmar mensaje (hash + timestamp)
  async signMessage(wallet: Wallet, hash: string, timestamp: number): Promise<string> {
    // Crear el hash del mensaje igual que en el contrato
    const messageHash = ethers.solidityPackedKeccak256(
      ['bytes32', 'uint256'],
      [hash, timestamp]
    );
    
    // Firmar el mensaje (ethers.js añade automáticamente el prefijo de Ethereum)
    const signature = await wallet.signMessage(ethers.getBytes(messageHash));
    return signature;
  }

  // Almacenar documento en el contrato
  async storeDocument(
    wallet: Wallet,
    documentHash: string,
    timestamp: number,
    signature: string
  ): Promise<ethers.ContractTransactionReceipt | null> {
    const contract = this.getContract(wallet);
    const tx = await contract.storeDocumentHash(documentHash, timestamp, signature, wallet.address);
    return await tx.wait();
  }

  // Verificar documento
  async verifyDocument(
    documentHash: string,
    signer: string,
    signature: string
  ): Promise<boolean> {
    try {
      const contract = this.getReadOnlyContract();
      console.log('Verifying document:', {
        hash: documentHash.substring(0, 10) + '...',
        signer: signer.substring(0, 10) + '...',
        signatureLength: signature.length
      });
      
      // Llamada directa (no staticCall) ya que la función es view
      const result = await contract.verifyDocument(documentHash, signer, signature);
      console.log('Verification result:', result);
      
      // Asegurarse de que devuelve un booleano
      return Boolean(result);
    } catch (error: any) {
      console.error('Error verifying document:', error.message || error);
      return false;
    }
  }

  // Obtener información del documento
  async getDocumentInfo(documentHash: string): Promise<{
    timestamp: bigint;
    signer: string;
    signature: string;
    exists: boolean;
  }> {
    try {
      const contract = this.getReadOnlyContract();
      const result = await contract.getDocumentInfo(documentHash);
      
      // Verificar si el documento existe (el signer no debe ser la dirección cero)
      const exists = result[2] !== ethers.ZeroAddress;
      
      return { 
        timestamp: result[1], 
        signer: result[2], 
        signature: result[3],
        exists: exists
      };
    } catch (error: any) {
      // Si el contrato revierte con "Document does not exist" o cualquier otro error,
      // retornar un objeto indicando que no existe
      console.log('Document does not exist or error occurred:', error.message);
      return {
        timestamp: BigInt(0),
        signer: ethers.ZeroAddress,
        signature: '0x',
        exists: false
      };
    }
  }

  // Obtener documentos de un usuario
  async getUserDocuments(userAddress: string): Promise<string[]> {
    const contract = this.getReadOnlyContract();
    return await contract.getUserDocuments(userAddress);
  }

  // Obtener total de documentos
  async getTotalDocuments(): Promise<bigint> {
    const contract = this.getReadOnlyContract();
    return await contract.getDocumentCount();
  }

  // Verificar si el documento existe
  async documentExists(documentHash: string): Promise<boolean> {
    try {
      const contract = this.getReadOnlyContract();
      return await contract.isDocumentStored(documentHash);
    } catch (error) {
      console.error('Error checking if document exists:', error);
      return false;
    }
  }

  // Formatear dirección
  static formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Formatear timestamp
  static formatTimestamp(timestamp: bigint | number): string {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  }
}

// Exportar instancia singleton
export const ethersUtils = new EthersUtils();