use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("DtMmh3L7tDaEJ67THeKU3X8HRDXh7hK9zNGeGe2L9MD9");

// ─── Events ──────────────────────────────────────────────────────────────────

#[event]
pub struct ListingCreated {
    pub issuer: Pubkey,
    pub bond_mint: Pubkey,
    pub stable_mint: Pubkey,
    pub bond_amount: u64,
    pub price_per_bond: u64,
    pub maturity_timestamp: i64,
    pub face_value: u64,
    pub token_name: String,
    pub token_symbol: String,
}

#[event]
pub struct BondsPurchased {
    pub buyer: Pubkey,
    pub bond_listing: Pubkey,
    pub amount: u64,
}

#[event]
pub struct ListingCancelled {
    pub issuer: Pubkey,
    pub bond_listing: Pubkey,
    pub returned_bonds: u64,
}

#[event]
pub struct RedemptionFunded {
    pub issuer: Pubkey,
    pub bond_listing: Pubkey,
    pub amount: u64,
}

#[event]
pub struct BondsRedeemed {
    pub holder: Pubkey,
    pub bond_listing: Pubkey,
    pub amount: u64,
    pub payout: u64,
}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum BondError {
    #[msg("Bond amount must be greater than zero")]
    ZeroBondAmount,
    #[msg("Price must be greater than zero")]
    ZeroPrice,
    #[msg("The listing is not active")]
    ListingNotActive,
    #[msg("Not enough bonds available")]
    InsufficientBonds,
    #[msg("Unauthorized action")]
    Unauthorized,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Maturity date must be in the future")]
    InvalidMaturity,
    #[msg("The bond has not matured yet")]
    NotMaturedYet,
    #[msg("Insufficient funds in the redemption vault")]
    InsufficientRedemptionFunds,
}

// ─── State ────────────────────────────────────────────────────────────────────

#[account]
pub struct BondListing {
    pub issuer: Pubkey,            // 32
    pub bond_mint: Pubkey,         // 32
    pub stable_mint: Pubkey,       // 32
    pub price_per_bond: u64,       // 8
    pub available_bonds: u64,      // 8
    pub total_bonds: u64,          // 8
    pub maturity_timestamp: i64,   // 8
    pub face_value: u64,           // 8
    pub total_redemption_funded: u64, // 8
    pub is_active: bool,           // 1
    pub token_name: String,        // 4 + 32
    pub token_symbol: String,      // 4 + 10
    pub bump: u8,                  // 1
    pub escrow_bump: u8,           // 1
    pub redemption_bump: u8,       // 1
}

impl BondListing {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 8 + 1 + 36 + 14 + 1 + 1 + 1;
}

// ─── Instruction Contexts ─────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(bond_amount: u64, price_per_bond: u64, maturity_timestamp: i64, face_value: u64, token_name: String, token_symbol: String)]
pub struct InitializeListing<'info> {
    #[account(mut)]
    pub issuer: Signer<'info>,

    pub bond_mint: Account<'info, Mint>,
    pub stable_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = issuer,
        space = BondListing::LEN,
        seeds = [b"listing", issuer.key().as_ref(), bond_mint.key().as_ref()],
        bump,
    )]
    pub bond_listing: Account<'info, BondListing>,

    #[account(
        init,
        payer = issuer,
        token::mint = bond_mint,
        token::authority = bond_listing,
        seeds = [b"escrow", bond_listing.key().as_ref()],
        bump,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = issuer,
        token::mint = stable_mint,
        token::authority = bond_listing,
        seeds = [b"redemption", bond_listing.key().as_ref()],
        bump,
    )]
    pub redemption_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = issuer_bond_account.mint == bond_mint.key(),
        constraint = issuer_bond_account.owner == issuer.key(),
    )]
    pub issuer_bond_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct PurchaseBonds<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"listing", bond_listing.issuer.as_ref(), bond_listing.bond_mint.as_ref()],
        bump = bond_listing.bump,
    )]
    pub bond_listing: Account<'info, BondListing>,

    #[account(
        mut,
        seeds = [b"escrow", bond_listing.key().as_ref()],
        bump = bond_listing.escrow_bump,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = buyer_bond_account.mint == bond_listing.bond_mint,
        constraint = buyer_bond_account.owner == buyer.key(),
    )]
    pub buyer_bond_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = buyer_stable_account.mint == bond_listing.stable_mint,
        constraint = buyer_stable_account.owner == buyer.key(),
    )]
    pub buyer_stable_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = issuer_stable_account.mint == bond_listing.stable_mint,
        constraint = issuer_stable_account.owner == bond_listing.issuer,
    )]
    pub issuer_stable_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelListing<'info> {
    #[account(mut)]
    pub issuer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"listing", issuer.key().as_ref(), bond_listing.bond_mint.as_ref()],
        bump = bond_listing.bump,
        constraint = bond_listing.issuer == issuer.key() @ BondError::Unauthorized,
    )]
    pub bond_listing: Account<'info, BondListing>,

    #[account(
        mut,
        seeds = [b"escrow", bond_listing.key().as_ref()],
        bump = bond_listing.escrow_bump,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = issuer_bond_account.mint == bond_listing.bond_mint,
        constraint = issuer_bond_account.owner == issuer.key(),
    )]
    pub issuer_bond_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(new_price: u64)]
