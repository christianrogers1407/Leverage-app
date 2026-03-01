import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0d12",
        panel: "#111522",
        panel2: "#0f1320",
        text: "#e8eaf2",
        muted: "#9aa3b2",
        money: "#1f9d55",
        warn: "#f59e0b",
        danger: "#ef4444"
      }
    }
  },
  plugins: []
} satisfies Config;
