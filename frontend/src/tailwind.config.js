/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0A255C',   // 로고의 왼쪽 딥 네이비 (전략 A)
          gold: '#C59B4E',   // 로고의 오른쪽 골드 (전략 B)
          'navy-light': '#1E3E7A',
          'gold-light': '#D6B265',
        }
      }
    },
  },
  plugins: [],
}