pub struct UpdatePrice<'info> {
    #[account(mut)]
    pub issuer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"listing", issuer.key().as_ref(), bond_listing.bond_mint.as_ref()],
        bump = bond_listing.bump,
        constraint = bond_listing.issuer == issuer.key() @ BondError::Unauthorized,
    )]
    pub bond_listing: Account<'info, BondListing>,
}

#[derive(Accounts)]
#[instruction(extra_amount: u64)]
pub struct AddBondsToListing<'info> {
    #[account(mut)]
    pub issuer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"listing", issuer.key().as_ref(), bond_listing.bond_mint.as_ref()],
        bump = bond_listing.bump,
        constraint = bond_listing.issuer == issuer.key() @ BondError::Unauthorized,
    )]
    pub bond_listing: Account<'info, BondListing>,

    #[account(
        mut,
        seeds = [b"escrow", bond_listing.key().as_ref()],
        bump = bond_listing.escrow_bump,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = issuer_bond_account.mint == bond_listing.bond_mint,
        constraint = issuer_bond_account.owner == issuer.key(),
    )]
    pub issuer_bond_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct DepositRedemptionFunds<'info> {
    #[account(mut)]
    pub issuer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"listing", issuer.key().as_ref(), bond_listing.bond_mint.as_ref()],
        bump = bond_listing.bump,
        constraint = bond_listing.issuer == issuer.key() @ BondError::Unauthorized,
    )]
    pub bond_listing: Account<'info, BondListing>,

    #[account(
        mut,
        seeds = [b"redemption", bond_listing.key().as_ref()],
        bump = bond_listing.redemption_bump,
    )]
    pub redemption_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = issuer_stable_account.mint == bond_listing.stable_mint,
        constraint = issuer_stable_account.owner == issuer.key(),
    )]
    pub issuer_stable_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct RedeemBonds<'info> {
    #[account(mut)]
    pub holder: Signer<'info>,

    #[account(
        mut,
        seeds = [b"listing", bond_listing.issuer.as_ref(), bond_listing.bond_mint.as_ref()],
        bump = bond_listing.bump,
    )]
    pub bond_listing: Account<'info, BondListing>,

    #[account(
        mut,
        seeds = [b"escrow", bond_listing.key().as_ref()],
        bump = bond_listing.escrow_bump,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"redemption", bond_listing.key().as_ref()],
        bump = bond_listing.redemption_bump,
    )]
    pub redemption_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = holder_bond_account.mint == bond_listing.bond_mint,
        constraint = holder_bond_account.owner == holder.key(),
    )]
    pub holder_bond_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = holder_stable_account.mint == bond_listing.stable_mint,
        constraint = holder_stable_account.owner == holder.key(),
    )]
    pub holder_stable_account: Account<'info, TokenAccount>,

    /// CHECK: issuer is validated via bond_listing.issuer
    pub issuer: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}

// ─── Program ──────────────────────────────────────────────────────────────────

#[program]
pub mod bonos_program {
    use super::*;

