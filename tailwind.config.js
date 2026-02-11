/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6', // Bright Blue
        'primary-dark': '#2563eb',
        secondary: '#64748b', // Slate
        accent: '#8b5cf6', // Violet
        danger: '#ef4444', // Red for bans
        'danger-dark': '#dc2626',
        warning: '#f59e0b', // Amber for voting
        'warning-dark': '#d97706',
        success: '#22c55e',
        'success-dark': '#16a34a',
        'dark-bg': '#0f172a', // Deep Slate
        'dark-surface': '#1e293b', // Lighter Slate
        'dark-border': '#334155',
        'dark-text': '#e2e8f0',
        'dark-muted': '#94a3b8'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
  darkMode: 'class', // Always dark mode effectively
}
