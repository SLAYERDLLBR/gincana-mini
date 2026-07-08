"use client";

import type { PerfilJogadorInput, Equipe } from "@/lib/tipos";
import type { EstadoPublico } from "./sala-logica";

const CHAVE_JOGADOR_ID = "gincana:jogadorId";

export function obterJogadorId(): string {
  let id = sessionStorage.getItem(CHAVE_JOGADOR_ID);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(CHAVE_JOGADOR_ID, id);
  }
  return id;
}

async function post(caminho: string, corpo: unknown) {
  const resposta = await fetch(caminho, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  return resposta.json();
}

export async function criarSala(perfil: PerfilJogadorInput): Promise<{ ok: true; codigoSala: string } | { ok: false; erro: string }> {
  return post("/api/sala", { jogadorId: obterJogadorId(), perfil });
}

export async function entrarSala(codigoSala: string, perfil: PerfilJogadorInput): Promise<{ ok: true } | { ok: false; erro: string }> {
  return post(`/api/sala/${codigoSala}`, { acao: "entrar", jogadorId: obterJogadorId(), perfil });
}

export async function escolherEquipe(codigoSala: string, equipe: Equipe) {
  return post(`/api/sala/${codigoSala}`, { acao: "equipe", jogadorId: obterJogadorId(), equipe });
}

export async function marcarPronto(codigoSala: string, pronto: boolean) {
  return post(`/api/sala/${codigoSala}`, { acao: "pronto", jogadorId: obterJogadorId(), pronto });
}

export async function iniciarPartida(codigoSala: string) {
  return post(`/api/sala/${codigoSala}`, { acao: "iniciar", jogadorId: obterJogadorId() });
}

export async function responder(codigoSala: string, perguntaId: string, alternativaEscolhida: number | null) {
  return post(`/api/sala/${codigoSala}`, { acao: "responder", jogadorId: obterJogadorId(), perguntaId, alternativaEscolhida });
}

export async function buscarEstado(codigoSala: string): Promise<EstadoPublico | null> {
  const resposta = await fetch(`/api/sala/${codigoSala}`, { cache: "no-store" });
  if (!resposta.ok) return null;
  return resposta.json();
}
