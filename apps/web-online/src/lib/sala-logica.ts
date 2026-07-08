import type { AvatarId, Categoria, CorFavoritaId, Dificuldade, Equipe, PerfilJogadorInput } from "@/lib/tipos";
import bancoPerguntas from "@/data/perguntas.json";

export const PAUSA_REVELACAO_MS = 6000;
const ATRASO_INICIAL_MS = 15000; // contagem regressiva de 15s antes da 1ª pergunta
const TEMPO_RESPOSTA_SEGUNDOS = 30; // tempo fixo para responder, igual em todas as dificuldades
const MAX_JOGADORES = 40;
const PONTOS_POR_ACERTO = 100;

export interface PerguntaArmazenada {
  id: string;
  enunciado: string;
  alternativas: string[];
  respostaCorreta: number;
  explicacao: string;
  categoria: Categoria;
  dificuldade: Dificuldade;
  idade: number;
}

const BANCO = bancoPerguntas as PerguntaArmazenada[];

/**
 * Perfil + estatísticas de um jogador. Cada jogador vive na sua PRÓPRIA chave
 * de armazenamento (jogador:{sala}:{id}) — ações de um jogador (trocar de
 * equipe, marcar pronto) NUNCA disputam a mesma chave que outro jogador está
 * escrevendo, o que elimina o principal ponto de perda de dados sob carga.
 */
export interface JogadorPerfil {
  id: string;
  nomeSessao: string;
  idade: number;
  avatar: AvatarId;
  corFavorita: CorFavoritaId;
  equipe: Equipe;
  pronto: boolean;
  organizador: boolean;
  pontuacao: number;
  acertos: number;
  sequenciaAtual: number;
  maiorSequencia: number;
  temposRespostaMs: number[];
}

/** Registro imutável de uma resposta, também em chave própria
 * (resposta:{sala}:{indiceQuestao}:{jogadorId}) — cada jogador só escreve na
 * própria resposta, nunca disputando com as respostas de outros jogadores
 * para a mesma pergunta. */
export interface RespostaRegistrada {
  jogadorId: string;
  indiceQuestao: number;
  perguntaId: string;
  alternativaEscolhida: number | null;
  correta: boolean;
  tempoRespostaMs: number;
  pontosGanhos: number;
}

export interface RevelacaoAtual {
  perguntaId: string;
  alternativaCorreta: number;
  explicacao: string;
  placarAzul: number;
  placarVermelho: number;
  revelarEm: number;
}

export interface DestaquesFinais {
  equipeVencedora: Equipe | "EMPATE";
  placarAzul: number;
  placarVermelho: number;
  melhorJogador: { nomeSessao: string; pontuacao: number } | null;
  maisRapido: { nomeSessao: string; tempoMedioMs: number } | null;
  maiorSequencia: { nomeSessao: string; sequencia: number } | null;
  ranking: { nomeSessao: string; equipe: Equipe; pontuacao: number }[];
}

/** Metadados da sala — a ÚNICA parte do estado que continua "compartilhada".
 * É escrita com pouca frequência (criação, início, e a transição entre
 * perguntas), então o risco de disputa é muito menor do que tentar guardar
 * a lista inteira de jogadores no mesmo objeto. */
export interface SalaMeta {
  codigoSala: string;
  status: "LOBBY" | "EM_ANDAMENTO" | "FINALIZADA";
  organizadorId: string;
  perguntasSelecionadasIds: string[];
  indiceAtual: number;
  perguntaComecouEm: number | null;
  alternativasRodadaAtual: string[];
  indiceCorretoRodadaAtual: number | null;
  revelacaoAtual: RevelacaoAtual | null;
  destaquesFinais: DestaquesFinais | null;
  criadaEm: number;
  atualizadoEm: number;
  /** Contador incrementado a cada gravação — usado para detectar se alguém
   * mais já avançou o estado da sala enquanto esta requisição processava,
   * evitando que uma escrita atrasada "volte no tempo" o jogo. */
  versao: number;
}

export function gerarCodigoSala(): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let codigo = "";
  for (let i = 0; i < 5; i++) codigo += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  return codigo;
}

