/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },
      colors: {
        'calm-bg': '#faf7f4',
        'calm-accent': '#7c6fcd',
        'calm-muted': '#9c9490',
      },
    },
  },
  plugins: [],
}
