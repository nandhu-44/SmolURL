import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // radius follows hierarchy: controls 6px, menus and rows 8px, panels 10px, dialogs 12px
      borderRadius: { md: "6px", lg: "8px", xl: "10px", "2xl": "12px" },
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        card: "hsl(var(--card) / <alpha-value>)",
        popover: "hsl(var(--popover) / <alpha-value>)",
        muted: { DEFAULT: "hsl(var(--muted) / <alpha-value>)", foreground: "hsl(var(--muted-foreground) / <alpha-value>)" },
        border: "hsl(var(--border) / <alpha-value>)",
        primary: { DEFAULT: "hsl(var(--primary) / <alpha-value>)", foreground: "hsl(var(--primary-foreground) / <alpha-value>)" },
        destructive: { DEFAULT: "hsl(var(--destructive) / <alpha-value>)", foreground: "hsl(0 0% 100%)" },
        success: "hsl(var(--success) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["'Red Hat Text'", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["'Red Hat Display'", "'Red Hat Text'", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'Red Hat Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      transitionTimingFunction: { out: "var(--ease-out)" },
      keyframes: {
        "nav-progress": { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(300%)" } },
        "soft-pulse": { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.6" } },
      },
      animation: { "soft-pulse": "soft-pulse 1.6s ease-in-out infinite" },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
