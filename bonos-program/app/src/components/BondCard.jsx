import { useState, useEffect } from "react";
import { Clock, Coins } from "lucide-react";

function formatDate(ts) {
  return new Date(ts * 1000).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatus(account) {
  const now = Math.floor(Date.now() / 1000);
  if (!account.isActive) return { label: "Cancelado", cls: "badge-inactive" };
  if (account.maturityTimestamp.toNumber() <= now) return { label: "Vencido", cls: "badge-matured" };
  return { label: "Activo", cls: "badge-active" };
}

function Countdown({ targetTs }) {
  const [diff, setDiff] = useState(0);

  useEffect(() => {
    const calc = () => {
      const now = Math.floor(Date.now() / 1000);
      setDiff(Math.max(0, targetTs - now));
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetTs]);

  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;

  if (diff === 0)
    return <span className="badge badge-matured" style={{display:"inline-flex", alignItems:"center", gap:4}}><Clock size={12} /> Vencido — Canjeable</span>;

  return (
    <div className="countdown">
      <div className="countdown-unit">
        <div className="countdown-value">{String(d).padStart(2, "0")}</div>
        <div className="countdown-label">días</div>
      </div>
      <div className="countdown-unit">
        <div className="countdown-value">{String(h).padStart(2, "0")}</div>
        <div className="countdown-label">hrs</div>
      </div>
      <div className="countdown-unit">
        <div className="countdown-value">{String(m).padStart(2, "0")}</div>
        <div className="countdown-label">min</div>
      </div>
      <div className="countdown-unit">
        <div className="countdown-value">{String(s).padStart(2, "0")}</div>
        <div className="countdown-label">seg</div>
      </div>
    </div>
  );
}

export default function BondCard({ listing, shortAddress }) {
  const { account } = listing;
  const address = listing.publicKey.toString();
  const status = getStatus(account);
  const soldPct =
    account.totalBonds.toNumber() > 0
      ? Math.round(
          ((account.totalBonds.toNumber() - account.availableBonds.toNumber()) /
            account.totalBonds.toNumber()) *
            100
        )
      : 0;

  const yieldPct =
    account.pricePerBond.toNumber() > 0
      ? (
          ((account.faceValue.toNumber() - account.pricePerBond.toNumber()) /
            account.pricePerBond.toNumber()) *
          100
        ).toFixed(2)
      : "0.00";

  return (
    <div className="bond-card fade-in">
      <div className="bond-card-header">
        <div>
          <div className="bond-card-address" title={address} style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1.1rem" }}>
            {account.tokenName} ({account.tokenSymbol})
          </div>
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 2 }}>
            {shortAddress(listing.publicKey)}
          </div>
        </div>
        <span className={`badge ${status.cls}`}>{status.label}</span>
      </div>

      <div className="bond-metrics">
        <div className="bond-metric">
          <div className="bond-metric-label">Precio / Bono</div>
          <div className="bond-metric-value" style={{ color: "var(--accent-blue)" }}>
            {account.pricePerBond.toNumber().toLocaleString()}
          </div>
        </div>
        <div className="bond-metric">
          <div className="bond-metric-label">Valor Facial</div>
          <div className="bond-metric-value" style={{ color: "var(--accent-green)" }}>
            {account.faceValue.toNumber().toLocaleString()}
          </div>
        </div>
        <div className="bond-metric">
          <div className="bond-metric-label">Disponibles</div>
          <div className="bond-metric-value">
            {account.availableBonds.toNumber().toLocaleString()}
          </div>
        </div>
        <div className="bond-metric">
          <div className="bond-metric-label">Rendimiento</div>
          <div className="bond-metric-value" style={{ color: "var(--accent-orange)" }}>
            +{yieldPct}%
          </div>
        </div>
      </div>

      {/* Progress */}
      {account.totalBonds.toNumber() > 0 && (
        <div className="progress-container">
          <div className="progress-label">
            <span>Vendidos</span>
            <span>{soldPct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${soldPct}%` }} />
          </div>
        </div>
      )}

      {/* Countdown */}
      <div style={{ margin: "16px 0 4px" }}>
        <div className="stat-label" style={{ marginBottom: 10, fontSize: "0.65rem" }}>
          VENCIMIENTO · {formatDate(account.maturityTimestamp.toNumber())}
        </div>
        <Countdown targetTs={account.maturityTimestamp.toNumber()} />
      </div>

      {/* Vault */}
      {account.totalRedemptionFunded.toNumber() > 0 && (
        <div
          style={{
            marginTop: 12,
            padding: "8px 12px",
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.15)",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.75rem",
            color: "var(--accent-green)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <span style={{display:"flex", alignItems:"center", gap:6}}><Coins size={12} /> Vault redención: {account.totalRedemptionFunded.toNumber().toLocaleString()} stables</span>
        </div>
      )}

      {/* Addresses */}
      <div className="divider" />
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
          Emisor: <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{shortAddress(account.issuer)}</span>
        </div>
        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
          Bond Mint: <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{shortAddress(account.bondMint)}</span>
        </div>
        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
          Stable Mint: <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{shortAddress(account.stableMint)}</span>
        </div>
      </div>
    </div>
  );
}
