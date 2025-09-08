/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2E7D32',
          50: '#E8F5E8',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#4CAF50',
          600: '#43A047',
          700: '#388E3C',
          800: '#2E7D32',
          900: '#1B5E20',
        },
        accent: {
          DEFAULT: '#00796B',
          50: '#E0F2F1',
          100: '#B2DFDB',
          200: '#80CBC4',
          300: '#4DB6AC',
          400: '#26A69A',
          500: '#009688',
          600: '#00897B',
          700: '#00796B',
          800: '#00695C',
          900: '#004D40',
        },
        success: {
          DEFAULT: '#4CAF50',
          100: '#DCFCE7',
          600: '#16A34A',
          800: '#166534',
        },
        warning: {
          DEFAULT: '#FFC107',
          100: '#FEF3C7',
          600: '#D97706',
          800: '#92400E',
        },
        error: {
          DEFAULT: '#D32F2F',
          100: '#FECACA',
          600: '#DC2626',
          800: '#991B1B',
        },
        gray: {
          50: '#F7F9FC',
          100: '#E2E8F0',
          200: '#CBD5E0',
          300: '#A0AEC0',
          400: '#718096',
          500: '#4A5568',
          600: '#2D3748',
          700: '#1A202C',
          800: '#171923',
          900: '#0F1419',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -2px rgba(0, 0, 0, 0.1), 0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
