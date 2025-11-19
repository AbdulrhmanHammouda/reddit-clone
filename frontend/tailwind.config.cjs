module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        reddit: {
          // Backgrounds
          page: "#ffffffff",            // whole site background
          card: "#FFFFFF",            // posts, sidebars
          sidebar: "#FFFFFF",         // left menu
          hover: "#F2F3F5",           // light hover gray
          hover_dark: "#E8E9EB",      // darker hover gray

          // Dark mode backgrounds
          dark_bg: "#0B0C0D",        // site background in dark mode (used in layout)
          dark_card: "#111214",      // cards and surfaces in dark mode
          dark_sidebar: "#0B0C0D",   // sidebar background in dark mode
          dark_hover: "#161718",     // hover surface in dark mode

          // Borders
          border: "#EDEFF1",          // card border
          divider: "#E5E5E5",         // subtle light border
          // Dark mode borders
          dark_border: "#27292B",
          dark_divider: "#2B2D2F",

          // Text
          text: "#1A1A1B",            // primary text
          text_secondary: "#7C7C7C",  // gray text
          text_light: "#4C4C4C",      // slightly darker gray
          // Dark mode text
          dark_text: "#E6E7E8",
          dark_text_secondary: "#A0A3A5",
          dark_text_light: "#C3C5C6",

          // Icons
          icon: "#7C7C7C",            // default icon color
          // Dark mode icons
          dark_icon: "#A0A3A5",
          upvote: "#FF4500",          // upvote orange
          downvote: "#7193FF",        // downvote blue
          // Dark mode vote colors (same hue, optionally adjusted)
          dark_upvote: "#FF6A3C",
          dark_downvote: "#88A3FF",

          // Buttons
          blue: "#0079D3",            // join button
          blue_hover: "#0067b5",      // join hover
          // Dark mode buttons
          dark_blue: "#0079D3",
          dark_blue_hover: "#0463A8",
        },
      },
    },
  },
  plugins: [],
};
