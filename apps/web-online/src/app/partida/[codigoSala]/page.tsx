"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORIAS } from "@/lib/tipos";
import { AnelTempo } from "@/components/ui/AnelTempo";
import { buscarEstado, responder } from "@/lib/api-cliente";
import type { EstadoPublico } from "@/lib/sala-logica";

const INTERVALO_POLL_MS = 1000;
const CHAVE_DESTAQUES = "gincana:destaques";

export default function PaginaPartida() {
  const router = useRouter();
  const params = useParams<{ codigoSala: string }>();
  const codigoSala = params.codigoSala.toUpperCase();

  const [estado, setEstado] = useState<EstadoPublico | null>(null);
  const [alternativaEscolhida, setAlternativaEscolhida] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function consultar() {
      const novoEstado = await buscarEstado(codigoSala);
      if (!ativo || !novoEstado) return;

      setEstado((atual) => {
        if (atual?.pergunta?.id !== novoEstado.pergunta?.id) {
          setAlternativaEscolhida(null);
        }
        return novoEstado;
      });

      if (novoEstado.status === "FINALIZADA" && novoEstado.destaques) {
        sessionStorage.setItem(CHAVE_DESTAQUES, JSON.stringify(novoEstado.destaques));
        router.push(`/resultado/${codigoSala}`);
      }
    }

    consultar();
    const intervalo = setInterval(consultar, INTERVALO_POLL_MS);
    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [codigoSala, router]);

  if (!estado || !estado.pergunta) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="text-slate-600">Aguardando o início da partida...</p>
      </main>
    );
  }

  const { pergunta, revelacao, placarAoVivo } = estado;
  const faltamParaComecar = Math.ceil((pergunta.comecaEm - estado.agora) / 1000);
  const emContagem = faltamParaComecar > 0;
  const segundosRestantes = emContagem
    ? pergunta.tempoLimiteSegundos
    : Math.max(0, pergunta.tempoLimiteSegundos - Math.floor((estado.agora - pergunta.comecaEm) / 1000));

  async function escolher(indice: number) {
    if (!pergunta || alternativaEscolhida !== null || revelacao || enviando) return;
    setAlternativaEscolhida(indice);
    setEnviando(true);
    await responder(codigoSala, pergunta.id, indice);
    setEnviando(false);
  }

  if (emContagem) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={faltamParaComecar}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="font-display text-8xl text-ouro"
          >
            {faltamParaComecar}
          </motion.p>
        </AnimatePresence>
      </main>
    );
  }

  const nomeCategoria = CATEGORIAS.find((c) => c.id === pergunta.categoria)?.label ?? pergunta.categoria;

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 py-6">
      {/* Acompanhamento ao vivo: equipe líder + aluno com mais acertos */}
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-suave">
        <div className="flex items-center gap-3 font-hud text-base">
          <span className={`text-azul-soft ${placarAoVivo.equipeLider === "AZUL" ? "font-bold" : ""}`}>
            🔵 {placarAoVivo.placarAzul}
          </span>
          <span className={`text-vermelho-soft ${placarAoVivo.equipeLider === "VERMELHO" ? "font-bold" : ""}`}>
            🔴 {placarAoVivo.placarVermelho}
          </span>
        </div>
        {placarAoVivo.melhorJogador && (
          <p className="text-xs text-slate-500">
            🏅 <span className="font-semibold text-slate-700">{placarAoVivo.melhorJogador.nomeSessao}</span> lidera com{" "}
            {placarAoVivo.melhorJogador.acertos} acerto{placarAoVivo.melhorJogador.acertos === 1 ? "" : "s"}
          </p>
        )}
      </div>

      <header className="mb-6 flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-slate-500">
          Pergunta {pergunta.numero}/{pergunta.total} · {nomeCategoria}
        </p>
        <AnelTempo segundosRestantes={segundosRestantes} segundosTotal={pergunta.tempoLimiteSegundos} />
      </header>

      <motion.h1
        key={pergunta.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 font-display text-2xl leading-snug sm:text-3xl"
      >
        {pergunta.enunciado}
      </motion.h1>

      <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
        {pergunta.alternativas.map((alternativa, indice) => {
          let estiloExtra = "border-slate-200 bg-white hover:bg-slate-50";

          if (revelacao) {
            if (indice === revelacao.alternativaCorreta) {
              estiloExtra = "border-ouro bg-ouro/20 text-ouro";
            } else if (indice === alternativaEscolhida) {
              estiloExtra = "border-vermelho bg-vermelho/20 text-vermelho-soft";
            } else {
              estiloExtra = "border-slate-200 bg-white opacity-50";
            }
          } else if (indice === alternativaEscolhida) {
            estiloExtra = "border-azul bg-azul/20";
          }

          return (
            <button
              key={indice}
              onClick={() => escolher(indice)}
              disabled={alternativaEscolhida !== null || !!revelacao}
              className={`rounded-2xl border px-5 py-6 text-left text-lg font-semibold transition ${estiloExtra}`}
            >
              {alternativa}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {revelacao && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-2xl bg-white px-5 py-4 text-slate-700"
          >
            💡 {revelacao.explicacao}
          </motion.p>
        )}
      </AnimatePresence>
    </main>
  );
}
