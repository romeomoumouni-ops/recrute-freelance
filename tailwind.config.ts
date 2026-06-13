import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        black: '#0d0d0d',
        white: '#ffffff',
        'off-white': '#f7f7f5',
        'gray-100': '#ececea',
        'gray-300': '#c9c9c5',
        'gray-500': '#8a8a86',
        'gray-700': '#4a4a47',
        border: '#e4e4e1',
        green: '#1a7f4e',
      },
      borderRadius: {
        DEFAULT: '14px',
        lg: '22px',
      },
      maxWidth: {
        page: '1200px',
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
