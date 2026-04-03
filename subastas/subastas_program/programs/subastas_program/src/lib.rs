pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;
use crate::instructions::*;
use crate::state::*;

declare_id!("9qTFEzwXLX2mX4gz1t9A231iV5JmD1sjatatYbAnhVJj");

#[program]
pub mod subastas_program {
    use super::*;

    pub fn crear_subasta(
        ctx: Context<CrearSubastaAccounts>, 
        id: u64, 
        nombre: String, 
        descripcion: String, 
        importe_minimo: u64, 
        fecha_inicio: u64, 
        fecha_fin: u64
    ) -> Result<()> {
        crear_subasta_ix::handler(ctx, id, nombre, descripcion, importe_minimo, fecha_inicio, fecha_fin)
    }

    pub fn iniciar_subasta(ctx: Context<IniciarSubastaAccounts>, id: u64) -> Result<()> {
        iniciar_subasta_ix::handler(ctx, id)
    }

    pub fn crear_puja(ctx: Context<CrearPujaAccounts>, id: u64, nombre: String, importe_puja: u64) -> Result<()> {
        crear_puja_ix::handler(ctx, id, nombre, importe_puja)
    }

    pub fn finalizar_subasta(ctx: Context<FinalizarSubastaAccounts>, id: u64) -> Result<()> {
        finalizar_subasta_ix::handler(ctx, id)
    }
}

#[derive(Accounts)]
#[instruction(id: u64)]
pub struct CrearSubastaAccounts<'info> {
    #[account(
        init,
        payer = creador,
        space = Subasta::INIT_SPACE,
        seeds = [b"subasta", id.to_le_bytes().as_ref()],
        bump
    )]
    pub subasta: Account<'info, Subasta>,
    #[account(mut)]
    pub creador: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(id: u64)]
pub struct IniciarSubastaAccounts<'info> {
    #[account(
        mut, 
        has_one = creador,
        seeds = [b"subasta", id.to_le_bytes().as_ref()],
        bump
    )]
    pub subasta: Account<'info, Subasta>,
    pub creador: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(id: u64, nombre: String, importe_puja: u64)]
pub struct CrearPujaAccounts<'info> {
    #[account(
        mut,
        seeds = [b"subasta", id.to_le_bytes().as_ref()],
        bump
    )]
    pub subasta: Account<'info, Subasta>,
    
    #[account(
        init_if_needed,
        payer = bidder,
        space = Puja::INIT_SPACE,
        seeds = [b"puja", id.to_le_bytes().as_ref(), bidder.key().as_ref()],
        bump
    )]
    pub puja_account: Account<'info, Puja>,

    #[account(mut)]
    pub bidder: Signer<'info>,

    /// CHECK: Safe
    #[account(mut)]
    pub previous_bidder_account: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(id: u64)]
pub struct FinalizarSubastaAccounts<'info> {
    #[account(
        mut,
        seeds = [b"subasta", id.to_le_bytes().as_ref()],
        bump,
        has_one = creador
    )]
    pub subasta: Account<'info, Subasta>,
    #[account(mut)]
    pub creador: Signer<'info>,
    pub system_program: Program<'info, System>,
}
