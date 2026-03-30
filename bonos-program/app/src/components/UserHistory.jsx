import React, { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Clock, Wallet, History as HistoryIcon } from "lucide-react";
import { useBondsProgram } from "../hooks/useBondsProgram.js";

export default function UserHistory() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState("compras"); // 'compras', 'canjes', 'balances'

  const [txHistory, setTxHistory] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(false);
  const { listings } = useBondsProgram();

  useEffect(() => {
    if (!publicKey) return;

    async function fetchData() {
      setLoading(true);
      try {
        // 1. Fetch Balances
        const pAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { programId: TOKEN_PROGRAM_ID }
        );
        const b = pAccounts.value
          .map((a) => {
            const info = a.account.data.parsed.info;
            return {
              mint: info.mint,
              amount: info.tokenAmount.uiAmount,
              decimals: info.tokenAmount.decimals,
            };
          })
          .filter((t) => t.amount > 0);
        setBalances(b);

        // 2. Fetch Transaction History (últimas 25)
        const sigs = await connection.getSignaturesForAddress(publicKey, { limit: 25 });
        const txs = await connection.getParsedTransactions(
          sigs.map((s) => s.signature),
          { maxSupportedTransactionVersion: 0 }
        );

        const historyList = [];
        txs.forEach((tx, i) => {
          if (!tx || !tx.meta || !tx.meta.logMessages) return;
          const logs = tx.meta.logMessages.join(" ");
          const time = tx.blockTime ? tx.blockTime * 1000 : Date.now();
          const signature = sigs[i].signature;

          if (logs.includes("Instruction: PurchaseBonds") || logs.includes("Instruction: Purchase")) {
            historyList.push({ type: "compra", signature, time, rawLogs: logs });
          } else if (logs.includes("Instruction: RedeemBonds") || logs.includes("Instruction: Redeem")) {
            historyList.push({ type: "canje", signature, time, rawLogs: logs });
          }
        });

        // Ordenamos por tiempo descendente
        historyList.sort((x, y) => y.time - x.time);
        setTxHistory(historyList);

      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [connection, publicKey]);

  if (!publicKey) {
    return (
      <div className="fade-in" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
        Conecta tu wallet para ver tu historial de transacciones y saldos.
      </div>
    );
  }

  const compras = txHistory.filter((t) => t.type === "compra");
  const canjes = txHistory.filter((t) => t.type === "canje");

  const formatDate = (ts) => {
    return new Date(ts).toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit"
    });
  };

  const shortSig = (sig) => `${sig.slice(0, 6)}…${sig.slice(-6)}`;
  const shortMint = (m) => `${m.slice(0, 6)}…${m.slice(-6)}`;

  return (
    <div className="fade-in" style={{ padding: "40px 0", maxWidth: 1000, margin: "0 auto" }}>
      <div className="hero" style={{ padding: "30px 20px" }}>
        <h1 className="hero-title">Historial de Transacciones & Saldos</h1>
        <p className="hero-description">Revisa tus compras de bonos, canjes y el balance de tu billetera.</p>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 30 }}>
        <button
          onClick={() => setActiveTab("compras")}
          style={{
            flex: 1, padding: "16px", background: "transparent", border: "none",
            borderBottom: activeTab === "compras" ? "2px solid var(--accent-blue)" : "2px solid transparent",
            color: activeTab === "compras" ? "var(--accent-blue)" : "var(--text-muted)",
            fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
          }}
        >
          Mis Compras ({compras.length})
        </button>
        <button
          onClick={() => setActiveTab("canjes")}
          style={{
            flex: 1, padding: "16px", background: "transparent", border: "none",
            borderBottom: activeTab === "canjes" ? "2px solid var(--accent-orange)" : "2px solid transparent",
            color: activeTab === "canjes" ? "var(--accent-orange)" : "var(--text-muted)",
            fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
          }}
        >
          Mis Canjes ({canjes.length})
        </button>
        <button
          onClick={() => setActiveTab("balances")}
          style={{
            flex: 1, padding: "16px", background: "transparent", border: "none",
            borderBottom: activeTab === "balances" ? "2px solid var(--accent-green)" : "2px solid transparent",
            color: activeTab === "balances" ? "var(--accent-green)" : "var(--text-muted)",
            fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8
          }}
        >
          <Wallet size={16} /> Saldos ({balances.length})
        </button>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
          <span className="spinner" style={{ display: "inline-block", marginRight: 10 }}></span> Escaneando la blockchain...
        </div>
      ) : (
        <div>
          {/* COMPRAS */}
          {activeTab === "compras" && (
            <div>
              {compras.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-lg)" }}>
                  No hay transacciones recientes de compra.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {compras.map((tx) => (
                    <div key={tx.signature} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 24 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                        <div>
                          <h3 style={{ margin: "0 0 4px 0", color: "var(--accent-blue)", fontSize: "1.1rem" }}>Compra de Bonos</h3>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                            <Clock size={12} /> {formatDate(tx.time)}
                          </div>
                        </div>
                        <span className="badge badge-active" style={{ background: "rgba(102,126,234,0.1)", color: "var(--accent-blue)" }}>COMPRA CONFIRMADA</span>
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontFamily: "monospace", display: "flex", gap: 10 }}>
                        <HistoryIcon size={14} /> Transacción: <span style={{ color: "var(--accent-blue)" }}>{shortSig(tx.signature)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CANJES */}
          {activeTab === "canjes" && (
            <div>
              {canjes.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-lg)" }}>
                  No hay transacciones recientes de canje (redención).
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {canjes.map((tx) => (
                    <div key={tx.signature} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 24 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                        <div>
                          <h3 style={{ margin: "0 0 4px 0", color: "var(--accent-orange)", fontSize: "1.1rem" }}>Canje / Redención de Bonos</h3>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                            <Clock size={12} /> {formatDate(tx.time)}
                          </div>
                        </div>
                        <span className="badge badge-active" style={{ background: "rgba(245,158,11,0.1)", color: "var(--accent-orange)" }}>CANJE CONFIRMADO</span>
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontFamily: "monospace", display: "flex", gap: 10 }}>
                        <HistoryIcon size={14} /> Transacción: <span style={{ color: "var(--accent-orange)" }}>{shortSig(tx.signature)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* BALANCES */}
          {activeTab === "balances" && (
            <div>
              {balances.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-lg)" }}>
                  Tu billetera no tiene tokens SPL actualmente.
                </div>
              ) : (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "rgba(0,0,0,0.2)", fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "1px" }}>
                        <th style={{ padding: "16px 30px", fontWeight: 600 }}>Mint Address (Token)</th>
                        <th style={{ padding: "16px 30px", fontWeight: 600, textAlign: "right" }}>Cantidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {balances.map((b, i) => {
                        const listing = listings.find(l => l.account.bondMint.toString() === b.mint);
                        const tokenName = listing ? `${listing.account.tokenName} (${listing.account.tokenSymbol})` : b.mint;

                        return (
                          <tr key={b.mint} style={{ borderBottom: i === balances.length - 1 ? "none" : "1px solid rgba(255,255,255,0.05)" }}>
                            <td style={{ padding: "16px 30px", fontFamily: "monospace", color: "var(--accent-green)", display: "flex", alignItems: "center", gap: 10 }}>
                              <Wallet size={16} /> {tokenName}
                            </td>
                            <td style={{ padding: "16px 30px", fontWeight: 600, color: "var(--text-primary)", fontSize: "1.1rem", textAlign: "right" }}>
                              {b.amount.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
