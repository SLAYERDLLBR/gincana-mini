import type { AvatarId, Categoria, CorFavoritaId, Dificuldade, Equipe, PerfilJogadorInput } from "@/lib/tipos";
import bancoPerguntas from "@/data/perguntas.json";

const PAUSA_REVELACAO_MS = 6000;
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

export interface JogadorEstado {
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

export interface RespostaRegistrada {
  jogadorId: string;
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

export interface SalaEstado {
  codigoSala: string;
  status: "LOBBY" | "EM_ANDAMENTO" | "FINALIZADA";
  organizadorId: string;
  jogadores: JogadorEstado[];
  perguntasSelecionadasIds: string[];
  indiceAtual: number;
  perguntaComecouEm: number | null;
  alternativasRodadaAtual: string[];
  indiceCorretoRodadaAtual: number | null;
  respostasQuestaoAtual: Record<string, RespostaRegistrada>;
  historicoRespostas: RespostaRegistrada[];
  revelacaoAtual: RevelacaoAtual | null;
  destaquesFinais: DestaquesFinais | null;
  criadaEm: number;
  atualizadoEm: number;
}

export function gerarCodigoSala(): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let codigo = "";
  for (let i = 0; i < 5; i++) codigo += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  return codigo;
}

export function criarSalaEstadoInicial(codigoSala: string): SalaEstado {
  const agora = Date.now();
  return {
    codigoSala,
    status: "LOBBY",
    organizadorId: "",
    jogadores: [],
    perguntasSelecionadasIds: [],
    indiceAtual: -1,
    perguntaComecouEm: null,
    alternativasRodadaAtual: [],
    indiceCorretoRodadaAtual: null,
    respostasQuestaoAtual: {},
    historicoRespostas: [],
    revelacaoAtual: null,
    destaquesFinais: null,
    criadaEm: agora,
    atualizadoEm: agora,
  };
}

export function sugerirEquipeBalanceada(sala: SalaEstado): Equipe {
  const azul = sala.jogadores.filter((j) => j.equipe === "AZUL").length;
  const vermelho = sala.jogadores.filter((j) => j.equipe === "VERMELHO").length;
  return azul <= vermelho ? "AZUL" : "VERMELHO";
}

export function adicionarJogador(
  sala: SalaEstado,
  jogadorId: string,
  perfil: PerfilJogadorInput,
  organizador: boolean,
): { ok: true } | { ok: false; erro: string } {
  if (sala.status !== "LOBBY") return { ok: false, erro: "Esta partida já começou." };
  if (sala.jogadores.length >= MAX_JOGADORES) return { ok: false, erro: "Sala cheia." };
  if (perfil.idade < 6 || perfil.idade > 11) return { ok: false, erro: "Idade deve ser entre 6 e 11 anos." };
  if (!perfil.nomeSessao?.trim()) return { ok: false, erro: "Digite um nome." };
  if (sala.jogadores.some((j) => j.id === jogadorId)) return { ok: true }; // já estava na sala (reconexão)

  sala.jogadores.push({
    id: jogadorId,
    nomeSessao: perfil.nomeSessao.trim().slice(0, 20),
    idade: perfil.idade,
    avatar: perfil.avatar,
    corFavorita: perfil.corFavorita,
    equipe: sugerirEquipeBalanceada(sala),
    pronto: false,
    organizador,
    pontuacao: 0,
    acertos: 0,
    sequenciaAtual: 0,
    maiorSequencia: 0,
    temposRespostaMs: [],
  });
  if (organizador) sala.organizadorId = jogadorId;
  return { ok: true };
}

export function escolherEquipe(sala: SalaEstado, jogadorId: string, equipe: Equipe): void {
  const jogador = sala.jogadores.find((j) => j.id === jogadorId);
  if (jogador) jogador.equipe = equipe;
}

export function marcarPronto(sala: SalaEstado, jogadorId: string, pronto: boolean): void {
  const jogador = sala.jogadores.find((j) => j.id === jogadorId);
  if (jogador) jogador.pronto = pronto;
}

export function placarEquipe(sala: SalaEstado, equipe: Equipe): number {
  return sala.jogadores.filter((j) => j.equipe === equipe).reduce((soma, j) => soma + j.pontuacao, 0);
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

export function iniciarPartida(sala: SalaEstado): { ok: true } | { ok: false; erro: string } {
  if (sala.status !== "LOBBY") return { ok: false, erro: "A partida já foi iniciada." };
  if (sala.jogadores.length < 2) return { ok: false, erro: "É preciso pelo menos 2 jogadores para iniciar." };
  if (!sala.jogadores.every((j) => j.pronto)) {
    return { ok: false, erro: "Nem todos os jogadores confirmaram que estão prontos." };
  }

  const idadeAlvo = Math.round(sala.jogadores.reduce((s, j) => s + j.idade, 0) / sala.jogadores.length);
  const selecionadas = selecionarPerguntas(idadeAlvo);
  if (selecionadas.length < 10) {
    return { ok: false, erro: "Banco de perguntas insuficiente para esta faixa etária." };
  }

  sala.perguntasSelecionadasIds = selecionadas.map((p) => p.id);
  sala.status = "EM_ANDAMENTO";
  sala.indiceAtual = 0;
  sala.perguntaComecouEm = Date.now() + ATRASO_INICIAL_MS;
  prepararAlternativasRodada(sala);
  return { ok: true };
}

function perguntaPorId(id: string): PerguntaArmazenada | undefined {
  return BANCO.find((p) => p.id === id);
}

export function perguntaAtual(sala: SalaEstado): PerguntaArmazenada | null {
  const id = sala.perguntasSelecionadasIds[sala.indiceAtual];
  return id ? perguntaPorId(id) ?? null : null;
}

function prepararAlternativasRodada(sala: SalaEstado): void {
  const pergunta = perguntaAtual(sala);
  if (!pergunta) return;
  const indices = pergunta.alternativas.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  sala.alternativasRodadaAtual = indices.map((i) => pergunta.alternativas[i]);
  sala.indiceCorretoRodadaAtual = indices.indexOf(pergunta.respostaCorreta);
  sala.respostasQuestaoAtual = {};
}

export function submeterResposta(sala: SalaEstado, jogadorId: string, alternativaEscolhida: number | null): void {
  const jogador = sala.jogadores.find((j) => j.id === jogadorId);
  const pergunta = perguntaAtual(sala);
  if (!jogador || !pergunta || sala.perguntaComecouEm === null) return;
  if (sala.respostasQuestaoAtual[jogadorId]) return;
  if (Date.now() < sala.perguntaComecouEm) return; // ainda na contagem regressiva

  const tempoLimiteMs = tempoLimitePorDificuldade(pergunta.dificuldade) * 1000;
  const tempoRespostaMs = Math.min(tempoLimiteMs, Date.now() - sala.perguntaComecouEm);
  const correta = alternativaEscolhida === sala.indiceCorretoRodadaAtual;

  // Pontuação baseada SOMENTE em acerto/erro — o tempo de resposta é
  // registrado apenas para estatísticas (ex: "jogador mais rápido"), sem
  // nenhum efeito no placar.
  let pontosGanhos = 0;
  if (correta) {
    jogador.sequenciaAtual += 1;
    jogador.acertos += 1;
    jogador.maiorSequencia = Math.max(jogador.maiorSequencia, jogador.sequenciaAtual);
    pontosGanhos = PONTOS_POR_ACERTO;
  } else {
    jogador.sequenciaAtual = 0;
  }

  jogador.pontuacao += pontosGanhos;
  jogador.temposRespostaMs.push(tempoRespostaMs);

  const registro: RespostaRegistrada = { jogadorId, perguntaId: pergunta.id, alternativaEscolhida, correta, tempoRespostaMs, pontosGanhos };
  sala.respostasQuestaoAtual[jogadorId] = registro;
  sala.historicoRespostas.push(registro);

  if (Object.keys(sala.respostasQuestaoAtual).length >= sala.jogadores.length) {
    revelarResposta(sala);
  }
}

function revelarResposta(sala: SalaEstado): void {
  const pergunta = perguntaAtual(sala);
  if (!pergunta || sala.revelacaoAtual) return;
  sala.revelacaoAtual = {
    perguntaId: pergunta.id,
    alternativaCorreta: sala.indiceCorretoRodadaAtual ?? 0,
    explicacao: pergunta.explicacao,
    placarAzul: placarEquipe(sala, "AZUL"),
    placarVermelho: placarEquipe(sala, "VERMELHO"),
    revelarEm: Date.now(),
  };
}

function avancarOuFinalizar(sala: SalaEstado): void {
  sala.revelacaoAtual = null;
  sala.indiceAtual += 1;
  if (sala.indiceAtual >= sala.perguntasSelecionadasIds.length) {
    finalizarPartida(sala);
    return;
  }
  sala.perguntaComecouEm = Date.now();
  prepararAlternativasRodada(sala);
}

function finalizarPartida(sala: SalaEstado): void {
  sala.status = "FINALIZADA";
  const placarAzul = placarEquipe(sala, "AZUL");
  const placarVermelho = placarEquipe(sala, "VERMELHO");
  const melhor = [...sala.jogadores].sort((a, b) => b.pontuacao - a.pontuacao)[0] ?? null;
  const maisRapido =
    sala.jogadores
      .filter((j) => j.temposRespostaMs.length > 0)
      .map((j) => ({ nomeSessao: j.nomeSessao, tempoMedioMs: j.temposRespostaMs.reduce((a, b) => a + b, 0) / j.temposRespostaMs.length }))
      .sort((a, b) => a.tempoMedioMs - b.tempoMedioMs)[0] ?? null;
  const maiorSequenciaJogador = [...sala.jogadores].sort((a, b) => b.maiorSequencia - a.maiorSequencia)[0] ?? null;

  sala.destaquesFinais = {
    equipeVencedora: placarAzul === placarVermelho ? "EMPATE" : placarAzul > placarVermelho ? "AZUL" : "VERMELHO",
    placarAzul,
    placarVermelho,
    melhorJogador: melhor ? { nomeSessao: melhor.nomeSessao, pontuacao: melhor.pontuacao } : null,
    maisRapido,
    maiorSequencia: maiorSequenciaJogador ? { nomeSessao: maiorSequenciaJogador.nomeSessao, sequencia: maiorSequenciaJogador.maiorSequencia } : null,
    ranking: [...sala.jogadores].sort((a, b) => b.pontuacao - a.pontuacao).map((j) => ({ nomeSessao: j.nomeSessao, equipe: j.equipe, pontuacao: j.pontuacao })),
  };
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
  status: SalaEstado["status"];
  organizadorId: string;
  jogadores: JogadorEstado[];
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

function calcularPlacarAoVivo(sala: SalaEstado): EstadoPublico["placarAoVivo"] {
  const placarAzul = placarEquipe(sala, "AZUL");
  const placarVermelho = placarEquipe(sala, "VERMELHO");
  const melhor = [...sala.jogadores].filter((j) => j.acertos > 0).sort((a, b) => b.acertos - a.acertos)[0] ?? null;

  return {
    placarAzul,
    placarVermelho,
    equipeLider: placarAzul === placarVermelho ? "EMPATE" : placarAzul > placarVermelho ? "AZUL" : "VERMELHO",
    melhorJogador: melhor ? { nomeSessao: melhor.nomeSessao, acertos: melhor.acertos, equipe: melhor.equipe } : null,
  };
}

export function paraEstadoPublico(sala: SalaEstado): EstadoPublico {
  const pergunta = perguntaAtual(sala);

  return {
    codigoSala: sala.codigoSala,
    status: sala.status,
    organizadorId: sala.organizadorId,
    jogadores: sala.jogadores,
    pergunta:
      pergunta && sala.perguntaComecouEm !== null
        ? {
            id: pergunta.id,
            numero: sala.indiceAtual + 1,
            total: sala.perguntasSelecionadasIds.length,
            enunciado: pergunta.enunciado,
            alternativas: sala.alternativasRodadaAtual,
            categoria: pergunta.categoria,
            dificuldade: pergunta.dificuldade,
            tempoLimiteSegundos: tempoLimitePorDificuldade(pergunta.dificuldade),
            comecaEm: sala.perguntaComecouEm,
          }
        : null,
    revelacao: sala.revelacaoAtual
      ? {
          perguntaId: sala.revelacaoAtual.perguntaId,
          alternativaCorreta: sala.revelacaoAtual.alternativaCorreta,
          explicacao: sala.revelacaoAtual.explicacao,
          placarAzul: sala.revelacaoAtual.placarAzul,
          placarVermelho: sala.revelacaoAtual.placarVermelho,
        }
      : null,
    destaques: sala.destaquesFinais,
    placarAoVivo: calcularPlacarAoVivo(sala),
    agora: Date.now(),
  };
}
/** Chamado em toda leitura/ação: avança o estado do jogo com base no relógio,
 * já que não existe um timer de servidor no modelo serverless (a "virada de
 * pergunta" acontece de forma preguiçosa, disparada pela próxima consulta). */
export function sincronizarEstado(sala: SalaEstado): boolean {
  if (sala.status !== "EM_ANDAMENTO") return false;
  const pergunta = perguntaAtual(sala);
  if (!pergunta || sala.perguntaComecouEm === null) return false;

  let alterado = false;
  const agora = Date.now();
  const tempoLimiteMs = tempoLimitePorDificuldade(pergunta.dificuldade) * 1000;

  if (!sala.revelacaoAtual && agora >= sala.perguntaComecouEm + tempoLimiteMs) {
    revelarResposta(sala);
    alterado = true;
  }

  if (sala.revelacaoAtual && agora >= sala.revelacaoAtual.revelarEm + PAUSA_REVELACAO_MS) {
    avancarOuFinalizar(sala);
    alterado = true;
  }

  return alterado;
}
