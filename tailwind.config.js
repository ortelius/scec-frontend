/** @type {import('tailwindcss').Config} */
export const content = [
  './pages/**/*.{js,ts,jsx,tsx,mdx}',
  './components/**/*.{js,ts,jsx,tsx,mdx}',
  './app/**/*.{js,ts,jsx,tsx,mdx}'
]
export const theme = {
  extend: {
    colors: {
      'docker-blue': '#0db7ed',
      'docker-dark': '#1d63ed'
    }
  }
}
export const plugins = []
