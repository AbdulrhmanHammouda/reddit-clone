import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import logo from "../assets/reddit-logo.png";

export default function SignupPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/auth/signup", form);

      const token = res.data?.data?.token;
      const user = res.data?.data?.user;

      if (token) localStorage.setItem("token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));

      // Auto-login → redirect to home
      navigate("/");
    } catch (err) {
      const msg =
        err.response?.data?.error || "Signup failed. Try again.";
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-reddit-page dark:bg-reddit-dark_bg">
      <div className="w-full max-w-md">
        <div className="bg-reddit-card dark:bg-reddit-dark_card rounded-lg p-6 border border-reddit-border dark:border-reddit-dark_divider shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <img src={logo} alt="logo" className="h-8 w-8" />
            <div>
              <h1 className="text-lg font-semibold text-reddit-text dark:text-reddit-dark_text">
                Create an account
              </h1>
              <p className="text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
                Join now — it only takes a minute.
              </p>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                name="username"
                type="text"
                required
                placeholder="Your username"
                value={form.username}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-md bg-white dark:bg-reddit-dark_input border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="name@example.com"
                value={form.email}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-md bg-white dark:bg-reddit-dark_input border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                name="password"
                type="password"
                required
                placeholder="Choose a password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-md bg-white dark:bg-reddit-dark_input border"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-reddit-blue hover:bg-reddit-blue_hover text-white font-semibold py-2 rounded-md"
            >
              Create Account
            </button>
          </form>

          <p className="mt-4 text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-reddit-blue font-semibold">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
