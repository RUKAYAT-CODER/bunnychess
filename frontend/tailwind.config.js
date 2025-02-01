/** @type {import('tailwindcss').Config} */

import plugin from 'tailwindcss/plugin';

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    fontFamily: {
      sans: ['Sigmar One']
    },
    extend: {
      textShadow: {
        sm: '0 1px 0px var(--tw-shadow-color)',
        DEFAULT: '0 2px 0px var(--tw-shadow-color)',
        lg: '0 8px 0px var(--tw-shadow-color)'
      }
    }
  },
  plugins: [
    plugin(function ({ matchUtilities, addUtilities, theme }) {
      matchUtilities(
        {
          'text-shadow': (value) => ({
            textShadow: value
          })
        },
        { values: theme('textShadow') }
      );
      addUtilities({
        '.break-word': {
          wordBreak: 'break-word'
        },
        '.break-all': {
          wordBreak: 'break-all'
        }
      });
    })
  ]
};
