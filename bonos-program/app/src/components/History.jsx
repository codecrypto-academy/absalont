import React, { useState, useEffect } from "react";
import { useBondsProgram } from "../hooks/useBondsProgram.js";
import { RefreshCw, BookOpen } from "lucide-react";

export default function History({ onSelectBond }) {
  const { listings, refresh, shortAddress } = useBondsProgram();
  const [filter, setFilter] = useState("all"); // 'all', 'active', 'mature'

  const getDurationInYears = (ts) => {
    const now = Date.now() / 1000;
    if (ts <= now) return "Vencido";
    const yrs = ((ts - now) / 31536000).toFixed(1);
    return `${yrs} años`;
  };

  const filteredListings = listings.filter((l) => {
    if (filter === "all") return true;
    if (filter === "active") return l.account.isActive;
    if (filter === "mature") return l.account.maturityTimestamp.toNumber() <= (Date.now() / 1000);
    return true;
  });

  return (
    <div className="fade-in" style={{ padding: "40px 0", maxWidth: 1100, margin: "0 auto" }}>
      <div className="hero" style={{ padding: "40px 20px" }}>
        <h1 className="hero-title">Directorio de Bonos</h1>
        <p className="hero-description">Historial completo y métricas de todos los bonos registrados on-chain.</p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, padding: "0 10px" }}>
        <div style={{ display: "flex", gap: 10 }}>
          <button 
            className="tab-anchor" 
            style={filter === "all" ? { background: "rgba(102,126,234,0.1)", color: "var(--accent-blue)" } : {}}
            onClick={() => setFilter("all")}
          >
            Todos ({listings.length})
          </button>
          <button 
            className="tab-anchor" 
            style={filter === "active" ? { background: "rgba(34,197,94,0.1)", color: "var(--accent-green)" } : {}}
            onClick={() => setFilter("active")}
          >
            Activos
          </button>
          <button 
            className="tab-anchor" 
            style={filter === "mature" ? { background: "rgba(245,158,11,0.1)", color: "var(--accent-orange)" } : {}}
            onClick={() => setFilter("mature")}
          >
            Vencidos
          </button>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={refresh} style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {filteredListings.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={40} style={{ opacity: 0.5, marginBottom: 16 }} />
          <div className="empty-title">No hay bonos en este filtro</div>
          <p className="empty-desc">Los bonos aparecerán aquí una vez creados.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
          {filteredListings.map((listing) => {
            const acc = listing.account;
            const maturity = acc.maturityTimestamp.toNumber();
            const now = Math.floor(Date.now() / 1000);
            
            // "Bono Cupón Cero" -> Sin pagos periódicos de interés, el rendimiento implícito ya se refleja en descuento
            const yieldPct = acc.pricePerBond.toNumber() > 0 
                ? (((acc.faceValue.toNumber() - acc.pricePerBond.toNumber()) / acc.pricePerBond.toNumber()) * 100).toFixed(2) 
                : "0.00";

            return (
              <div key={listing.publicKey.toString()} className="card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
                      {acc.tokenName} ({acc.tokenSymbol})
                    </h3>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 4 }}>
                      ZERO COUPON BOND
                    </div>
                  </div>
                  <span className={`badge ${acc.isActive ? "badge-active" : "badge-inactive"}`}>
                    {acc.isActive ? "Bond Activo" : "Inactivo"}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Mint:</span>
                    <span style={{ fontFamily: "monospace", color: "var(--text-primary)" }}>{shortAddress(acc.bondMint)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Emisor:</span>
                    <span style={{ fontFamily: "monospace", color: "var(--accent-blue)" }}>{shortAddress(acc.issuer)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Supply (Total):</span>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{acc.totalBonds.toNumber().toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Valor Nominal:</span>
                    <span style={{ fontWeight: 600, color: "var(--accent-green)" }}>{acc.faceValue.toNumber().toLocaleString()} nominal</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Retorno Implícito:</span>
                    <span style={{ fontWeight: 600, color: "var(--accent-orange)" }}>+{yieldPct}% al venc.</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Duración Restante:</span>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{getDurationInYears(maturity)}</span>
                  </div>
                </div>

                <div style={{ marginTop: 20 }}>
                  <button 
                    className="btn btn-ghost btn-full" 
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}
                    onClick={() => onSelectBond(listing)}
                  >
                    Ver Detalles Financieros
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
