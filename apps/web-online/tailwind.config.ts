import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        arena: {
          DEFAULT: "#EAF2FF",
          deep: "#1E2A4A",
          light: "#F5F9FF",
        },
        azul: {
          DEFAULT: "#2F6FED",
          soft: "#4C82F0",
        },
        vermelho: {
          DEFAULT: "#E63946",
          soft: "#EA5A65",
        },
        ouro: "#F5A623",
        giz: "#1E2A4A",
        recreio: "#8B5CF6",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        hud: ["var(--font-hud)"],
      },
      boxShadow: {
        arena: "0 20px 60px -20px rgba(30,41,59,0.2)",
        suave: "0 4px 14px -4px rgba(30,41,59,0.18), 0 2px 4px -2px rgba(30,41,59,0.1)",
      },
      keyframes: {
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "spin-slow": "spin-slow 8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
