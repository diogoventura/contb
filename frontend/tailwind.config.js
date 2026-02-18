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
                    50: '#fdf3f3', 100: '#fbe7e7', 200: '#f6c3c3', 300: '#f19f9f',
                    400: '#e75858', 500: '#5B2424', 600: '#4D1F1F',
                    700: '#3D1919', 800: '#2E1212', 900: '#1F0C0C', 950: '#0F0606',
                },
                accent: {
                    50: '#f4f9f0', 100: '#e9f3e1', 200: '#c8e2b4', 300: '#a7d187',
                    400: '#86c05a', 500: '#74B62E', 600: '#5e9426',
                    700: '#48721d', 800: '#324f15', 900: '#1c2d0c',
                },
                brand: {
                    bg: '#FAF6F0',
                    card: '#FFFFFF',
                    text: '#1F2937',
                    subtext: '#6B7280',
                }
            },
        },
    },
    plugins: [],
}
