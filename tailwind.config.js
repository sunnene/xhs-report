/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ef4444',
      },
      backgroundImage: {
        'gradient-card-1': 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
        'gradient-card-2': 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        'gradient-card-3': 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
        'gradient-card-4': 'linear-gradient(135deg, #06b6d4 0%, #22c55e 100%)',
        'gradient-card-5': 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
      }
    },
  },
  plugins: [],
}
