import { Contract } from 'ethers';
import { useWeb3 } from '@/context/Web3Context';
import { DAO_ADDRESS, DAO_ABI, FORWARDER_ADDRESS, FORWARDER_ABI } from '@/lib/contracts';

export function useContracts() {
  const { signer, provider } = useWeb3();

  const getDAOContract = () => {
    if (!provider) return null;
    return new Contract(DAO_ADDRESS, DAO_ABI, signer || provider);
  };

  const getForwarderContract = () => {
    if (!provider) return null;
    return new Contract(FORWARDER_ADDRESS, FORWARDER_ABI, signer || provider);
  };

  return {
    daoContract: getDAOContract(),
    forwarderContract: getForwarderContract(),
  };
}
