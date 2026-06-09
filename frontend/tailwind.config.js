/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0F0F0F',
        surface: '#1A1A1A',
        'surface-raised': '#222222',
        'surface-hover': '#282828',
        border: '#2E2E2E',
        'border-focus': '#C9963A',
        'text-primary': '#E8E6E1',
        'text-secondary': '#7A7773',
        'text-disabled': '#444240',
        accent: '#C9963A',
        'accent-dim': '#3A2C15',
        'accent-hover': '#DBA84A',
        success: '#5A8A6A',
        'success-dim': '#1A2E22',
        warning: '#A08030',
        'warning-dim': '#2A2010',
        danger: '#A85252',
        'danger-dim': '#2E1515',
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
