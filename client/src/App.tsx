import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import { getCurrentUserRole, getSession, logout } from "./lib/auth";

import Footer from "./components/Footer";
import Header from "./components/Header";

import Auth from "./screens/auth/Auth";
import Menu from "./screens/Menu";
import Profile from "./screens/Profile";
import EventsPage from "./screens/Event/EventsPage";
import EventWaitingRoom from "./screens/Event/EventWaitingRoom";
import EventRoom from "./screens/Event/EventRoom";
import CreateEventPage from "./screens/Event/CreateEventPage";
import EventResultsPage from "./screens/Event/EventResultsPage";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = Boolean(session);

  /* ================= INIT ================= */

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

    return () => data.subscription.unsubscribe();
  }, []);

  /* ================= ROLE + THEME ================= */

  useEffect(() => {
    const setAccent = async () => {
      if (!session) {
        setRole(null);
        document.body.dataset.accent = "failure";
        return;
      }

      const resolvedRole = await getCurrentUserRole(session.access_token);
      const nextRole = resolvedRole ?? "participant";

      setRole(nextRole);

      document.body.dataset.accent =
        nextRole === "coordinator" ? "coordinator" : "success";
    };

    setAccent();
  }, [session]);

  /* ================= ACTIONS ================= */

  const handleLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  const handleToggleProfile = () => {
    if (!isAuthenticated) return;

    navigate(location.pathname === "/profile" ? "/menu" : "/profile");
  };

  /* ================= LOADING STATE ================= */

  if (isLoading) {
    return (
      <div className="app-shell">
        <Header
          isAuthenticated={false}
          onLogout={() => {}}
          onToggleProfile={() => {}}
          isProfileOpen={false}
          isCoordinator={false}
        />

        <div className="app-frame">
          <main className="app-main">
            <div className="system-loading">
              <p>&gt; Initializing system...</p>
              <p>&gt; Connecting to backend...</p>
              <p>&gt; Loading session...</p>
            </div>
          </main>
        </div>

        <Footer registeredPlayers={21} />
      </div>
    );
  }

  /* ================= MAIN APP ================= */

  return (
    <div className="app-shell">
      <Header
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        onToggleProfile={handleToggleProfile}
        isProfileOpen={location.pathname === "/profile"}
        isCoordinator={role === "coordinator"}
      />

      <div className="app-frame">
        {/* GLOBAL STATUS BAR */}
        <div className="system-bar">
          <span>&gt; {isAuthenticated ? "SYSTEM READY" : "AUTH REQUIRED"}</span>
          {role && <span>{role.toUpperCase()}</span>}
        </div>

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
                isAuthenticated ? <Menu /> : <Navigate to="/auth" replace />
              }
            />

            <Route
              path="/events"
              element={
                isAuthenticated && session ? (
                  <EventsPage
                    role={role ?? "participant"}
                    accessToken={session.access_token}
                  />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />

            <Route
              path="/events/create"
              element={
                isAuthenticated && role === "coordinator" && session ? (
                  <CreateEventPage accessToken={session.access_token} />
                ) : (
                  <Navigate to="/events" replace />
                )
              }
            />

            <Route
              path="/event/waiting"
              element={
                isAuthenticated && session ? (
                  <EventWaitingRoom
                    accessToken={session.access_token}
                    role={role ?? "participant"}
                    userId={session.user.id}
                  />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />

            <Route
              path="/event/results"
              element={
                isAuthenticated && session ? (
                  <EventResultsPage accessToken={session.access_token} />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />

            <Route
              path="/event"
              element={
                isAuthenticated && session ? (
                  <EventRoom
                    accessToken={session.access_token}
                    role={role ?? "participant"}
                    userId={session.user.id}
                  />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />

            <Route
              path="/profile"
              element={
                isAuthenticated && session ? (
                  <Profile session={session} />
                ) : (
                  <Navigate to="/auth" replace />
                )
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