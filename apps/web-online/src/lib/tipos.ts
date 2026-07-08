export type Categoria = "HISTORIA" | "PORTUGUES" | "GRAMATICA" | "RACIOCINIO_LOGICO";
export type Dificuldade = "FACIL" | "MEDIA" | "DIFICIL";
export type Equipe = "AZUL" | "VERMELHO";

export const CATEGORIAS: { id: Categoria; label: string }[] = [
  { id: "HISTORIA", label: "História" },
  { id: "PORTUGUES", label: "Português" },
  { id: "GRAMATICA", label: "Gramática" },
  { id: "RACIOCINIO_LOGICO", label: "Raciocínio Lógico" },
];

export const AVATARES = [
  { id: "robo", emoji: "🤖", label: "Robô" },
  { id: "astronauta", emoji: "🧑‍🚀", label: "Astronauta" },
  { id: "pirata", emoji: "🏴‍☠️", label: "Pirata" },
  { id: "mago", emoji: "🧙", label: "Mago" },
  { id: "dinossauro", emoji: "🦕", label: "Dinossauro" },
  { id: "ninja", emoji: "🥷", label: "Ninja" },
  { id: "explorador", emoji: "🧭", label: "Explorador" },
  { id: "detetive", emoji: "🕵️", label: "Detetive" },
  { id: "raposa", emoji: "🦊", label: "Raposa" },
  { id: "coruja", emoji: "🦉", label: "Coruja" },
  { id: "heroi", emoji: "🦸", label: "Herói" },
  { id: "heroina", emoji: "🦸‍♀️", label: "Heroína" },
] as const;

export type AvatarId = (typeof AVATARES)[number]["id"];

export const CORES_FAVORITAS = [
  { id: "azul", hex: "#2F6FED" },
  { id: "vermelho", hex: "#F2374A" },
  { id: "amarelo", hex: "#FFC53D" },
  { id: "roxo", hex: "#8B5CF6" },
  { id: "verde", hex: "#22C55E" },
  { id: "rosa", hex: "#EC4899" },
] as const;

export type CorFavoritaId = (typeof CORES_FAVORITAS)[number]["id"];

export interface PerfilJogadorInput {
  nomeSessao: string;
  idade: number;
  avatar: AvatarId;
  corFavorita: CorFavoritaId;
}
