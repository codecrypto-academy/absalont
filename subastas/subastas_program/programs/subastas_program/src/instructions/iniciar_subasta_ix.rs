use anchor_lang::prelude::*;
use crate::{IniciarSubastaAccounts};

pub fn handler(ctx: Context<IniciarSubastaAccounts>, _id: u64) -> Result<()> {
    let subasta = &mut ctx.accounts.subasta;
    subasta.estado = 1; // Iniciada
    Ok(())
}
