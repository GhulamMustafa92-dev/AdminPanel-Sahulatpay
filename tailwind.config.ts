import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        syne:     ["var(--font-syne)", "sans-serif"],
        "dm-sans":["var(--font-dm-sans)", "sans-serif"],
        sans:     ["var(--font-dm-sans)", "sans-serif"],
        heading:  ["var(--font-syne)", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "bg-primary":   "var(--bg-primary)",
        "bg-secondary": "var(--bg-secondary)",
        "bg-card":      "var(--bg-card)",
        "bg-card2":     "var(--bg-card2)",
        orange: {
          DEFAULT: "var(--orange)",
          dim:     "var(--orange-dim)",
        },
        "text-primary":   "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted-sp":  "var(--text-muted)",
        border:           "var(--border-color)",
        "border-active":  "var(--border-active)",
      },
    },
  },
  plugins: [],
};
export default config;
