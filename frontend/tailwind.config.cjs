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

          // Borders
          border: "#EDEFF1",          // card border
          divider: "#E5E5E5",         // subtle light border

          // Text
          text: "#1A1A1B",            // primary text
          text_secondary: "#7C7C7C",  // gray text
          text_light: "#4C4C4C",      // slightly darker gray

          // Icons
          icon: "#7C7C7C",            // default icon color
          upvote: "#FF4500",          // upvote orange
          downvote: "#7193FF",        // downvote blue

          // Buttons
          blue: "#0079D3",            // join button
          blue_hover: "#0067b5",      // join hover
        },
      },
    },
  },
  plugins: [],
};
