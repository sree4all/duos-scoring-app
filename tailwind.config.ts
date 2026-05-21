import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        neon: {
          deep: "#18004F",
          royal: "#2B0A88",
          electric: "#11398C",
          glow: "#5917FF",
          cta: "#10B69B",
          "cta-hover": "#13C5A7",
          "cta-pressed": "#0D9D87",
          score: {
            green: "hsl(var(--neon-score-green))",
            blue: "hsl(var(--neon-score-blue))",
            red: "hsl(var(--neon-score-red))",
          },
          accent: {
            orange: "#FF7044",
            yellow: "#E4FF3B",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        cta: "20px",
      },
      spacing: {
        "safe-x": "28px",
        "safe-y": "32px",
        rhythm: "40px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        cta: "0 8px 20px rgba(0, 0, 0, 0.18)",
        glass: "0 10px 20px rgba(0, 0, 0, 0.25)",
      },
      minHeight: {
        cta: "92px",
        "cta-compact": "44px",
      },
    },
  },
  plugins: [],
};

export default config;
