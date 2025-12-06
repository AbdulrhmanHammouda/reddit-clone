import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layout/MainLayout";

// Pages
import Home from "./pages/Home";
import PostPage from "./pages/PostPage";
import CommunityPage from "./pages/CommunityPage";
import PopularPage from "./pages/PopularPage";
import AllPage from "./pages/AllPage";
import ExplorePage from "./pages/ExplorePage";
import ChatPage from "./components/ChatPage";
import CreateCommunityPage from "./pages/CreateCommunityPage";
import ProfilePage from "./pages/ProfilePage";
import CreatePost from "./pages/CreatePost";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>

        {/* Public */}
        <Route
          path="/login"
          element={!token ? <LoginPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/signup"
          element={!token ? <SignupPage /> : <Navigate to="/" replace />}
        />

        {/* Protected */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout><Home /></MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/post/:id"
          element={
            <ProtectedRoute>
              <MainLayout><PostPage /></MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/r/:name"
          element={
            <ProtectedRoute>
              <MainLayout noRightSidebar={true}>
                <CommunityPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/u/:username"
          element={
            <ProtectedRoute>
              <MainLayout noRightSidebar={true}>
                <ProfilePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/popular"
          element={
            <ProtectedRoute>
              <MainLayout noRightSidebar={true}>
                <PopularPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <MainLayout noRightSidebar={true}>
                <ChatPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/all"
          element={
            <ProtectedRoute>
              <MainLayout>
                <AllPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/explore"
          element={
            <ProtectedRoute>
              <MainLayout noRightSidebar={true}>
                <ExplorePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-community"
          element={
            <ProtectedRoute>
              <MainLayout noRightSidebar={true}>
                <CreateCommunityPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/createpost"
          element={
            <ProtectedRoute>
              <MainLayout noRightSidebar={true}>
                <CreatePost />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
