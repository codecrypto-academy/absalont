import React, { useState } from "react";
import toast from "react-hot-toast";
import { useBondsProgram } from "../hooks/useBondsProgram.js";
import { ShoppingCart, Award, CreditCard, Hourglass, Coins, Briefcase } from "lucide-react";
function FormGroup({ label, hint, children }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
      {hint && <div className="form-hint">{hint}</div>}
    </div>
  );
}

function PurchaseForm({ listings, loading, onSubmit }) {
  const [listingAddress, setListingAddress] = useState("");
  const [buyerBondAccount, setBuyerBondAccount] = useState("");
  const [buyerStableAccount, setBuyerStableAccount] = useState("");
  const [issuerStableAccount, setIssuerStableAccount] = useState("");
  const [amount, setAmount] = useState("");

  // When a listing is selected from dropdown, auto-fill listing address
  const selectedListing = listings.find(
    (l) => l.publicKey.toString() === listingAddress
  );
  const maxBonds = selectedListing?.account.availableBonds.toNumber() || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit({ listingAddress, buyerBondAccount, buyerStableAccount, issuerStableAccount, amount });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="info-box">
        <p>Compra bonos de un listing activo. El pago en stablecoins va al emisor y los bonos llegan a tu wallet de forma <strong>atómica</strong>.</p>
      </div>

      <FormGroup label="Seleccionar Listing">
        <select
          id="pur-listing"
          className="form-input"
          value={listingAddress}
          onChange={(e) => setListingAddress(e.target.value)}
          required
        >
          <option value="">— Elige un listing activo —</option>
          {listings
            .filter((l) => l.account.isActive)
            .map((l) => (
              <option key={l.publicKey.toString()} value={l.publicKey.toString()}>
                {l.publicKey.toString().slice(0, 8)}… · {l.account.availableBonds.toNumber()} bonos · Precio: {l.account.pricePerBond.toNumber()}
              </option>
            ))}
        </select>
      </FormGroup>

      {selectedListing && (
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(102,126,234,0.06)",
            border: "1px solid rgba(102,126,234,0.15)",
            borderRadius: "var(--radius-sm)",
            marginBottom: 16,
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
          }}
        >
          <div>
            <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Precio</div>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-blue)" }}>
              {selectedListing.account.pricePerBond.toNumber()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Disponibles</div>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-green)" }}>
              {selectedListing.account.availableBonds.toNumber()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Valor Facial</div>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-orange)" }}>
              {selectedListing.account.faceValue.toNumber()}
            </div>
          </div>
        </div>
      )}

      <div className="form-row">
        <FormGroup label="Tu Bond Account" hint="Recibirás los bonos aquí">
          <input id="pur-bondAcc" className="form-input" placeholder="Pubkey" value={buyerBondAccount} onChange={(e) => setBuyerBondAccount(e.target.value)} required />
        </FormGroup>
        <FormGroup label="Tu Stable Account" hint="Pagarás desde aquí">
          <input id="pur-stableAcc" className="form-input" placeholder="Pubkey" value={buyerStableAccount} onChange={(e) => setBuyerStableAccount(e.target.value)} required />
        </FormGroup>
      </div>

      <FormGroup label="Cuenta Stables del Emisor" hint="Dirección a la que pagará el emisor">
        <input id="pur-issuerStable" className="form-input" placeholder="Pubkey del token account del emisor" value={issuerStableAccount} onChange={(e) => setIssuerStableAccount(e.target.value)} required />
      </FormGroup>

      <FormGroup label={`Cantidad de Bonos${maxBonds > 0 ? ` (máx. ${maxBonds})` : ""}`}>
        <input
          id="pur-amount"
          className="form-input"
          type="number"
          min="1"
          max={maxBonds || undefined}
          placeholder="10"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </FormGroup>

      {amount && selectedListing && (
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.15)",
            borderRadius: "var(--radius-sm)",
            marginBottom: 16,
            fontSize: "0.8rem",
            color: "var(--text-secondary)",
          }}
        >
          <span style={{display:"flex", alignItems:"center", gap:4}}><CreditCard size={14} /> Total a pagar:</span>{" "}
          <strong style={{ color: "var(--accent-green)", fontFamily: "var(--font-mono)" }}>
            {(Number(amount) * selectedListing.account.pricePerBond.toNumber()).toLocaleString()}
          </strong>{" "}
          stablecoins
        </div>
      )}

      <button id="btn-purchase" type="submit" className="btn btn-success btn-full" disabled={loading}>
        {loading ? <><span className="spinner" /> Comprando...</> : <span style={{display:"flex", alignItems:"center", justifyContent:"center", gap:6}}><ShoppingCart size={16} /> Comprar Bonos</span>}
      </button>
    </form>
  );
}

