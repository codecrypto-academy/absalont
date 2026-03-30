import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BonosProgram } from "../target/types/bonos_program";
import {
  createMint,
  createAccount,
  mintTo,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";

describe("bonos-program", () => {
  // Use configured provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.BonosProgram as Program<BonosProgram>;
  const connection = provider.connection;

  let issuer: anchor.web3.Keypair;
  let buyer: anchor.web3.Keypair;
  let bondMint: anchor.web3.PublicKey;
  let stableMint: anchor.web3.PublicKey;
  let bondListing: anchor.web3.PublicKey;
  let escrowTokenAccount: anchor.web3.PublicKey;
  let redemptionVault: anchor.web3.PublicKey;
  let issuerBondAccount: anchor.web3.PublicKey;
  let issuerStableAccount: anchor.web3.PublicKey;
  let buyerBondAccount: anchor.web3.PublicKey;
  let buyerStableAccount: anchor.web3.PublicKey;

  // Test parameters
  const BOND_AMOUNT = new anchor.BN(100);
  const PRICE_PER_BOND = new anchor.BN(1000);
  const FACE_VALUE = new anchor.BN(1100);
  const MATURITY_SECONDS = 10; // 10 seconds from now

  let maturityTimestamp: anchor.BN;

  before(async () => {
    issuer = anchor.web3.Keypair.generate();
    buyer = anchor.web3.Keypair.generate();

    // Airdrop SOL to issuer and buyer
    await Promise.all([
      connection.confirmTransaction(
        await connection.requestAirdrop(
          issuer.publicKey,
          2 * anchor.web3.LAMPORTS_PER_SOL
        )
      ),
      connection.confirmTransaction(
        await connection.requestAirdrop(
          buyer.publicKey,
          2 * anchor.web3.LAMPORTS_PER_SOL
        )
      ),
    ]);

    // Create bond and stable mints
    bondMint = await createMint(connection, issuer, issuer.publicKey, null, 0);
    stableMint = await createMint(
      connection,
      issuer,
      issuer.publicKey,
      null,
      6
    );

    // Derive PDAs
    [bondListing] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("listing"),
        issuer.publicKey.toBuffer(),
        bondMint.toBuffer(),
      ],
      program.programId
    );
    [escrowTokenAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), bondListing.toBuffer()],
      program.programId
    );
    [redemptionVault] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("redemption"), bondListing.toBuffer()],
      program.programId
    );

    // Create token accounts
    issuerBondAccount = await createAccount(
      connection,
      issuer,
      bondMint,
      issuer.publicKey
    );
    issuerStableAccount = await createAccount(
      connection,
      issuer,
      stableMint,
      issuer.publicKey
    );
    buyerBondAccount = await createAccount(
      connection,
      buyer,
      bondMint,
      buyer.publicKey
    );
    buyerStableAccount = await createAccount(
      connection,
      issuer,
      stableMint,
      buyer.publicKey
    );

    // Mint 200 bonds to issuer
    await mintTo(connection, issuer, bondMint, issuerBondAccount, issuer, 200);
    // Mint enough stablecoins for buyer purchases + redemption
    await mintTo(
      connection,
      issuer,
      stableMint,
      buyerStableAccount,
      issuer,
      200_000
    );
    await mintTo(
      connection,
      issuer,
      stableMint,
      issuerStableAccount,
      issuer,
      500_000
    );

    // Set maturity timestamp 10 seconds from now
    maturityTimestamp = new anchor.BN(
      Math.floor(Date.now() / 1000) + MATURITY_SECONDS
    );
  });

  // ─── Test 1: Initialize Listing ──────────────────────────────────────────

  it("1. Initializes a listing", async () => {
    await program.methods
      .initializeListing(
        BOND_AMOUNT,
        PRICE_PER_BOND,
        maturityTimestamp,
        FACE_VALUE,
        "Test Bond",
        "TB"
      )
      .accounts({
        issuer: issuer.publicKey,
        bondMint,
        stableMint,
        bondListing,
        escrowTokenAccount,
        redemptionVault,
        issuerBondAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([issuer])
      .rpc();

    const listing = await program.account.bondListing.fetch(bondListing);
    assert.equal(listing.issuer.toString(), issuer.publicKey.toString());
    assert.equal(listing.availableBonds.toString(), BOND_AMOUNT.toString());
    assert.equal(listing.totalBonds.toString(), BOND_AMOUNT.toString());
    assert.equal(listing.pricePerBond.toString(), PRICE_PER_BOND.toString());
    assert.equal(listing.tokenName, "Test Bond");
    assert.equal(listing.tokenSymbol, "TB");
    assert.equal(listing.isActive, true);

    const escrow = await getAccount(connection, escrowTokenAccount);
    assert.equal(escrow.amount.toString(), BOND_AMOUNT.toString());
  });

  // ─── Test 2: Purchase Bonds ───────────────────────────────────────────────

  it("2. Purchases bonds", async () => {
    const purchaseAmount = new anchor.BN(10);

    const listingBefore = await program.account.bondListing.fetch(bondListing);
    const expectedRemaining = listingBefore.availableBonds.sub(purchaseAmount);

    await program.methods
      .purchaseBonds(purchaseAmount)
      .accounts({
        buyer: buyer.publicKey,
        bondListing,
        escrowTokenAccount,
        buyerBondAccount,
        buyerStableAccount,
        issuerStableAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc();

    const listing = await program.account.bondListing.fetch(bondListing);
    assert.equal(
      listing.availableBonds.toString(),
      expectedRemaining.toString()
    );

    const buyerBonds = await getAccount(connection, buyerBondAccount);
    assert.equal(buyerBonds.amount.toString(), purchaseAmount.toString());
  });

  // ─── Test 3: Update Price ─────────────────────────────────────────────────

  it("3. Updates price", async () => {
    const newPrice = new anchor.BN(1200);

    await program.methods
      .updatePrice(newPrice)
      .accounts({
        issuer: issuer.publicKey,
        bondListing,
      })
      .signers([issuer])
      .rpc();

    const listing = await program.account.bondListing.fetch(bondListing);
    assert.equal(listing.pricePerBond.toString(), newPrice.toString());

    // Reset price for subsequent tests
    await program.methods
      .updatePrice(PRICE_PER_BOND)
      .accounts({
        issuer: issuer.publicKey,
        bondListing,
      })
      .signers([issuer])
      .rpc();
  });

  // ─── Test 4: Add More Bonds ───────────────────────────────────────────────

  it("4. Adds more bonds to listing", async () => {
    const extraAmount = new anchor.BN(20);

    const listingBefore = await program.account.bondListing.fetch(bondListing);
    const expectedAvailable = listingBefore.availableBonds.add(extraAmount);

    await program.methods
      .addBondsToListing(extraAmount)
      .accounts({
        issuer: issuer.publicKey,
        bondListing,
        escrowTokenAccount,
        issuerBondAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([issuer])
      .rpc();

    const listing = await program.account.bondListing.fetch(bondListing);
    assert.equal(
      listing.availableBonds.toString(),
      expectedAvailable.toString()
    );
  });

  // ─── Test 5: Cancel Listing ───────────────────────────────────────────────

  it("5. Cancels the listing", async () => {
    // First re-initialize a fresh listing for this test only
    // We'll use a secondary bond mint
    const bondMint2 = await createMint(
      connection,
      issuer,
      issuer.publicKey,
      null,
      0
    );
    const [bondListing2] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("listing"),
        issuer.publicKey.toBuffer(),
        bondMint2.toBuffer(),
      ],
      program.programId
    );
    const [escrow2] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), bondListing2.toBuffer()],
      program.programId
    );
    const [redemption2] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("redemption"), bondListing2.toBuffer()],
      program.programId
    );
    const issuerBondAccount2 = await createAccount(
      connection,
      issuer,
      bondMint2,
      issuer.publicKey
    );
    await mintTo(connection, issuer, bondMint2, issuerBondAccount2, issuer, 50);

    const cancelListingTimestamp = new anchor.BN(
      Math.floor(Date.now() / 1000) + 3600 // 1 hour future
    );

    await program.methods
      .initializeListing(
        new anchor.BN(50),
        PRICE_PER_BOND,
        cancelListingTimestamp,
        FACE_VALUE,
        "Cancel Bond",
        "CB"
      )
      .accounts({
        issuer: issuer.publicKey,
        bondMint: bondMint2,
        stableMint,
        bondListing: bondListing2,
        escrowTokenAccount: escrow2,
        redemptionVault: redemption2,
        issuerBondAccount: issuerBondAccount2,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([issuer])
      .rpc();

    await program.methods
      .cancelListing()
      .accounts({
        issuer: issuer.publicKey,
        bondListing: bondListing2,
        escrowTokenAccount: escrow2,
        issuerBondAccount: issuerBondAccount2,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([issuer])
      .rpc();

    const listing = await program.account.bondListing.fetch(bondListing2);
    assert.equal(listing.isActive, false);
    assert.equal(listing.availableBonds.toString(), "0");

    const issuerBonds2 = await getAccount(connection, issuerBondAccount2);
    assert.equal(issuerBonds2.amount.toString(), "50");
  });

  // ─── Test 6: Deposit Redemption Funds ────────────────────────────────────

  it("6. Deposits redemption funds", async () => {
    const depositAmount = new anchor.BN(110_000); // 100 bonds * 1100 face value

    await program.methods
      .depositRedemptionFunds(depositAmount)
      .accounts({
        issuer: issuer.publicKey,
        bondListing,
        redemptionVault,
        issuerStableAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([issuer])
      .rpc();

    const listing = await program.account.bondListing.fetch(bondListing);
    assert.equal(
      listing.totalRedemptionFunded.toString(),
      depositAmount.toString()
    );

    const vault = await getAccount(connection, redemptionVault);
    assert.equal(vault.amount.toString(), depositAmount.toString());
  });

  // ─── Test 7: Fail to redeem before maturity ───────────────────────────────

  it("7. Fails to redeem bonds before maturity", async () => {
    try {
      await program.methods
        .redeemBonds(new anchor.BN(1))
        .accounts({
          holder: buyer.publicKey,
          bondListing,
          escrowTokenAccount,
          redemptionVault,
          holderBondAccount: buyerBondAccount,
          holderStableAccount: buyerStableAccount,
          issuer: issuer.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        })
        .signers([buyer])
        .rpc();
      assert.fail("Should have thrown NotMaturedYet error");
    } catch (err: any) {
      assert.include(err.message, "NotMaturedYet");
    }
  });

  // ─── Test 8: Redeem after maturity ───────────────────────────────────────

  it("8. Redeems bonds after maturity", async () => {
    // Wait for maturity
    const now = Math.floor(Date.now() / 1000);
    const waitTime = (maturityTimestamp.toNumber() - now + 2) * 1000;
    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    const redeemAmount = new anchor.BN(5);
    const expectedPayout = FACE_VALUE.mul(redeemAmount); // 5 * 1100 = 5500

    const buyerStableBefore = await getAccount(connection, buyerStableAccount);

    await program.methods
      .redeemBonds(redeemAmount)
      .accounts({
        holder: buyer.publicKey,
        bondListing,
        escrowTokenAccount,
        redemptionVault,
        holderBondAccount: buyerBondAccount,
        holderStableAccount: buyerStableAccount,
        issuer: issuer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      })
      .signers([buyer])
      .rpc();

    const buyerStableAfter = await getAccount(connection, buyerStableAccount);
    const received =
      BigInt(buyerStableAfter.amount) - BigInt(buyerStableBefore.amount);
    assert.equal(received.toString(), expectedPayout.toString());
  });
});
