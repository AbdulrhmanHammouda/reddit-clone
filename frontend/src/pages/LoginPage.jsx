import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios"
import logo from "../assets/reddit-logo.png";

export default function LoginPage() {
    const navigate = useNavigate();

    const [emailOrUsername, setEmailOrUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const res = await api.post("/auth/login", {
                emailOrUsername,
                password,
            });

            const token = res.data.data.token;
            const user = res.data.data.user;
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            navigate("/"); // redirect to home
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || "Login failed");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-reddit-page dark:bg-reddit-dark_bg">
            <div className="w-full max-w-md">
                <div className="bg-reddit-card dark:bg-reddit-dark_card rounded-lg p-6 border border-reddit-border dark:border-reddit-dark_divider shadow-md">
                    <div className="flex items-center gap-3 mb-4">
                        <img src={logo} alt="logo" className="h-8 w-8" />
                        <div>
                            <h1 className="text-lg font-semibold text-reddit-text dark:text-reddit-dark_text">Log In</h1>
                            <p className="text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
                                Welcome back — please enter your details.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-reddit-text_secondary dark:text-reddit-dark_text_secondary mb-1">
                                Email or Username
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="name@example.com"
                                value={emailOrUsername}
                                onChange={(e) => setEmailOrUsername(e.target.value)}
                                className="w-full px-3 py-2 rounded-md bg-white dark:bg-reddit-dark_input border border-reddit-border dark:border-reddit-dark_divider text-reddit-text dark:text-reddit-dark_text placeholder-gray-400 dark:placeholder-reddit-dark_text_secondary focus:outline-none focus:ring-2 focus:ring-reddit-blue/30"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-reddit-text_secondary dark:text-reddit-dark_text_secondary">Password</label>
                                <a href="#" className="text-sm text-reddit-blue dark:text-reddit-dark_blue">Forgot?</a>
                            </div>
                            <input
                                type="password"
                                required
                                placeholder="Your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 rounded-md bg-white dark:bg-reddit-dark_input border border-reddit-border dark:border-reddit-dark_divider text-reddit-text dark:text-reddit-dark_text placeholder-gray-400 dark:placeholder-reddit-dark_text_secondary focus:outline-none focus:ring-2 focus:ring-reddit-blue/30"
                            />
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm text-center">{error}</p>
                        )}

                        <div>
                            <button
                                type="submit"
                                className="w-full bg-reddit-blue hover:bg-reddit-blue_hover text-reddit-card font-semibold py-2 rounded-md"
                            >
                                Log In
                            </button>
                        </div>
                    </form>

                    <p className="mt-4 text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary text-center">
                        Don't have an account?{" "}
                        <Link to="/signup" className="text-reddit-blue dark:text-reddit-dark_blue font-semibold">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
