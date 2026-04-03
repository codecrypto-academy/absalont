use anchor_lang::prelude::*;
use crate::error::ErrorCode;
use crate::{FinalizarSubastaAccounts};

pub fn handler(ctx: Context<FinalizarSubastaAccounts>, _id: u64) -> Result<()> {
    let subasta = &mut ctx.accounts.subasta;
    let clock = Clock::get()?;

    if (clock.unix_timestamp as u64) < subasta.fecha_fin {
        return err!(ErrorCode::AuctionNotEnded);
    }

    if subasta.ganador != Pubkey::default() {
        let amount = subasta.importe_ganador;
        
        **subasta.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.creador.to_account_info().try_borrow_mut_lamports()? += amount;
    }

    subasta.estado = 2; // Finalizada

    Ok(())
}
