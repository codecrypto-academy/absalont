import { ethers } from 'ethers';
import { getProvider, getSigner } from './constants';

export async function connectWallet(): Promise<string[]> {
  if (!window.ethereum) {
    throw new Error('MetaMask no está instalado');
  }

  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts',
  });

  return accounts;
}

export async function getConnectedAccount(): Promise<string | null> {
  try {
    const provider = getProvider();
    const signer = await getSigner();
    return await signer.getAddress();
  } catch (error) {
    return null;
  }
}

export async function switchNetwork(chainId: number): Promise<void> {
  if (!window.ethereum) {
    throw new Error('MetaMask no está instalado');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (error) {
    throw new Error('No se pudo cambiar de red');
  }
}

export async function addNetwork(
  chainId: number,
  name: string,
  rpcUrl: string
): Promise<void> {
  if (!window.ethereum) {
    throw new Error('MetaMask no está instalado');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: `0x${chainId.toString(16)}`,
          chainName: name,
          rpcUrls: [rpcUrl],
          nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18,
          },
        },
      ],
    });
  } catch (error) {
    throw new Error('No se pudo añadir la red');
  }
}
