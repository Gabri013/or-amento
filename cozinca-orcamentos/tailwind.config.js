/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cozinca: '#ff530d',
        'cozinca-dark': '#e0480c',
        ink: '#1c1c1c',
        'sidebar-bg': '#212529',
      },
    },
  },
  plugins: [],
};
