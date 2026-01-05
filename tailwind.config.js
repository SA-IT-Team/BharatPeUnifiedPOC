/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bharatpe-blue': '#09B6DE',
        'bharatpe-red': '#FA6C61',
        'bharatpe-green': '#007C77',
        'bharatpe-blue-dark': '#07A0C0',
        'bharatpe-blue-light': '#E6F7FB',
        'bharatpe-red-light': '#FEF2F2',
        'bharatpe-green-light': '#E6F7F6',
      },
    },
  },
  plugins: [],
}

