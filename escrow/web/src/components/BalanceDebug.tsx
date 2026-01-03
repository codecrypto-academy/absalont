'use client';

import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/context/WalletContext';
import { ESCROW_ADDRESS, TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, ERC20_ABI } from '@/lib/constants';
import { ErrorAlert } from '@/components/ErrorAlert';
import { formatErrorDisplay, logError, isValidAddress } from '@/lib/errorUtils';
import {
  BarChart3,
  Wallet,
  Database,
  ChevronRight,
  ExternalLink,
  RefreshCcw,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AccountBalance {
  address: string;
  label: string;
  ethBalance: string;
  tokenBalances: {
    tokenA: string;
    tokenB: string;
  };
}

interface EscrowBalance {
  ethBalance: string;
  tokenBalances: {
    tokenA: string;
    tokenB: string;
  };
}

const ANVIL_ACCOUNTS = [
  { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', label: 'Account #0' },
  { address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', label: 'Account #1' },
  { address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', label: 'Account #2' },
];

export function BalanceDebug() {
  const { provider, account } = useWallet();
  const [escrowBalance, setEscrowBalance] = useState<EscrowBalance | null>(null);
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([]);
  const [currentAccountBalance, setCurrentAccountBalance] = useState<AccountBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMinting, setIsMinting] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const getTokenBalance = async (tokenAddress: string, accountAddress: string): Promise<string> => {
    try {
      if (!provider || !isValidAddress(tokenAddress) || !isValidAddress(accountAddress)) return '0';
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const balance = await tokenContract.balanceOf(accountAddress).catch(() => BigInt(0));
      return ethers.formatEther(balance);
    } catch { return '0'; }
  };

  const loadBalances = async () => {
    if (!provider) return;
    setLoading(true);
    try {
      const escrowEth = ethers.formatEther(await provider.getBalance(ESCROW_ADDRESS).catch(() => BigInt(0)));
      const escrowTokenA = await getTokenBalance(TOKEN_A_ADDRESS, ESCROW_ADDRESS);
      const escrowTokenB = await getTokenBalance(TOKEN_B_ADDRESS, ESCROW_ADDRESS);

      setEscrowBalance({ ethBalance: escrowEth, tokenBalances: { tokenA: escrowTokenA, tokenB: escrowTokenB } });

      const balances = await Promise.all(ANVIL_ACCOUNTS.map(async (acc) => {
        const eth = ethers.formatEther(await provider.getBalance(acc.address).catch(() => BigInt(0)));
        const tA = await getTokenBalance(TOKEN_A_ADDRESS, acc.address);
        const tB = await getTokenBalance(TOKEN_B_ADDRESS, acc.address);
        return { address: acc.address, label: acc.label, ethBalance: eth, tokenBalances: { tokenA: tA, tokenB: tB } };
      }));
      setAccountBalances(balances);

      if (account) {
        const eth = ethers.formatEther(await provider.getBalance(account).catch(() => BigInt(0)));
        const tA = await getTokenBalance(TOKEN_A_ADDRESS, account);
        const tB = await getTokenBalance(TOKEN_B_ADDRESS, account);
        setCurrentAccountBalance({ address: account, label: 'Tu Billetera', ethBalance: eth, tokenBalances: { tokenA: tA, tokenB: tB } });
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { loadBalances(); }, [provider]);

  const mintTokens = async (tokenAddress: string, accountAddress: string) => {
    if (!provider) return;
    try {
      setIsMinting(`${tokenAddress}-${accountAddress}`);
      const signer = await provider.getSigner();
      const normalizedToken = ethers.getAddress(tokenAddress);
      const normalizedAccount = ethers.getAddress(accountAddress);

      const tokenContract = new ethers.Contract(normalizedToken, ERC20_ABI, signer);
      const amount = ethers.parseEther('50');
      const tx = await tokenContract.mint(normalizedAccount, amount);
      await tx.wait();
      await loadBalances();
    } catch (err) {
      logError('BalanceDebug: mintTokens', err);
    } finally {
      setIsMinting(null);
    }
  };

  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="flex flex-col h-full bg-[#0d1117]/50 backdrop-blur-sm">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-lg">Balance Explorer</h2>
        </div>
        <button onClick={loadBalances} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-500 hover:text-white">
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
        {/* Escrow Contract Highlights */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Contrato Principal</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Active</span>
            </div>
          </div>
          <div className="bg-indigo-600/5 border border-indigo-500/20 rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 bg-indigo-500/5 blur-[40px] pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-gray-400 font-medium">Fondo de Garantía</span>
                <span className="text-[10px] font-mono text-indigo-400 font-bold tracking-tighter">{truncateAddress(ESCROW_ADDRESS)}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Token A</div>
                  <div className="text-xl font-bold text-white">{parseFloat(escrowBalance?.tokenBalances.tokenA || '0').toFixed(2)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Token B</div>
                  <div className="text-xl font-bold text-white">{parseFloat(escrowBalance?.tokenBalances.tokenB || '0').toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Current Wallet Section */}
        {account && !ANVIL_ACCOUNTS.find(a => a.address.toLowerCase() === account.toLowerCase()) && currentAccountBalance && (
          <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/20 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-tighter">Tu Billetera</span>
              </div>
              <span className="text-[10px] font-mono text-gray-500">{truncateAddress(account)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-black/40 p-2 rounded-xl border border-white/5 text-center">
                <div className="text-[8px] text-gray-500 uppercase font-black mb-1">TKNA</div>
                <div className="text-xs font-black text-white">{parseFloat(currentAccountBalance.tokenBalances.tokenA).toFixed(1)}</div>
              </div>
              <div className="bg-black/40 p-2 rounded-xl border border-white/5 text-center">
                <div className="text-[8px] text-gray-500 uppercase font-black mb-1">TKNB</div>
                <div className="text-xs font-black text-white">{parseFloat(currentAccountBalance.tokenBalances.tokenB).toFixed(1)}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => mintTokens(TOKEN_A_ADDRESS, account)}
                disabled={isMinting === `${TOKEN_A_ADDRESS}-${account}`}
                className="flex-1 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 text-[10px] font-black rounded-lg border border-indigo-500/20 transition-all uppercase tracking-widest disabled:opacity-50"
              >
                {isMinting === `${TOKEN_A_ADDRESS}-${account}` ? '...' : '+50 TKNA'}
              </button>
              <button
                onClick={() => mintTokens(TOKEN_B_ADDRESS, account)}
                disabled={isMinting === `${TOKEN_B_ADDRESS}-${account}`}
                className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-[10px] font-black rounded-lg border border-emerald-500/20 transition-all uppercase tracking-widest disabled:opacity-50"
              >
                {isMinting === `${TOKEN_B_ADDRESS}-${account}` ? '...' : '+50 TKNB'}
              </button>
            </div>
          </div>
        )}

        {/* Preset Accounts List */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Database className="w-4 h-4 text-gray-500" />
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Cuentas Preset (Anvil)</span>
          </div>
          <div className="space-y-3">
            {accountBalances.map((acc, i) => (
              <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-600 group-hover:bg-indigo-400 transition-colors" />
                    <span className="text-[11px] font-bold text-white tracking-tight">{acc.label}</span>
                  </div>
                  <span className="text-[9px] font-mono text-gray-500">{truncateAddress(acc.address)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { val: acc.ethBalance, sub: 'ETH', color: 'text-gray-400' },
                    { val: acc.tokenBalances.tokenA, sub: 'TKNA', color: 'text-indigo-400', addr: TOKEN_A_ADDRESS },
                    { val: acc.tokenBalances.tokenB, sub: 'TKNB', color: 'text-emerald-400', addr: TOKEN_B_ADDRESS }
                  ].map((stat, j) => (
                    <div key={j} className="bg-black/20 rounded-xl px-2 py-2 text-center border border-white/5">
                      <div className={`text-[11px] font-bold ${stat.color} mb-0.5`}>{parseFloat(stat.val).toFixed(1)}</div>
                      <div className="text-[7px] font-black tracking-widest text-gray-600 uppercase">{stat.sub}</div>
                    </div>
                  ))}
                </div>
                {/* Mint Buttons (Faucet) */}
                <div className="flex gap-2">
                  <button
                    onClick={() => mintTokens(TOKEN_A_ADDRESS, acc.address)}
                    className="flex-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[8px] font-black uppercase py-1.5 rounded-lg border border-indigo-500/20 transition-all"
                  >
                    +50 TKNA
                  </button>
                  <button
                    onClick={() => mintTokens(TOKEN_B_ADDRESS, acc.address)}
                    className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase py-1.5 rounded-lg border border-emerald-500/20 transition-all"
                  >
                    +50 TKNB
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10 flex items-start gap-3">
          <Zap className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-[9px] leading-relaxed text-gray-500 font-medium">
              Utiliza los botones superiores para recibir tokens de prueba (Faucet) en cualquier cuenta de Anvil.
            </p>
            <p className="text-[9px] leading-relaxed text-gray-400 italic">
              * El swap fallará si el destinatario no tiene suficiente balance de Token B.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
