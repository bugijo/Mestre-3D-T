/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0C10', // Fundo quase preto profundo
        surface: '#15171E',    // Superfície primária
        'surface-highlight': '#1F2229', // Superfície secundária/hover
        primary: {
          DEFAULT: '#00FF9D', // Verde Neon (GM Forge)
          hover: '#00CC7D',
          glow: 'rgba(0, 255, 157, 0.5)'
        },
        secondary: {
          DEFAULT: '#D000FF', // Roxo Neon
          hover: '#A600CC',
          glow: 'rgba(208, 0, 255, 0.5)'
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#9CA3AF',
          muted: '#6B7280'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Rajdhani', 'sans-serif'], // Fonte mais tecnológica para títulos se disponível, senão fallback
      },
      boxShadow: {
        'neon-green': '0 0 10px rgba(0, 255, 157, 0.3), 0 0 20px rgba(0, 255, 157, 0.1)',
        'neon-purple': '0 0 10px rgba(208, 0, 255, 0.3), 0 0 20px rgba(208, 0, 255, 0.1)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #1a1d21 0deg, #0f1115 360deg)',
      }
    },
  },
  plugins: [],
}
