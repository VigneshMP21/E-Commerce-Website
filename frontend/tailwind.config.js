const primary = {
  50: '#fbf7f2',
  100: '#f5eadf',
  200: '#e5d4c4',
  300: '#ddb38a',
  400: '#e19b61',
  500: '#e29645',
  600: '#7c4019',
  700: '#6b4529',
  800: '#3f1c09',
  900: '#201f22',
  950: '#201f22'
};

const neutral = {
  50: '#fbf7f2',
  100: '#f3e8dd',
  200: '#e5d4c4',
  300: '#c8b29f',
  400: '#8a6c55',
  500: '#6b4529',
  600: '#7c4019',
  700: '#3f1c09',
  800: '#201f22',
  900: '#201f22',
  950: '#201f22'
};

const copper = {
  50: '#fff8ef',
  100: '#f7eadc',
  200: '#e5d4c4',
  300: '#ddb38a',
  400: '#e19b61',
  500: '#e29645',
  600: '#b87a4a',
  700: '#7c4019',
  800: '#6b4529',
  900: '#3f1c09',
  950: '#201f22'
};

const taupe = {
  50: '#fbf7f2',
  100: '#efe2d6',
  200: '#e5d4c4',
  300: '#c8b29f',
  400: '#ddb38a',
  500: '#8a6c55',
  600: '#6b4529',
  700: '#7c4019',
  800: '#3f1c09',
  900: '#201f22',
  950: '#201f22'
};

const clay = {
  50: '#fbf7f2',
  100: '#f2dfcf',
  200: '#e5d4c4',
  300: '#ddb38a',
  400: '#e19b61',
  500: '#b87a4a',
  600: '#7c4019',
  700: '#6b4529',
  800: '#3f1c09',
  900: '#201f22',
  950: '#201f22'
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary,
        gray: neutral,
        zinc: neutral,
        neutral,
        stone: neutral,
        amber: copper,
        orange: copper,
        yellow: copper,
        rose: clay,
        red: clay,
        pink: clay,
        violet: taupe,
        purple: taupe,
        indigo: taupe,
        blue: taupe,
        sky: taupe,
        cyan: taupe,
        emerald: taupe,
        green: taupe,
        teal: taupe
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'marquee': 'marquee 28s linear infinite',
        'marquee2': 'marquee2 28s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 3s infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'gradient-x': 'gradientX 4s ease infinite',
        'count-up': 'countUp 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' }
        },
        marquee2: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0%)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(124,64,25,0.4), 0 0 20px rgba(226,150,69,0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(226,150,69,0.65), 0 0 60px rgba(124,64,25,0.35)' }
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' }
        },
        gradientX: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      backgroundSize: {
        '200%': '200%',
        '400%': '400%',
      }
    }
  },
  plugins: []
};
