import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import { getSession, logout } from "./lib/auth";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Auth from "./auth/Auth";
import Menu from "./components/Menu";
import Profile from "./components/Profile";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = Boolean(session);

  useEffect(() => {
    const initializeSession = async () => {
      const activeSession = await getSession();
      setSession(activeSession);
      setIsLoading(false);
    };

    initializeSession();

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    document.body.dataset.accent = session ? "success" : "failure";
  }, [session]);

  const handleLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  const handleToggleProfile = () => {
    if (!isAuthenticated) {
      return;
    }

    if (location.pathname === "/profile") {
      navigate("/menu");
      return;
    }

    navigate("/profile");
  };

  if (isLoading) {
    return (
      <div className="app-shell">
        <Header
          isAuthenticated={false}
          onLogout={() => undefined}
          onToggleProfile={() => undefined}
          isProfileOpen={false}
        />
        <div className="app-frame">
          <main className="app-main">
            <p className="status-text">Loading...</p>
          </main>
        </div>
        <Footer registeredPlayers={21} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        onToggleProfile={handleToggleProfile}
        isProfileOpen={location.pathname === "/profile"}
      />
      <div className="app-frame">
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to={isAuthenticated ? "/menu" : "/auth"} replace />} />
            <Route
              path="/auth"
              element={isAuthenticated ? <Navigate to="/menu" replace /> : <Auth />}
            />
            <Route
              path="/menu"
              element={
                isAuthenticated && session ? (
                  <Menu
                    displayName={
                      (session.user.user_metadata?.display_name as string | undefined) ?? "Player"
                    }
                  />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
            <Route
              path="/profile"
              element={
                isAuthenticated && session ? <Profile session={session} /> : <Navigate to="/auth" replace />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <Footer registeredPlayers={21} />
    </div>
  );
}