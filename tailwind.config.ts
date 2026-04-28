import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#182028",
        sand: "#F7FAFA",
        burgundy: {
          DEFAULT: "#19AEBB",
          deep: "#178A95",
          muted: "#3A7E86",
          soft: "#EAF7F8"
        }
      },
      fontFamily: {
        serif: ["var(--font-serif)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"]
      },
      boxShadow: {
        panel: "0 18px 40px rgba(17, 24, 39, 0.08)",
        report: "0 24px 54px rgba(17, 24, 39, 0.12)"
      },
      borderRadius: {
        "4xl": "2rem"
      }
    }
  },
  plugins: []
};

export default config;
