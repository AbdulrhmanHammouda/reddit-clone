import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layout/MainLayout";

// Pages
import Home from "./pages/Home";
import PostPage from "./pages/PostPage";
import CommunityPage from "./pages/CommunityPage";
import PopularPage from "./pages/PopularPage";
import AllPage from "./pages/AllPage";
import ExplorePage from "./pages/ExplorePage";
import ChatPage from "./pages/ChatPage";
import CreateCommunityPage from "./pages/CreateCommunityPage";
import ProfilePage from "./pages/ProfilePage";
import CreatePost from "./pages/CreatePost";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import SettingsPage from "./pages/SettingsPage";

// Protected Route Wrapper
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

// Route configuration for cleaner code
const protectedRoutes = [
  // With right sidebar
  { path: "/", element: <Home />, noRightSidebar: false },
  { path: "/post/:id", element: <PostPage />, noRightSidebar: false },
  { path: "/all", element: <AllPage />, noRightSidebar: false },
  
  // Without right sidebar
  { path: "/r/:name", element: <CommunityPage />, noRightSidebar: true },
  { path: "/u/:username", element: <ProfilePage />, noRightSidebar: true },
  { path: "/popular", element: <PopularPage />, noRightSidebar: true },
  { path: "/chat", element: <ChatPage />, noRightSidebar: true },
  { path: "/explore", element: <ExplorePage />, noRightSidebar: true },
  { path: "/create-community", element: <CreateCommunityPage />, noRightSidebar: true },
  { path: "/createpost", element: <CreatePost />, noRightSidebar: true },
  { path: "/settings", element: <SettingsPage />, noRightSidebar: true },
  { path: "/settings/:tab", element: <SettingsPage />, noRightSidebar: true },
];

export default function App() {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route
          path="/login"
          element={!token ? <LoginPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/signup"
          element={!token ? <SignupPage /> : <Navigate to="/" replace />}
        />

        {/* Protected Routes - Generated from config */}
        {protectedRoutes.map(({ path, element, noRightSidebar }) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute>
                <MainLayout noRightSidebar={noRightSidebar}>
                  {element}
                </MainLayout>
              </ProtectedRoute>
            }
          />
        ))}

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
