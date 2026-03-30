import React, { useState, useEffect } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { ArrowLeft, Users } from "lucide-react";

export default function BondDetails({ listing, onBack, shortAddress }) {
  const { connection } = useConnection();
  const [bondholders, setBondholders] = useState([]);
  const [loading, setLoading] = useState(true);

  const acc = listing.account;
  const mintStr = acc.bondMint.toString();

  useEffect(() => {
    async function fetchHolders() {
      try {
        setLoading(true);
        // Filtramos todas las cuentas de token asociadas a este bondMint
        const accounts = await connection.getParsedProgramAccounts(
          TOKEN_PROGRAM_ID,
          {
            filters: [
              { dataSize: 165 }, // Tamaño fijo de un Token Account
              { memcmp: { offset: 0, bytes: mintStr } }, // El Mint está en el offset 0
            ],
          }
        );

        const holders = accounts
          .map((a) => {
            const info = a.account.data.parsed.info;
            return {
              wallet: info.owner,
              amount: info.tokenAmount.uiAmount,
            };
          })
          .filter((h) => h.amount > 0)
          .sort((a, b) => b.amount - a.amount); // Mayor a menor

        setBondholders(holders);
      } catch (err) {
        console.error("Error fetching holders:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHolders();
  }, [connection, mintStr]);

  const formatDate = (ts) => {
    return new Date(ts * 1000).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getDurationString = (ts) => {
    const now = Date.now() / 1000;
    if (ts <= now) return "Vencido";
    const yrs = ((ts - now) / 31536000).toFixed(1);
    return `${yrs} años`;
  };

  return (
    <div className="fade-in" style={{ padding: "40px 0", maxWidth: 900, margin: "0 auto" }}>
      <button 
        onClick={onBack} 
        className="btn btn-ghost" 
        style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 30, paddingLeft: 0, color: "var(--text-secondary)" }}
      >
        <ArrowLeft size={18} /> Volver al Historial
      </button>

      {/* Cabecera del Bono */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 30, marginBottom: 30 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
          <div>
            <h1 style={{ fontSize: "1.8rem", margin: "0 0 4px 0", color: "var(--text-primary)" }}>
              {acc.tokenName} ({acc.tokenSymbol})
            </h1>
            <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>
              ZERO-COUPON BOND
            </div>
          </div>
          <span className={`badge ${acc.isActive ? "badge-active" : "badge-inactive"}`} style={{ fontSize: "0.85rem", padding: "6px 12px" }}>
            {acc.isActive ? "Emisión Activa" : "Inactivo"}
          </span>
        </div>

        {/* Info del Emisor y Mint */}
        <div style={{ background: "rgba(102,126,234,0.05)", border: "1px solid rgba(102,126,234,0.15)", borderRadius: "var(--radius-md)", padding: 20, marginBottom: 30 }}>
          <div style={{ marginBottom: 15 }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Token Issuer</div>
            <div style={{ fontFamily: "monospace", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "var(--accent-blue)" }}>{acc.issuer.toString()}</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 20 }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Mint Address</div>
              <div style={{ fontFamily: "monospace", fontSize: "0.9rem", color: "var(--text-secondary)" }}>{shortAddress(acc.bondMint)}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Max Supply</div>
              <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{acc.totalBonds.toNumber().toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Decimals</div>
              <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>0</div>
            </div>
          </div>
        </div>

        {/* Bond Details Grid */}
        <div style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: "var(--radius-md)", padding: 20 }}>
          <h3 style={{ margin: "0 0 20px 0", fontSize: "1rem", color: "var(--text-primary)" }}>Detalles Financieros del Bono</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 40px" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Valor Nominal al Vencimiento</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--accent-green)" }}>{acc.faceValue.toNumber().toLocaleString()} USD</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Tasa de Interés (Cupón)</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>0% / anual</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Duración Restante</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>{getDurationString(acc.maturityTimestamp.toNumber())}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Pago de Cupón Anual</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>0.00 (Zero-Coupon)</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Fecha de Vencimiento</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--accent-orange)" }}>{formatDate(acc.maturityTimestamp.toNumber())}</div>
            </div>
             <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Fondo de Redención (Escrow)</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--accent-blue)" }}>{acc.totalRedemptionFunded.toNumber().toLocaleString()} USD</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bondholders List */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ padding: "20px 30px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, display: "flex", gap: 10, alignItems: "center", fontSize: "1.1rem" }}>
            <Users size={20} className="inline-icon" /> Tenedores del Bono (Bondholders) 
            <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: "normal" }}>({bondholders.length})</span>
          </h3>
        </div>
        
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Cargando datos on-chain...</div>
        ) : bondholders.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
            Aún no hay compradores ni tenedores registrados para este bono.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.2)", fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "1px" }}>
                <th style={{ padding: "16px 30px", fontWeight: 600 }}>Wallet</th>
                <th style={{ padding: "16px 30px", fontWeight: 600 }}>Cantidad Depositada (Bonds)</th>
                <th style={{ padding: "16px 30px", fontWeight: 600 }}>Cupón</th>
              </tr>
            </thead>
            <tbody>
              {bondholders.map((h, i) => (
                <tr key={h.wallet} style={{ borderBottom: i === bondholders.length - 1 ? "none" : "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "16px 30px", fontFamily: "monospace", color: "var(--accent-blue)" }}>
                    {h.wallet === acc.issuer.toString() ? (
                      <span>{h.wallet} <span className="badge badge-active" style={{marginLeft: 8, fontSize:"0.6rem"}}>Emisor</span></span>
                    ) : (
                      h.wallet
                    )}
                  </td>
                  <td style={{ padding: "16px 30px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {h.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: "16px 30px", color: "var(--text-muted)" }}>
                    -
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
