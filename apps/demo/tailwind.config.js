/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "hsl(var(--surface) / <alpha-value>)",
          raised: "hsl(var(--surface-raised) / <alpha-value>)",
          overlay: "hsl(var(--surface-overlay) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "hsl(var(--ink) / <alpha-value>)",
          muted: "hsl(var(--ink-muted) / <alpha-value>)",
          faint: "hsl(var(--ink-faint) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          soft: "hsl(var(--accent-soft) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        line: "hsl(var(--line) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px hsl(220 40% 2% / 0.24), 0 12px 40px hsl(220 40% 2% / 0.28)",
        glow: "0 0 0 1px hsl(var(--accent) / 0.25), 0 8px 32px hsl(var(--accent) / 0.12)",
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(1200px 600px at 50% -20%, hsl(var(--accent) / 0.14), transparent 60%), radial-gradient(800px 400px at 100% 0%, hsl(260 60% 50% / 0.08), transparent 50%)",
      },
    },
  },
  plugins: [],
};
