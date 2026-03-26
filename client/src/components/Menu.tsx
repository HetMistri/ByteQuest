import { useEffect, useMemo, useState } from "react";
import {
  createEvent,
  endEvent,
  getEventDetails,
  listScheduledEvents,
  pauseEvent,
  startEvent,
  type EventSummary,
} from "../lib/events";

type MenuProps = {
  displayName: string;
  role: string;
  accessToken: string;
};

export default function Menu({ displayName, role, accessToken }: MenuProps) {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventName, setEventName] = useState("");
  const [timeLimit, setTimeLimit] = useState("60");
  const [password, setPassword] = useState("");

  const isCoordinator = role === "coordinator";

  const canControlSelected = useMemo(
    () => Boolean(selectedEvent && isCoordinator && selectedEvent.createdBy),
    [isCoordinator, selectedEvent],
  );

  const refreshEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      const scheduledEvents = await listScheduledEvents(accessToken);
      setEvents(scheduledEvents);

      if (selectedEvent) {
        const exists = scheduledEvents.some((event) => event.id === selectedEvent.id);
        if (exists) {
          const details = await getEventDetails(accessToken, selectedEvent.id);
          setSelectedEvent(details);
        } else {
          setSelectedEvent(null);
        }
      }
    } catch {
      setError("Could not load events right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleSelectEvent = async (eventId: string) => {
    setError(null);
    try {
      const details = await getEventDetails(accessToken, eventId);
      setSelectedEvent(details);
    } catch {
      setError("Could not load this event.");
    }
  };

  const handleCreateEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isCoordinator) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await createEvent(accessToken, {
        name: eventName,
        timeLimit: Number(timeLimit),
        password: password.trim() ? password.trim() : undefined,
      });
      setSelectedEvent(created);
      setEventName("");
      setTimeLimit("60");
      setPassword("");
      await refreshEvents();
    } catch {
      setError("Failed to create event. Check fields and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLifecycle = async (action: "start" | "pause" | "end") => {
    if (!selectedEvent || !canControlSelected) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const updated =
        action === "start"
          ? await startEvent(accessToken, selectedEvent.id)
          : action === "pause"
            ? await pauseEvent(accessToken, selectedEvent.id)
            : await endEvent(accessToken, selectedEvent.id);

      setSelectedEvent(updated);
      await refreshEvents();
    } catch {
      setError(`Could not ${action} this event.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="menu-panel">
      <h2 className="section-title">Phase 1 Event Console</h2>
      <div className="section-divider" />
      <p className="status-text">Welcome, {displayName}</p>

      {error ? <p className="error-text">{error}</p> : null}

      <div className="event-layout">
        <div className="event-column">
          <h3 className="section-title mini">Scheduled Events</h3>
          {loading ? <p className="status-text">Loading events...</p> : null}
          {!loading && events.length === 0 ? <p className="status-text">No scheduled events yet.</p> : null}
          <ul className="menu-list">
            {events.map((event) => (
              <li
                key={event.id}
                className={`menu-item ${selectedEvent?.id === event.id ? "active" : ""}`}
                onClick={() => handleSelectEvent(event.id)}
                onKeyDown={(keyEvent) => {
                  if (keyEvent.key === "Enter" || keyEvent.key === " ") {
                    handleSelectEvent(event.id);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                {event.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="event-column">
          <h3 className="section-title mini">Event Details</h3>
          {selectedEvent ? (
            <div className="event-details">
              <p className="status-text">Name: {selectedEvent.name}</p>
              <p className="status-text">Status: {selectedEvent.status}</p>
              <p className="status-text">Time Limit: {selectedEvent.timeLimit} minutes</p>
              <p className="status-text">Created By: {selectedEvent.createdBy}</p>
              <p className="status-text">Created At: {new Date(selectedEvent.createdAt).toLocaleString()}</p>
              {selectedEvent.startedAt ? (
                <p className="status-text">Started At: {new Date(selectedEvent.startedAt).toLocaleString()}</p>
              ) : null}

              {canControlSelected ? (
                <div className="lifecycle-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleLifecycle("start")}
                    disabled={isSubmitting}
                  >
                    Start
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleLifecycle("pause")}
                    disabled={isSubmitting}
                  >
                    Pause
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleLifecycle("end")}
                    disabled={isSubmitting}
                  >
                    End
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="status-text">Select an event from the list to view details.</p>
          )}
        </div>
      </div>

      {isCoordinator ? (
        <div className="event-create-panel">
          <h3 className="section-title mini">Create Event</h3>
          <form className="auth-form" onSubmit={handleCreateEvent}>
            <label htmlFor="eventName">Event Name</label>
            <input
              id="eventName"
              type="text"
              value={eventName}
              onChange={(event) => setEventName(event.target.value)}
              placeholder="ByteQuest Weekly #1"
              required
            />

            <label htmlFor="timeLimit">Time Limit (minutes)</label>
            <input
              id="timeLimit"
              type="number"
              value={timeLimit}
              onChange={(event) => setTimeLimit(event.target.value)}
              min={1}
              required
            />

            <label htmlFor="password">Password (optional)</label>
            <input
              id="password"
              type="text"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Optional"
            />

            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Event"}
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
