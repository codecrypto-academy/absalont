import * as anchor from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Transaction } from "@solana/web3.js";

// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────
const RPC_URL      = "http://127.0.0.1:8899";
const PROGRAM_ID   = new PublicKey("9sJMyh2aoAGrSmsWArvLxDg7ZwJQhm3ixAPAA7cPJ3a7");
const PRICE_FACTOR = 1_000_000; // 10^6

const IDL = {
  address: "9sJMyh2aoAGrSmsWArvLxDg7ZwJQhm3ixAPAA7cPJ3a7",
  metadata: { name: "solanaSwap2025", version: "0.1.0", spec: "0.1.0" },
  instructions: [
    {
      name: "addLiquidity",
      discriminator: [181,157,89,67,143,182,52,72],
      accounts: [
        { name: "tokenMintA" },
        { name: "tokenMintB" },
        { name: "market", writable: true, pda: { seeds: [{ kind:"const", value:[109,97,114,107,101,116] },{ kind:"account", path:"tokenMintA" },{ kind:"account", path:"tokenMintB" }] } },
        { name: "vaultA", writable: true, pda: { seeds: [{ kind:"const", value:[118,97,117,108,116,95,97] },{ kind:"account", path:"market" }] } },
        { name: "vaultB", writable: true, pda: { seeds: [{ kind:"const", value:[118,97,117,108,116,95,98] },{ kind:"account", path:"market" }] } },
        { name: "autorityTokenA", writable: true },
        { name: "autorityTokenB", writable: true },
        { name: "authority", writable: true, signer: true },
        { name: "systemProgram", address: "11111111111111111111111111111111" },
        { name: "tokenProgram", address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
      ],
      args: [{ name: "amountA", type: "u64" }, { name: "amountB", type: "u64" }],
    },
    {
      name: "initializeMarket",
      discriminator: [35,129,133,8,229,228,143,191],
      accounts: [
        { name: "market", writable: true, pda: { seeds: [{ kind:"const", value:[109,97,114,107,101,116] },{ kind:"account", path:"tokenMintA" },{ kind:"account", path:"tokenMintB" }] } },
        { name: "tokenMintA" },
        { name: "tokenMintB" },
        { name: "vaultA", writable: true, pda: { seeds: [{ kind:"const", value:[118,97,117,108,116,95,97] },{ kind:"account", path:"market" }] } },
        { name: "vaultB", writable: true, pda: { seeds: [{ kind:"const", value:[118,97,117,108,116,95,98] },{ kind:"account", path:"market" }] } },
        { name: "authority", writable: true, signer: true },
        { name: "systemProgram", address: "11111111111111111111111111111111" },
        { name: "tokenProgram", address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { name: "rent", address: "SysvarRent111111111111111111111111111111111" },
      ],
      args: [{ name: "price", type: "u64" }, { name: "decimalsA", type: "u8" }, { name: "decimalsB", type: "u8" }, { name: "bump", type: "u8" }],
    },
    {
      name: "setPrice",
      discriminator: [16,19,182,8,149,83,72,181],
      accounts: [
        { name: "tokenMintA" },
        { name: "tokenMintB" },
        { name: "market", writable: true, pda: { seeds: [{ kind:"const", value:[109,97,114,107,101,116] },{ kind:"account", path:"tokenMintA" },{ kind:"account", path:"tokenMintB" }] } },
        { name: "authority", signer: true },
        { name: "systemProgram", address: "11111111111111111111111111111111" },
        { name: "tokenProgram", address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { name: "rent", address: "SysvarRent111111111111111111111111111111111" },
      ],
      args: [{ name: "price", type: "u64" }],
    },
    {
      name: "swap",
      discriminator: [248,198,158,145,225,117,135,200],
      accounts: [
        { name: "tokenMintA" },
        { name: "tokenMintB" },
        { name: "market", writable: true, pda: { seeds: [{ kind:"const", value:[109,97,114,107,101,116] },{ kind:"account", path:"tokenMintA" },{ kind:"account", path:"tokenMintB" }] } },
        { name: "vaultA", writable: true, pda: { seeds: [{ kind:"const", value:[118,97,117,108,116,95,97] },{ kind:"account", path:"market" }] } },
        { name: "vaultB", writable: true, pda: { seeds: [{ kind:"const", value:[118,97,117,108,116,95,98] },{ kind:"account", path:"market" }] } },
        { name: "userTokenA", writable: true },
        { name: "userTokenB", writable: true },
        { name: "user", writable: true, signer: true },
        { name: "systemProgram", address: "11111111111111111111111111111111" },
        { name: "tokenProgram", address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { name: "rent", address: "SysvarRent111111111111111111111111111111111" },
      ],
      args: [{ name: "amount", type: "u64" }, { name: "aToB", type: "bool" }],
    },
  ],
  accounts: [{ name: "MarketAccount", discriminator: [201,78,187,225,240,198,201,251] }],
  errors: [
    { code: 6000, name: "Unauthorized", msg: "You are not authorized to perform this action." },
    { code: 6001, name: "PriceNotSet", msg: "Exchange rate has not been set." },
    { code: 6002, name: "AmountOutTooSmall", msg: "Amount out is too small." },
    { code: 6003, name: "InvalidPriceForReverseSwap", msg: "Invalid price for reverse swap (price is zero)." },
    { code: 6004, name: "ZeroAmount", msg: "The amount must be greater than zero." },
    { code: 6005, name: "CalculationOverflow", msg: "Arithmetic overflow during calculation." },
  ],
  types: [{
    name: "MarketAccount",
    type: {
      kind: "struct",
      fields: [
        { name: "authority", type: "pubkey" },
        { name: "tokenMintA", type: "pubkey" },
        { name: "tokenMintB", type: "pubkey" },
        { name: "price", type: "u64" },
        { name: "decimalsA", type: "u8" },
        { name: "decimalsB", type: "u8" },
        { name: "bump", type: "u8" },
      ],
    },
  }],
};

// ─────────────────────────────────────────────
//  APP STATE
// ─────────────────────────────────────────────
const state = {
  connection: null,
  program: null,
  wallet: null,          // window.solana adapter
  walletPublicKey: null,
  markets: [],           // [{publicKey, account, vaultABalance, vaultBBalance}]
  selectedMarket: null,
  swapDirection: true,   // true = A→B, false = B→A
  refreshInterval: null,
  history: JSON.parse(localStorage.getItem("swap_history") || "[]"),
};

// ─────────────────────────────────────────────
//  DOM HELPERS
// ─────────────────────────────────────────────
const $  = (id) => document.getElementById(id);
const show = (id) => $( id )?.classList.remove("hidden");
const hide = (id) => $( id )?.classList.add("hidden");

// ─────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────
async function init() {
  state.connection = new Connection(RPC_URL, "confirmed");

  // Build a read-only provider (no wallet yet)
  const provider = new anchor.AnchorProvider(
    state.connection,
    { publicKey: PublicKey.default, signTransaction: async (tx) => tx, signAllTransactions: async (txs) => txs },
    { commitment: "confirmed" }
  );
  state.program = new anchor.Program(IDL, provider);

  setupWalletUI();
  await loadMarkets();

  // Auto-refresh every 15 s
  state.refreshInterval = setInterval(loadMarkets, 15_000);
}

// ─────────────────────────────────────────────
//  WALLET
// ─────────────────────────────────────────────
function setupWalletUI() {
  $("btn-connect-wallet").addEventListener("click", connectWallet);
  $("btn-disconnect").addEventListener("click", disconnectWallet);
  $("btn-airdrop").addEventListener("click", requestAirdrop);
}

async function connectWallet() {
  const provider = window.solana || window.phantom?.solana;
  if (!provider) {
    alert("⚠️ No se encontró Phantom wallet.\nInstálalo en https://phantom.app");
    return;
  }
  try {
    const resp = await provider.connect();
    state.wallet = provider;
    state.walletPublicKey = resp.publicKey;

    // Rebuild program with signing provider
    const walletAdapter = {
      publicKey: resp.publicKey,
      signTransaction: (tx) => provider.signTransaction(tx),
      signAllTransactions: (txs) => provider.signAllTransactions(txs),
    };
    const anchorProvider = new anchor.AnchorProvider(state.connection, walletAdapter, { commitment: "confirmed" });
    state.program = new anchor.Program(IDL, anchorProvider);

    updateWalletUI(true);
    await updateSolBalance();
    // Refresh swap panel if open
    if (state.selectedMarket) refreshSwapPanel();
  } catch (err) {
    console.error("Wallet connect error:", err);
  }
}

function disconnectWallet() {
  state.wallet?.disconnect?.();
  state.wallet = null;
  state.walletPublicKey = null;
  updateWalletUI(false);

  // Reset program to read-only
  const provider = new anchor.AnchorProvider(
    state.connection,
    { publicKey: PublicKey.default, signTransaction: async (tx) => tx, signAllTransactions: async (txs) => txs },
    { commitment: "confirmed" }
  );
  state.program = new anchor.Program(IDL, provider);
}

function updateWalletUI(connected) {
  if (connected) {
    const addr = state.walletPublicKey.toBase58();
    $("wallet-address").textContent = addr.slice(0, 4) + "\u2026" + addr.slice(-4);
    hide("btn-connect-wallet");
    show("wallet-info");
  } else {
    $("sol-balance").textContent = "0 SOL";
    hide("btn-airdrop");
    show("btn-connect-wallet");
    hide("wallet-info");
  }
}

// ─────────────────────────────────────────────
//  SOL BALANCE & AIRDROP
// ─────────────────────────────────────────────
async function updateSolBalance() {
  if (!state.walletPublicKey) return;
  try {
    const lamports = await state.connection.getBalance(state.walletPublicKey);
    const sol      = lamports / anchor.web3.LAMPORTS_PER_SOL;
    state.solBalance = sol;
    $("sol-balance").textContent = sol.toFixed(3) + " SOL";

    // Show airdrop button if low
    if (sol < 0.1) {
      show("btn-airdrop");
    } else {
      hide("btn-airdrop");
    }

    // Update warning inside swap panel
    if (state.selectedMarket) {
      if (sol < 0.001) show("sol-warning");
      else             hide("sol-warning");
    }
  } catch (_) {}
}

async function requestAirdrop() {
  if (!state.walletPublicKey) return;
  const btn = $("btn-airdrop");
  btn.classList.add("loading");
  btn.textContent = "\u23f3 Solicitando...";
  try {
    const sig = await state.connection.requestAirdrop(
      state.walletPublicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL   // 2 SOL
    );
    const { blockhash, lastValidBlockHeight } = await state.connection.getLatestBlockhash();
    await state.connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight });
    await updateSolBalance();
    btn.textContent = "\u2705 Listo!";
    setTimeout(() => { btn.textContent = "\ud83d\udca7 Airdrop"; }, 2000);
    // Refresh swap panel to re-enable button
    if (state.selectedMarket) refreshSwapPanel();
  } catch (err) {
    console.error("Airdrop error:", err);
    btn.textContent = "\u274c Error";
    setTimeout(() => { btn.textContent = "\ud83d\udca7 Airdrop"; }, 2000);
  } finally {
    btn.classList.remove("loading");
  }
}

// ─────────────────────────────────────────────
//  LOAD MARKETS
// ─────────────────────────────────────────────
async function loadMarkets() {
  setRefreshSpinning(true);

  try {
    // Fetch all MarketAccount PDAs
    const rawAccounts = await state.program.account.marketAccount.all();

    // Enrich with vault balances
    const enriched = await Promise.all(
      rawAccounts.map(async ({ publicKey, account }) => {
        const [vaultAPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("vault_a"), publicKey.toBuffer()],
          PROGRAM_ID
        );
        const [vaultBPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("vault_b"), publicKey.toBuffer()],
          PROGRAM_ID
        );

        let vaultABalance = null;
        let vaultBBalance = null;
        let userBalA = null;
        let userBalB = null;

        try {
          const [balA, balB] = await Promise.all([
            state.connection.getTokenAccountBalance(vaultAPDA),
            state.connection.getTokenAccountBalance(vaultBPDA),
          ]);
          vaultABalance = balA.value;
          vaultBBalance = balB.value;
        } catch (_) { /* vaults may not exist yet */ }

        // Fetch user balance if wallet connected
        if (state.walletPublicKey) {
          try {
            const [ataA, ataB] = await Promise.all([
              getAssociatedTokenAddress(account.tokenMintA, state.walletPublicKey),
              getAssociatedTokenAddress(account.tokenMintB, state.walletPublicKey),
            ]);
            const [uBalA, uBalB] = await Promise.all([
              state.connection.getTokenAccountBalance(ataA).catch(() => ({ value: { uiAmount: 0 } })),
              state.connection.getTokenAccountBalance(ataB).catch(() => ({ value: { uiAmount: 0 } })),
            ]);
            userBalA = uBalA.value.uiAmount;
            userBalB = uBalB.value.uiAmount;
          } catch (_) {}
        }

        return { publicKey, account, vaultAPDA, vaultBPDA, vaultABalance, vaultBBalance, userBalA, userBalB };
      })
    );

    state.markets = enriched;
    renderMarkets(enriched);
    updateStats(enriched);
    hide("state-container");

  } catch (err) {
    console.error("Error loading markets:", err);
    if (state.markets.length === 0) {
      $("error-message").textContent = "No se pudo conectar al validator local en " + RPC_URL;
      showState("state-error");
    }
  } finally {
    setRefreshSpinning(false);
  }
}

