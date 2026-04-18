import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // AI Shelf palette (provided)
        lavender: "#d8d8f6",
        "amethyst-smoke": "#b18fcf",
        "lilac-ash": "#978897",
        charcoal: "#494850",
        "shadow-grey": "#2c2c34",

        // Semantic UI tokens
        bg: "#0f1117",
        bg2: "#161922",
        panel: "rgba(44, 44, 52, 0.58)",
        panel2: "rgba(73, 72, 80, 0.26)",
        stroke: "rgba(216, 216, 246, 0.12)",
        glow: "rgba(216, 216, 246, 0.14)",
        danger: "#ff3b5c",
        warning: "#ffb020",
        ok: "#2ee59d"
      },
      boxShadow: {
        glass:
          "0 0 0 1px rgba(216,216,246,0.10), 0 24px 70px rgba(0,0,0,0.55)",
        glow:
          "0 0 0 1px rgba(216,216,246,0.12), 0 0 40px rgba(177,143,207,0.20)"
      },
      backgroundImage: {
        "glass-grid":
          "linear-gradient(rgba(216,216,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(216,216,246,0.05) 1px, transparent 1px)",
        "radial-glow":
          "radial-gradient(1100px circle at 18% 8%, rgba(216,216,246,0.12), transparent 55%), radial-gradient(900px circle at 78% 28%, rgba(177,143,207,0.10), transparent 60%)"
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-40%)", opacity: "0.0" },
          "25%": { opacity: "0.6" },
          "100%": { transform: "translateX(140%)", opacity: "0.0" }
        },
        alarm: {
          "0%, 100%": { boxShadow: "0 0 0 rgba(255,59,92,0.0)" },
          "50%": { boxShadow: "0 0 60px rgba(255,59,92,0.45)" }
        },
        caret: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" }
        }
      },
      animation: {
        shimmer: "shimmer 2.2s ease-in-out infinite",
        alarm: "alarm 1.1s ease-in-out infinite",
        caret: "caret 1s step-end infinite"
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "monospace"],
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"]
      }
    }
  },
  plugins: []
} satisfies Config;

