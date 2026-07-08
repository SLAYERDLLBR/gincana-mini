import { NextResponse } from "next/server";
import type { Equipe, PerfilJogadorInput } from "@/lib/tipos";
import {
  lerJogador,
  lerMeta,
  lerResposta,
  listarJogadores,
  listarRespostasDaQuestao,
  salvarJogador,
  salvarMeta,
  salvarResposta,
} from "@/lib/blob-store";
import {
  avaliarTransicao,
  criarJogadorPerfil,
  paraEstadoPublico,
  podeEntrarNaSala,
  podeIniciarPartida,
  prepararInicioPartida,
  registrarResposta,
  validarPerfil,
  type SalaMeta,
} from "@/lib/sala-logica";

interface Contexto {
  params: { codigo: string };
}

/** Avança o estado da sala (revelar gabarito / próxima pergunta / fim de
 * jogo) se for a hora — chamado em toda leitura e ação, com uma função pura
 * e idempotente por trás, então é seguro mesmo com várias requisições
 * concorrentes chegando aqui ao mesmo tempo.
 *
 * Proteção extra: como o cálculo (ler jogadores + respostas + decidir) pode
 * levar um tempinho, uma requisição atrasada poderia gravar um resultado
 * obsoleto por cima de um estado mais novo (o jogo "voltando no tempo").
 * Por isso, logo antes de gravar, relemos a meta e comparamos a "versão" —
 * se alguém mais já avançou nesse meio-tempo, descartamos nosso cálculo em
 * vez de sobrescrever. */
async function sincronizar(codigoSala: string, meta: SalaMeta): Promise<SalaMeta> {
  if (meta.status !== "EM_ANDAMENTO") return meta;

  const jogadores = await listarJogadores(codigoSala);
  const respostas = meta.indiceAtual >= 0 ? await listarRespostasDaQuestao(codigoSala, meta.indiceAtual) : [];
  const resultado = avaliarTransicao(meta, jogadores, respostas);
  if (!resultado) return meta;

  const metaNoBanco = await lerMeta(codigoSala);
  if (!metaNoBanco || metaNoBanco.versao !== meta.versao) {
    // Outra requisição já avançou o estado enquanto processávamos — o
    // cálculo que fizemos ficou obsoleto. Usa o que está no banco agora.
    return metaNoBanco ?? meta;
  }

  await salvarMeta(resultado.metaAtualizada);
  if (resultado.jogadoresMudaram) {
    await Promise.all(resultado.jogadoresAtualizados.map((j) => salvarJogador(codigoSala, j)));
  }
  return resultado.metaAtualizada;
}

export async function GET(_request: Request, { params }: Contexto) {
  const codigoSala = params.codigo.toUpperCase();
  let meta = await lerMeta(codigoSala);
  if (!meta) return NextResponse.json({ erro: "Sala não encontrada." }, { status: 404 });

  meta = await sincronizar(codigoSala, meta);
  const jogadores = await listarJogadores(codigoSala);

  return NextResponse.json(paraEstadoPublico(meta, jogadores));
}

export async function POST(request: Request, { params }: Contexto) {
  const codigoSala = params.codigo.toUpperCase();
  let meta = await lerMeta(codigoSala);
  if (!meta) return NextResponse.json({ ok: false, erro: "Sala não encontrada." }, { status: 404 });

  meta = await sincronizar(codigoSala, meta);

  const corpo = await request.json();
  const acao = corpo.acao as string;

  switch (acao) {
    case "entrar": {
      const perfil = corpo.perfil as PerfilJogadorInput;
      const validacao = validarPerfil(perfil);
      if (!validacao.ok) return NextResponse.json({ ok: false, erro: validacao.erro }, { status: 400 });

      const existente = await lerJogador(codigoSala, corpo.jogadorId);
      if (!existente) {
        const jogadores = await listarJogadores(codigoSala);
        const podeEntrar = podeEntrarNaSala(meta, jogadores.length);
        if (!podeEntrar.ok) return NextResponse.json({ ok: false, erro: podeEntrar.erro }, { status: 400 });

        const novoJogador = criarJogadorPerfil(corpo.jogadorId, perfil, false, jogadores);
        await salvarJogador(codigoSala, novoJogador);
      }
      break;
    }

    case "equipe": {
      const jogador = await lerJogador(codigoSala, corpo.jogadorId);
      if (jogador) {
        jogador.equipe = corpo.equipe as Equipe;
        await salvarJogador(codigoSala, jogador);
      }
      break;
    }

    case "pronto": {
      const jogador = await lerJogador(codigoSala, corpo.jogadorId);
      if (jogador) {
        jogador.pronto = Boolean(corpo.pronto);
        await salvarJogador(codigoSala, jogador);
      }
      break;
    }

    case "iniciar": {
      if (meta.organizadorId !== corpo.jogadorId) {
        return NextResponse.json({ ok: false, erro: "Só o organizador pode iniciar a partida." }, { status: 403 });
      }
      const jogadores = await listarJogadores(codigoSala);
      const podeIniciar = podeIniciarPartida(meta, jogadores);
      if (!podeIniciar.ok) return NextResponse.json({ ok: false, erro: podeIniciar.erro }, { status: 400 });

      const novaMeta = prepararInicioPartida(meta, jogadores);
      if (!novaMeta) {
        return NextResponse.json(
          { ok: false, erro: "Banco de perguntas insuficiente para esta faixa etária." },
          { status: 400 },
        );
      }
      await salvarMeta(novaMeta);
      break;
    }

    case "responder": {
      const jaRespondeu = await lerResposta(codigoSala, meta.indiceAtual, corpo.jogadorId);
      if (!jaRespondeu) {
        const resposta = registrarResposta(meta, corpo.jogadorId, corpo.perguntaId, corpo.alternativaEscolhida ?? null);
        if (resposta) await salvarResposta(codigoSala, resposta);
      }
      break;
    }

    default:
      return NextResponse.json({ ok: false, erro: "Ação inválida." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
