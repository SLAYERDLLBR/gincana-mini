"use client";

import { AVATARES } from "@/lib/tipos";
import type { JogadorEstado } from "@/lib/sala-logica";

export function CartaoJogador({ jogador, souEu }: { jogador: JogadorEstado; souEu: boolean }) {
  const avatar = AVATARES.find((a) => a.id === jogador.avatar);

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
        souEu ? "border-ouro/60 bg-white/10" : "border-white/10 bg-white/5"
      }`}
    >
      <span className="text-2xl">{avatar?.emoji ?? "🙂"}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">
          {jogador.nomeSessao} {jogador.organizador && <span className="text-ouro">★</span>}
        </p>
        <p className="text-xs text-giz/50">{jogador.idade} anos</p>
      </div>
      <span className={`text-lg ${jogador.pronto ? "opacity-100" : "opacity-30"}`} aria-label={jogador.pronto ? "Pronto" : "Não pronto"}>
        {jogador.pronto ? "✅" : "⏳"}
      </span>
    </div>
  );
}
