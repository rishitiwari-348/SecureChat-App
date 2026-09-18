import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      colors: {
        nebula: {
          50: "#f4f7ff",
          100: "#e8edff",
          200: "#ced7ff",
          300: "#a9b5ff",
          400: "#7d8dff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1f1d4d",
        },
        graphite: {
          950: "#060816",
          900: "#0b1220",
          800: "#121a2b",
          700: "#1a2335",
          600: "#263244",
          500: "#36445b",
        },
        glass: {
          white: "rgba(255,255,255,0.04)",
          "white-hover": "rgba(255,255,255,0.08)",
          "white-active": "rgba(255,255,255,0.12)",
          border: "rgba(255,255,255,0.06)",
          "border-hover": "rgba(255,255,255,0.12)",
        },
        text: {
          primary: "#f8fafc",
          secondary: "#cbd5e1",
          muted: "#94a3b8",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "nebula-glow": "radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.15) 0%, transparent 70%)",
        "accent-gradient": "linear-gradient(135deg, #22d3ee 0%, #6366f1 50%, #8b5cf6 100%)",
        "accent-gradient-hover": "linear-gradient(135deg, #06b6d4 0%, #4f46e5 50%, #7c3aed 100%)",
        "bubble-sent": "linear-gradient(135deg, #22d3ee 0%, #6366f1 100%)",
        panel: "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))",
        shimmer: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(2, 6, 23, 0.42)",
        "soft-lg": "0 24px 60px rgba(2, 6, 23, 0.48)",
        glow: "0 0 0 1px rgba(34, 211, 238, 0.16), 0 12px 34px rgba(34, 211, 238, 0.12)",
      },
      transitionDuration: {
        200: "200ms",
        250: "250ms",
      },
      animation: {
        shimmer: "shimmer 2s infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
        fade: "fadeIn 220ms ease-out",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [daisyui],
};
