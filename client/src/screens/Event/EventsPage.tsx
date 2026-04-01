import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getEventDetails,
  joinEvent,
  listScheduledEvents,
  type EventSummary,
} from "../../lib/events";
import { setActiveEventId } from "../../lib/event-session";
import { useToast } from "../../components/ToastProvider";
import { getErrorMessage } from "../../lib/error-message";

type EventsPageProps = {
  role: string;
  accessToken: string;
};

export default function EventPage({ role, accessToken }: EventsPageProps) {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [passwordEventId, setPasswordEventId] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const isCoordinator = role === "coordinator";

  useEffect(() => {
    (async () => {
      try {
        const data = await listScheduledEvents(accessToken);
        setEvents(data);
      } catch (error) {
        const reason = getErrorMessage(error, "The event list request failed before data was returned.");
        const message = `Unable to load events: ${reason}`;
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken]);

  useEffect(() => {
    if (searchParams.get("kicked") !== "1") return;

    setError("You were removed from the event by the coordinator, so your previous event session was closed.");
    toast.warn("Access revoked: the coordinator removed your participant record from that event.");
    const next = new URLSearchParams(searchParams);
    next.delete("kicked");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const performJoin = async (eventId: string, password?: string) => {
    setJoiningId(eventId);
    setError(null);

    try {
      await joinEvent(accessToken, eventId, {
        password: isCoordinator ? undefined : password || undefined,
      });

      setActiveEventId(eventId);
      const details = await getEventDetails(accessToken, eventId);

      toast.success(`Joined event ${details.name} successfully.`);

      navigate(
        isCoordinator || details.status === "running"
          ? "/event"
          : "/event/waiting",
        { replace: true }
      );
    } catch (error) {
      const reason = getErrorMessage(
        error,
        "The join request was rejected because the password is incorrect, the event is not joinable, or your token is invalid.",
      );
      const message = `Unable to join event: ${reason}`;
      setError(message);
      toast.error(message);
    } finally {
      setJoiningId(null);
      setPasswordEventId(null);
      setPassword("");
    }
  };

  return (
    <section className="menu-panel">
      <h2 className="section-title">EVENTS</h2>

      {error && <p className="error-text">{error}</p>}
      {loading && <p className="status-text">Loading...</p>}

      {!loading && events.length === 0 && (
        <p className="status-text">No events available.</p>
      )}

      {!loading && events.length > 0 && (
        <div className="event-list">
          <div className="event-list-header">
            <span>ID</span>
            <span>NAME</span>
            <span>ACTION</span>
          </div>

          {events.map((event) => (
            <div key={event.id} className="event-row">
              <span className="event-id">#{event.id.slice(0, 4)}</span>

              <span className="event-name">{event.name}</span>

              <button
                className="secondary-button small"
                onClick={() =>
                  isCoordinator
                    ? performJoin(event.id)
                    : setPasswordEventId(event.id)
                }
                disabled={joiningId === event.id}
              >
                {joiningId === event.id ? "..." : "> JOIN"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* PASSWORD MODAL */}
      {passwordEventId && (
        <div className="terminal-modal">
          <p className="status-text"> ENTER PASSWORD</p>

          <input
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
          />

          <div className="control-actions-row">
            <button
              className="primary-button"
              onClick={() => performJoin(passwordEventId, password)}
            >
              ENTER
            </button>

            <button
              className="secondary-button"
              onClick={() => {
                setPasswordEventId(null);
                setPassword("");
              }}
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {isCoordinator && (
        <button
          className="fab-button"
          onClick={() => navigate("/events/create")}
        >
          +
        </button>
      )}
    </section>
  );
}