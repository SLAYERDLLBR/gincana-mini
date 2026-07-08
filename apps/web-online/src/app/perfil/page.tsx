"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AVATARES, CORES_FAVORITAS, type AvatarId, type CorFavoritaId } from "@/lib/tipos";
import { Botao } from "@/components/ui/Botao";
import { criarSala, entrarSala } from "@/lib/api-cliente";
import { salvarPerfilSessao } from "@/lib/sessao";

const IDADES_DISPONIVEIS = [6, 7, 8, 9, 10, 11];

function FormularioPerfil() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modo: "criar" | "entrar" = searchParams.get("modo") === "entrar" ? "entrar" : "criar";

  const [nomeSessao, setNomeSessao] = useState("");
  const [idade, setIdade] = useState<number | null>(null);
  const [avatar, setAvatar] = useState<AvatarId | null>(null);
  const [corFavorita, setCorFavorita] = useState<CorFavoritaId | null>(null);
  const [codigoSala, setCodigoSala] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const podeEnviar =
    nomeSessao.trim().length > 0 &&
    idade !== null &&
    avatar !== null &&
    corFavorita !== null &&
    (modo === "criar" || codigoSala.trim().length === 5);

  async function handleSubmit() {
    if (!podeEnviar || idade === null || !avatar || !corFavorita) return;
    setEnviando(true);
    setErro(null);

    const perfil = { nomeSessao: nomeSessao.trim(), idade, avatar, corFavorita };

    if (modo === "criar") {
      const resposta = await criarSala(perfil);
      setEnviando(false);
      if (!resposta.ok) {
        setErro(resposta.erro);
        return;
      }
      salvarPerfilSessao(perfil);
      router.push(`/lobby/${resposta.codigoSala}`);
    } else {
      const codigo = codigoSala.toUpperCase().trim();
      const resposta = await entrarSala(codigo, perfil);
      setEnviando(false);
      if (!resposta.ok) {
        setErro(resposta.erro);
        return;
      }
      salvarPerfilSessao(perfil);
      router.push(`/lobby/${codigo}`);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center px-6 py-12">
      <h1 className="font-display text-3xl">{modo === "criar" ? "Criar sala" : "Entrar na sala"}</h1>
      <p className="mb-8 mt-1 text-sm text-slate-600">Esse perfil vale só para esta partida.</p>

      <div className="w-full max-w-md space-y-7">
        {modo === "entrar" && (
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Código da sala</label>
            <input
              value={codigoSala}
              onChange={(e) => setCodigoSala(e.target.value.toUpperCase().slice(0, 5))}
              placeholder="EX: A7K2P"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center font-hud text-2xl uppercase tracking-[0.3em] placeholder:text-slate-400"
            />
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Seu nome</label>
          <input
            value={nomeSessao}
            onChange={(e) => setNomeSessao(e.target.value.slice(0, 20))}
            placeholder="Como a turma vai te ver"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 placeholder:text-slate-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Sua idade</label>
          <div className="flex flex-wrap gap-2">
            {IDADES_DISPONIVEIS.map((valor) => (
              <button
                key={valor}
                onClick={() => setIdade(valor)}
                className={`h-12 w-12 rounded-full font-hud text-lg transition ${
                  idade === valor ? "bg-ouro text-arena-deep" : "border border-slate-200 bg-white"
                }`}
              >
                {valor}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Escolha um avatar</label>
          <div className="grid grid-cols-4 gap-3">
            {AVATARES.map((a) => (
              <button
                key={a.id}
                onClick={() => setAvatar(a.id)}
                aria-label={a.label}
                className={`flex aspect-square items-center justify-center rounded-2xl text-3xl transition ${
                  avatar === a.id ? "border-2 border-recreio bg-recreio/30" : "border border-slate-200 bg-white"
                }`}
              >
                {a.emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Cor favorita</label>
          <div className="flex gap-3">
            {CORES_FAVORITAS.map((c) => (
              <button
                key={c.id}
                onClick={() => setCorFavorita(c.id)}
                aria-label={c.id}
                style={{ backgroundColor: c.hex }}
                className={`h-10 w-10 rounded-full transition ${
                  corFavorita === c.id ? "scale-110 ring-4 ring-giz/70" : ""
                }`}
              />
            ))}
          </div>
        </div>

        {erro && <p className="text-sm text-vermelho-soft">{erro}</p>}

        <Botao variante="azul" className="w-full" disabled={!podeEnviar || enviando} onClick={handleSubmit}>
          {enviando ? "Entrando..." : "Confirmar"}
        </Botao>
      </div>
    </main>
  );
}

export default function PaginaPerfil() {
  return (
    <Suspense fallback={null}>
      <FormularioPerfil />
    </Suspense>
  );
}
