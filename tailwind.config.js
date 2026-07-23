/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'hsl(142, 70%, 97%)',
          100: 'hsl(142, 70%, 93%)',
          200: 'hsl(142, 70%, 84%)',
          300: 'hsl(142, 60%, 72%)',
          400: 'hsl(142, 50%, 58%)',
          500: 'hsl(142, 65%, 42%)',
          600: 'hsl(142, 70%, 33%)',
          700: 'hsl(142, 70%, 25%)',
          800: 'hsl(142, 70%, 18%)',
          900: 'hsl(142, 70%, 12%)',
        },
        warm: {
          50: 'hsl(35, 100%, 98%)',
          100: 'hsl(35, 100%, 94%)',
          200: 'hsl(35, 100%, 86%)',
          300: 'hsl(35, 90%, 75%)',
          400: 'hsl(35, 85%, 60%)',
          500: 'hsl(35, 90%, 48%)',
          600: 'hsl(35, 90%, 38%)',
          700: 'hsl(35, 90%, 28%)',
        },
        sky: {
          50: 'hsl(199, 100%, 97%)',
          100: 'hsl(199, 100%, 93%)',
          200: 'hsl(199, 100%, 85%)',
          300: 'hsl(199, 90%, 72%)',
          400: 'hsl(199, 85%, 55%)',
          500: 'hsl(199, 89%, 45%)',
          600: 'hsl(199, 90%, 36%)',
        }
      },
      fontFamily: {
        sans: ['"Outfit"', '"Noto Sans JP"', 'sans-serif'],
      },
      animation: {
        'bounce-subtle': 'bounceSubtle 2s infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
