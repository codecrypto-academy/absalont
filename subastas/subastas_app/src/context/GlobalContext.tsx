"use client";

import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import {
  ConnectionProvider,
  WalletProvider,
  useAnchorWallet,
} from "@solana/wallet-adapter-react";
import { WalletError } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import idlJson from "../constants/idl.json";
import { SubastasProxy } from "../services/subastasProxy";

import "@solana/wallet-adapter-react-ui/styles.css";

interface GlobalContextState {
  program: Program | null;
  connection: Connection;
  proxy: SubastasProxy | null;
  refreshSession: () => void;
}

const GlobalContext = createContext<GlobalContextState | undefined>(undefined);

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobalContext must be used within GlobalProvider");
  }
  return context;
};

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use localnet for development
  const endpoint = useMemo(() => "http://localhost:8899", []);
  const connection = useMemo(() => new Connection(endpoint, "confirmed"), [endpoint]);

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  const onError = useCallback((error: WalletError) => {
    // Suppress WalletDisconnectedError as it often occurs during account switches
    // and is handled gracefully by the provider state updates.
    if (error.name === "WalletDisconnectedError") {
      console.debug("WalletDisconnectedError suppressed during transition.");
      return;
    }
    console.error("Wallet Error:", error);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect>
        <WalletModalProvider>
          <ContextProvider connection={connection}>{children}</ContextProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

const ContextProvider: React.FC<{ children: React.ReactNode; connection: Connection }> = ({
  children,
  connection,
}) => {
  const wallet = useAnchorWallet();

  const session = useMemo(() => {
    // Initializing provider: use connected wallet if available, otherwise a read-only dummy wallet
    const activeWallet = wallet || {
      publicKey: PublicKey.default,
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any[]) => txs,
    };

    const provider = new AnchorProvider(connection, activeWallet as any, {
      preflightCommitment: "confirmed",
    });
    
    const idl = idlJson as any;
    const program = new Program(idl, provider);
    const proxy = new SubastasProxy(program);
    
    console.debug(`[GlobalContext] Session Sync: ${activeWallet.publicKey.toBase58()}`);
    
    return { program, proxy };
  }, [wallet, connection]);

  const refreshSession = useCallback(() => {
    // In useMemo version, this is just a hint that we might want to re-render, 
    // but useMemo already handles wallet changes perfectly.
    console.log("Session refresh triggered (managed by useMemo)");
  }, []);

  return (
    <GlobalContext.Provider value={{ 
      program: session.program, 
      connection, 
      proxy: session.proxy,
      refreshSession
    }}>
      {children}
    </GlobalContext.Provider>
  );
};
