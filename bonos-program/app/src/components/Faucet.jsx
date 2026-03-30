import React, { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  createInitializeMintInstruction, 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction, 
  createMintToInstruction 
} from "@solana/spl-token";

const MINT_SIZE = 82;
import toast from "react-hot-toast";
import { Droplet, Coins, Lightbulb } from "lucide-react";

export default function Faucet() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [solAmount, setSolAmount] = useState("10");
  const [stableAmount, setStableAmount] = useState("1000");
  const [loadingSol, setLoadingSol] = useState(false);
  const [loadingStable, setLoadingStable] = useState(false);
  const [localMintPubKey, setLocalMintPubKey] = useState(null);
  const [isDevMode, setIsDevMode] = useState(false);
  const [devKeypair, setDevKeypair] = useState(null);

  useEffect(() => {
    const storedMint = localStorage.getItem("localStableMint");
    if (storedMint) {
      try {
        const kp = Keypair.fromSecretKey(new Uint8Array(JSON.parse(storedMint)));
        setLocalMintPubKey(kp.publicKey.toString());
      } catch (e) {}
    }

    const storedDev = localStorage.getItem("localDevWallet");
    if (storedDev) {
      setDevKeypair(Keypair.fromSecretKey(new Uint8Array(JSON.parse(storedDev))));
    } else {
      const newKp = Keypair.generate();
      localStorage.setItem("localDevWallet", JSON.stringify(Array.from(newKp.secretKey)));
      setDevKeypair(newKp);
    }
  }, []);

  const resetMint = () => {
    localStorage.removeItem("localStableMint");
    setLocalMintPubKey(null);
    toast.success("Estado del Faucet reiniciado. Puedes crear una nueva stablecoin.");
  };

  const requestSol = async (e) => {
    e.preventDefault();
    if (!publicKey) return toast.error("Conecta tu wallet primero");
    
    const totalToRequest = Number(solAmount);
    if (isNaN(totalToRequest) || totalToRequest <= 0) return toast.error("Monto inválido");

    setLoadingSol(true);
    let requestedSoFar = 0;
    const CHUNK_SIZE = 2; // SOL limit per request

    try {
      while (requestedSoFar < totalToRequest) {
        const remaining = totalToRequest - requestedSoFar;
        const currentChunk = Math.min(remaining, CHUNK_SIZE);
        
        if (totalToRequest > CHUNK_SIZE) {
          toast.loading(`Solicitando SOL (${requestedSoFar + currentChunk}/${totalToRequest})...`, { id: "airdrop-progress" });
        }

        const airdropSignature = await connection.requestAirdrop(
          publicKey,
          currentChunk * LAMPORTS_PER_SOL
        );
        
        const latestBlockhash = await connection.getLatestBlockhash();
        await connection.confirmTransaction({
          signature: airdropSignature,
          ...latestBlockhash
        }, "confirmed");

        requestedSoFar += currentChunk;
        
        // Pequeño delay para no saturar el RPC en local
        if (requestedSoFar < totalToRequest) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      toast.dismiss("airdrop-progress");
      toast.success(`${totalToRequest} SOL recibidos correctamente!`, { className: "toast-success" });
    } catch (err) {
      console.error(err);
      toast.dismiss("airdrop-progress");
      toast.error(`Error en el Faucet: El validador rechazó la solicitud. Intenta con montos más pequeños o revisa 'solana logs'.`, { duration: 10000 });
    } finally {
      setLoadingSol(false);
    }
  };

  const requestStablecoins = async (e) => {
    e.preventDefault();
    if (!publicKey) return toast.error("Conecta tu wallet primero");
    setLoadingStable(true);
    try {
      let mintKeypair;
      let isNewMint = false;
      const storedMint = localStorage.getItem("localStableMint");

      if (storedMint) {
        mintKeypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(storedMint)));
        // IMPORTANT: Verify if the mint actually exists on-chain.
        // It could be stored in localStorage but the transaction might have failed!
        const info = await connection.getAccountInfo(mintKeypair.publicKey);
        if (!info) {
           isNewMint = true;
        } else {
           // Verifica si el usuario cambió de wallet de Phantom
           const authOption = info.data.readUInt32LE(0);
           if (authOption === 1) {
             const authorityStr = new PublicKey(info.data.slice(4, 36)).toString();
             if (authorityStr !== publicKey.toString()) {
               mintKeypair = Keypair.generate(); // <-- CORRECCIÓN VITAL: Generar uno nuevo para que la dirección cambie
               isNewMint = true; // La wallet actual NO es dueña, creamos cuenta nueva en Solana.
             }
           }
        }
      } else {
        mintKeypair = Keypair.generate();
        isNewMint = true;
      }

      const mint = mintKeypair.publicKey;
      
      if (isNewMint) {
        localStorage.setItem("localStableMint", JSON.stringify(Array.from(mintKeypair.secretKey)));
        setLocalMintPubKey(mint.toString());
      }

      // PASO 1: CREAR EL MINT (si no existe)
      if (isNewMint) {
        toast.loading(isDevMode ? "Modo Dev: Creando moneda..." : "Paso 1/2: Aprueba en Phantom para crear la moneda...", { id: "mint-step" });
        const { blockhash } = await connection.getLatestBlockhash("confirmed");
        const mintTx = new Transaction();
        mintTx.recentBlockhash = blockhash;
        mintTx.feePayer = isDevMode ? devKeypair.publicKey : publicKey;

        const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
        mintTx.add(
          SystemProgram.createAccount({
            fromPubkey: isDevMode ? devKeypair.publicKey : publicKey,
            newAccountPubkey: mint,
            space: MINT_SIZE,
            lamports,
            programId: TOKEN_PROGRAM_ID,
          }),
          createInitializeMintInstruction(mint, 6, isDevMode ? devKeypair.publicKey : publicKey, null, TOKEN_PROGRAM_ID)
        );

        let signature;
        if (isDevMode) {
          // Ensure dev wallet has SOL for rent
          await connection.requestAirdrop(devKeypair.publicKey, 1 * LAMPORTS_PER_SOL);
          signature = await connection.sendTransaction(mintTx, [devKeypair, mintKeypair]);
        } else {
          signature = await sendTransaction(mintTx, connection, { signers: [mintKeypair] });
        }
        toast.loading("Paso 1/2: Confirmando creación en la red local...", { id: "mint-step" });
        
        await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight
        }, "confirmed");
        
        toast.success("¡Paso 1 Completado! Mint creado.", { id: "mint-step", duration: 2000 });
      }

      toast.loading(isDevMode ? "Modo Dev: Procesando..." : "Paso 2/2: Aprueba el minteo en Phantom...", { id: "mint-step" });
      const { blockhash: bh2 } = await connection.getLatestBlockhash("confirmed");
      const mintToTx = new Transaction();
      mintToTx.recentBlockhash = bh2;
      mintToTx.feePayer = isDevMode ? devKeypair.publicKey : publicKey;

      const ata = await getAssociatedTokenAddress(mint, publicKey);
      const ataInfo = await connection.getAccountInfo(ata);
      
      if (!ataInfo) {
        mintToTx.add(
          createAssociatedTokenAccountInstruction(
            isDevMode ? devKeypair.publicKey : publicKey, 
            ata, 
            publicKey, 
            mint
          )
        );
      }

      mintToTx.add(
        createMintToInstruction(
          mint,
          ata,
          isDevMode ? devKeypair.publicKey : publicKey,
          BigInt(Number(stableAmount) * Math.pow(10, 6))
        )
      );

      let signature2;
      if (isDevMode) {
        // Ensure dev wallet has SOL
        await connection.requestAirdrop(devKeypair.publicKey, 1 * LAMPORTS_PER_SOL);
        signature2 = await connection.sendTransaction(mintToTx, [devKeypair]);
      } else {
        signature2 = await sendTransaction(mintToTx, connection);
      }
      toast.loading("Paso 2/2: Depositando fondos en tu cuenta...", { id: "mint-step" });
      
      await connection.confirmTransaction({
        signature: signature2,
        blockhash: bh2,
        lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight
      }, "confirmed");

      toast.success(`${stableAmount} Local USD (EE-EE) recibidos!`, { id: "mint-step" });
    } catch (err) {
      console.error(err);
      toast.dismiss("mint-step");
      let msg = err.message || "Error desconocido";
      if (msg.includes("Transaction simulation failed")) {
         msg = "La simulación falló. Verifica que tengas SOL suficiente y que Phantom esté en modo 'Localhost'.";
      }
      toast.error("Error al mintear: " + msg, { className: "toast-error", duration: 6000 });
      // Clear buggy local mint if transaction failed during creation
      try {
        const info = await connection.getAccountInfo(new PublicKey(localMintPubKey));
        if (!info) {
          localStorage.removeItem("localStableMint");
          setLocalMintPubKey(null);
        }
      } catch(e) {}
    } finally {
      setLoadingStable(false);
    }
  };

  return (
    <div className="fade-in" style={{ padding: "40px 0", maxWidth: 900, margin: "0 auto" }}>
      <div className="hero" style={{ padding: "40px 20px", position: "relative" }}>
        <h1 className="hero-title">Faucet (Localnet)</h1>
        <p className="hero-description">Obtén SOL y stablecoins de prueba para usar en tu entorno local.</p>
        
        {/* Toggle Dev Mode */}
        <div style={{ position: "absolute", bottom: -10, right: 20, display: "flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.3)", padding: "8px 16px", borderRadius: 30, border: "1px solid var(--border)" }}>
           <span style={{ fontSize: "0.75rem", color: isDevMode ? "var(--accent-blue)" : "var(--text-muted)", fontWeight: 600 }}>Modo Dev (Sin Phantom)</span>
           <button 
             onClick={() => setIsDevMode(!isDevMode)}
             style={{
               width: 36, height: 20, borderRadius: 10, background: isDevMode ? "var(--accent-blue)" : "#334155", position: "relative", border: "none", cursor: "pointer"
             }}
           >
             <div style={{ position: "absolute", top: 2, left: isDevMode ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "white", transition: "0.2s" }} />
           </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 24, marginTop: 40 }}>
        {/* SOL Faucet */}
        <div className="card card-hover" style={{ display: "flex", flexDirection: "column" }}>
          <div className="card-header">
            <div className="card-icon blue"><Droplet size={24} /></div>
            <div>
              <div className="card-title">SOL Airdrop</div>
              <div className="card-subtitle">Red: Localnet (127.0.0.1)</div>
            </div>
          </div>
          <form style={{ marginTop: 10, display: "flex", flex: 1, flexDirection: "column" }} onSubmit={requestSol}>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Cantidad a solicitar <span>(SOL)</span></label>
              <div style={{ position: "relative" }}>
                <input 
                  className="form-input" 
                  type="number" 
                  min="0.1" max="100" step="0.1" 
                  value={solAmount} 
                  onChange={e => setSolAmount(e.target.value)} 
                  required 
                  style={{ paddingRight: 80, fontSize: "1.2rem", fontWeight: "700" }}
                />
                <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontWeight: "600" }}>SOL</div>
              </div>
              <div className="form-hint" style={{ marginTop: 12 }}>Localnet: Ten en cuenta el límite del validador.</div>
              {publicKey && (
                <div style={{marginTop: 10, padding: 10, background: "rgba(0,0,0,0.2)", borderRadius: 8, fontSize: "0.75rem", fontFamily: "monospace", color: "#94a3b8"}}>
                  Falla el botón? Usa la terminal:<br/>
                  solana airdrop 10 {publicKey.toString()}
                </div>
              )}
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loadingSol} style={{ marginTop: "auto" }}>
              {loadingSol ? <span className="spinner" /> : <span style={{display:"flex", alignItems:"center", justifyContent:"center", gap:6}}><Droplet size={16} /> Solicitar SOL</span>}
            </button>
          </form>
        </div>

        {/* Stablecoin Faucet */}
        <div className="card" style={{ display: "flex", flexDirection: "column", border: "1px solid rgba(34, 197, 94, 0.2)" }}>
            <div className="card-header">
            <div className="card-icon green"><Coins size={24} /></div>
            <div style={{ flex: 1 }}>
              <div className="card-title">Stablecoin Creator</div>
              <div className="card-subtitle">Local USD para compra de bonos</div>
            </div>
            {localMintPubKey && (
              <button 
                onClick={resetMint} 
                className="btn btn-secondary btn-sm"
                title="Borrar mint actual y empezar de cero"
                style={{ padding: "4px 8px", fontSize: "0.7rem" }}
              >
                Reiniciar
              </button>
            )}
          </div>
          <form style={{ marginTop: 10, display: "flex", flex: 1, flexDirection: "column" }} onSubmit={requestStablecoins}>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Monto a acuñar <span>(USD)</span></label>
              <div style={{ position: "relative" }}>
                <input 
                  className="form-input" 
                  type="number" 
                  min="1" max="1000000" step="1" 
                  value={stableAmount} 
                  onChange={e => setStableAmount(e.target.value)} 
                  required 
                  style={{ paddingRight: 80, fontSize: "1.2rem", fontWeight: "700", borderColor: "rgba(34, 197, 94, 0.3)" }}
                />
                <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: "var(--accent-green)", fontWeight: "600" }}>USD</div>
              </div>
              {localMintPubKey && (
                 <div className="form-hint" style={{ color: "var(--accent-green)" }}>
                   Mint Activo: <span style={{fontFamily:"monospace"}}>{localMintPubKey.slice(0,8)}...</span>
                 </div>
              )}
            </div>
            <button type="submit" className="btn btn-success btn-full" disabled={loadingStable} style={{ marginTop: "auto" }}>
              {loadingStable ? <span className="spinner" /> : <span style={{display:"flex", alignItems:"center", justifyContent:"center", gap:6}}><Coins size={16} /> Mintear Stablecoin</span>}
            </button>
          </form>
        </div>
      </div>
      
      <div className="info-box" style={{ marginTop: 40 }}>
        <h4 style={{ margin: "0 0 10px 0", color: "var(--accent-blue)", display:"flex", alignItems:"center", gap:8 }}><Lightbulb size={18} /> Cómo usar estos tokens en la DApp</h4>
        <ol style={{ margin: 0, paddingLeft: 20, color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.6" }}>
          <li>Pide Local USD en el Faucet.</li>
          <li>Ve al <strong>Dashboard</strong> {">"} <strong>Emisor</strong>.</li>
          <li>En <strong>Stable Mint</strong>, pega el Mint Activo (cópialo de tu wallet o log).</li>
          <li>En <strong>Tu Cuenta de Bonos</strong>, crea un Token normal en tu wallet Phantom y usa su Token Account.</li>
          <li>¡Inicializa el listing y mira cómo aparece para los compradores!</li>
        </ol>
      </div>
    </div>
  );
}
