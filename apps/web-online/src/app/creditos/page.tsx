import Link from "next/link";
import { Botao } from "@/components/ui/Botao";

export default function Creditos() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-display text-3xl">Créditos</h1>
      <p className="max-w-sm text-slate-600">
        Gincana educativa criada para uso em sala de aula. Código aberto, sem personagens registrados — todos os
        avatares são emojis ou ilustrações originais.
      </p>
      <Link href="/">
        <Botao variante="fantasma">Voltar</Botao>
      </Link>
    </main>
  );
}
