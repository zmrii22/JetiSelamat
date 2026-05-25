/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './App.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        marine: {
          navy: '#000080',
          orange: '#FF8C00',
          white: '#FFFFFF',
          slate: '#0F172A',
          mist: '#E2E8F0',
          danger: '#DC2626',
          caution: '#EA580C',
          safe: '#16A34A',
        },
      },
      fontFamily: {
        heading: ['System'],
        body: ['System'],
      },
    },
  },
  plugins: [],
};