function showState(which) {
  show("state-container");
  hide("state-loading");
  hide("state-empty");
  hide("state-error");
  show(which);
}

function setRefreshSpinning(on) {
  const btn = $("btn-refresh");
  if (on) btn.classList.add("spinning");
  else btn.classList.remove("spinning");
}

// ─────────────────────────────────────────────
//  STATS
// ─────────────────────────────────────────────
function updateStats(markets) {
  $("stat-markets").textContent = markets.length;
  const totalVaults = markets.reduce((acc, m) => {
    const a = m.vaultABalance?.uiAmount ?? 0;
    const b = m.vaultBBalance?.uiAmount ?? 0;
    return acc + a + b;
  }, 0);
  $("stat-tvl").textContent = formatAmount(totalVaults);
}

// ─────────────────────────────────────────────
//  RENDER MARKETS
// ─────────────────────────────────────────────
function renderMarkets(markets) {
  const grid = $("markets-grid");
  grid.innerHTML = "";

  if (markets.length === 0) {
    showState("state-empty");
    return;
  }

  hide("state-container");

  markets.forEach((market, idx) => {
    const card = buildMarketCard(market, idx);
    grid.appendChild(card);
  });
}

function buildMarketCard(market, idx) {
  const { publicKey, account, vaultABalance, vaultBBalance } = market;
  const price      = account.price.toNumber() / PRICE_FACTOR;
  const mintA      = account.tokenMintA.toBase58();
  const mintB      = account.tokenMintB.toBase58();
  const authority  = account.authority.toBase58();
  const balA       = vaultABalance?.uiAmount ?? 0;
  const balB       = vaultBBalance?.uiAmount ?? 0;
  const total      = balA + balB;
  const pctA       = total > 0 ? (balA / total) * 100 : 50;

  const labelA = "TK" + String.fromCharCode(65 + idx * 2);
  const labelB = "TK" + String.fromCharCode(66 + idx * 2);

  const card = document.createElement("div");
  const hasBalance = (market.userBalA ?? 0) > 0 || (market.userBalB ?? 0) > 0;
  card.className = `market-card ${hasBalance ? "has-funds" : "no-funds"}`;
  card.dataset.marketIdx = idx;
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.id = "market-card-" + idx;

  card.innerHTML = `
    <div class="card-header">
      <div class="pair-info">
        <div class="pair-icons">
          <div class="token-circle a">${labelA[0]}</div>
          <div class="token-circle b">${labelB[0]}</div>
        </div>
        <div>
          <div class="pair-name">
            <span>${labelA}</span>
            <span class="arrow-icon">⇄</span>
            <span>${labelB}</span>
          </div>
          <div class="mono" style="font-size:11px;color:var(--text-muted);margin-top:2px;">
            Market ${idx + 1}
          </div>
        </div>
      </div>
      <span class="card-badge">● Activo</span>
    </div>

    <div class="card-stats">
      <div class="card-stat">
        <div class="cs-label">💰 Precio</div>
        <div class="cs-value">${price.toFixed(4)}</div>
        <div class="cs-sub">${labelA} por ${labelB}</div>
      </div>

      <div class="card-stat">
        <div class="cs-label">🧬 Mints</div>
        <div class="cs-value mono" style="font-size:10px">${mintA.slice(0,4)}…${mintA.slice(-4)}</div>
        <div class="cs-sub">${mintB.slice(0,4)}…${mintB.slice(-4)}</div>
      </div>

      <div class="card-stat">
        <div class="cs-label">🏦 Vault A</div>
        <div class="cs-value">${formatAmount(balA)}</div>
        <div class="cs-sub">${labelA}</div>
      </div>

      <div class="card-stat">
        <div class="cs-label">🏦 Vault B</div>
        <div class="cs-value">${formatAmount(balB)}</div>
        <div class="cs-sub">${labelB}</div>
      </div>

      <!-- User Balances -->
      ${state.walletPublicKey ? `
      <div class="user-card-balances">
        <div class="usb-item ${market.userBalA > 0 ? 'has-bal' : ''}">
          <span>Tu ${labelA}:</span>
          <strong>${formatAmount(market.userBalA ?? 0)}</strong>
        </div>
        <div class="usb-item ${market.userBalB > 0 ? 'has-bal' : ''}">
          <span>Tu ${labelB}:</span>
          <strong>${formatAmount(market.userBalB ?? 0)}</strong>
        </div>
      </div>
      ` : ''}

      <div class="vault-bar-wrap">
        <div class="vault-bar-labels">
          <span>${labelA} ${pctA.toFixed(1)}%</span>
          <span>${(100 - pctA).toFixed(1)}% ${labelB}</span>
        </div>
        <div class="vault-bar-track">
          <div class="vault-bar-a" style="width:${pctA}%"></div>
          <div class="vault-bar-b"></div>
        </div>
      </div>
    </div>

    <div class="card-footer">
      <div>
        <div class="authority-label">Authority</div>
        <div class="authority-addr">${authority.slice(0,4)}…${authority.slice(-4)}</div>
      </div>
      <button class="btn-open-swap" id="swap-btn-${idx}">
        ⚡ Swap
      </button>
    </div>
  `;

  // Open swap panel on card click or button click
  card.querySelector(`#swap-btn-${idx}`).addEventListener("click", (e) => {
    e.stopPropagation();
    openSwapPanel(market, labelA, labelB);
  });
  card.addEventListener("click", () => openSwapPanel(market, labelA, labelB));
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") openSwapPanel(market, labelA, labelB);
  });

  return card;
}

