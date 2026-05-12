/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Outfit', 'Inter', 'sans-serif'],
                serif: ['Playfair Display', 'serif'],
            },
            colors: {
                'warm-grey': '#d9d5cd',
                'paper-white': '#fdfbf7',
                'ink-black': '#1a1a1a',
                'vibrant-orange': '#ff3300',
                'soft-charcoal': '#2d2d2d',
            },
            animation: {
                'fade-in-slow': 'fadeIn 1.2s ease-out forwards',
                'slide-up-slow': 'slideUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'reveal': 'reveal 1.5s cubic-bezier(0.77, 0, 0.175, 1) forwards',
            },
            keyframes: {
                fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
                slideUp: { '0%': { transform: 'translateY(40px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
                reveal: { '0%': { clipPath: 'inset(0 100% 0 0)' }, '100%': { clipPath: 'inset(0 0 0 0)' } },
            }
        },
    },
    plugins: [],
}
