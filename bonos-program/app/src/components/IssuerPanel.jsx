import React, { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import { useBondsProgram } from "../hooks/useBondsProgram.js";
import { Landmark, Rocket, ArrowRightLeft, PlusCircle, Coins, XCircle, AlertTriangle } from "lucide-react";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createInitializeMintInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createMintToInstruction } from "@solana/spl-token";

const MINT_SIZE = 82;

const ACCORDION_ITEMS = [
  { id: "initialize", icon: <Rocket size={16} />, title: "Inicializar Listing", color: "blue" },
  { id: "updatePrice", icon: <ArrowRightLeft size={16} />, title: "Actualizar Precio", color: "cyan" },
  { id: "addBonds", icon: <PlusCircle size={16} />, title: "Añadir Bonos", color: "green" },
  { id: "deposit", icon: <Coins size={16} />, title: "Depositar Fondos Redención", color: "gold" },
  { id: "cancel", icon: <XCircle size={16} />, title: "Cancelar Listing", color: "red" },
];

function FormGroup({ label, hint, children }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
      {hint && <div className="form-hint">{hint}</div>}
    </div>
  );
}

function InitializeForm({ loading: txLoading, onSubmit }) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    tokenName: "BONONAVIDAD",
    symbol: "BN",
    bondAmount: "1000000",
    faceValue: "2000",
    interestRate: "6",
    durationYears: "3",
    stableMint: "", // Nuevo campo
  });

  // Cargar de localStorage inicialmente si existe
  React.useEffect(() => {
    const stored = localStorage.getItem("localStableMint");
    if (stored) {
      try {
        const pk = Keypair.fromSecretKey(new Uint8Array(JSON.parse(stored))).publicKey.toString();
        setForm(prev => ({ ...prev, stableMint: pk }));
      } catch (e) {}
    }
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const annualCoupon = (Number(form.faceValue) * Number(form.interestRate)) / 100 || 0;
  const totalCoupons = annualCoupon * Number(form.durationYears) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!publicKey) return toast.error("Conecta tu wallet primero");

    if (!form.stableMint) return toast.error("Define la dirección de la Stablecoin (Stable Mint).");
    const stableMint = form.stableMint;

    setLoading(true);
    try {
      // 1. Generate new SPL Token (Bond Mint)
      const mintKeypair = Keypair.generate();
      const mint = mintKeypair.publicKey;
      const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

      const tx = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mint,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(mint, 0, publicKey, null, TOKEN_PROGRAM_ID)
      );

      const ata = await getAssociatedTokenAddress(mint, publicKey);
      tx.add(
        createAssociatedTokenAccountInstruction(publicKey, ata, publicKey, mint),
        createMintToInstruction(mint, ata, publicKey, Number(form.bondAmount))
      );

      const signature = await sendTransaction(tx, connection, { signers: [mintKeypair] });
      await connection.confirmTransaction(signature, "confirmed");

      // 2. Initialize Listing on-chain
      const durationSeconds = Number(form.durationYears) * 31536000;
      const maturityTimestamp = Math.floor(Date.now() / 1000) + durationSeconds;
      const pricePerBond = Math.max(1, Number(form.faceValue) - totalCoupons);

      await onSubmit({
        bondMint: mint.toString(),
        stableMint,
        issuerBondAccount: ata.toString(),
        bondAmount: Number(form.bondAmount),
        pricePerBond,
        faceValue: Number(form.faceValue),
        maturityTimestamp,
        tokenName: form.tokenName,
        symbol: form.symbol
      });
      
      toast.success("¡Token y Listing creados exitosamente!", { className: "toast-success" });
    } catch (err) {
      console.error(err);
      toast.error("Error al inicializar el bono: " + err.message, { className: "toast-error" });
    } finally {
      setLoading(false);
    }
  };

  const isWorking = loading || txLoading;
  const endDate = new Date(Date.now() + Number(form.durationYears) * 31536000000);

  return (
    <form onSubmit={handleSubmit}>
      <div className="info-box" style={{ marginBottom: 24 }}>
        <p>Genera el token SPL del bono y define sus métricas económicas (simulando rendimiento vía descuento Zero-Coupon).</p>
      </div>
      
      <div style={{ padding: "0 10px 20px 10px" }}>
        <h4 style={{ margin: "0 0 16px 0", color: "var(--text-primary)", fontSize: "1rem" }}>Create New Token (Bond)</h4>
        
        <FormGroup label="Token Name">
          <input className="form-input" value={form.tokenName} onChange={set("tokenName")} required />
        </FormGroup>
        
        <FormGroup label="Symbol">
          <input className="form-input" value={form.symbol} onChange={set("symbol")} required />
        </FormGroup>
        
        <FormGroup label="Initial Supply">
          <input className="form-input" type="number" min="1" value={form.bondAmount} onChange={set("bondAmount")} required />
        </FormGroup>
        
        <FormGroup label="Nominal Value (per bond)">
          <input className="form-input" type="number" min="1" value={form.faceValue} onChange={set("faceValue")} required />
        </FormGroup>

        <FormGroup label="Interest Rate (% per year)">
          <input className="form-input" type="number" min="0" max="100" step="0.1" value={form.interestRate} onChange={set("interestRate")} required />
        </FormGroup>

        <FormGroup label="Duration (years)">
          <input className="form-input" type="number" min="0.1" max="100" step="0.1" value={form.durationYears} onChange={set("durationYears")} required />
        </FormGroup>

        <FormGroup label="Stablecoin Mint Address" hint="Pega aquí la dirección de Local USD (ej: 5obq...)">
          <input className="form-input" value={form.stableMint} onChange={set("stableMint")} required placeholder="Ej: 5obqwZTUm2WGsXuriyXpNRSoDjLZqF1gnFeiGSSBSobc" />
        </FormGroup>
        
        <div style={{ background: "rgba(102,126,234,0.05)", border: "1px solid rgba(102,126,234,0.2)", borderRadius: "var(--radius-md)", padding: 16, marginTop: 24, marginBottom: 24 }}>
          <h4 style={{ margin: "0 0 12px 0", color: "var(--accent-blue)", fontSize: "0.9rem" }}>Bond Summary (Discount Engine)</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: "0.80rem", color: "var(--text-secondary)" }}>
            <div>Annual Yield Return: <b style={{color: "var(--accent-blue)"}}>{annualCoupon.toLocaleString()}</b> USD</div>
            <div>Total Implied Yield: <b style={{color: "var(--accent-blue)"}}>{totalCoupons.toLocaleString()}</b> USD</div>
            <div>Discounted Price: <b style={{color: "var(--accent-green)"}}>{Math.max(1, Number(form.faceValue) - totalCoupons).toLocaleString()}</b> USD</div>
            <div>Maturity Date: <b>{isNaN(endDate) ? "Invalida" : endDate.toLocaleDateString("es-ES")}</b></div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={isWorking} style={{ padding: 16, fontSize: "1rem" }}>
          {isWorking ? <><span className="spinner" /> Generando Token & Escrow...</> : <span style={{display:"flex", alignItems:"center", justifyContent:"center", gap:6}}><Rocket size={18} /> Create Bond</span>}
        </button>
      </div>
    </form>
  );
}