// ─────────────────────────────────────────────
//  SWAP PANEL
// ─────────────────────────────────────────────
function openSwapPanel(market, labelA, labelB) {
  state.selectedMarket = market;
  state.swapDirection  = true;
  state.labelA = labelA;
  state.labelB = labelB;

  const price = market.account.price.toNumber() / PRICE_FACTOR;

  $("modal-pair-title").textContent = `⚡ Swap ${labelA} ⇄ ${labelB}`;
  $("btn-a-to-b").textContent  = `${labelA} → ${labelB}`;
  $("btn-b-to-a").textContent  = `${labelB} → ${labelA}`;
  $("preview-price").textContent = `1 ${labelA} = ${price.toFixed(4)} ${labelB}`;

  updateSwapDirection(true);
  refreshSwapPanel();
  hide("tx-result");

  show("modal-overlay");
  document.body.style.overflow = "hidden";
}

function closeSwapPanel() {
  hide("modal-overlay");
  document.body.style.overflow = "";
  state.selectedMarket = null;
}

async function refreshSwapPanel() {
  if (!state.walletPublicKey || !state.selectedMarket) {
    $("token-accounts-info").innerHTML = `<p class="ta-hint">💡 Conecta tu wallet para ver saldos y ejecutar el swap.</p>`;
    hide("sol-warning");
    $("btn-execute-swap").disabled = true;
    $("btn-execute-swap").textContent = "Conecta tu wallet primero";
    return;
  }

  // Check SOL balance first
  await updateSolBalance();
  if ((state.solBalance ?? 0) < 0.001) {
    show("sol-warning");
  } else {
    hide("sol-warning");
  }

  const market = state.selectedMarket;
  const mintA  = market.account.tokenMintA;
  const mintB  = market.account.tokenMintB;

  try {
    const [ataA, ataB] = await Promise.all([
      getAssociatedTokenAddress(mintA, state.walletPublicKey),
      getAssociatedTokenAddress(mintB, state.walletPublicKey),
    ]);

    let balA = 0, balB = 0;
    let ataAExists = false, ataBExists = false;

    try {
      await getAccount(state.connection, ataA);
      ataAExists = true;
      balA = (await state.connection.getTokenAccountBalance(ataA)).value.uiAmount ?? 0;
    } catch (_) {}

    try {
      await getAccount(state.connection, ataB);
      ataBExists = true;
      balB = (await state.connection.getTokenAccountBalance(ataB)).value.uiAmount ?? 0;
    } catch (_) {}

    state.userAtaA    = ataA;
    state.userAtaB    = ataB;
    state.ataAExists  = ataAExists;
    state.ataBExists  = ataBExists;

    // Warn if ATAs need to be created
    const missingAtas = [];
    if (!ataAExists) missingAtas.push(state.labelA);
    if (!ataBExists) missingAtas.push(state.labelB);

    // Differentiate modal style if accounts are missing
    if (missingAtas.length > 0) {
      $("swap-panel").classList.add("missing-accounts");
    } else {
      $("swap-panel").classList.remove("missing-accounts");
    }

    const ataHint = missingAtas.length > 0
      ? `<p class="ta-hint" style="color:var(--red);border-color:rgba(239,68,68,0.3);background:rgba(239,68,68,0.05)">⚠️ Token account${missingAtas.length > 1 ? 's' : ''} de <strong>${missingAtas.join(' y ')}</strong> no existe${missingAtas.length > 1 ? 'n' : ''}. Se crearán automáticamente al hacer swap.</p>`
      : '';

    $("token-accounts-info").innerHTML = `
      ${ataHint}
      <div class="ta-balances">
        <div class="ta-item">
          <div class="ta-label">${state.labelA} Balance</div>
          <div class="ta-value" style="color:var(--cyan)">${ataAExists ? formatAmount(balA) : '— (nueva)'}</div>
        </div>
        <div class="ta-item">
          <div class="ta-label">${state.labelB} Balance</div>
          <div class="ta-value" style="color:#a78bfa">${ataBExists ? formatAmount(balB) : '— (nueva)'}</div>
        </div>
      </div>`;

    $("btn-execute-swap").disabled = false;
    $("swap-amount").disabled = false; // Asegurar que el input esté activo
    $("btn-execute-swap").textContent = missingAtas.length > 0
      ? `⚡ Crear cuentas y Swap`
      : `⚡ Ejecutar Swap`;
  } catch (err) {
    console.error("Error loading token accounts:", err);
  }
}

