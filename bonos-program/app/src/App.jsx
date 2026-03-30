import React, { useMemo, useState } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { Toaster } from "react-hot-toast";
import "@solana/wallet-adapter-react-ui/styles.css";
import { Landmark } from "lucide-react";
import Dashboard from "./components/Dashboard.jsx";
import Faucet from "./components/Faucet.jsx";
import History from "./components/History.jsx";
import BondDetails from "./components/BondDetails.jsx";
import UserHistory from "./components/UserHistory.jsx";

export default function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedListing, setSelectedListing] = useState(null);

  const shortAddress = (pk) => `${pk.toString().slice(0, 4)}…${pk.toString().slice(-4)}`;
  const network = "localnet";
  const endpoint = "http://127.0.0.1:8899";
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#0d1428",
                color: "#f0f4ff",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                fontSize: "0.875rem",
                fontFamily: "'Inter', sans-serif",
              },
              success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
              error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
            }}
          />
          <div className="app-container">
            {/* Header */}
            <header className="header">
              <div className="header-brand">
                <div className="header-logo"><Landmark size={28} /></div>
                <div>
                  <div className="header-title">Bonos DApp</div>
                  <div className="header-subtitle">F7C9…oMv8 · Localnet</div>
                </div>
              </div>
              <nav className="header-nav">
                <div className="network-badge">
                  <div className="header-nav-tabs" style={{ display: "flex", gap: 16, marginRight: "auto", marginLeft: 40 }}>
                    <button 
                      className={`tab-anchor ${activeView === "dashboard" ? "active" : ""}`}
                      onClick={() => { setActiveView("dashboard"); setSelectedListing(null); }}
                    >
                      Dashboard
                    </button>
                    <button 
                      className={`tab-anchor ${activeView === "faucet" ? "active" : ""}`}
                      onClick={() => { setActiveView("faucet"); setSelectedListing(null); }}
                    >
                      Faucet
                    </button>
                    <button 
                      className={`tab-anchor ${activeView === "history" ? "active" : ""}`}
                      onClick={() => { setActiveView("history"); setSelectedListing(null); }}
                    >
                      Mercado / Directorio
                    </button>
                    <button 
                      className={`tab-anchor ${activeView === "userhistory" ? "active" : ""}`}
                      onClick={() => { setActiveView("userhistory"); setSelectedListing(null); }}
                    >
                      Mi Historial
                    </button>
                  </div>
                  <span className="network-dot" />
                  Localnet
                </div>
                <WalletMultiButton />
              </nav>
            </header>

            {/* Main */}
            <main>
              {activeView === "dashboard" && <Dashboard />}
              {activeView === "faucet" && <Faucet />}
              {activeView === "history" && !selectedListing && (
                <History onSelectBond={setSelectedListing} />
              )}
              {activeView === "history" && selectedListing && (
                <BondDetails 
                  listing={selectedListing} 
                  onBack={() => setSelectedListing(null)} 
                  shortAddress={shortAddress} 
                />
              )}
              {activeView === "userhistory" && <UserHistory />}
            </main>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
