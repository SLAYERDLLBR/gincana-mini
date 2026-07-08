"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Botao } from "@/components/ui/Botao";

export default function TelaInicial() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-2 flex items-center gap-2 text-xs font-hud uppercase tracking-[0.3em] text-giz/60"
      >
        <span className="h-2 w-2 rounded-full bg-azul" /> Equipe Azul
        <span className="mx-1">vs</span>
        <span className="h-2 w-2 rounded-full bg-vermelho" /> Equipe Vermelha
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="font-display text-6xl font-semibold tracking-tight sm:text-7xl"
      >
        GINCANA
      </motion.h1>
      <p className="mt-3 max-w-md text-giz/70">
        Uma competição em tempo real para a turma toda. Escolha um time, responda rápido e ajude sua equipe a vencer.
      </p>

      <div className="mt-10 flex w-full max-w-xs flex-col gap-4">
        <Link href="/perfil?modo=criar">
          <Botao variante="azul" className="w-full">
            Criar servidor
          </Botao>
        </Link>
        <Link href="/perfil?modo=entrar">
          <Botao variante="vermelho" className="w-full">
            Entrar no servidor
          </Botao>
        </Link>
        <Link href="/configuracoes">
          <Botao variante="fantasma" className="w-full">
            Configurações
          </Botao>
        </Link>
        <Link href="/creditos">
          <Botao variante="fantasma" className="w-full">
            Créditos
          </Botao>
        </Link>
      </div>
    </main>
  );
}
