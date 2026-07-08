import type { Metadata } from "next";
import { Fredoka, Nunito, Space_Mono } from "next/font/google";
import "./globals.css";

const fonteDisplay = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const fonteBody = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-body",
});

const fonteHud = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-hud",
});

export const metadata: Metadata = {
  title: "Gincana Educativa",
  description: "Gincana educativa multiplayer para sala de aula — Equipe Azul vs Equipe Vermelha",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${fonteDisplay.variable} ${fonteBody.variable} ${fonteHud.variable} font-body`}>
        {children}
      </body>
    </html>
  );
}
