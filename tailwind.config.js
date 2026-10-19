/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        church: {
          canvas: '#FAFAFC',
          card: '#FFFFFF',
          bg: '#FAFAFC',
          navy: '#111827',
          charcoal: '#111827',
          slate: '#6B7280',
          muted: '#9CA3AF',
          rose: '#FF577F',
          'rose-light': '#FFF0F5',
          'rose-hover': '#E03E67',
          violet: '#B66DFF',
          amber: '#D97706',
          'amber-light': '#FEF3C7',
          emerald: '#10B981',
          'emerald-light': '#ECFDF5',
          border: '#F3F4F6',
          green: '#10B981',
          'green-light': '#34D399',
        },
      },
      boxShadow: {
        'church-soft': '0 4px 16px -2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
        'church-elevated': '0 12px 32px -4px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.03)',
        'church-glow': '0 8px 24px -3px rgba(255, 87, 127, 0.3)',
      },
      backgroundImage: {
        'gradient-coram': 'linear-gradient(135deg, #FF577F 0%, #B66DFF 100%)',
        'gradient-coram-hero': 'linear-gradient(135deg, #FF5B84 0%, #A855F7 100%)',
      },
    },
  },
  plugins: [],
}
