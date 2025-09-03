/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#16a34a', // green-600
          light: '#22c55e',
          dark: '#15803d',
        },
      },
    },
  },
  plugins: [],
}
