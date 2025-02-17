import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext({
  isAuthenticated: false,
  loginWithGitHub: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("https://a4-emre-sunar.glitch.me/auth/status", {
          credentials: "include",
        });

        if (response.ok) {
          const userData = await response.json();
          setIsAuthenticated(userData.authenticated);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
    const handleAuthChange = () => checkAuth();
    window.addEventListener("focus", handleAuthChange);

    return () => window.removeEventListener("focus", handleAuthChange);
  }, []);

  const loginWithGitHub = () => {
    window.location.href = "https://a4-emre-sunar.glitch.me/auth/github";
  };

  const logout = async () => {
    await fetch("https://a4-emre-sunar.glitch.me/auth/logout", { credentials: "include" });
    setIsAuthenticated(false);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loginWithGitHub, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const AuthStatus = () => {
  const { isAuthenticated, loginWithGitHub, logout } = React.useContext(AuthContext);

  return (
    <div className="auth-status">
      {isAuthenticated ? (
        <button onClick={logout} className="bg-red-500 text-white p-2 rounded">
          Logout
        </button>
      ) : (
        <button onClick={loginWithGitHub} className="bg-blue-500 text-white p-2 rounded">
          Login with GitHub
        </button>
      )}
    </div>
  );
};

export default AuthStatus;
