import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getEventDetails,
  joinEvent,
  listScheduledEvents,
  type EventSummary,
} from "../../lib/events";
import { setActiveEventId } from "../../lib/event-session";

type EventsPageProps = {
  role: string;
  accessToken: string;
  userId: string;
};

export default function EventPage({ role, accessToken }: EventsPageProps) {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // password modal state
  const [passwordEventId, setPasswordEventId] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const isCoordinator = role === "coordinator";

  /* ================= LOAD EVENTS ================= */

  useEffect(() => {
    (async () => {
      try {
        const data = await listScheduledEvents(accessToken);
        setEvents(data);
      } catch {
        setError("Could not load events.");
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken]);

  /* ================= HANDLE KICKED ================= */

  useEffect(() => {
    if (searchParams.get("kicked") !== "1") return;

    setError("You were kicked from the event.");

    const next = new URLSearchParams(searchParams);
    next.delete("kicked");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  /* ================= JOIN ================= */

  const performJoin = async (eventId: string, password?: string) => {
    setJoiningId(eventId);
    setError(null);

    try {
      await joinEvent(accessToken, eventId, {
        password: isCoordinator ? undefined : password || undefined,
      });

      setActiveEventId(eventId);

      const details = await getEventDetails(accessToken, eventId);

      if (isCoordinator || details.status === "running") {
        navigate("/event", { replace: true });
      } else {
        navigate("/event/waiting", { replace: true });
      }
    } catch {
      setError("Join failed. Check password or event state.");
    } finally {
      setJoiningId(null);
      setPasswordEventId(null);
      setPassword("");
    }
  };

  const handleJoinClick = (eventId: string) => {
    if (isCoordinator) {
      performJoin(eventId);
    } else {
      // open password modal instead of inline input
      setPasswordEventId(eventId);
    }
  };

  /* ================= RENDER ================= */

  return (
    <section className="menu-panel relative">
      <h2 className="section-title">Events</h2>
      <div className="section-divider" />

      {error && <p className="error-text">{error}</p>}

      {loading && <p className="status-text">Loading events...</p>}

      {!loading && events.length === 0 && (
        <p className="status-text">No events available.</p>
      )}

      {!loading && events.length > 0 && (
        <div className="table-container">
          <table className="event-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Event Name</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>{event.id}</td>

                  <td>{event.name}</td>

                  <td className="text-right">
                    <button
                      className="secondary-button small"
                      onClick={() => handleJoinClick(event.id)}
                      disabled={joiningId === event.id}
                    >
                      {joiningId === event.id ? "..." : "JOIN"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= PASSWORD MODAL ================= */}

      {passwordEventId && (
        <div className="join-panel">
          <label>Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter event password"
          />

          <div className="lifecycle-actions">
            <button
              className="primary-button"
              onClick={() => performJoin(passwordEventId, password)}
              disabled={joiningId === passwordEventId}
            >
              Join
            </button>

            <button
              className="secondary-button"
              onClick={() => {
                setPasswordEventId(null);
                setPassword("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ================= FAB ================= */}

      {isCoordinator && (
        <button
          onClick={() => navigate("/events/create")}
          className="fab-button"
        >
          +
        </button>
      )}
    </section>
  );
}