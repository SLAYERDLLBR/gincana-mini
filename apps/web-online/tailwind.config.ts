import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        arena: {
          DEFAULT: "#12163B",
          deep: "#0B0E28",
          light: "#1C2150",
        },
        azul: {
          DEFAULT: "#2F6FED",
          soft: "#5D8FF2",
        },
        vermelho: {
          DEFAULT: "#F2374A",
          soft: "#F5616F",
        },
        ouro: "#FFC53D",
        giz: "#F5F3ED",
        recreio: "#8B5CF6",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        hud: ["var(--font-hud)"],
      },
      boxShadow: {
        arena: "0 20px 60px -20px rgba(0,0,0,0.6)",
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
