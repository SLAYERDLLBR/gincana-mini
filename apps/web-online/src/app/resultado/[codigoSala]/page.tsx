"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { DestaquesFinais } from "@/lib/sala-logica";
import { Botao } from "@/components/ui/Botao";

const CHAVE_DESTAQUES = "gincana:destaques";

export default function PaginaResultado() {
  const router = useRouter();
  const params = useParams<{ codigoSala: string }>();
  const [destaques, setDestaques] = useState<DestaquesFinais | null>(null);

  useEffect(() => {
    const bruto = sessionStorage.getItem(CHAVE_DESTAQUES);
    if (bruto) setDestaques(JSON.parse(bruto));
  }, []);

  if (!destaques) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-slate-600">Não encontramos o resultado desta partida.</p>
        <Botao variante="fantasma" onClick={() => router.push("/")}>
          Voltar ao início
        </Botao>
      </main>
    );
  }

  const corVencedora =
    destaques.equipeVencedora === "AZUL" ? "text-azul-soft" : destaques.equipeVencedora === "VERMELHO" ? "text-vermelho-soft" : "text-ouro";
  const nomeVencedora =
    destaques.equipeVencedora === "AZUL" ? "🔵 Equipe Azul" : destaques.equipeVencedora === "VERMELHO" ? "🔴 Equipe Vermelha" : "Empate!";

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center px-6 py-12 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 140, damping: 12 }}
        className="mb-3 text-6xl"
      >
        🏆
      </motion.div>
      <p className={`font-display text-4xl ${corVencedora}`}>{nomeVencedora}</p>
      <p className="mt-2 font-hud text-lg">
        <span className="text-azul-soft">🔵 {destaques.placarAzul}</span>
        {"   "}
        <span className="text-vermelho-soft">🔴 {destaques.placarVermelho}</span>
      </p>

      <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
        <CartaoDestaque titulo="Melhor jogador" valor={destaques.melhorJogador?.nomeSessao} detalhe={destaques.melhorJogador ? `${destaques.melhorJogador.pontuacao} pts` : undefined} />
        <CartaoDestaque titulo="Mais rápido" valor={destaques.maisRapido?.nomeSessao} detalhe={destaques.maisRapido ? `${Math.round(destaques.maisRapido.tempoMedioMs / 1000)}s em média` : undefined} />
        <CartaoDestaque titulo="Maior sequência" valor={destaques.maiorSequencia?.nomeSessao} detalhe={destaques.maiorSequencia ? `${destaques.maiorSequencia.sequencia} acertos seguidos` : undefined} />
      </div>

      <div className="mt-8 w-full">
        <h2 className="mb-3 text-left font-display text-lg">Ranking</h2>
        <ol className="space-y-2">
          {destaques.ranking.map((jogador, indice) => (
            <li
              key={`${jogador.nomeSessao}-${indice}`}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2"
            >
              <span>
                {indice + 1}º {jogador.nomeSessao}{" "}
                <span className={jogador.equipe === "AZUL" ? "text-azul-soft" : "text-vermelho-soft"}>
                  {jogador.equipe === "AZUL" ? "🔵" : "🔴"}
                </span>
              </span>
              <span className="font-hud">{jogador.pontuacao} pts</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-10 flex w-full gap-3">
        <Botao variante="fantasma" className="flex-1" onClick={() => router.push("/")}>
          Sair
        </Botao>
        <Botao variante="azul" className="flex-1" onClick={() => router.push("/perfil?modo=criar")}>
          Nova partida
        </Botao>
      </div>
    </main>
  );
}

function CartaoDestaque({ titulo, valor, detalhe }: { titulo: string; valor?: string; detalhe?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{titulo}</p>
      <p className="mt-1 font-display text-lg">{valor ?? "—"}</p>
      {detalhe && <p className="text-xs text-slate-500">{detalhe}</p>}
    </div>
  );
}
