import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: "#FFD600",
          black: "#0A0A0A",
          gray: {
            50: "#F8F8F8",
            100: "#F0F0F0",
            200: "#E0E0E0",
            300: "#C0C0C0",
            400: "#909090",
            500: "#606060",
            600: "#404040",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        mono: ["monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 2px 16px rgba(0,0,0,0.08)",
        "card-hover": "0 8px 32px rgba(0,0,0,0.14)",
        float: "0 4px 24px rgba(0,0,0,0.16)",
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease forwards",
        "fade-in": "fadeIn 0.3s ease forwards",
        "scale-in": "scaleIn 0.2s ease forwards",
        shimmer: "shimmer 1.5s infinite",
        "spin-slow": "spin 2s linear infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
