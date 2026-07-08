import { NextResponse } from "next/server";
import type { Equipe, PerfilJogadorInput } from "@/lib/tipos";
import { lerSala, salvarSala } from "@/lib/blob-store";
import {
  adicionarJogador,
  escolherEquipe,
  iniciarPartida,
  marcarPronto,
  paraEstadoPublico,
  sincronizarEstado,
  submeterResposta,
} from "@/lib/sala-logica";

interface Contexto {
  params: { codigo: string };
}

export async function GET(_request: Request, { params }: Contexto) {
  const sala = await lerSala(params.codigo.toUpperCase());
  if (!sala) return NextResponse.json({ erro: "Sala não encontrada." }, { status: 404 });

  const alterado = sincronizarEstado(sala);
  if (alterado) await salvarSala(sala);

  return NextResponse.json(paraEstadoPublico(sala));
}

export async function POST(request: Request, { params }: Contexto) {
  const codigoSala = params.codigo.toUpperCase();
  const sala = await lerSala(codigoSala);
  if (!sala) return NextResponse.json({ ok: false, erro: "Sala não encontrada." }, { status: 404 });

  sincronizarEstado(sala);

  const corpo = await request.json();
  const acao = corpo.acao as string;

  switch (acao) {
    case "entrar": {
      const resultado = adicionarJogador(sala, corpo.jogadorId, corpo.perfil as PerfilJogadorInput, false);
      if (!resultado.ok) return NextResponse.json({ ok: false, erro: resultado.erro }, { status: 400 });
      break;
    }
    case "equipe":
      escolherEquipe(sala, corpo.jogadorId, corpo.equipe as Equipe);
      break;
    case "pronto":
      marcarPronto(sala, corpo.jogadorId, Boolean(corpo.pronto));
      break;
    case "iniciar": {
      if (sala.organizadorId !== corpo.jogadorId) {
        return NextResponse.json({ ok: false, erro: "Só o organizador pode iniciar a partida." }, { status: 403 });
      }
      const resultado = iniciarPartida(sala);
      if (!resultado.ok) return NextResponse.json({ ok: false, erro: resultado.erro }, { status: 400 });
      break;
    }
    case "responder":
      submeterResposta(sala, corpo.jogadorId, corpo.alternativaEscolhida ?? null);
      break;
    default:
      return NextResponse.json({ ok: false, erro: "Ação inválida." }, { status: 400 });
  }

  await salvarSala(sala);
  return NextResponse.json({ ok: true });
}
