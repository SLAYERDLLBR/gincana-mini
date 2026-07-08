"use client";

import type { PerfilJogadorInput } from "@/lib/tipos";

const CHAVE_PERFIL = "gincana:perfil";

export function salvarPerfilSessao(perfil: PerfilJogadorInput): void {
  sessionStorage.setItem(CHAVE_PERFIL, JSON.stringify(perfil));
}

export function obterPerfilSessao(): PerfilJogadorInput | null {
  if (typeof window === "undefined") return null;
  const bruto = sessionStorage.getItem(CHAVE_PERFIL);
  return bruto ? (JSON.parse(bruto) as PerfilJogadorInput) : null;
}
