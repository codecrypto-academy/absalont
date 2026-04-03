import { Program, BN, AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import bs58 from "bs58";
import idlJson from "../constants/idl.json";
const idl = idlJson as any;

export class SubastasProxy {
  private program: Program;

  constructor(program: Program) {
    this.program = program;
  }

  static getProgram(provider: AnchorProvider): Program {
    return new Program(idl, provider);
  }

  // PDAs
  getSubastaPDA(id: number | BN): PublicKey {
    const idBN = new BN(id);
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("subasta"), idBN.toArrayLike(Buffer, "le", 8)],
      this.program.programId
    );
    return pda;
  }

  getPujaPDA(id: number | BN, bidder: PublicKey): PublicKey {
    const idBN = new BN(id);
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("puja"), idBN.toArrayLike(Buffer, "le", 8), bidder.toBuffer()],
      this.program.programId
    );
    return pda;
  }

  // Instructions
  async crearSubasta(
    id: number,
    nombre: string,
    descripcion: string,
    importeMinimo: number,
    fechaInicio: number,
    fechaFin: number
  ) {
    const subastaPDA = this.getSubastaPDA(id);
    return await (this.program.methods as any)
      .crearSubasta(
        new BN(id),
        nombre,
        descripcion,
        new BN(importeMinimo),
        new BN(fechaInicio),
        new BN(fechaFin)
      )
      .accounts({
        subasta: subastaPDA,
        creador: this.program.provider.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async iniciarSubasta(id: number) {
    const subastaPDA = this.getSubastaPDA(id);
    return await (this.program.methods as any)
      .iniciarSubasta(new BN(id))
      .accounts({
        subasta: subastaPDA,
        creador: this.program.provider.publicKey,
      })
      .rpc();
  }

  async crearPuja(id: number, nombre: string, importePuja: number, previousBidder: PublicKey | null) {
    const subastaPDA = this.getSubastaPDA(id);
    const pujaPDA = this.getPujaPDA(id, this.program.provider.publicKey!);
    
    // If no previous bidder, use subastaPDA as placeholder because it's already marked as mut
    const prevBidder = previousBidder || subastaPDA;

    console.log("[SubastasProxy] Ejecutando crearPuja:", {
      id,
      nombre,
      importePuja,
      bidder: this.program.provider.publicKey?.toBase58(),
      pujaPDA: pujaPDA.toBase58(),
      subastaPDA: subastaPDA.toBase58(),
      previousBidderAccount: prevBidder.toBase58(),
    });

    return await (this.program.methods as any)
      .crearPuja(new BN(id), nombre, new BN(importePuja))
      .accounts({
        subasta: subastaPDA,
        pujaAccount: pujaPDA,
        bidder: this.program.provider.publicKey,
        previousBidderAccount: prevBidder,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async finalizarSubasta(id: number) {
    const subastaPDA = this.getSubastaPDA(id);
    return await (this.program.methods as any)
      .finalizarSubasta(new BN(id))
      .accounts({
        subasta: subastaPDA,
        creador: this.program.provider.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  // Fetching
  async getAllSubastas() {
    return await (this.program.account as any).subasta.all();
  }

  async getSubastaById(id: number) {
    const subastaPDA = this.getSubastaPDA(id);
    return await (this.program.account as any).subasta.fetch(subastaPDA);
  }

  async getPujasBySubasta(id: number) {
    const idBuffer = new BN(id).toArrayLike(Buffer, "le", 8);
    return await (this.program.account as any).puja.all([
      {
        memcmp: {
          offset: 8, // Discriminator
          bytes: bs58.encode(idBuffer),
        },
      },
    ]);
  }
}
