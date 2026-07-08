import { getStore } from "@netlify/blobs";
import type { JogadorPerfil, RespostaRegistrada, SalaMeta } from "./sala-logica";

function store() {
  return getStore({ name: "salas", consistency: "strong" });
}

// ---- Metadados da sala ----

export async function lerMeta(codigoSala: string): Promise<SalaMeta | null> {
  return store().get(`meta:${codigoSala}`, { type: "json" });
}

export async function salvarMeta(meta: SalaMeta): Promise<void> {
  meta.atualizadoEm = Date.now();
  await store().setJSON(`meta:${meta.codigoSala}`, meta);
}

// ---- Jogadores (uma chave por jogador — sem disputa entre jogadores diferentes) ----

export async function lerJogador(codigoSala: string, jogadorId: string): Promise<JogadorPerfil | null> {
  return store().get(`jogador:${codigoSala}:${jogadorId}`, { type: "json" });
}

export async function salvarJogador(codigoSala: string, jogador: JogadorPerfil): Promise<void> {
  await store().setJSON(`jogador:${codigoSala}:${jogador.id}`, jogador);
}

export async function listarJogadores(codigoSala: string): Promise<JogadorPerfil[]> {
  const s = store();
  const { blobs } = await s.list({ prefix: `jogador:${codigoSala}:` });
  const jogadores = await Promise.all(blobs.map((b) => s.get(b.key, { type: "json" }) as Promise<JogadorPerfil | null>));
  return jogadores.filter((j): j is JogadorPerfil => j !== null);
}

// ---- Respostas (uma chave por pergunta+jogador — sem disputa entre respostas diferentes) ----

export async function lerResposta(codigoSala: string, indiceQuestao: number, jogadorId: string): Promise<RespostaRegistrada | null> {
  return store().get(`resposta:${codigoSala}:${indiceQuestao}:${jogadorId}`, { type: "json" });
}

export async function salvarResposta(codigoSala: string, resposta: RespostaRegistrada): Promise<void> {
  await store().setJSON(`resposta:${codigoSala}:${resposta.indiceQuestao}:${resposta.jogadorId}`, resposta);
}

export async function listarRespostasDaQuestao(codigoSala: string, indiceQuestao: number): Promise<RespostaRegistrada[]> {
  const s = store();
  const { blobs } = await s.list({ prefix: `resposta:${codigoSala}:${indiceQuestao}:` });
  const respostas = await Promise.all(blobs.map((b) => s.get(b.key, { type: "json" }) as Promise<RespostaRegistrada | null>));
  return respostas.filter((r): r is RespostaRegistrada => r !== null);
}
