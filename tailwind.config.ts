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
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        "shimmer-travel": {
          "0%": { transform: "translateX(-100%)" },
          "60%": { transform: "translateX(220%)" },
          "100%": { transform: "translateX(220%)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.7" },
        },
        "spark-float": {
          "0%, 100%": { opacity: "0", transform: "translateY(0) scale(0.5)" },
          "50%": { opacity: "1", transform: "translateY(-6px) scale(1)" },
        },
        "wave-pulse": {
          "0%, 100%": { transform: "scaleY(1)" },
          "25%": { transform: "scaleY(1.22)" },
          "50%": { transform: "scaleY(0.84)" },
          "75%": { transform: "scaleY(1.1)" },
        },
        "wave-pulse-active": {
          "0%, 100%": { transform: "scaleY(1)" },
          "25%": { transform: "scaleY(1.7)" },
          "50%": { transform: "scaleY(0.7)" },
          "75%": { transform: "scaleY(1.4)" },
        },
        "spark-twinkle": {
          "0%, 100%": { opacity: "0", transform: "scale(0.5)" },
          "50%": { opacity: "1", transform: "scale(1.1)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite",
        "shimmer-travel":
          "shimmer-travel 2.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite",
        "pulse-subtle": "pulse-subtle 1.8s ease-in-out infinite",
        "spark-float": "spark-float 2.4s ease-in-out infinite",
        "wave-pulse": "wave-pulse 2.6s ease-in-out infinite",
        "wave-pulse-active": "wave-pulse-active 1.3s ease-in-out infinite",
        "spark-twinkle": "spark-twinkle 2s ease-in-out infinite",
      },
      boxShadow: {
        "focus-ring": "0 0 0 4px hsl(263 70% 58% / 0.14)",
        "focus-ring-strong":
          "0 0 0 4px hsl(263 70% 58% / 0.22), 0 0 32px -4px hsl(263 70% 58% / 0.45)",
        lift: "0 6px 16px -4px hsl(0 0% 0% / 0.5)",
        "lift-strong":
          "0 10px 28px -6px hsl(0 0% 0% / 0.7), 0 0 40px -8px hsl(263 70% 58% / 0.35)",
        "lift-success":
          "0 10px 28px -6px hsl(0 0% 0% / 0.7), 0 0 40px -8px hsl(150 60% 50% / 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
