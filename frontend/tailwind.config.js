/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#1c9d56',
        secondary: '#31a5d6',
      },
      boxShadow: {
        soft: '0 10px 30px rgba(2, 6, 23, 0.08)',
        softDark: '0 10px 30px rgba(0, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
}
