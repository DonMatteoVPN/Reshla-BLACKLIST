/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Кастомная палитра для тёмной темы
                dark: {
                    bg: '#0f0f0f',
                    surface: '#1a1a1a',
                    border: '#2a2a2a',
                    text: '#e0e0e0',
                    muted: '#888888',
                },
                primary: {
                    DEFAULT: '#3b82f6',
                    dark: '#2563eb',
                },
                danger: {
                    DEFAULT: '#ef4444',
                    dark: '#dc2626',
                },
                success: {
                    DEFAULT: '#10b981',
                    dark: '#059669',
                },
                warning: {
                    DEFAULT: '#f59e0b',
                    dark: '#d97706',
                },
            },
        },
    },
    plugins: [],
}
