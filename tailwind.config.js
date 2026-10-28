/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        game: {
          gold: '#f59e0b',
          wood: '#854d0e',
          paper: '#fef3c7',
          bamboo: '#15803d',
          brick: '#dc2626',
          sky: '#0284c7',
        },
      },
    },
  },
  plugins: [],
};
