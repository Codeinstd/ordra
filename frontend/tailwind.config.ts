import type { Config } from "tailwindcss";

// Design direction: a quiet, precise operations console — not a consumer
// SaaS dashboard. Cool slate paper (not the common warm-cream default),
// one restrained teal accent, mono type reserved for the things that are
// genuinely tabular data (amounts, IDs, statuses).
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#EEF1EF",
        ink: "#151A1E",
        line: "#D6DAD6",
        teal: { DEFAULT: "#1C6E74", dim: "#E4EEEE" },
        amber: { DEFAULT: "#A66A22", dim: "#F3E9DA" },
        moss: { DEFAULT: "#3E7A54", dim: "#E4EEE6" },
        rust: { DEFAULT: "#9C3F35", dim: "#F1E1DE" },
        slate: { DEFAULT: "#5B6460", dim: "#E7E9E7" },
        mist: "#8FA39D",
      },
      fontFamily: {
        sans: ["Space Grotesk", "sans-serif"],
        body: ["IBM Plex Sans", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
