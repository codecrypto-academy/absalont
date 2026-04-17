/**
 * setup-localnet.ts
 *
 * Script de configuración para localnet que:
 * 1. Usa la CLI wallet (~/.config/solana/id.json) como autoridad
 * 2. Crea dos tokens (Token A y Token B) con mint authority = CLI wallet
 * 3. Mintea tokens a la CLI wallet Y a una wallet externa (ej. Phantom)
 * 4. Inicializa un market en el programa swap
 * 5. Agrega liquidez en ambos vaults
 * 6. Guarda las direcciones en setup-output.json para usarlas en el frontend
 *
 * Uso:
 *   npx ts-node scripts/setup-localnet.ts [WALLET_DESTINO]
 *
 * Ejemplo:
 *   npx ts-node scripts/setup-localnet.ts 5Q544f... (tu Phantom wallet address)
 */

import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// ─────────────────────────────────────────────
//  CONFIG
// ─────────────────────────────────────────────
const RPC_URL    = "http://127.0.0.1:8899";
const PROGRAM_ID = new PublicKey("9sJMyh2aoAGrSmsWArvLxDg7ZwJQhm3ixAPAA7cPJ3a7");
const DECIMALS   = 6;
const MINT_AMOUNT = 1_000_000 * Math.pow(10, DECIMALS); // 1M tokens

// ─────────────────────────────────────────────
//  LOAD CLI WALLET
// ─────────────────────────────────────────────
function loadCliWallet(): Keypair {
  const walletPath = path.join(os.homedir(), ".config", "solana", "id.json");
  const raw = fs.readFileSync(walletPath, "utf-8");
  const secretKey = Uint8Array.from(JSON.parse(raw));
  return Keypair.fromSecretKey(secretKey);
}

