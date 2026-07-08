import { NextResponse } from "next/server";
import type { Equipe, PerfilJogadorInput } from "@/lib/tipos";
import {
  contarChaves,
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
  PAUSA_REVELACAO_MS,
  paraEstadoPublico,
  perguntaAtual,
  podeEntrarNaSala,
  podeIniciarPartida,
  prepararInicioPartida,
  registrarResposta,
  tempoLimitePorDificuldade,
  validarPerfil,
  type JogadorPerfil,
  type SalaMeta,
} from "@/lib/sala-logica";

interface Contexto {
  params: { codigo: string };
}

/** Checagem BARATA (sem baixar o conteúdo de nenhum jogador/resposta) para
 * saber se vale a pena fazer o processamento completo de uma transição.
 * A esmagadora maioria das consultas (enquanto a pergunta ainda está sendo
 * respondida) cai fora aqui, sem tocar em nenhum dado pesado. */
async function precisaAvaliarTransicao(codigoSala: string, meta: SalaMeta): Promise<boolean> {
  if (meta.status !== "EM_ANDAMENTO") return false;

  if (meta.revelacaoAtual) {
    return Date.now() >= meta.revelacaoAtual.revelarEm + PAUSA_REVELACAO_MS;
  }

  const pergunta = perguntaAtual(meta);
  if (!pergunta || meta.perguntaComecouEm === null) return false;

  const tempoLimiteMs = tempoLimitePorDificuldade(pergunta.dificuldade) * 1000;
  if (Date.now() >= meta.perguntaComecouEm + tempoLimiteMs) return true;

  const [totalJogadores, totalRespostas] = await Promise.all([
    contarChaves(`jogador:${codigoSala}:`),
    contarChaves(`resposta:${codigoSala}:${meta.indiceAtual}:`),
  ]);
  return totalJogadores > 0 && totalRespostas >= totalJogadores;
}

/** Busca a meta + jogadores atualizados em UMA passada, avançando o estado
 * da sala (revelar gabarito / próxima pergunta / fim de jogo) se for a
 * hora. Protegida contra escritas obsoletas por um contador de versão: se
 * outra requisição já avançou o estado enquanto esta processava, o cálculo
 * é descartado em vez de sobrescrever (evita o jogo "voltar no tempo"). */
async function sincronizarEObterJogadores(
  codigoSala: string,
  metaInicial: SalaMeta,
): Promise<{ meta: SalaMeta; jogadores: JogadorPerfil[] }> {
  if (!(await precisaAvaliarTransicao(codigoSala, metaInicial))) {
    return { meta: metaInicial, jogadores: await listarJogadores(codigoSala) };
  }

  const jogadores = await listarJogadores(codigoSala);
  const respostas =
    metaInicial.indiceAtual >= 0 ? await listarRespostasDaQuestao(codigoSala, metaInicial.indiceAtual) : [];
  const resultado = avaliarTransicao(metaInicial, jogadores, respostas);
  if (!resultado) return { meta: metaInicial, jogadores };

  const metaNoBanco = await lerMeta(codigoSala);
  if (!metaNoBanco || metaNoBanco.versao !== metaInicial.versao) {
    // Outra requisição já avançou o estado enquanto processávamos.
    return { meta: metaNoBanco ?? metaInicial, jogadores: await listarJogadores(codigoSala) };
  }

  await salvarMeta(resultado.metaAtualizada);
  if (resultado.jogadoresMudaram) {
    await Promise.all(resultado.jogadoresAtualizados.map((j) => salvarJogador(codigoSala, j)));
  }
  return { meta: resultado.metaAtualizada, jogadores: resultado.jogadoresAtualizados };
}

export async function GET(_request: Request, { params }: Contexto) {
  const codigoSala = params.codigo.toUpperCase();
  const metaInicial = await lerMeta(codigoSala);
  if (!metaInicial) return NextResponse.json({ erro: "Sala não encontrada." }, { status: 404 });

  const { meta, jogadores } = await sincronizarEObterJogadores(codigoSala, metaInicial);
  return NextResponse.json(paraEstadoPublico(meta, jogadores));
}

export async function POST(request: Request, { params }: Contexto) {
  const codigoSala = params.codigo.toUpperCase();
  const metaInicial = await lerMeta(codigoSala);
  if (!metaInicial) return NextResponse.json({ ok: false, erro: "Sala não encontrada." }, { status: 404 });

  const corpo = await request.json();
  const acao = corpo.acao as string;

  // A ação "responder" é, de longe, a mais frequente sob carga (todo mundo
  // respondendo ao mesmo tempo) — evita o custo da sincronização completa
  // nesse caminho, já que registrar a resposta não depende dela.
  if (acao === "responder") {
    const jaRespondeu = await lerResposta(codigoSala, metaInicial.indiceAtual, corpo.jogadorId);
    if (!jaRespondeu) {
      const resposta = registrarResposta(metaInicial, corpo.jogadorId, corpo.perguntaId, corpo.alternativaEscolhida ?? null);
      if (resposta) await salvarResposta(codigoSala, resposta);
    }
    return NextResponse.json({ ok: true });
  }

  const { meta } = await sincronizarEObterJogadores(codigoSala, metaInicial);

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

    default:
      return NextResponse.json({ ok: false, erro: "Ação inválida." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
