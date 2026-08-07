import type { Config } from "tailwindcss";

const config: Config = {
  // src 전체를 스캔한다. 상태 배지·현장 색 같은 클래스 문자열이 src/types와 src/lib에도
  // 있어서, 폴더를 하나씩 넣으면 새 파일을 만들 때마다 조용히 purge되는 사고가 난다.
  content: ["./src/**/*.{ts,tsx}"],
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
