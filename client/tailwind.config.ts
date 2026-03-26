import type { Config } from "tailwindcss";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        primary: "hsl(var(--primary))",
        accent: "hsl(var(--accent))",

        card: "hsl(var(--card))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",

        muted: "hsl(var(--muted))",
      },
    },
  },
  plugins: [],
} satisfies Config;