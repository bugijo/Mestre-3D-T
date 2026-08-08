export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#11100f',
        surface: '#1b1917',
        'surface-highlight': '#28231f',
        'surface-strong': '#39302a',
        border: 'rgba(198, 183, 165, 0.18)',
        accent: '#b89b78',
        'accent-strong': '#c3a27c',
        primary: {
          DEFAULT: '#a65c61',
          hover: '#bb6b70',
          glow: 'rgba(166, 92, 97, 0.34)'
        },
        secondary: {
          DEFAULT: '#b89b78',
          hover: '#caaa82',
          glow: 'rgba(184, 155, 120, 0.28)'
        },
        'neon-purple': '#8b5cf6',
        'neon-green': '#34d399',
        'neon-cyan': '#22d3ee',
        'neon-yellow': '#fbbf24',
        'neon-red': '#fb7185',
        text: {
          primary: '#eee8df',
          secondary: '#d7cec2',
          muted: '#a69c90'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Georgia', 'ui-serif', 'serif'],
        rajdhani: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        'soft-lg': '0 24px 60px rgba(3, 8, 18, 0.45)',
        'soft-md': '0 16px 36px rgba(3, 8, 18, 0.34)',
        'neon-green': '0 0 18px rgba(52, 211, 153, 0.24), 0 0 36px rgba(52, 211, 153, 0.12)',
        'neon-purple': '0 0 18px rgba(139, 92, 246, 0.2), 0 0 36px rgba(139, 92, 246, 0.1)',
        glass: '0 28px 80px rgba(3, 8, 18, 0.42)',
        ember: '0 24px 60px rgba(166, 92, 97, 0.14)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'radial-gradient(circle at top, rgba(166, 92, 97, 0.18), transparent 50%), radial-gradient(circle at 15% 15%, rgba(184, 155, 120, 0.15), transparent 38%)',
        'aurora-mesh': 'linear-gradient(135deg, rgba(31, 27, 25, 0.96), rgba(13, 12, 11, 0.98)), radial-gradient(circle at top left, rgba(166, 92, 97, 0.16), transparent 32%), radial-gradient(circle at top right, rgba(184, 155, 120, 0.1), transparent 26%)',
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
