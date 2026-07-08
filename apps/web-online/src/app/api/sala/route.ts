import { NextResponse } from "next/server";
import type { PerfilJogadorInput } from "@/lib/tipos";
import { lerMeta, salvarJogador, salvarMeta } from "@/lib/blob-store";
import { criarJogadorPerfil, criarSalaMetaInicial, gerarCodigoSala, validarPerfil } from "@/lib/sala-logica";

export async function POST(request: Request) {
  const corpo = (await request.json()) as { jogadorId: string; perfil: PerfilJogadorInput };

  const validacao = validarPerfil(corpo.perfil);
  if (!validacao.ok) {
    return NextResponse.json({ ok: false, erro: validacao.erro }, { status: 400 });
  }

  let codigoSala = "";
  let tentativas = 0;
  do {
    codigoSala = gerarCodigoSala();
    tentativas += 1;
  } while ((await lerMeta(codigoSala)) !== null && tentativas < 5);

  const meta = criarSalaMetaInicial(codigoSala, corpo.jogadorId);
  const organizador = criarJogadorPerfil(corpo.jogadorId, corpo.perfil, true, []);

  await salvarMeta(meta);
  await salvarJogador(codigoSala, organizador);

  return NextResponse.json({ ok: true, codigoSala });
}
