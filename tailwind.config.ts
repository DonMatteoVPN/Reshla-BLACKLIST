/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0d1117',
        'dark-surface': '#161b22',
        'dark-border': '#30363d',
        'dark-text': '#c9d1d9',
        'dark-muted': '#8b949e',
        'primary': '#238636',
        'primary-dark': '#2ea043',
        'danger': '#da3633',
        'danger-dark': '#b62324',
        'success': '#238636',
        'success-dark': '#2ea043',
        'warning': '#d29922',
        'warning-dark': '#9e6a03',
        'accent': '#58a6ff',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
