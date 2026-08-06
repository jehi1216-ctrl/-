import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2f8",
          100: "#dbe4f0",
          200: "#b3c5e0",
          300: "#85a1cb",
          400: "#5c7db3",
          500: "#3f6199",
          600: "#2f4d7d",
          700: "#263f66",
          800: "#1f3352",
          900: "#172640",
        },
      },
    },
  },
  plugins: [],
};

export default config;