    /// 1. Initialize a bond listing
    pub fn initialize_listing(
        ctx: Context<InitializeListing>,
        bond_amount: u64,
        price_per_bond: u64,
        maturity_timestamp: i64,
        face_value: u64,
        token_name: String,
        token_symbol: String,
    ) -> Result<()> {
        require!(bond_amount > 0, BondError::ZeroBondAmount);
        require!(price_per_bond > 0, BondError::ZeroPrice);
        require!(face_value > 0, BondError::ZeroPrice);

        let clock = Clock::get()?;
        require!(
            maturity_timestamp > clock.unix_timestamp,
            BondError::InvalidMaturity
        );

        let listing = &mut ctx.accounts.bond_listing;
        listing.issuer = ctx.accounts.issuer.key();
        listing.bond_mint = ctx.accounts.bond_mint.key();
        listing.stable_mint = ctx.accounts.stable_mint.key();
        listing.price_per_bond = price_per_bond;
        listing.available_bonds = bond_amount;
        listing.total_bonds = bond_amount;
        listing.maturity_timestamp = maturity_timestamp;
        listing.face_value = face_value;
        listing.total_redemption_funded = 0;
        listing.is_active = true;
        listing.token_name = token_name.clone();
        listing.token_symbol = token_symbol.clone();
        listing.bump = ctx.bumps.bond_listing;
        listing.escrow_bump = ctx.bumps.escrow_token_account;
        listing.redemption_bump = ctx.bumps.redemption_vault;

        // Transfer bonds from issuer to escrow PDA
        let cpi_accounts = Transfer {
            from: ctx.accounts.issuer_bond_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.issuer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new(cpi_program, cpi_accounts), bond_amount)?;

        emit!(ListingCreated {
            issuer: listing.issuer,
            bond_mint: listing.bond_mint,
            stable_mint: listing.stable_mint,
            bond_amount,
            price_per_bond,
            maturity_timestamp,
            face_value,
            token_name,
            token_symbol,
        });

        Ok(())
    }

    /// 2. Purchase bonds — atomic swap: stablecoins → issuer, bonds → buyer
    pub fn purchase_bonds(ctx: Context<PurchaseBonds>, amount: u64) -> Result<()> {
        require!(amount > 0, BondError::ZeroBondAmount);

        let listing = &mut ctx.accounts.bond_listing;
        require!(listing.is_active, BondError::ListingNotActive);
        require!(listing.available_bonds >= amount, BondError::InsufficientBonds);

        // Calculate payment
        let payment = listing
            .price_per_bond
            .checked_mul(amount)
            .ok_or(BondError::Overflow)?;

        // Transfer stablecoins from buyer to issuer
        let cpi_stable = Transfer {
            from: ctx.accounts.buyer_stable_account.to_account_info(),
            to: ctx.accounts.issuer_stable_account.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        };
        token::transfer(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_stable),
            payment,
        )?;

        // Transfer bonds from escrow to buyer (PDA signs)
        let listing_key = listing.key();
        let seeds = &[
            b"listing",
            listing.issuer.as_ref(),
            listing.bond_mint.as_ref(),
            &[listing.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_bonds = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.buyer_bond_account.to_account_info(),
            authority: listing.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_bonds,
                signer,
            ),
            amount,
        )?;

        listing.available_bonds = listing
            .available_bonds
            .checked_sub(amount)
            .ok_or(BondError::Overflow)?;

        emit!(BondsPurchased {
            buyer: ctx.accounts.buyer.key(),
            bond_listing: listing_key,
            amount,
        });

