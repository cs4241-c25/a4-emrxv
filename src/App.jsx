import React, { useContext, useEffect, useState, useCallback } from "react";
import { Router, Route, Switch, useLocation, Redirect } from "wouter";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import Header from "./components/Header";
import LoginForm from "./components/LoginForm";
import LogoutButton from "./components/LogoutButton";
import WorkoutForm from "./components/WorkoutForm";
import WorkoutLog from "./components/WorkoutLog";
import Footer from "./components/Footer";

const App = () => (
  <AuthProvider>
    <Router>
      <AppContent />
    </Router>
  </AuthProvider>
);

const AppContent = () => {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const [workouts, setWorkouts] = useState([]);
  const [, navigate] = useLocation(); // Used for navigation in `wouter`

  const fetchWorkouts = useCallback(async () => {
    try {
      const response = await fetch("https://a4-emre-sunar.glitch.me/results", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error(`Something went wrong. Status: ${response.status}`);

      const userData = await response.json();
      setWorkouts(Array.isArray(userData.data) ? userData.data : []);
    } catch (error) {
      console.error("Error fetching workouts:", error);
      setWorkouts([]);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchWorkouts();
  }, [isAuthenticated, fetchWorkouts]);

  return (
    <>
      <Header />
      <Switch>
        <Route path="/">
          {isAuthenticated ? <Redirect to="/dashboard" /> : <LoginForm />}
        </Route>
        <Route path="/dashboard">
          {isAuthenticated ? (
            <>
              <LogoutButton onLogout={() => { logout(); navigate("/"); }} />
              <WorkoutForm fetchWorkouts={fetchWorkouts} />
              <WorkoutLog workouts={workouts} fetchWorkouts={fetchWorkouts} />
            </>
          ) : (
            <Redirect to="/" />
          )}
        </Route>
      </Switch>
      <Footer />
    </>
  );
};

export default App;
