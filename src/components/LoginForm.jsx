import React, { useEffect, useContext } from "react";
import { useLocation } from "wouter";
import { AuthContext } from "../context/AuthContext";

const LoginForm = () => {
    const [, navigate] = useLocation(); // useLocation hook from wouter
    const { isAuthenticated } = useContext(AuthContext);

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/dashboard"); // Redirect if already logged in
        }
    }, [isAuthenticated, navigate]);

    const handleLogin = () => {
        window.location.href = "https://a4-emre-sunar.glitch.me/auth/github";
    };

    return (
        <div className="text-center p-4">
            <h2 className="text-lg font-bold mb-4">Login</h2>
            <button onClick={handleLogin} className="bg-black text-white p-3 rounded">
                Login with GitHub
            </button>
        </div>
    );
};

export default LoginForm;
