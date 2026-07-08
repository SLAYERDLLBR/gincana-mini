"use client";

import type { ButtonHTMLAttributes } from "react";

type Variante = "azul" | "vermelho" | "ouro" | "fantasma";

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
}

const CLASSES_VARIANTE: Record<Variante, string> = {
  azul: "bg-azul hover:bg-azul-soft text-white shadow-suave",
  vermelho: "bg-vermelho hover:bg-vermelho-soft text-white shadow-suave",
  ouro: "bg-ouro hover:brightness-105 text-arena-deep shadow-suave",
  fantasma: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-suave",
};

export function Botao({ variante = "azul", className = "", ...props }: BotaoProps) {
  return (
    <button
      className={`rounded-2xl px-6 py-4 text-lg font-display font-semibold tracking-wide transition-transform active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${CLASSES_VARIANTE[variante]} ${className}`}
      {...props}
    />
  );
}
