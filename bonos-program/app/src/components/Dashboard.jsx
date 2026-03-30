import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import toast from "react-hot-toast";
import { useBondsProgram } from "../hooks/useBondsProgram.js";
import BondCard from "./BondCard.jsx";
import IssuerPanel from "./IssuerPanel.jsx";
import BuyerPanel from "./BuyerPanel.jsx";
import { Landmark, Zap, RefreshCw, ClipboardList, Briefcase } from "lucide-react";

export default function Dashboard() {
  const { publicKey, connected } = useWallet();
  const { listings, loading, refresh, shortAddress } = useBondsProgram();
  const [activeTab, setActiveTab] = useState("overview");
  const [totalBonds, setTotalBonds] = useState(0);
  const [activeListings, setActiveListings] = useState(0);
  const [matureListings, setMatureListings] = useState(0);

  useEffect(() => {
    const now = Math.floor(Date.now() / 1000);
    let bonds = 0;
    let active = 0;
    let mature = 0;
    listings.forEach((l) => {
      bonds += Number(l.account.availableBonds);
      if (l.account.isActive) active++;
      if (l.account.maturityTimestamp.toNumber() <= now) mature++;
    });
    setTotalBonds(bonds);
    setActiveListings(active);
    setMatureListings(mature);
  }, [listings]);

  if (!connected) {
    return (
      <div className="connect-prompt fade-in">
        <span className="connect-icon"><Landmark size={48} /></span>
        <h1 className="connect-title">Bonos DApp</h1>
        <p className="connect-desc">
          Plataforma descentralizada para emitir, comprar y canjear bonos financieros on-chain sobre Solana.
        </p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Hero */}
      <div className="hero">
        <div className="hero-tag" style={{ display: "flex", alignItems: "center", gap: 6 }}><Zap size={14} /> Solana · Localnet</div>
        <h1 className="hero-title">
          Gestión <span>On-Chain</span> de Bonos
        </h1>
        <p className="hero-description">
          Emite, compra y canjea bonos financieros con liquidación atómica y custodia en PDAs de Solana.
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 40 }}>
        <div className="stat-card blue">
          <div className="stat-label">Listings Totales</div>
          <div className="stat-value blue">{listings.length}</div>
          <div className="stat-sub">registros on-chain</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Listings Activos</div>
          <div className="stat-value green">{activeListings}</div>
          <div className="stat-sub">disponibles para compra</div>
        </div>
        <div className="stat-card gold">
          <div className="stat-label">Bonos Disponibles</div>
          <div className="stat-value gold">{totalBonds.toLocaleString()}</div>
          <div className="stat-sub">unidades en escrow</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">Listos para Canjear</div>
          <div className="stat-value purple">{matureListings}</div>
          <div className="stat-sub">vencimiento alcanzado</div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="main-grid">
        {/* Actions panel */}
        <aside className="actions-panel">
          <div className="tabs-container">
            <button
              className={`tab-btn ${activeTab === "issuer" ? "active" : ""}`}
              onClick={() => setActiveTab("issuer")}
              id="tab-issuer"
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <Landmark size={16} /> Emisor
            </button>
            <button
              className={`tab-btn ${activeTab === "buyer" ? "active" : ""}`}
              onClick={() => setActiveTab("buyer")}
              id="tab-buyer"
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <Briefcase size={16} /> Comprador
            </button>
          </div>

          {activeTab === "issuer" && <IssuerPanel />}
          {activeTab === "buyer" && <BuyerPanel listings={listings} />}
        </aside>

        {/* Listings */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">
              Listings
              <span>{listings.length} registros</span>
            </h2>
            <button
              className="btn btn-ghost btn-sm"
              onClick={refresh}
              id="btn-refresh"
              title="Actualizar listado"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <RefreshCw size={14} /> Actualizar
            </button>
          </div>

          {listings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><ClipboardList size={40} /></div>
              <div className="empty-title">No hay listings aún</div>
              <p className="empty-desc">
                Usa el panel de <strong>Emisor</strong> para crear el primer listing de bonos.
              </p>
            </div>
          ) : (
            <div className="listings-grid">
              {listings.map((listing) => (
                <BondCard
                  key={listing.publicKey.toString()}
                  listing={listing}
                  shortAddress={shortAddress}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
