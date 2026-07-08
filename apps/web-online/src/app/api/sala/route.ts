import { NextResponse } from "next/server";
import type { PerfilJogadorInput } from "@/lib/tipos";
import { lerSala, salvarSala } from "@/lib/blob-store";
import { adicionarJogador, criarSalaEstadoInicial, gerarCodigoSala } from "@/lib/sala-logica";

export async function POST(request: Request) {
  const corpo = (await request.json()) as { jogadorId: string; perfil: PerfilJogadorInput };

  let codigoSala = "";
  let tentativas = 0;
  do {
    codigoSala = gerarCodigoSala();
    tentativas += 1;
  } while ((await lerSala(codigoSala)) !== null && tentativas < 5);

  const sala = criarSalaEstadoInicial(codigoSala);
  const resultado = adicionarJogador(sala, corpo.jogadorId, corpo.perfil, true);
  if (!resultado.ok) {
    return NextResponse.json({ ok: false, erro: resultado.erro }, { status: 400 });
  }

  await salvarSala(sala);
  return NextResponse.json({ ok: true, codigoSala });
}
