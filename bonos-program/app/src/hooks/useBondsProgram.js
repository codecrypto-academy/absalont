import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, SYSVAR_CLOCK_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import IDL from "../idl.json";
import toast from "react-hot-toast";

const PROGRAM_ID = new PublicKey("DtMmh3L7tDaEJ67THeKU3X8HRDXh7hK9zNGeGe2L9MD9");

function shortAddress(pk) {
  const s = pk.toString();
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

export function useBondsProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const provider = useMemo(() => {
    if (!wallet.publicKey) return null;
    return new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  }, [connection, wallet]);

  const program = useMemo(() => {
    if (!provider) return null;
    return new Program({ ...IDL, address: PROGRAM_ID.toBase58() }, provider);
  }, [provider]);

  // Derive listing PDA
  const getListingPDA = useCallback(
    (issuer, bondMint) => {
      return PublicKey.findProgramAddressSync(
        [Buffer.from("listing"), issuer.toBuffer(), bondMint.toBuffer()],
        PROGRAM_ID
      );
    },
    []
  );

  const getEscrowPDA = useCallback((bondListing) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), bondListing.toBuffer()],
      PROGRAM_ID
    );
  }, []);

  const getRedemptionPDA = useCallback((bondListing) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("redemption"), bondListing.toBuffer()],
      PROGRAM_ID
    );
  }, []);

  // Fetch all listings
  const fetchListings = useCallback(async () => {
    if (!program) return;
    try {
      const all = await program.account.bondListing.all();
      setListings(all);
    } catch (e) {
      console.error("fetchListings:", e);
    }
  }, [program]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings, refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  // ─── initializeListing ─────────────────────────────────────────────────────
  const initializeListing = useCallback(
    async ({ bondMint, stableMint, bondAmount, pricePerBond, maturityTimestamp, faceValue, tokenName, symbol, issuerBondAccount }) => {
      if (!program || !wallet.publicKey) throw new Error("Not connected");

      const bondMintPk = new PublicKey(bondMint);
      const stableMintPk = new PublicKey(stableMint);
      const issuerBondAccountPk = new PublicKey(issuerBondAccount);

      const [bondListing] = getListingPDA(wallet.publicKey, bondMintPk);
      const [escrowTokenAccount] = getEscrowPDA(bondListing);
      const [redemptionVault] = getRedemptionPDA(bondListing);

      setLoading(true);
      try {
        const tx = await program.methods
          .initializeListing(
            new BN(bondAmount),
            new BN(pricePerBond),
            new BN(maturityTimestamp),
            new BN(faceValue),
            tokenName,
            symbol
          )
          .accounts({
            issuer: wallet.publicKey,
            bondMint: bondMintPk,
            stableMint: stableMintPk,
            bondListing,
            escrowTokenAccount,
            redemptionVault,
            issuerBondAccount: issuerBondAccountPk,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .rpc();
        toast.success(`Listing creado! TX: ${shortAddress(tx)}`, { className: "toast-success", duration: 6000 });
        refresh();
        return tx;
      } finally {
        setLoading(false);
      }
    },
    [program, wallet, getListingPDA, getEscrowPDA, getRedemptionPDA]
  );

  // ─── purchaseBonds ─────────────────────────────────────────────────────────
  const purchaseBonds = useCallback(
    async ({ listingAddress, amount, buyerBondAccount, buyerStableAccount, issuerStableAccount }) => {
      if (!program || !wallet.publicKey) throw new Error("Not connected");

      const listingPk = new PublicKey(listingAddress);
      const listing = await program.account.bondListing.fetch(listingPk);
      const [escrowTokenAccount] = getEscrowPDA(listingPk);

      setLoading(true);
      try {
        const tx = await program.methods
          .purchaseBonds(new BN(amount))
          .accounts({
            buyer: wallet.publicKey,
            bondListing: listingPk,
            escrowTokenAccount,
            buyerBondAccount: new PublicKey(buyerBondAccount),
            buyerStableAccount: new PublicKey(buyerStableAccount),
            issuerStableAccount: new PublicKey(issuerStableAccount),
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();
        toast.success(`¡${amount} bono(s) comprado(s)! TX: ${shortAddress(tx)}`, { className: "toast-success", duration: 6000 });
        refresh();
        return tx;
      } finally {
        setLoading(false);
      }
    },
    [program, wallet, getEscrowPDA]
  );

  // ─── cancelListing ─────────────────────────────────────────────────────────
  const cancelListing = useCallback(
    async ({ listingAddress, issuerBondAccount }) => {
      if (!program || !wallet.publicKey) throw new Error("Not connected");

      const listingPk = new PublicKey(listingAddress);
      const [escrowTokenAccount] = getEscrowPDA(listingPk);

      setLoading(true);
      try {
        const tx = await program.methods
          .cancelListing()
          .accounts({
            issuer: wallet.publicKey,
            bondListing: listingPk,
            escrowTokenAccount,
            issuerBondAccount: new PublicKey(issuerBondAccount),
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();
        toast.success(`Listing cancelado. TX: ${shortAddress(tx)}`, { className: "toast-success", duration: 6000 });
        refresh();
        return tx;
      } finally {
        setLoading(false);
      }
    },
    [program, wallet, getEscrowPDA]
  );

  // ─── updatePrice ───────────────────────────────────────────────────────────
  const updatePrice = useCallback(
    async ({ listingAddress, newPrice }) => {
      if (!program || !wallet.publicKey) throw new Error("Not connected");

      const listingPk = new PublicKey(listingAddress);
      setLoading(true);
      try {
        const tx = await program.methods
          .updatePrice(new BN(newPrice))
          .accounts({
            issuer: wallet.publicKey,
            bondListing: listingPk,
          })
          .rpc();
        toast.success(`Precio actualizado. TX: ${shortAddress(tx)}`, { className: "toast-success", duration: 6000 });
        refresh();
        return tx;
      } finally {
        setLoading(false);
      }
    },
    [program, wallet]
  );

  // ─── addBondsToListing ─────────────────────────────────────────────────────
  const addBondsToListing = useCallback(
    async ({ listingAddress, extraAmount, issuerBondAccount }) => {
      if (!program || !wallet.publicKey) throw new Error("Not connected");

      const listingPk = new PublicKey(listingAddress);
      const [escrowTokenAccount] = getEscrowPDA(listingPk);

      setLoading(true);
      try {
        const tx = await program.methods
          .addBondsToListing(new BN(extraAmount))
          .accounts({
            issuer: wallet.publicKey,
            bondListing: listingPk,
            escrowTokenAccount,
            issuerBondAccount: new PublicKey(issuerBondAccount),
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();
        toast.success(`${extraAmount} bono(s) añadido(s). TX: ${shortAddress(tx)}`, { className: "toast-success", duration: 6000 });
        refresh();
        return tx;
      } finally {
        setLoading(false);
      }
    },
    [program, wallet, getEscrowPDA]
  );

  // ─── depositRedemptionFunds ────────────────────────────────────────────────
  const depositRedemptionFunds = useCallback(
    async ({ listingAddress, amount, issuerStableAccount }) => {
      if (!program || !wallet.publicKey) throw new Error("Not connected");

      const listingPk = new PublicKey(listingAddress);
      const [redemptionVault] = getRedemptionPDA(listingPk);

      setLoading(true);
      try {
        const tx = await program.methods
          .depositRedemptionFunds(new BN(amount))
          .accounts({
            issuer: wallet.publicKey,
            bondListing: listingPk,
            redemptionVault,
            issuerStableAccount: new PublicKey(issuerStableAccount),
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();
        toast.success(`Fondos depositados. TX: ${shortAddress(tx)}`, { className: "toast-success", duration: 6000 });
        refresh();
        return tx;
      } finally {
        setLoading(false);
      }
    },
    [program, wallet, getRedemptionPDA]
  );

  // ─── redeemBonds ──────────────────────────────────────────────────────────
  const redeemBonds = useCallback(
    async ({ listingAddress, amount, holderBondAccount, holderStableAccount }) => {
      if (!program || !wallet.publicKey) throw new Error("Not connected");

      const listingPk = new PublicKey(listingAddress);
      const listing = await program.account.bondListing.fetch(listingPk);
      const [escrowTokenAccount] = getEscrowPDA(listingPk);
      const [redemptionVault] = getRedemptionPDA(listingPk);

      setLoading(true);
      try {
        const tx = await program.methods
          .redeemBonds(new BN(amount))
          .accounts({
            holder: wallet.publicKey,
            bondListing: listingPk,
            escrowTokenAccount,
            redemptionVault,
            holderBondAccount: new PublicKey(holderBondAccount),
            holderStableAccount: new PublicKey(holderStableAccount),
            issuer: listing.issuer,
            tokenProgram: TOKEN_PROGRAM_ID,
            clock: SYSVAR_CLOCK_PUBKEY,
          })
          .rpc();
        toast.success(`¡${amount} bono(s) canjeado(s)! TX: ${shortAddress(tx)}`, { className: "toast-success", duration: 6000 });
        refresh();
        return tx;
      } finally {
        setLoading(false);
      }
    },
    [program, wallet, getEscrowPDA, getRedemptionPDA]
  );

  return {
    program,
    listings,
    loading,
    fetchListings,
    refresh,
    initializeListing,
    purchaseBonds,
    cancelListing,
    updatePrice,
    addBondsToListing,
    depositRedemptionFunds,
    redeemBonds,
    shortAddress,
  };
}
