import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import AuthProvider from "./context/AuthContext.jsx"; // <-- ADD THIS

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>    {/* <-- WRAP THE WHOLE APP */}
      <App />
    </AuthProvider>
  </StrictMode>
);
