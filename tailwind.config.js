export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#07111f',
        surface: '#0f1b2d',
        'surface-highlight': '#16243a',
        'surface-strong': '#21324b',
        border: 'rgba(148, 163, 184, 0.18)',
        accent: '#7dd3fc',
        'accent-strong': '#38bdf8',
        primary: {
          DEFAULT: '#f59e0b',
          hover: '#d97706',
          glow: 'rgba(245, 158, 11, 0.38)'
        },
        secondary: {
          DEFAULT: '#38bdf8',
          hover: '#0ea5e9',
          glow: 'rgba(56, 189, 248, 0.34)'
        },
        'neon-purple': '#8b5cf6',
        'neon-green': '#34d399',
        'neon-cyan': '#22d3ee',
        'neon-yellow': '#fbbf24',
        'neon-red': '#fb7185',
        text: {
          primary: '#f8fafc',
          secondary: '#d8e1f2',
          muted: '#9aa9c2'
        }
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        display: ['Sora', 'sans-serif'],
        rajdhani: ['Sora', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'soft-lg': '0 24px 60px rgba(3, 8, 18, 0.45)',
        'soft-md': '0 16px 36px rgba(3, 8, 18, 0.34)',
        'neon-green': '0 0 18px rgba(52, 211, 153, 0.24), 0 0 36px rgba(52, 211, 153, 0.12)',
        'neon-purple': '0 0 18px rgba(139, 92, 246, 0.2), 0 0 36px rgba(139, 92, 246, 0.1)',
        glass: '0 28px 80px rgba(3, 8, 18, 0.42)',
        ember: '0 24px 60px rgba(245, 158, 11, 0.14)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'radial-gradient(circle at top, rgba(56, 189, 248, 0.18), transparent 50%), radial-gradient(circle at 15% 15%, rgba(245, 158, 11, 0.18), transparent 38%), radial-gradient(circle at 85% 15%, rgba(139, 92, 246, 0.14), transparent 34%)',
        'aurora-mesh': 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(8, 15, 29, 0.98)), radial-gradient(circle at top left, rgba(56, 189, 248, 0.14), transparent 32%), radial-gradient(circle at top right, rgba(245, 158, 11, 0.14), transparent 26%)',
      },
      borderRadius: {
        xl: '1.1rem',
        '2xl': '1.4rem',
        '3xl': '1.8rem',
        '4xl': '2rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
        'ambient-float': {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(0, -12px, 0) scale(1.03)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out',
        float: 'float 5s ease-in-out infinite',
        shimmer: 'shimmer 4s ease-in-out infinite',
        'ambient-float': 'ambient-float 9s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
