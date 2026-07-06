/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pocket: { 50: "#f0fdfa", 100: "#ccfbf1", 200: "#99f6e4", 500: "#14b8a6", 600: "#0d9488", 700: "#0f766e", 800: "#115e59", 900: "#134e4a" }
      },
      boxShadow: {
        soft: "0 8px 30px rgba(15, 23, 42, .055)",
        card: "0 14px 34px rgba(15, 23, 42, .09)",
        button: "0 4px 12px rgba(15, 118, 110, .18)"
      }
    }
  },
  plugins: []
};