function UpdatePriceForm({ loading, onSubmit }) {
  const [listingAddress, setListingAddress] = useState("");
  const [newPrice, setNewPrice] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit({ listingAddress, newPrice });
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormGroup label="Dirección del Listing">
        <input id="up-listing" className="form-input" placeholder="Pubkey del BondListing" value={listingAddress} onChange={(e) => setListingAddress(e.target.value)} required />
      </FormGroup>
      <FormGroup label="Nuevo Precio">
        <input id="up-price" className="form-input" type="number" min="1" placeholder="1200" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required />
      </FormGroup>
      <button id="btn-updatePrice" type="submit" className="btn btn-primary btn-full" disabled={loading}>
        {loading ? <><span className="spinner" /> Actualizando...</> : <span style={{display:"flex", alignItems:"center", justifyContent:"center", gap:6}}><ArrowRightLeft size={16} /> Actualizar Precio</span>}
      </button>
    </form>
  );
}

function AddBondsForm({ loading, onSubmit }) {
  const [listingAddress, setListingAddress] = useState("");
  const [issuerBondAccount, setIssuerBondAccount] = useState("");
  const [extraAmount, setExtraAmount] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit({ listingAddress, issuerBondAccount, extraAmount });
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormGroup label="Dirección del Listing">
        <input id="ab-listing" className="form-input" placeholder="Pubkey del BondListing" value={listingAddress} onChange={(e) => setListingAddress(e.target.value)} required />
      </FormGroup>
      <FormGroup label="Tu Cuenta de Bonos">
        <input id="ab-account" className="form-input" placeholder="Pubkey del bond token account" value={issuerBondAccount} onChange={(e) => setIssuerBondAccount(e.target.value)} required />
      </FormGroup>
      <FormGroup label="Cantidad Extra">
        <input id="ab-amount" className="form-input" type="number" min="1" placeholder="50" value={extraAmount} onChange={(e) => setExtraAmount(e.target.value)} required />
      </FormGroup>
      <button id="btn-addBonds" type="submit" className="btn btn-success btn-full" disabled={loading}>
        {loading ? <><span className="spinner" /> Añadiendo...</> : <span style={{display:"flex", alignItems:"center", justifyContent:"center", gap:6}}><PlusCircle size={16} /> Añadir Bonos</span>}
      </button>
    </form>
  );
}