function updateSwapDirection(aToB) {
  state.swapDirection = aToB;
  const la = state.labelA ?? "Token A";
  const lb = state.labelB ?? "Token B";

  $("btn-a-to-b").classList.toggle("active", aToB);
  $("btn-b-to-a").classList.toggle("active", !aToB);

  if (aToB) {
    $("swap-input-label").textContent = `Cantidad de ${la}`;
    $("swap-suffix").textContent       = la.slice(0, 3);
  } else {
    $("swap-input-label").textContent = `Cantidad de ${lb}`;
    $("swap-suffix").textContent       = lb.slice(0, 3);
  }

  $("swap-amount").value = "";
  $("preview-out").textContent = "—";
  updatePreview();
}

function updatePreview() {
  const amount = parseFloat($("swap-amount").value);
  if (!state.selectedMarket || isNaN(amount) || amount <= 0) {
    $("preview-out").textContent = "—";
    return;
  }

  const price = state.selectedMarket.account.price.toNumber() / PRICE_FACTOR;
  const la = state.labelA ?? "A";
  const lb = state.labelB ?? "B";

  if (state.swapDirection) {
    // A → B: amount * price
    const out = amount * price;
    $("preview-out").textContent = `${formatAmount(out)} ${lb}`;
  } else {
    // B → A: amount / price
    const out = price > 0 ? amount / price : 0;
    $("preview-out").textContent = `${formatAmount(out)} ${la}`;
  }
}

