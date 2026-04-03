use anchor_lang::prelude::*;

use crate::{CrearSubastaAccounts};

pub fn handler(
    ctx: Context<CrearSubastaAccounts>, 
    id: u64, 
    nombre: String, 
    descripcion: String, 
    importe_minimo: u64, 
    fecha_inicio: u64, 
    fecha_fin: u64
) -> Result<()> {
    let subasta = &mut ctx.accounts.subasta;
    subasta.id = id;
    subasta.nombre = nombre;
    subasta.descripcion = descripcion;
    subasta.importe_minimo = importe_minimo;
    subasta.fecha_inicio = fecha_inicio;
    subasta.fecha_fin = fecha_fin;
    subasta.estado = 0; // Creada
    subasta.creador = ctx.accounts.creador.key();
    subasta.ganador = Pubkey::default();
    subasta.importe_ganador = 0;
    Ok(())
}
