use anchor_lang::prelude::*;
use crate::error::ErrorCode;
use crate::{CrearPujaAccounts};

pub fn handler(
    ctx: Context<CrearPujaAccounts>, 
    id: u64, 
    nombre: String, 
    importe_puja: u64
) -> Result<()> {
    let subasta = &mut ctx.accounts.subasta;
    let clock = Clock::get()?;

    // Checks
    if subasta.estado != 1 {
        return err!(ErrorCode::AuctionNotActive);
    }
    if (clock.unix_timestamp as u64) > subasta.fecha_fin {
        return err!(ErrorCode::AuctionEnded);
    }
    if importe_puja <= subasta.importe_ganador || importe_puja < subasta.importe_minimo {
        return err!(ErrorCode::BidTooLow);
    }

    let refund_amount = if subasta.ganador != Pubkey::default() {
        subasta.importe_ganador
    } else {
        0
    };

    // 1. Refund previous bidder (Directly from current bidder's pocket)
    if refund_amount > 0 {
        // Verify correct previous bidder is passed for refund
        if ctx.accounts.previous_bidder_account.key() != subasta.ganador {
             return err!(ErrorCode::InvalidPreviousBidder);
        }

        anchor_lang::solana_program::program::invoke(
            &anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.bidder.key(),
                &ctx.accounts.previous_bidder_account.key(),
                refund_amount,
            ),
            &[
                ctx.accounts.bidder.to_account_info(),
                ctx.accounts.previous_bidder_account.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
    }

    // 2. Transfer the net increase to the Subasta account
    // This ensures the Subasta PDA always holds exactly the current winning amount.
    let net_amount = importe_puja - refund_amount;
    anchor_lang::solana_program::program::invoke(
        &anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.bidder.key(),
            &subasta.key(),
            net_amount,
        ),
        &[
            ctx.accounts.bidder.to_account_info(),
            subasta.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    // Update Subasta state
    subasta.importe_ganador = importe_puja;
    subasta.ganador = ctx.accounts.bidder.key();

    // Create/Update Puja PDA
    let puja_account = &mut ctx.accounts.puja_account;
    puja_account.id = id;
    puja_account.nombre = nombre;
    puja_account.importe_puja = importe_puja;
    puja_account.ts = clock.unix_timestamp as u64;
    puja_account.pk = ctx.accounts.bidder.key();

    Ok(())
}
