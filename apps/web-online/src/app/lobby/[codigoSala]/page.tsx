"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Equipe } from "@/lib/tipos";
import { Botao } from "@/components/ui/Botao";
import { CartaoJogador } from "@/components/lobby/CartaoJogador";
import { buscarEstado, escolherEquipe, iniciarPartida, marcarPronto, obterJogadorId } from "@/lib/api-cliente";
import type { EstadoPublico } from "@/lib/sala-logica";

const INTERVALO_POLL_MS = 1500;

export default function PaginaLobby() {
  const router = useRouter();
  const params = useParams<{ codigoSala: string }>();
  const codigoSala = params.codigoSala.toUpperCase();

  const [estado, setEstado] = useState<EstadoPublico | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [meuId, setMeuId] = useState<string | null>(null);

  useEffect(() => {
    setMeuId(obterJogadorId());
  }, []);

  useEffect(() => {
    let ativo = true;

    async function consultar() {
      const novoEstado = await buscarEstado(codigoSala);
      if (!ativo) return;
      if (!novoEstado) {
        setErro("Sala não encontrada.");
        return;
      }
      setEstado(novoEstado);
      if (novoEstado.status === "EM_ANDAMENTO") {
        router.push(`/partida/${codigoSala}`);
      }
    }

    consultar();
    const intervalo = setInterval(consultar, INTERVALO_POLL_MS);
    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [codigoSala, router]);

  if (!estado) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <p className="text-slate-600">
          {erro ?? `Conectando à sala ${codigoSala}...`} Se a tela ficar assim por muito tempo, volte e crie/entre na
          sala novamente.
        </p>
        <Botao variante="fantasma" className="mt-6" onClick={() => router.push("/")}>
          Voltar ao início
        </Botao>
      </main>
    );
  }

  const eu = estado.jogadores.find((j) => j.id === meuId);
  const souOrganizador = estado.organizadorId === meuId;
  const jogadoresAzul = estado.jogadores.filter((j) => j.equipe === "AZUL");
  const jogadoresVermelho = estado.jogadores.filter((j) => j.equipe === "VERMELHO");
  const diferencaTimes = Math.abs(jogadoresAzul.length - jogadoresVermelho.length);
  const totalProntos = estado.jogadores.filter((j) => j.pronto).length;
  const todosProntos = estado.jogadores.length >= 2 && totalProntos === estado.jogadores.length;

  async function trocarEquipe(equipe: Equipe) {
    await escolherEquipe(codigoSala, equipe);
  }

  async function alternarPronto() {
    await marcarPronto(codigoSala, !eu?.pronto);
  }

  async function aoIniciar() {
    const resposta = await iniciarPartida(codigoSala);
    if (!resposta.ok) setErro(resposta.erro);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500">Código da sala</p>
          <p className="font-hud text-3xl tracking-[0.2em]">{estado.codigoSala}</p>
        </div>
        <p className="text-sm text-slate-600">{estado.jogadores.length} jogador(es)</p>
      </div>

      {erro && <p className="mb-4 rounded-xl bg-vermelho/20 px-4 py-2 text-sm text-vermelho-soft">{erro}</p>}

      {diferencaTimes >= 2 && (
        <p className="mb-4 rounded-xl bg-ouro/10 px-4 py-2 text-sm text-ouro">
          As equipes estão desequilibradas — considere pedir para alguém trocar de time.
        </p>
      )}

      <div className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl text-azul">🔵 Equipe Azul</h2>
            <button
              onClick={() => trocarEquipe("AZUL")}
              disabled={eu?.equipe === "AZUL"}
              className="text-xs text-azul-soft underline disabled:no-underline disabled:opacity-40"
            >
              Entrar neste time
            </button>
          </div>
          <div className="space-y-2">
            {jogadoresAzul.map((j) => (
              <CartaoJogador key={j.id} jogador={j} souEu={j.id === meuId} />
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl text-vermelho">🔴 Equipe Vermelha</h2>
            <button
              onClick={() => trocarEquipe("VERMELHO")}
              disabled={eu?.equipe === "VERMELHO"}
              className="text-xs text-vermelho-soft underline disabled:no-underline disabled:opacity-40"
            >
              Entrar neste time
            </button>
          </div>
          <div className="space-y-2">
            {jogadoresVermelho.map((j) => (
              <CartaoJogador key={j.id} jogador={j} souEu={j.id === meuId} />
            ))}
          </div>
        </section>
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        <p className="font-hud text-lg text-slate-600">
          Prontos: <span className={todosProntos ? "text-ouro" : ""}>{totalProntos}</span>/{estado.jogadores.length}
        </p>

        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Botao variante={eu?.pronto ? "fantasma" : "ouro"} className="flex-1" onClick={alternarPronto}>
            {eu?.pronto ? "Cancelar (não estou pronto)" : "Estou pronto!"}
          </Botao>

          {souOrganizador && (
            <Botao variante="azul" className="flex-1" disabled={!todosProntos} onClick={aoIniciar}>
              {estado.jogadores.length < 2
                ? "Aguardando mais jogadores..."
                : todosProntos
                  ? "Iniciar partida"
                  : "Aguardando todos confirmarem..."}
            </Botao>
          )}
        </div>
      </div>
    </main>
  );
}
