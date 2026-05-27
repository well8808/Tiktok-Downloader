import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "hsl(0 0% 0%)",
        surface: "hsl(240 5% 6%)",
        "surface-hover": "hsl(240 5% 9%)",
        border: "hsl(240 5% 14%)",
        "text-primary": "hsl(0 0% 95%)",
        "text-muted": "hsl(240 5% 55%)",
        "text-subtle": "hsl(240 5% 35%)",
        accent: "hsl(263 70% 58%)",
        "accent-press": "hsl(263 70% 48%)",
        success: "hsl(150 60% 50%)",
        warning: "hsl(38 92% 55%)",
        danger: "hsl(0 70% 55%)",
      },
      borderRadius: { sm: "4px", md: "6px", lg: "10px" },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["13px", { lineHeight: "18px" }],
        base: ["14px", { lineHeight: "20px" }],
        lg: ["16px", { lineHeight: "22px" }],
        xl: ["20px", { lineHeight: "26px" }],
      },
      transitionTimingFunction: { "out-quad": "cubic-bezier(0.25, 0.46, 0.45, 0.94)" },
    },
  },
  plugins: [],
};

export default config;
