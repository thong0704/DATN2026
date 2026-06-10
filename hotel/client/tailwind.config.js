/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        accent: 'var(--color-accent)',
        'surface-bg': 'var(--color-surface-bg)',
        surface: 'var(--color-surface)',
        text: 'var(--color-text)',
        muted: 'var(--color-muted)',
        border: 'var(--color-border)',
        brand: {
          50: '#F4F6F9',
          100: '#E1E6EB',
          200: '#C2CDD8',
          300: '#9FB0C2',
          400: '#738CA5',
          500: 'var(--color-accent)',   /* Brushed Bronze */
          600: 'var(--color-primary)',  /* Deep Sapphire */
          700: '#0B1320',
          800: '#070C15',
          900: '#030509',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 24px rgba(196, 154, 69, 0.15)',
        'card': '0 4px 24px rgba(15, 26, 44, 0.04)',
        'card-hover': '0 20px 48px -12px rgba(15, 26, 44, 0.1)',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
