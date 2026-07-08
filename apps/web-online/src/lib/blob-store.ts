import { getStore } from "@netlify/blobs";
import type { SalaEstado } from "./sala-logica";

function armazenamento() {
  return getStore({ name: "salas", consistency: "strong" });
}

export async function lerSala(codigoSala: string): Promise<SalaEstado | null> {
  return armazenamento().get(codigoSala, { type: "json" });
}

export async function salvarSala(sala: SalaEstado): Promise<void> {
  sala.atualizadoEm = Date.now();
  await armazenamento().setJSON(sala.codigoSala, sala);
}