// ─────────────────────────────────────────────
//  MAIN
// ─────────────────────────────────────────────
async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  const payer      = loadCliWallet();

  console.log("─────────────────────────────────────");
  console.log("  SolanaSwap — Setup Localnet");
  console.log("─────────────────────────────────────");
  console.log("Authority (CLI wallet):", payer.publicKey.toBase58());

  // Airdrop SOL si la CLI wallet tiene poco balance
  const balance = await connection.getBalance(payer.publicKey);
  if (balance < 2 * LAMPORTS_PER_SOL) {
    console.log("→ Solicitando airdrop de SOL...");
    const sig = await connection.requestAirdrop(payer.publicKey, 5 * LAMPORTS_PER_SOL);
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight });
    console.log("  ✅ Airdrop completado");
  }

  // Wallet de destino adicional (argumento de línea de comandos)
  const extraWallets: PublicKey[] = [];
  const extraArg = process.argv[2];
  if (extraArg) {
    try {
      const extra = new PublicKey(extraArg);
      extraWallets.push(extra);
      console.log("Wallet extra (Phantom):", extra.toBase58());
    } catch {
      console.warn("⚠️  Dirección de wallet extra inválida, se omite.");
    }
  }

  // ── 1. Crear los Mints ──────────────────────
  console.log("\n→ Creando Token Mint A...");
  const mintA = await createMint(
    connection, payer,
    payer.publicKey,   // mint authority = CLI wallet
    null,
    DECIMALS, undefined, undefined, TOKEN_PROGRAM_ID
  );
  console.log("  Mint A:", mintA.toBase58());

  console.log("→ Creando Token Mint B...");
  const mintB = await createMint(
    connection, payer,
    payer.publicKey,
    null,
    DECIMALS, undefined, undefined, TOKEN_PROGRAM_ID
  );
  console.log("  Mint B:", mintB.toBase58());

  // ── 2. Crear ATAs para la CLI wallet ────────
  console.log("\n→ Creando cuentas de token para la CLI wallet...");
  const payerAtaA = await getOrCreateAssociatedTokenAccount(
    connection, payer, mintA, payer.publicKey
  );
  const payerAtaB = await getOrCreateAssociatedTokenAccount(
    connection, payer, mintB, payer.publicKey
  );

  // ── 3. Mintear tokens a la CLI wallet ───────
  console.log("→ Minteando tokens a la CLI wallet...");
  await mintTo(connection, payer, mintA, payerAtaA.address, payer.publicKey, MINT_AMOUNT);
  await mintTo(connection, payer, mintB, payerAtaB.address, payer.publicKey, MINT_AMOUNT);
  console.log(`  ✅ CLI wallet: 1,000,000 Token A + 1,000,000 Token B`);

  // ── 4. Mintear a wallets extra (Phantom) ────
  for (const extraPubkey of extraWallets) {
    console.log(`\n→ Minteando tokens a wallet extra: ${extraPubkey.toBase58()}...`);
    const extraAtaA = await getOrCreateAssociatedTokenAccount(
      connection, payer, mintA, extraPubkey
    );
    const extraAtaB = await getOrCreateAssociatedTokenAccount(
      connection, payer, mintB, extraPubkey
    );
    await mintTo(connection, payer, mintA, extraAtaA.address, payer.publicKey, MINT_AMOUNT);
    await mintTo(connection, payer, mintB, extraAtaB.address, payer.publicKey, MINT_AMOUNT);
    console.log(`  ✅ Phantom wallet: 1,000,000 Token A + 1,000,000 Token B`);
  }

  // ── 5. Derivar PDAs del market ───────────────
  const [marketPDA, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("market"), mintA.toBuffer(), mintB.toBuffer()],
    PROGRAM_ID
  );
  const [vaultAPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault_a"), marketPDA.toBuffer()],
    PROGRAM_ID
  );
  const [vaultBPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault_b"), marketPDA.toBuffer()],
    PROGRAM_ID
  );

  console.log("\n→ Market PDA:", marketPDA.toBase58());
  console.log("  Vault A:   ", vaultAPDA.toBase58());
  console.log("  Vault B:   ", vaultBPDA.toBase58());

  // ── 6. Inicializar el Market ─────────────────
  const walletAdapter = new anchor.Wallet(payer);
  const provider = new anchor.AnchorProvider(connection, walletAdapter, { commitment: "confirmed" });

  // Cargar el IDL del programa
  const idlPath = path.join(__dirname, "..", "target", "idl", "solana_swap_2025.json");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  // Usamos 'any' porque este es un script de utilidad con IDL cargado dinámicamente
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const program: any = new anchor.Program(idl, provider);

  // Verificar si el market ya existe
  let marketExists = false;
  try {
    await program.account.marketAccount.fetch(marketPDA);
    marketExists = true;
    console.log("\n⚠️  El market ya existe, saltando initialize_market...");
  } catch { /* no existe, lo creamos */ }

  const PRICE = new BN(2_500_000); // precio = 2.5 (× 10^6)

  if (!marketExists) {
    console.log("\n→ Inicializando market (precio: 2.5)...");
    await program.methods
      .initializeMarket(PRICE, DECIMALS, DECIMALS, bump)
      .accounts({
        market: marketPDA,
        tokenMintA: mintA,
        tokenMintB: mintB,
        vaultA: vaultAPDA,
        vaultB: vaultBPDA,
        authority: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([payer])
      .rpc();
    console.log("  ✅ Market inicializado con precio 2.5");
  }

  // ── 7. Agregar liquidez ──────────────────────
  const LIQUIDITY = new BN(500_000 * Math.pow(10, DECIMALS)); // 500k tokens
  console.log("\n→ Agregando liquidez (500,000 Token A + 500,000 Token B)...");
  await program.methods
    .addLiquidity(LIQUIDITY, LIQUIDITY)
    .accounts({
      market: marketPDA,
      tokenMintA: mintA,
      tokenMintB: mintB,
      autorityTokenA: payerAtaA.address,
      autorityTokenB: payerAtaB.address,
      vaultA: vaultAPDA,
      vaultB: vaultBPDA,
      authority: payer.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .signers([payer])
    .rpc();
  console.log("  ✅ Liquidez agregada");

  // ── 8. Guardar output ───────────────────────
  const output = {
    programId:   PROGRAM_ID.toBase58(),
    market:      marketPDA.toBase58(),
    vaultA:      vaultAPDA.toBase58(),
    vaultB:      vaultBPDA.toBase58(),
    mintA:       mintA.toBase58(),
    mintB:       mintB.toBase58(),
    authority:   payer.publicKey.toBase58(),
    price:       "2.5",
    decimals:    DECIMALS,
    liquidity:   "500,000",
    extras:      extraWallets.map(w => w.toBase58()),
    timestamp:   new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, "..", "setup-output.json");
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log("\n─────────────────────────────────────");
  console.log("  ✅ Setup completado exitosamente");
  console.log("─────────────────────────────────────");
  console.log("Datos guardados en: setup-output.json\n");
  console.log(JSON.stringify(output, null, 2));
  console.log("\n▶ Abre http://localhost:5173 para ver el market en el frontend.");
}

main().catch((err) => {
  console.error("❌ Error:", err?.message ?? err);
  process.exit(1);
});
