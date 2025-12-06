import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function ProtectedRoutes({ children }) {
  const { token, loading } = useAuth();

  // Don’t show anything while checking localStorage
  if (loading) return <div className="text-center p-4">Loading...</div>;

  // If no token → force go login
  if (!token) return <Navigate to="/login" replace />;

  // If logged in → show the app normally
  return children;
}
