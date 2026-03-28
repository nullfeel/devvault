import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      /* ── Colors ────────────────────────────────────── */
      colors: {
        "cyber-dark": "#0A0A0F",
        "cyber-secondary": "#12121A",
        "cyber-card": "rgba(18, 18, 26, 0.8)",
        "cyber-elevated": "#1A1A2E",
        "neon-cyan": "#00FFFF",
        "neon-magenta": "#FF00FF",
        "neon-green": "#00FF41",
        "neon-purple": "#B967FF",
        "glass-bg": "rgba(255, 255, 255, 0.05)",
        "glass-border": "rgba(255, 255, 255, 0.1)",
      },

      /* ── Typography ────────────────────────────────── */
      fontFamily: {
        mono: [
          "var(--font-jetbrains-mono)",
          "JetBrains Mono",
          "Fira Code",
          "monospace",
        ],
        sans: [
          "var(--font-ibm-plex-sans)",
          "IBM Plex Sans",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },

      /* ── Animations ────────────────────────────────── */
      animation: {
        glitch: "glitch 2.5s infinite steps(2, end)",
        float: "float 3s ease-in-out infinite",
        "pulse-neon": "pulse-neon 2s ease-in-out infinite",
        scanline: "scanline-scroll 8s linear infinite",
        blink: "blink 1s step-end infinite",
        "neon-border": "neon-border-rotate 4s linear infinite",
        "grain": "grain-drift 0.5s steps(1) infinite",
      },

      keyframes: {
        glitch: {
          "0%, 100%": { transform: "translate(0)" },
          "10%": { transform: "translate(-2px, 1px) skewX(-1deg)" },
          "30%": { transform: "translate(2px, -1px) skewX(1deg)" },
          "50%": { transform: "translate(-1px, 2px) skewX(-0.5deg)" },
          "70%": { transform: "translate(1px, -2px) skewX(0.5deg)" },
          "90%": { transform: "translate(-2px, 0) skewX(-1deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "pulse-neon": {
          "0%, 100%": { opacity: "1", filter: "brightness(1)" },
          "50%": { opacity: "0.85", filter: "brightness(1.3)" },
        },
        "scanline-scroll": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(4px)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "neon-border-rotate": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "grain-drift": {
          "0%": { transform: "translate(0, 0)" },
          "25%": { transform: "translate(-2%, 3%)" },
          "50%": { transform: "translate(3%, -1%)" },
          "75%": { transform: "translate(-1%, -2%)" },
          "100%": { transform: "translate(2%, 1%)" },
        },
      },

      /* ── Backdrop Blur ─────────────────────────────── */
      backdropBlur: {
        xs: "2px",
        glass: "16px",
        heavy: "32px",
      },

      /* ── Box Shadow (neon glows) ───────────────────── */
      boxShadow: {
        "neon-cyan":
          "0 0 5px rgba(0,255,255,0.4), 0 0 15px rgba(0,255,255,0.2), 0 0 30px rgba(0,255,255,0.1)",
        "neon-magenta":
          "0 0 5px rgba(255,0,255,0.4), 0 0 15px rgba(255,0,255,0.2), 0 0 30px rgba(255,0,255,0.1)",
        "neon-green":
          "0 0 5px rgba(0,255,65,0.4), 0 0 15px rgba(0,255,65,0.2), 0 0 30px rgba(0,255,65,0.1)",
        "neon-purple":
          "0 0 5px rgba(185,103,255,0.4), 0 0 15px rgba(185,103,255,0.2), 0 0 30px rgba(185,103,255,0.1)",
        glass:
          "inset 0 1px 0 0 rgba(255,255,255,0.02), 0 4px 24px rgba(0,0,0,0.4)",
      },

      /* ── Border Radius ─────────────────────────────── */
      borderRadius: {
        cyber: "12px",
      },

      /* ── Spacing ───────────────────────────────────── */
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
    },
  },
  plugins: [],
};

export default config;
