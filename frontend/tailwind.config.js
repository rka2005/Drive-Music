/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#050509',
        ink: '#0b0b11',
        surface: 'rgba(17, 18, 26, 0.72)',
        surfaceStrong: 'rgba(24, 25, 36, 0.92)',
        gold: {
          light: '#f9e596',
          DEFAULT: '#d4af37',
          dark: '#aa8822',
        },
        pulse: '#ff7ab6',
        cyan: '#67e8f9',
        muted: '#8b8b99',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        serif: ['Cormorant Garamond', 'serif'],
      },
      boxShadow: {
        glass: '0 16px 50px rgba(0, 0, 0, 0.38)',
        glow: '0 0 0 1px rgba(212, 175, 55, 0.14), 0 24px 60px rgba(0, 0, 0, 0.42)',
        neon: '0 0 35px rgba(103, 232, 249, 0.18)',
      }
    },
  },
  plugins: [],
}