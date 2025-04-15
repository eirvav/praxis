import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          'from': { 
            opacity: '0', 
            transform: 'translateY(5px)' 
          },
          'to': { 
            opacity: '1', 
            transform: 'translateY(0)' 
          }
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out'
      }
    }
  },
  plugins: [],
};

export default config; 