function DepositForm({ loading, onSubmit }) {
  const [listingAddress, setListingAddress] = useState("");
  const [issuerStableAccount, setIssuerStableAccount] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit({ listingAddress, issuerStableAccount, amount });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="info-box">
        <p>Deposita stablecoins en el <strong>redemption vault PDA</strong> para que los titulares puedan canjear sus bonos al vencimiento.</p>
      </div>
      <FormGroup label="Dirección del Listing">
        <input id="dep-listing" className="form-input" placeholder="Pubkey del BondListing" value={listingAddress} onChange={(e) => setListingAddress(e.target.value)} required />
      </FormGroup>
      <FormGroup label="Tu Cuenta de Stablecoins">
        <input id="dep-account" className="form-input" placeholder="Pubkey del stable token account" value={issuerStableAccount} onChange={(e) => setIssuerStableAccount(e.target.value)} required />
      </FormGroup>
      <FormGroup label="Cantidad a Depositar">
        <input id="dep-amount" className="form-input" type="number" min="1" placeholder="110000" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </FormGroup>
      <button id="btn-deposit" type="submit" className="btn btn-gold btn-full" disabled={loading}>
        {loading ? <><span className="spinner" /> Depositando...</> : <span style={{display:"flex", alignItems:"center", justifyContent:"center", gap:6}}><Coins size={16} /> Depositar Fondos</span>}
      </button>
    </form>
  );
}

function CancelForm({ loading, onSubmit }) {
  const [listingAddress, setListingAddress] = useState("");
  const [issuerBondAccount, setIssuerBondAccount] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit({ listingAddress, issuerBondAccount });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="warning-box">
        <p style={{display:"flex", alignItems:"center", gap:6}}><AlertTriangle size={14} /> Esta acción es <strong>irreversible</strong>. Los bonos no vendidos serán devueltos a tu wallet y el listing quedará inactivo.</p>
      </div>
      <FormGroup label="Dirección del Listing">
        <input id="can-listing" className="form-input" placeholder="Pubkey del BondListing" value={listingAddress} onChange={(e) => setListingAddress(e.target.value)} required />
      </FormGroup>
      <FormGroup label="Tu Cuenta de Bonos">
        <input id="can-account" className="form-input" placeholder="Pubkey del bond token account" value={issuerBondAccount} onChange={(e) => setIssuerBondAccount(e.target.value)} required />
      </FormGroup>
      <button id="btn-cancel" type="submit" className="btn btn-danger btn-full" disabled={loading}>
        {loading ? <><span className="spinner" /> Cancelando...</> : <span style={{display:"flex", alignItems:"center", justifyContent:"center", gap:6}}><XCircle size={16} /> Cancelar Listing</span>}
      </button>
    </form>
  );
}

export default function IssuerPanel() {
  const [openItem, setOpenItem] = useState("initialize");
  const { loading, initializeListing, updatePrice, addBondsToListing, depositRedemptionFunds, cancelListing } = useBondsProgram();

  const handleError = (fn) => async (data) => {
    try {
      await fn(data);
    } catch (err) {
      const msg = err?.message || String(err);
      toast.error(msg.length > 100 ? msg.slice(0, 100) + "…" : msg, { className: "toast-error", duration: 8000 });
      console.error(err);
    }
  };

  const toggle = (id) => setOpenItem((cur) => (cur === id ? null : id));

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon blue"><Landmark size={24} /></div>
        <div>
          <div className="card-title">Panel del Emisor</div>
          <div className="card-subtitle">Gestiona tus listings de bonos</div>
        </div>
      </div>

      {ACCORDION_ITEMS.map((item) => (
        <div key={item.id} style={{ marginBottom: 8 }}>
          <button
            id={`accordion-${item.id}`}
            onClick={() => toggle(item.id)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              background: openItem === item.id ? "rgba(102,126,234,0.1)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${openItem === item.id ? "rgba(102,126,234,0.3)" : "var(--border)"}`,
              borderRadius: "var(--radius-md)",
              color: openItem === item.id ? "var(--accent-blue)" : "var(--text-secondary)",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              transition: "all 0.2s",
              textAlign: "left",
            }}
          >
            <span>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.title}</span>
            <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>
              {openItem === item.id ? "▲" : "▼"}
            </span>
          </button>

          {openItem === item.id && (
            <div
              style={{
                padding: "16px 14px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(102,126,234,0.15)",
                borderTop: "none",
                borderRadius: "0 0 var(--radius-md) var(--radius-md)",
              }}
              className="fade-in"
            >
              {item.id === "initialize" && (
                <InitializeForm loading={loading} onSubmit={handleError(initializeListing)} />
              )}
              {item.id === "updatePrice" && (
                <UpdatePriceForm loading={loading} onSubmit={handleError(updatePrice)} />
              )}
              {item.id === "addBonds" && (
                <AddBondsForm loading={loading} onSubmit={handleError(addBondsToListing)} />
              )}
              {item.id === "deposit" && (
                <DepositForm loading={loading} onSubmit={handleError(depositRedemptionFunds)} />
              )}
              {item.id === "cancel" && (
                <CancelForm loading={loading} onSubmit={handleError(cancelListing)} />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
