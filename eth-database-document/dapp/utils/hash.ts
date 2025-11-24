import { ethers } from 'ethers';

export class HashUtils {
  /**
   * Calcula el hash SHA-256 de un archivo y lo convierte a bytes32
   * compatible con Solidity
   */
  static async hashFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          
          // Usar SubtleCrypto para SHA-256
          const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
          
          // Convertir a hex string
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          
          resolve(hashHex);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Calcula el hash Keccak256 de un string (compatible con Solidity)
   */
  static keccak256(data: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(data));
  }

  /**
   * Calcula el hash Keccak256 de bytes
   */
  static keccak256Bytes(data: Uint8Array): string {
    return ethers.keccak256(data);
  }

  /**
   * Verifica si un string es un hash válido de 32 bytes
   */
  static isValidBytes32(hash: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
  }

  /**
   * Formatea un hash para mostrar (truncado)
   */
  static formatHash(hash: string, chars: number = 8): string {
    if (!hash || hash.length < chars * 2 + 2) return hash;
    return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
  }

  /**
   * Compara dos hashes (case-insensitive)
   */
  static compareHashes(hash1: string, hash2: string): boolean {
    return hash1.toLowerCase() === hash2.toLowerCase();
  }
}

export default HashUtils;