        Ok(())
    }

    /// 3. Cancel listing — return unsold bonds to issuer, mark inactive
    pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
        let listing = &mut ctx.accounts.bond_listing;
        require!(listing.is_active, BondError::ListingNotActive);

        let returned = listing.available_bonds;

        if returned > 0 {
            let seeds = &[
                b"listing",
                listing.issuer.as_ref(),
                listing.bond_mint.as_ref(),
                &[listing.bump],
            ];
            let signer = &[&seeds[..]];

            let cpi_accounts = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.issuer_bond_account.to_account_info(),
                authority: listing.to_account_info(),
            };
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    cpi_accounts,
                    signer,
                ),
                returned,
            )?;
        }

        let listing_key = listing.key();
        listing.available_bonds = 0;
        listing.is_active = false;

        emit!(ListingCancelled {
            issuer: ctx.accounts.issuer.key(),
            bond_listing: listing_key,
            returned_bonds: returned,
        });

        Ok(())
    }

    /// 4. Update bond price (issuer only, listing must be active)
    pub fn update_price(ctx: Context<UpdatePrice>, new_price: u64) -> Result<()> {
        require!(new_price > 0, BondError::ZeroPrice);
        let listing = &mut ctx.accounts.bond_listing;
        require!(listing.is_active, BondError::ListingNotActive);
        listing.price_per_bond = new_price;
        Ok(())
    }

    /// 5. Add more bonds to an active listing
    pub fn add_bonds_to_listing(
        ctx: Context<AddBondsToListing>,
        extra_amount: u64,
    ) -> Result<()> {
        require!(extra_amount > 0, BondError::ZeroBondAmount);
        let listing = &mut ctx.accounts.bond_listing;
        require!(listing.is_active, BondError::ListingNotActive);

        // Transfer extra bonds from issuer to escrow
        let cpi_accounts = Transfer {
            from: ctx.accounts.issuer_bond_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.issuer.to_account_info(),
        };
        token::transfer(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts),
            extra_amount,
        )?;

        listing.available_bonds = listing
            .available_bonds
            .checked_add(extra_amount)
            .ok_or(BondError::Overflow)?;
        listing.total_bonds = listing
            .total_bonds
            .checked_add(extra_amount)
            .ok_or(BondError::Overflow)?;

        Ok(())
    }

    /// 6. Deposit stablecoins into redemption vault
    pub fn deposit_redemption_funds(
        ctx: Context<DepositRedemptionFunds>,
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, BondError::ZeroBondAmount);

        let listing = &mut ctx.accounts.bond_listing;

        // Transfer stablecoins from issuer to redemption vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.issuer_stable_account.to_account_info(),
            to: ctx.accounts.redemption_vault.to_account_info(),
            authority: ctx.accounts.issuer.to_account_info(),
        };
        token::transfer(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts),
            amount,
        )?;

        listing.total_redemption_funded = listing
            .total_redemption_funded
            .checked_add(amount)
            .ok_or(BondError::Overflow)?;

        emit!(RedemptionFunded {
            issuer: ctx.accounts.issuer.key(),
            bond_listing: listing.key(),
            amount,
        });

        Ok(())
    }

    /// 7. Redeem bonds after maturity — bonds → issuer escrow, stablecoins → holder
    pub fn redeem_bonds(ctx: Context<RedeemBonds>, amount: u64) -> Result<()> {
        require!(amount > 0, BondError::ZeroBondAmount);

        let listing = &mut ctx.accounts.bond_listing;

        // Check maturity
        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp >= listing.maturity_timestamp,
            BondError::NotMaturedYet
        );

        // Calculate payout
        let payout = listing
            .face_value
            .checked_mul(amount)
            .ok_or(BondError::Overflow)?;

        require!(
            ctx.accounts.redemption_vault.amount >= payout,
            BondError::InsufficientRedemptionFunds
        );

        // Transfer bonds from holder back to escrow (buyback)
        let holder_bond_cpi = Transfer {
            from: ctx.accounts.holder_bond_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.holder.to_account_info(),
        };
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                holder_bond_cpi,
            ),
            amount,
        )?;

        // Transfer stablecoins from redemption vault to holder (PDA signs)
        let seeds = &[
            b"listing",
            listing.issuer.as_ref(),
            listing.bond_mint.as_ref(),
            &[listing.bump],
        ];
        let signer = &[&seeds[..]];

        let payout_cpi = Transfer {
            from: ctx.accounts.redemption_vault.to_account_info(),
            to: ctx.accounts.holder_stable_account.to_account_info(),
            authority: listing.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                payout_cpi,
                signer,
            ),
            payout,
        )?;

        listing.total_redemption_funded = listing
            .total_redemption_funded
            .checked_sub(payout)
            .ok_or(BondError::Overflow)?;

        emit!(BondsRedeemed {
            holder: ctx.accounts.holder.key(),
            bond_listing: listing.key(),
            amount,
            payout,
        });

        Ok(())
    }
}
