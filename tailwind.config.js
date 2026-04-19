/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "secondary-dim": "#a9beab",
        "surface-dim": "#0e0e0e",
        "secondary-fixed": "#e0f7e2",
        "primary-container": "#e08efe",
        "surface-container": "#191a1a",
        "error-container": "#8a1632",
        "surface-bright": "#2c2c2c",
        "on-tertiary-container": "#00535e",
        "primary-fixed": "#eaa9ff",
        "surface-container-highest": "#262626",
        "inverse-on-surface": "#565555",
        "secondary-fixed-dim": "#d2e8d4",
        "on-tertiary-fixed": "#003e47",
        "on-secondary-fixed": "#394c3d",
        "surface-tint": "#e7a1ff",
        "on-error-container": "#ff97a3",
        "tertiary-container": "#7be7f9",
        "inverse-surface": "#fcf9f8",
        "tertiary-dim": "#6cd8eb",
        "tertiary-fixed-dim": "#6cd8eb",
        secondary: "#b6ccb8",
        "on-secondary-fixed-variant": "#556959",
        "primary-fixed-dim": "#e395ff",
        "on-surface": "#e7e5e4",
        "surface-container-low": "#131313",
        "on-primary-fixed-variant": "#6c1e8b",
        "on-tertiary-fixed-variant": "#005d69",
        "surface-variant": "#262626",
        "inverse-primary": "#893da7",
        "tertiary-fixed": "#7be7f9",
        "on-background": "#e7e5e4",
        surface: "#0e0e0e",
        "on-primary-fixed": "#45005f",
        "primary-dim": "#d180ef",
        "on-primary-container": "#4f006c",
        "error-dim": "#c8475d",
        "secondary-container": "#172a1c",
        "outline-variant": "#484848",
        "on-secondary-container": "#94a997",
        primary: "#e7a1ff",
        outline: "#767575",
        "on-primary": "#5d097d",
        background: "#0e0e0e",
        "surface-container-high": "#202020",
        "on-tertiary": "#005c68",
        "on-error": "#490013",
        "on-surface-variant": "#acabaa",
        "on-secondary": "#324536",
        "surface-container-lowest": "#000000",
        tertiary: "#a8f1ff",
        error: "#fd6f85"
      },
      fontFamily: {
        headline: ["Plus Jakarta Sans", "Noto Sans SC", "sans-serif"],
        body: ["Plus Jakarta Sans", "Noto Sans SC", "sans-serif"],
        label: ["Plus Jakarta Sans", "Noto Sans SC", "sans-serif"]
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px"
      },
      boxShadow: {
        glow: "0 0 30px rgba(224, 142, 254, 0.3)"
      }
    }
  },
  plugins: []
};
