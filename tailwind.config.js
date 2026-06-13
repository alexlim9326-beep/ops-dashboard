/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dde7ff',
          200: '#b8ccff',
          400: '#6b93f5',
          600: '#3a5fd9',
          800: '#1e3a8a',
          900: '#0f1f5c',
        },
      },
    },
  },
  plugins: [],
}
