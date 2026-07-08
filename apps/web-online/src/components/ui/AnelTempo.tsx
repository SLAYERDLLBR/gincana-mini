"use client";

import { motion } from "framer-motion";

interface AnelTempoProps {
  segundosRestantes: number;
  segundosTotal: number;
  tamanho?: number;
}

export function AnelTempo({ segundosRestantes, segundosTotal, tamanho = 96 }: AnelTempoProps) {
  const raio = (tamanho - 12) / 2;
  const circunferencia = 2 * Math.PI * raio;
  const progresso = Math.max(0, Math.min(1, segundosRestantes / segundosTotal));
  const corAnel = progresso > 0.5 ? "#2F6FED" : progresso > 0.2 ? "#FFC53D" : "#F2374A";

  return (
    <div className="relative" style={{ width: tamanho, height: tamanho }}>
      <svg width={tamanho} height={tamanho} className="-rotate-90">
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={8}
          fill="none"
        />
        <motion.circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          stroke={corAnel}
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          animate={{ strokeDashoffset: circunferencia * (1 - progresso) }}
          transition={{ duration: 0.3, ease: "linear" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-hud text-2xl" aria-hidden>
        {Math.max(0, segundosRestantes)}
      </span>
    </div>
  );
}