function RedeemForm({ listings, loading, onSubmit }) {
  const [listingAddress, setListingAddress] = useState("");
  const [holderBondAccount, setHolderBondAccount] = useState("");
  const [holderStableAccount, setHolderStableAccount] = useState("");
  const [amount, setAmount] = useState("");

  const now = Math.floor(Date.now() / 1000);
  const matureListings = listings.filter(
    (l) => l.account.maturityTimestamp.toNumber() <= now
  );

  const selectedListing = listings.find(
    (l) => l.publicKey.toString() === listingAddress
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit({ listingAddress, holderBondAccount, holderStableAccount, amount });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="info-box">
        <p>Canjea tus bonos después del vencimiento. Recibirás el <strong>valor facial</strong> por cada bono en stablecoins del vault de redención.</p>
      </div>

      <FormGroup label="Listing Vencido">
        <select
          id="red-listing"
          className="form-input"
          value={listingAddress}
          onChange={(e) => setListingAddress(e.target.value)}
          required
        >
          <option value="">— Elige un listing vencido —</option>
          {matureListings.map((l) => (
            <option key={l.publicKey.toString()} value={l.publicKey.toString()}>
              {l.publicKey.toString().slice(0, 8)}… · Valor facial: {l.account.faceValue.toNumber()} · Vault: {l.account.totalRedemptionFunded.toNumber()}
            </option>
          ))}
        </select>
      </FormGroup>

      {matureListings.length === 0 && (
        <div style={{ padding: "12px 14px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: "var(--radius-sm)", marginBottom: 16, fontSize: "0.8rem", color: "#fbbf24" }}>
          <span style={{display:"flex", alignItems:"center", gap:6}}><Hourglass size={14} /> No hay listings vencidos aún. Espera al vencimiento para canjear.</span>
        </div>
      )}

      <div className="form-row">
        <FormGroup label="Tu Bond Account" hint="Donde tienes los bonos">
          <input id="red-bondAcc" className="form-input" placeholder="Pubkey" value={holderBondAccount} onChange={(e) => setHolderBondAccount(e.target.value)} required />
        </FormGroup>
        <FormGroup label="Tu Stable Account" hint="Recibirás stablecoins aquí">
          <input id="red-stableAcc" className="form-input" placeholder="Pubkey" value={holderStableAccount} onChange={(e) => setHolderStableAccount(e.target.value)} required />
        </FormGroup>
      </div>

      <FormGroup label="Cantidad a Canjear">
        <input id="red-amount" className="form-input" type="number" min="1" placeholder="5" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </FormGroup>

      {amount && selectedListing && (
        <div style={{ padding: "10px 14px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: "var(--radius-sm)", marginBottom: 16, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
          <span style={{display:"flex", alignItems:"center", gap:4}}><Coins size={14} /> Recibirás:</span>{" "}
          <strong style={{ color: "var(--accent-green)", fontFamily: "var(--font-mono)" }}>
            {(Number(amount) * selectedListing.account.faceValue.toNumber()).toLocaleString()}
          </strong>{" "}
          stablecoins
        </div>
      )}

      <button id="btn-redeem" type="submit" className="btn btn-gold btn-full" disabled={loading || matureListings.length === 0}>
        {loading ? <><span className="spinner" /> Canjeando...</> : <span style={{display:"flex", alignItems:"center", justifyContent:"center", gap:6}}><Award size={16} /> Canjear Bonos</span>}
      </button>
    </form>
  );
}

export default function BuyerPanel({ listings }) {
  const [buyerTab, setBuyerTab] = useState("purchase");
  const { loading, purchaseBonds, redeemBonds } = useBondsProgram();

  const handleError = (fn) => async (data) => {
    try {
      await fn(data);
    } catch (err) {
      const msg = err?.message || String(err);
      toast.error(msg.length > 100 ? msg.slice(0, 100) + "…" : msg, { className: "toast-error", duration: 8000 });
      console.error(err);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon green"><Briefcase size={24} /></div>
        <div>
          <div className="card-title">Panel del Comprador</div>
          <div className="card-subtitle">Compra y canjea bonos</div>
        </div>
      </div>

      <div className="tabs-container" style={{ marginBottom: 20 }}>
        <button
          id="buyer-tab-purchase"
          className={`tab-btn ${buyerTab === "purchase" ? "active" : ""}`}
          onClick={() => setBuyerTab("purchase")}
        >
          <span style={{display:"flex", alignItems:"center", gap:6}}><ShoppingCart size={16} /> Comprar</span>
        </button>
        <button
          id="buyer-tab-redeem"
          className={`tab-btn ${buyerTab === "redeem" ? "active" : ""}`}
          onClick={() => setBuyerTab("redeem")}
        >
          <span style={{display:"flex", alignItems:"center", gap:6}}><Award size={16} /> Canjear</span>
        </button>
      </div>

      {buyerTab === "purchase" && (
        <PurchaseForm listings={listings} loading={loading} onSubmit={handleError(purchaseBonds)} />
      )}
      {buyerTab === "redeem" && (
        <RedeemForm listings={listings} loading={loading} onSubmit={handleError(redeemBonds)} />
      )}
    </div>
  );
}