export function criarSalaMetaInicial(codigoSala: string, organizadorId: string): SalaMeta {
  const agora = Date.now();
  return {
    codigoSala,
    status: "LOBBY",
    organizadorId,
    perguntasSelecionadasIds: [],
    indiceAtual: -1,
    perguntaComecouEm: null,
    alternativasRodadaAtual: [],
    indiceCorretoRodadaAtual: null,
    revelacaoAtual: null,
    destaquesFinais: null,
    criadaEm: agora,
    atualizadoEm: agora,
    versao: 0,
  };
}

export function sugerirEquipeBalanceada(jogadores: JogadorPerfil[]): Equipe {
  const azul = jogadores.filter((j) => j.equipe === "AZUL").length;
  const vermelho = jogadores.filter((j) => j.equipe === "VERMELHO").length;
  return azul <= vermelho ? "AZUL" : "VERMELHO";
}

export function validarPerfil(perfil: PerfilJogadorInput): { ok: true } | { ok: false; erro: string } {
  if (perfil.idade < 6 || perfil.idade > 11) return { ok: false, erro: "A idade deve estar entre 6 e 11 anos." };
  if (!perfil.nomeSessao?.trim()) return { ok: false, erro: "Digite um nome para entrar na sala." };
  return { ok: true };
}

export function podeEntrarNaSala(meta: SalaMeta, totalJogadores: number): { ok: true } | { ok: false; erro: string } {
  if (meta.status !== "LOBBY") return { ok: false, erro: "Esta partida já começou. Peça ao professor para criar uma nova sala." };
  if (totalJogadores >= MAX_JOGADORES) return { ok: false, erro: "Esta sala já está cheia." };
  return { ok: true };
}

export function criarJogadorPerfil(
  jogadorId: string,
  perfil: PerfilJogadorInput,
  organizador: boolean,
  jogadoresExistentes: JogadorPerfil[],
): JogadorPerfil {
  return {
    id: jogadorId,
    nomeSessao: perfil.nomeSessao.trim().slice(0, 20),
    idade: perfil.idade,
    avatar: perfil.avatar,
    corFavorita: perfil.corFavorita,
    equipe: sugerirEquipeBalanceada(jogadoresExistentes),
    pronto: false,
    organizador,
    pontuacao: 0,
    acertos: 0,
    sequenciaAtual: 0,
    maiorSequencia: 0,
    temposRespostaMs: [],
  };
}

export function tempoLimitePorDificuldade(_dificuldade: Dificuldade): number {
  return TEMPO_RESPOSTA_SEGUNDOS;
}

