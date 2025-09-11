/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html",
    "./*.{js,jsx,html}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', '"SF Pro Text"', '"SF Pro Display"', '"Helvetica Neue"', 'Helvetica', 'Arial', '"Segoe UI"', 'Roboto', 'Ubuntu', 'Cantarell', '"Noto Sans"', 'sans-serif']
      }
    }
  },
  plugins: [],
}
