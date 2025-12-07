// tailwind.config.cjs
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        reddit: {
          // Light mode
          page: "#ffffff",
          card: "#FFFFFF",
          sidebar: "#FFFFFF",
          hover: "#F2F3F5",
          hover_dark: "#E8E9EB",
          border: "#EDEFF1",
          divider: "#E5E5E5",
          text: "#1A1A1B",
          text_secondary: "#7C7C7C",
          text_light: "#4C4C4C",
          input: "#F2F3F5", // ⭐ FIX ADDED

          // Dark mode
          dark_bg: "#0B0C0D",
          dark_card: "#111214",
          dark_sidebar: "#0B0C0D",
          dark_hover: "#161718",
          dark_border: "#27292B",
          dark_divider: "#2B2D2F",
          dark_text: "#E6E7E8",
          dark_text_secondary: "#A0A3A5",
          dark_text_light: "#C3C5C6",
          dark_icon: "#A0A3A5",
          dark_input: "#27292B", // ⭐ FIX ADDED

          // Icons & votes
          icon: "#7C7C7C",
          upvote: "#FF4500",
          downvote: "#7193FF",
          dark_upvote: "#FF6A3C",
          dark_downvote: "#88A3FF",

          // Buttons
          blue: "#0079D3",
          blue_hover: "#0067b5",
          dark_blue: "#0079D3",
          dark_blue_hover: "#0463A8",
        },
      },
    },
  },
 plugins: [require("@tailwindcss/typography")],
};
