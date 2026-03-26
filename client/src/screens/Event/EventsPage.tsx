import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getEventDetails,
  joinEvent,
  listParticipants,
  listScheduledEvents,
  type EventSummary,
} from "../../lib/events";
import { setActiveEventId } from "../../lib/event-session";

type EventsPageProps = {
  role: string;
  accessToken: string;
  userId: string;
};

export default function EventsPage({ role, accessToken, userId }: EventsPageProps) {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joinPassword, setJoinPassword] = useState("");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const isCoordinator = role === "coordinator";
  const isParticipant = !isCoordinator;

  const canCreateEvent = useMemo(() => isCoordinator, [isCoordinator]);

  const refreshEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchedEvents = await listScheduledEvents(accessToken);
      setEvents(fetchedEvents);

      if (selectedEvent) {
        const exists = fetchedEvents.some((event) => event.id === selectedEvent.id);
        if (exists) {
          const details = await getEventDetails(accessToken, selectedEvent.id);
          setSelectedEvent(details);
        } else {
          setSelectedEvent(null);
        }
      }
    } catch {
      setError("Could not load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    if (searchParams.get("kicked") !== "1") {
      return;
    }

    setError("You were kicked from the event.");
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("kicked");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleSelectEvent = async (eventId: string) => {
    setError(null);
    try {
      const details = await getEventDetails(accessToken, eventId);
      setSelectedEvent(details);
    } catch {
      setError("Could not load this event.");
    }
  };

  const handleJoin = async () => {
    if (!selectedEvent) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await joinEvent(accessToken, selectedEvent.id, {
        password: isCoordinator ? undefined : joinPassword.trim() || undefined,
      });

      setActiveEventId(selectedEvent.id);
      const details = await getEventDetails(accessToken, selectedEvent.id);

      if (isCoordinator || details.status === "running") {
        navigate("/event", { replace: true });
      } else {
        navigate("/event/waiting", { replace: true });
      }
    } catch {
      setError("Join failed. Check event status, password, or active-event restriction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkAlreadyJoined = async () => {
    if (!selectedEvent || !isParticipant) {
      return;
    }

    try {
      const participants = await listParticipants(accessToken, selectedEvent.id);
      const joined = participants.some((participant) => participant.userId === userId);
      if (joined) {
        setActiveEventId(selectedEvent.id);
      }
    } catch {
      // Ignore transient issues for soft check.
    }
  };

  useEffect(() => {
    checkAlreadyJoined();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent?.id]);

  return (
    <section className="menu-panel">
      <h2 className="section-title">Events</h2>
      <div className="section-divider" />

      {error ? <p className="error-text">{error}</p> : null}

      <div className="event-layout">
        <div className="event-column">
          <h3 className="section-title mini">Joinable Events</h3>
          {canCreateEvent ? (
            <button type="button" className="secondary-button" onClick={() => navigate("/events/create")}>Create Event</button>
          ) : null}
          {loading ? <p className="status-text">Loading events...</p> : null}
          {!loading && events.length === 0 ? <p className="status-text">No events available.</p> : null}
          <ul className="menu-list">
            {events.map((event) => (
              <li
                key={event.id}
                className={`menu-item ${selectedEvent?.id === event.id ? "active" : ""}`}
                onClick={() => handleSelectEvent(event.id)}
                onKeyDown={(keyboardEvent) => {
                  if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
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
              {selectedEvent.startedAt ? (
                <p className="status-text">Started At: {new Date(selectedEvent.startedAt).toLocaleString()}</p>
              ) : null}

              <div className="join-panel">
                {!isCoordinator ? (
                  <>
                    <label htmlFor="joinPassword">Password (if required)</label>
                    <input
                      id="joinPassword"
                      type="text"
                      value={joinPassword}
                      onChange={(event) => setJoinPassword(event.target.value)}
                      placeholder="Enter event password"
                    />
                  </>
                ) : null}
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleJoin}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Joining..." : "Join Event"}
                </button>
              </div>
            </div>
          ) : (
            <p className="status-text">Select an event to view details and join.</p>
          )}
        </div>
      </div>
    </section>
  );
}
