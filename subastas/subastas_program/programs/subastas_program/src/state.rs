use anchor_lang::prelude::*;

#[account]
pub struct Subasta {
    pub id: u64,
    pub nombre: String,
    pub descripcion: String,
    pub importe_minimo: u64,
    pub fecha_inicio: u64,
    pub fecha_fin: u64,
    pub estado: u64, // 0: Creada, 1: Iniciada, 2: Finalizada
    pub creador: Pubkey,
    pub ganador: Pubkey,
    pub importe_ganador: u64,
}

impl Subasta {
    pub const INIT_SPACE: usize = 8 + 8 + 4 + 32 + 4 + 100 + 8 + 8 + 8 + 8 + 32 + 32 + 8;
}

#[account]
pub struct Puja {
    pub id: u64,
    pub nombre: String,
    pub importe_puja: u64,
    pub ts: u64,
    pub pk: Pubkey,
}

impl Puja {
    pub const INIT_SPACE: usize = 8 + 8 + 4 + 32 + 8 + 8 + 32;
}
