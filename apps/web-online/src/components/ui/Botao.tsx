"use client";

import type { ButtonHTMLAttributes } from "react";

type Variante = "azul" | "vermelho" | "ouro" | "fantasma";

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
}

const CLASSES_VARIANTE: Record<Variante, string> = {
  azul: "bg-azul hover:bg-azul-soft text-giz shadow-arena",
  vermelho: "bg-vermelho hover:bg-vermelho-soft text-giz shadow-arena",
  ouro: "bg-ouro hover:brightness-110 text-arena-deep shadow-arena",
  fantasma: "bg-white/5 hover:bg-white/10 text-giz border border-white/15",
};

export function Botao({ variante = "azul", className = "", ...props }: BotaoProps) {
  return (
    <button
      className={`rounded-2xl px-6 py-4 text-lg font-display font-semibold tracking-wide transition-transform active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${CLASSES_VARIANTE[variante]} ${className}`}
      {...props}
    />
  );
}
