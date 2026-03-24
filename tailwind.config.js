/** @type {import('tailwindcss').Config} */
export default {
  content: ['./client/src/**/*.{ts,tsx}', './client/index.html'],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#f0f5ff', 100: '#e0eaff', 200: '#c2d5ff', 300: '#94b3ff', 400: '#6088ff', 500: '#3b5eff', 600: '#2541f5', 700: '#1d31d9', 800: '#1d2aaf', 900: '#1e288a' },
      },
    },
  },
  plugins: [],
};