function embaralhar<T>(itens: T[]): T[] {
  const copia = [...itens];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function selecionarPerguntas(idadeAlvo: number): PerguntaArmazenada[] {
  const categorias: Categoria[] = ["HISTORIA", "PORTUGUES", "GRAMATICA", "RACIOCINIO_LOGICO"];
  const distribuicao: Dificuldade[] = ["FACIL", "FACIL", "MEDIA", "MEDIA", "DIFICIL"];
  const selecionadas: PerguntaArmazenada[] = [];

  for (const categoria of categorias) {
    for (const dificuldade of distribuicao) {
      let escolhida: PerguntaArmazenada | null = null;
      for (let raio = 0; raio <= 5 && !escolhida; raio++) {
        const idades = raio === 0 ? [idadeAlvo] : [idadeAlvo - raio, idadeAlvo + raio];
        const candidatas = BANCO.filter(
          (p) =>
            p.categoria === categoria &&
            p.dificuldade === dificuldade &&
            idades.includes(p.idade) &&
            !selecionadas.some((s) => s.id === p.id),
        );
        if (candidatas.length > 0) escolhida = candidatas[Math.floor(Math.random() * candidatas.length)];
      }
      if (escolhida) selecionadas.push(escolhida);
    }
  }
  return embaralhar(selecionadas);
}

function perguntaPorId(id: string): PerguntaArmazenada | undefined {
  return BANCO.find((p) => p.id === id);
}

export function perguntaAtual(meta: SalaMeta): PerguntaArmazenada | null {
  const id = meta.perguntasSelecionadasIds[meta.indiceAtual];
  return id ? perguntaPorId(id) ?? null : null;
}

function prepararAlternativas(pergunta: PerguntaArmazenada): { alternativas: string[]; indiceCorreto: number } {
  const indices = pergunta.alternativas.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return {
    alternativas: indices.map((i) => pergunta.alternativas[i]),
    indiceCorreto: indices.indexOf(pergunta.respostaCorreta),
  };
}

export function podeIniciarPartida(meta: SalaMeta, jogadores: JogadorPerfil[]): { ok: true } | { ok: false; erro: string } {
  if (meta.status !== "LOBBY") return { ok: false, erro: "A partida já foi iniciada." };
  if (jogadores.length < 2) return { ok: false, erro: "É preciso pelo menos 2 jogadores para iniciar." };
  if (!jogadores.every((j) => j.pronto)) {
    return { ok: false, erro: "Nem todos os jogadores confirmaram que estão prontos." };
  }
  return { ok: true };
}

export function prepararInicioPartida(meta: SalaMeta, jogadores: JogadorPerfil[]): SalaMeta | null {
  const idadeAlvo = Math.round(jogadores.reduce((s, j) => s + j.idade, 0) / jogadores.length);
  const selecionadas = selecionarPerguntas(idadeAlvo);
  if (selecionadas.length < 10) return null;

  const { alternativas, indiceCorreto } = prepararAlternativas(selecionadas[0]);

  return {
    ...meta,
    perguntasSelecionadasIds: selecionadas.map((p) => p.id),
    status: "EM_ANDAMENTO",
    indiceAtual: 0,
    perguntaComecouEm: Date.now() + ATRASO_INICIAL_MS,
    alternativasRodadaAtual: alternativas,
    indiceCorretoRodadaAtual: indiceCorreto,
    revelacaoAtual: null,
    versao: meta.versao + 1,
  };
}

/** Calcula (sem gravar nada) o resultado de UMA resposta. Retorna null se a
 * resposta não deve ser aceita (fora de sincronia, tempo esgotado, etc). */
export function registrarResposta(
  meta: SalaMeta,
  jogadorId: string,
  perguntaId: string,
  alternativaEscolhida: number | null,
): RespostaRegistrada | null {
  const pergunta = perguntaAtual(meta);
  if (!pergunta || meta.perguntaComecouEm === null) return null;
  if (pergunta.id !== perguntaId) return null; // cliente estava numa pergunta que já mudou
  if (meta.revelacaoAtual) return null; // já revelou o gabarito, não aceita mais respostas
  if (Date.now() < meta.perguntaComecouEm) return null; // ainda na contagem regressiva

  const tempoLimiteMs = tempoLimitePorDificuldade(pergunta.dificuldade) * 1000;
  const tempoRespostaMs = Math.min(tempoLimiteMs, Date.now() - meta.perguntaComecouEm);
  const correta = alternativaEscolhida === meta.indiceCorretoRodadaAtual;

  return {
    jogadorId,
    indiceQuestao: meta.indiceAtual,
    perguntaId: pergunta.id,
    alternativaEscolhida,
    correta,
    tempoRespostaMs,
    pontosGanhos: correta ? PONTOS_POR_ACERTO : 0,
  };
}

function somarPlacar(jogadores: JogadorPerfil[], equipe: Equipe): number {
  return jogadores.filter((j) => j.equipe === equipe).reduce((soma, j) => soma + j.pontuacao, 0);
}

export function calcularDestaquesFinais(jogadores: JogadorPerfil[]): DestaquesFinais {
  const placarAzul = somarPlacar(jogadores, "AZUL");
  const placarVermelho = somarPlacar(jogadores, "VERMELHO");
  const melhor = [...jogadores].sort((a, b) => b.pontuacao - a.pontuacao)[0] ?? null;
  const maisRapido =
    jogadores
      .filter((j) => j.temposRespostaMs.length > 0)
      .map((j) => ({ nomeSessao: j.nomeSessao, tempoMedioMs: j.temposRespostaMs.reduce((a, b) => a + b, 0) / j.temposRespostaMs.length }))
      .sort((a, b) => a.tempoMedioMs - b.tempoMedioMs)[0] ?? null;
  const maiorSequenciaJogador = [...jogadores].sort((a, b) => b.maiorSequencia - a.maiorSequencia)[0] ?? null;

  return {
    equipeVencedora: placarAzul === placarVermelho ? "EMPATE" : placarAzul > placarVermelho ? "AZUL" : "VERMELHO",
    placarAzul,
    placarVermelho,
    melhorJogador: melhor ? { nomeSessao: melhor.nomeSessao, pontuacao: melhor.pontuacao } : null,
    maisRapido,
    maiorSequencia: maiorSequenciaJogador
      ? { nomeSessao: maiorSequenciaJogador.nomeSessao, sequencia: maiorSequenciaJogador.maiorSequencia }
      : null,
    ranking: [...jogadores].sort((a, b) => b.pontuacao - a.pontuacao).map((j) => ({ nomeSessao: j.nomeSessao, equipe: j.equipe, pontuacao: j.pontuacao })),
  };
}

export interface ResultadoTransicao {
  metaAtualizada: SalaMeta;
  jogadoresAtualizados: JogadorPerfil[];
  jogadoresMudaram: boolean;
}

/**
 * Avalia se a sala precisa avançar de estado (revelar gabarito, avançar de
 * pergunta, ou finalizar). É uma função PURA — não lê nem grava nada — e é
 * seguro chamá-la várias vezes em paralelo: como ela sempre recalcula os
 * valores a partir dos mesmos dados de entrada (em vez de incrementar um
 * valor que pode estar sendo alterado por outra requisição ao mesmo tempo),
 * mesmo que duas chamadas concorrentes cheguem a esse ponto, o resultado
 * final gravado é o mesmo — sem perda de pontos.
 */
export function avaliarTransicao(
  meta: SalaMeta,
  jogadores: JogadorPerfil[],
  respostasQuestaoAtual: RespostaRegistrada[],
): ResultadoTransicao | null {
  if (meta.status !== "EM_ANDAMENTO") return null;
  const pergunta = perguntaAtual(meta);
  if (!pergunta || meta.perguntaComecouEm === null) return null;

  const agora = Date.now();
  const tempoLimiteMs = tempoLimitePorDificuldade(pergunta.dificuldade) * 1000;
  const todosResponderam = jogadores.length > 0 && respostasQuestaoAtual.length >= jogadores.length;
  const tempoEsgotado = agora >= meta.perguntaComecouEm + tempoLimiteMs;

  // 1) Revelar o gabarito desta pergunta (aplica a pontuação de quem respondeu)
  if (!meta.revelacaoAtual && (todosResponderam || tempoEsgotado)) {
    const jogadoresAtualizados = jogadores.map((jogador) => {
      const resposta = respostasQuestaoAtual.find((r) => r.jogadorId === jogador.id);
      if (!resposta) {
        // Não respondeu a tempo: quebra a sequência de acertos, sem pontuar.
        return jogador.sequenciaAtual === 0 ? jogador : { ...jogador, sequenciaAtual: 0 };
      }
      const sequenciaAtual = resposta.correta ? jogador.sequenciaAtual + 1 : 0;
      return {
        ...jogador,
        pontuacao: jogador.pontuacao + resposta.pontosGanhos,
        acertos: jogador.acertos + (resposta.correta ? 1 : 0),
        sequenciaAtual,
        maiorSequencia: Math.max(jogador.maiorSequencia, sequenciaAtual),
        temposRespostaMs: [...jogador.temposRespostaMs, resposta.tempoRespostaMs],
      };
    });

    return {
      metaAtualizada: {
        ...meta,
        revelacaoAtual: {
          perguntaId: pergunta.id,
          alternativaCorreta: meta.indiceCorretoRodadaAtual ?? 0,
          explicacao: pergunta.explicacao,
          placarAzul: somarPlacar(jogadoresAtualizados, "AZUL"),
          placarVermelho: somarPlacar(jogadoresAtualizados, "VERMELHO"),
          revelarEm: agora,
        },
        versao: meta.versao + 1,
      },
      jogadoresAtualizados,
      jogadoresMudaram: true,
    };
  }

  // 2) Avançar para a próxima pergunta (ou finalizar, se essa era a última)
  if (meta.revelacaoAtual && agora >= meta.revelacaoAtual.revelarEm + PAUSA_REVELACAO_MS) {
    const proximoIndice = meta.indiceAtual + 1;

    if (proximoIndice >= meta.perguntasSelecionadasIds.length) {
      return {
        metaAtualizada: {
          ...meta,
          status: "FINALIZADA",
          revelacaoAtual: null,
          destaquesFinais: calcularDestaquesFinais(jogadores),
          versao: meta.versao + 1,
        },
        jogadoresAtualizados: jogadores,
        jogadoresMudaram: false,
      };
    }

    const proximaPergunta = perguntaPorId(meta.perguntasSelecionadasIds[proximoIndice]);
    if (!proximaPergunta) return null;
    const { alternativas, indiceCorreto } = prepararAlternativas(proximaPergunta);

    return {
      metaAtualizada: {
        ...meta,
        indiceAtual: proximoIndice,
        perguntaComecouEm: agora,
        alternativasRodadaAtual: alternativas,
        indiceCorretoRodadaAtual: indiceCorreto,
        revelacaoAtual: null,
        versao: meta.versao + 1,
      },
      jogadoresAtualizados: jogadores,
      jogadoresMudaram: false,
    };
  }

  return null;
}

export interface PerguntaPublica {
  id: string;
  numero: number;
  total: number;
  enunciado: string;
  alternativas: string[];
  categoria: Categoria;
  dificuldade: Dificuldade;
  tempoLimiteSegundos: number;
  comecaEm: number;
}

export interface EstadoPublico {
  codigoSala: string;
  status: SalaMeta["status"];
  organizadorId: string;
  jogadores: JogadorPerfil[];
  pergunta: PerguntaPublica | null;
  revelacao: Omit<RevelacaoAtual, "revelarEm"> | null;
  destaques: DestaquesFinais | null;
  placarAoVivo: {
    placarAzul: number;
    placarVermelho: number;
    equipeLider: Equipe | "EMPATE";
    melhorJogador: { nomeSessao: string; acertos: number; equipe: Equipe } | null;
  };
  agora: number;
}

export function paraEstadoPublico(meta: SalaMeta, jogadores: JogadorPerfil[]): EstadoPublico {
  const pergunta = perguntaAtual(meta);
  const placarAzul = somarPlacar(jogadores, "AZUL");
  const placarVermelho = somarPlacar(jogadores, "VERMELHO");
  const melhor = [...jogadores].filter((j) => j.acertos > 0).sort((a, b) => b.acertos - a.acertos)[0] ?? null;

  return {
    codigoSala: meta.codigoSala,
    status: meta.status,
    organizadorId: meta.organizadorId,
    jogadores,
    pergunta:
      pergunta && meta.perguntaComecouEm !== null
        ? {
            id: pergunta.id,
            numero: meta.indiceAtual + 1,
            total: meta.perguntasSelecionadasIds.length,
            enunciado: pergunta.enunciado,
            alternativas: meta.alternativasRodadaAtual,
            categoria: pergunta.categoria,
            dificuldade: pergunta.dificuldade,
            tempoLimiteSegundos: tempoLimitePorDificuldade(pergunta.dificuldade),
            comecaEm: meta.perguntaComecouEm,
          }
        : null,
    revelacao: meta.revelacaoAtual
      ? {
          perguntaId: meta.revelacaoAtual.perguntaId,
          alternativaCorreta: meta.revelacaoAtual.alternativaCorreta,
          explicacao: meta.revelacaoAtual.explicacao,
          placarAzul: meta.revelacaoAtual.placarAzul,
          placarVermelho: meta.revelacaoAtual.placarVermelho,
        }
      : null,
    destaques: meta.destaquesFinais,
    placarAoVivo: {
      placarAzul,
      placarVermelho,
      equipeLider: placarAzul === placarVermelho ? "EMPATE" : placarAzul > placarVermelho ? "AZUL" : "VERMELHO",
      melhorJogador: melhor ? { nomeSessao: melhor.nomeSessao, acertos: melhor.acertos, equipe: melhor.equipe } : null,
    },
    agora: Date.now(),
  };
}
