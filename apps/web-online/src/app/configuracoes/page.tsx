import Link from "next/link";
import { Botao } from "@/components/ui/Botao";

export default function Configuracoes() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-display text-3xl">Configurações</h1>
      <p className="max-w-sm text-slate-600">
        Em breve: som, tema e duração das perguntas. Por enquanto, a partida já usa os tempos recomendados
        (15 a 20 segundos por pergunta, conforme a dificuldade).
      </p>
      <Link href="/">
        <Botao variante="fantasma">Voltar</Botao>
      </Link>
    </main>
  );
}
