/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        reshla: {
          bg: '#1a1a1a',
          card: '#2a2a2a',
          text: '#ffffff',
          accent: '#ff4d4d', // Red like censorship or ban
          gold: '#ffd700', // For the 'Sheriff' badge
        }
      }
    },
  },
  plugins: [],
}
