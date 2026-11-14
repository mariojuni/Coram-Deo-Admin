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
          canvas: '#F8FAFC',
          card: '#FFFFFF',
          bg: '#F8FAFC',
          navy: '#162533',
          charcoal: '#1E2E3D',
          slate: '#476072',
          muted: '#7E97A8',
          // Mapped from legacy rose to authentic Coram Deo calm Nordic steel & ice
          rose: '#2C4A60',
          'rose-light': '#EBF2F7',
          'rose-hover': '#1D3547',
          steel: '#2C4A60',
          'steel-light': '#4F748E',
          ice: '#EBF2F7',
          violet: '#4F748E',
          amber: '#D97706',
          'amber-light': '#FEF3C7',
          emerald: '#059669',
          'emerald-light': '#ECFDF5',
          border: '#E2E8F0',
          green: '#10B981',
          'green-light': '#34D399',
        },
      },
      boxShadow: {
        'church-soft': '0 4px 20px -2px rgba(44, 74, 96, 0.05), 0 1px 3px rgba(44, 74, 96, 0.02)',
        'church-elevated': '0 12px 36px -4px rgba(44, 74, 96, 0.08), 0 2px 6px rgba(44, 74, 96, 0.03)',
        'church-glow': '0 8px 24px -3px rgba(44, 74, 96, 0.16)',
      },
      backgroundImage: {
        'gradient-coram': 'linear-gradient(135deg, #162533 0%, #2C4A60 50%, #4F748E 100%)',
        'gradient-coram-hero': 'linear-gradient(135deg, #162533 0%, #243B4F 55%, #3B5B75 100%)',
      },
    },
  },
  plugins: [],
}