async function executeSwap() {
  if (!state.walletPublicKey || !state.selectedMarket) return;

  const amountRaw = parseFloat($("swap-amount").value);
  if (isNaN(amountRaw) || amountRaw <= 0) {
    alert("Ingresa una cantidad válida mayor a 0.");
    return;
  }

  const market   = state.selectedMarket;
  const decimals = state.swapDirection ? market.account.decimalsA : market.account.decimalsB;
  const amountU64 = new anchor.BN(Math.floor(amountRaw * Math.pow(10, decimals)));

  // ── Pre-validación: verificar saldo de tokens suficiente ──
  const sourceAta  = state.swapDirection ? state.userAtaA : state.userAtaB;
  const sourceMint = state.swapDirection ? market.account.tokenMintA : market.account.tokenMintB;
  const tokenLabel = state.swapDirection ? state.labelA : state.labelB;
  try {
    const balInfo = await state.connection.getTokenAccountBalance(sourceAta);
    const balRaw  = BigInt(balInfo.value.amount);
    const needRaw = BigInt(amountU64.toString());
    if (balRaw < needRaw) {
      const available = balInfo.value.uiAmountString;
      alert(
        `⚠️ Fondos insuficientes en ${tokenLabel}\n\n` +
        `Quieres enviar: ${amountRaw} ${tokenLabel}\n` +
        `Disponible:     ${available} ${tokenLabel}\n\n` +
        `Reduce la cantidad o consigue más tokens.`
      );
      return;
    }
  } catch (_) {
    // ATA recién creada, saldo = 0
    alert(
      `⚠️ Tu cuenta de ${tokenLabel} no tiene tokens.\n\n` +
      `Necesitas tener tokens de ${tokenLabel} para realizar este swap.\n` +
      `Si eres la autoridad del market, deposita liquidez primero con add_liquidity.`
    );
    return;
  }

  const btn = $("btn-execute-swap");
  btn.disabled = true;
  hide("tx-result");

  try {
    const [vaultAPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault_a"), market.publicKey.toBuffer()],
      PROGRAM_ID
    );
    const [vaultBPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault_b"), market.publicKey.toBuffer()],
      PROGRAM_ID
    );

    // ── Step 1: Create missing ATAs if needed ──
    const missingAtaIxs = [];
    if (!state.ataAExists) {
      missingAtaIxs.push(
        createAssociatedTokenAccountInstruction(
          state.walletPublicKey,           // payer
          state.userAtaA,                  // ata address
          state.walletPublicKey,           // owner
          market.account.tokenMintA,       // mint
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }
    if (!state.ataBExists) {
      missingAtaIxs.push(
        createAssociatedTokenAccountInstruction(
          state.walletPublicKey,
          state.userAtaB,
          state.walletPublicKey,
          market.account.tokenMintB,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }

    if (missingAtaIxs.length > 0) {
      btn.textContent = "⏳ Creando cuentas de tokens…";
      const setupTx = new Transaction().add(...missingAtaIxs);
      const { blockhash, lastValidBlockHeight } = await state.connection.getLatestBlockhash();
      setupTx.recentBlockhash = blockhash;
      setupTx.feePayer = state.walletPublicKey;
      const signedSetup = await state.wallet.signTransaction(setupTx);
      const setupSig = await state.connection.sendRawTransaction(signedSetup.serialize());
      await state.connection.confirmTransaction({ signature: setupSig, blockhash, lastValidBlockHeight });
      // Mark ATAs as now existing
      state.ataAExists = true;
      state.ataBExists = true;
    }

    // ── Step 2: Execute the swap ──
    btn.textContent = "⏳ Enviando swap…";
    const tx = await state.program.methods
      .swap(amountU64, state.swapDirection)
      .accounts({
        tokenMintA: market.account.tokenMintA,
        tokenMintB: market.account.tokenMintB,
        market: market.publicKey,
        vaultA: vaultAPDA,
        vaultB: vaultBPDA,
        userTokenA: state.userAtaA,
        userTokenB: state.userAtaB,
        user: state.walletPublicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    // Show success
    $("tx-link").href = `https://explorer.solana.com/tx/${tx}?cluster=custom&customUrl=${encodeURIComponent(RPC_URL)}`;
    $("tx-link").textContent = tx.slice(0, 8) + "…" + tx.slice(-8) + " →";
    show("tx-result");

    // Reload balances & markets
    await refreshSwapPanel();
    await loadMarkets();

    // ── Guardar en Historial ──
    const price = market.account.price.toNumber() / PRICE_FACTOR;
    let totalOut = 0;
    if (state.swapDirection) {
      totalOut = amountRaw * price;
    } else {
      totalOut = price > 0 ? amountRaw / price : 0;
    }

    const txRecord = {
      id: tx,
      timestamp: Date.now(),
      labelA: state.labelA,
      labelB: state.labelB,
      sentAmount: amountRaw,
      receivedAmount: totalOut,
      direction: state.swapDirection,
    };
    addTransactionToHistory(txRecord);

  } catch (err) {
    console.error("Swap error:", err);
    const msg = err?.message ?? "";
    const logs = (err?.logs ?? []).join(" ");

    if (msg.includes("no record of a prior credit") || msg.includes("insufficient lamports")) {
      // Sin SOL para fees
      show("sol-warning");
      show("btn-airdrop");
      alert("⚠️ Tu wallet no tiene SOL en localnet.\n\nUsa el botón 💧 Airdrop del header para obtener SOL de prueba y vuelve a intentarlo.");
    } else if (
      msg.includes("0x1") ||
      logs.includes("insufficient funds") ||
      logs.includes("custom program error: 0x1")
    ) {
      // Tokens insuficientes en la ATA del usuario
      const tokenLabel = state.swapDirection ? state.labelA : state.labelB;
      alert(
        `⚠️ Fondos insuficientes en ${tokenLabel}\n\n` +
        `La cuenta de tokens no tiene suficiente saldo para realizar este swap.\n\n` +
        `Si eres la authority del market, agrega liquidez primero (add_liquidity).\n` +
        `Si eres trader, necesitas obtener tokens de ${tokenLabel}.`
      );
    } else {
      alert("❌ Error en el swap:\n" + (msg || JSON.stringify(err)));
    }
    await updateSolBalance();
  } finally {
    btn.disabled = false;
    btn.textContent = "⚡ Ejecutar Swap";
  }
}

// ─────────────────────────────────────────────
//  MAX AMOUNT HELPER
// ─────────────────────────────────────────────
async function setMaxAmount() {
  if (!state.walletPublicKey || !state.selectedMarket) return;
  const sourceAta = state.swapDirection ? state.userAtaA : state.userAtaB;
  if (!sourceAta) return;
  try {
    const balInfo = await state.connection.getTokenAccountBalance(sourceAta);
    const uiAmount = balInfo.value.uiAmountString;
    $("swap-amount").value = uiAmount;
    updatePreview();
  } catch (_) {
    $("swap-amount").value = "0";
  }
}

// ─────────────────────────────────────────────
//  EVENT LISTENERS (MODAL)
// ─────────────────────────────────────────────
function setupModalListeners() {
  $("modal-close").addEventListener("click", closeSwapPanel);
  $("modal-overlay").addEventListener("click", (e) => {
    if (e.target === $("modal-overlay")) closeSwapPanel();
  });

  $("btn-a-to-b").addEventListener("click", () => updateSwapDirection(true));
  $("btn-b-to-a").addEventListener("click", () => updateSwapDirection(false));

  $("swap-amount").addEventListener("input", updatePreview);

  // MAX button (added dynamically, so use event delegation)
  document.addEventListener("click", (e) => {
    if (e.target?.id === "btn-max-amount") setMaxAmount();
  });

  $("btn-execute-swap").addEventListener("click", executeSwap);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSwapPanel();
  });

  // Handle Hash Routing (Deep-linking)
  window.addEventListener("hashchange", handleRouting);
  // Also check on initial load
  setTimeout(handleRouting, 500); // Wait bit for markets to load
}

function handleRouting() {
  const hash = window.location.hash;
  if (hash === "#swap-panel") {
    // If we have markets, open the first one by default as a gateway
    if (state.markets && state.markets.length > 0) {
      if (!state.selectedMarket) {
        const m = state.markets[0];
        // En cada tarjeta usamos etiquetas dinámicas (TKA, TKB, etc)
        // Como fallback usamos las de la primera tarjeta
        const labelA = "TKA";
        const labelB = "TKB";
        openSwapPanel(m, labelA, labelB);
      }
    } else {
      // If no markets yet, wait for loadMarkets to finish or scroll
      document.getElementById("markets")?.scrollIntoView({ behavior: "smooth" });
    }
  } else if (hash === "#markets") {
    document.getElementById("markets")?.scrollIntoView({ behavior: "smooth" });
  }
}

// ─────────────────────────────────────────────
//  REFRESH & CLEAR BUTTONS
// ─────────────────────────────────────────────
$("btn-refresh").addEventListener("click", loadMarkets);
$("btn-clear-history").addEventListener("click", clearHistory);

// Initial history render
renderHistory();

// ─────────────────────────────────────────────
//  TRANSACTION HISTORY
// ─────────────────────────────────────────────
function addTransactionToHistory(tx) {
  state.history.unshift(tx);
  if (state.history.length > 50) state.history.pop(); // Mantener últimos 50
  localStorage.setItem("swap_history", JSON.stringify(state.history));
  renderHistory();
}

function renderHistory() {
  const container = $("activity-section");
  const list = $("history-list");
  
  if (state.history.length === 0) {
    hide("activity-section");
    return;
  }
  
  show("activity-section");
  list.innerHTML = state.history.map(tx => {
    const date = new Date(tx.timestamp).toLocaleString();
    const fromLabel = tx.direction ? tx.labelA : tx.labelB;
    const toLabel = tx.direction ? tx.labelB : tx.labelA;
    const link = `https://explorer.solana.com/tx/${tx.id}?cluster=custom&customUrl=${encodeURIComponent(RPC_URL)}`;

    return `
      <div class="history-item">
        <div class="hi-icon">🔄</div>
        <div class="hi-info">
          <div class="hi-title">Swap ${fromLabel} → ${toLabel}</div>
          <div class="hi-date">${date}</div>
        </div>
        <div class="hi-amounts">
          <div class="hi-sent">-${tx.sentAmount} ${fromLabel}</div>
          <div class="hi-received">+${tx.receivedAmount.toFixed(4)} ${toLabel}</div>
        </div>
        <div class="hi-action">
          <a href="${link}" target="_blank" class="btn-view-tx">
            Ver TX
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </div>
      </div>
    `;
  }).join("");
}

function clearHistory() {
  if (confirm("¿Seguro que quieres borrar todo el historial?")) {
    state.history = [];
    localStorage.removeItem("swap_history");
    renderHistory();
  }
}

// ─────────────────────────────────────────────
//  UTILITIES
// ─────────────────────────────────────────────
function formatAmount(n) {
  if (n === null || n === undefined) return "—";
  if (n === 0) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(2) + "K";
  return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

// ─────────────────────────────────────────────
//  BOOT
// ─────────────────────────────────────────────
setupModalListeners();
init().catch(console.error);
