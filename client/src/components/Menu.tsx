import { useEffect, useMemo, useState } from "react";
import {
  createEvent,
  endEvent,
  getEventDetails,
  joinEvent,
  listParticipants,
  listScheduledEvents,
  pauseEvent,
  startEvent,
  type EventSummary,
} from "../lib/events";

type MenuProps = {
  displayName: string;
  role: string;
  accessToken: string;
  userId: string;
};

export default function Menu({ displayName, role, accessToken, userId }: MenuProps) {
  const [view, setView] = useState<"menu" | "play">("menu");
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventSummary | null>(null);
  const [joinedEventId, setJoinedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventName, setEventName] = useState("");
  const [timeLimit, setTimeLimit] = useState("60");
  const [password, setPassword] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  const isCoordinator = role === "coordinator";
  const isParticipant = !isCoordinator;
  const isJoinedSelectedEvent = Boolean(selectedEvent && joinedEventId === selectedEvent.id);

  const eventHasExpired = useMemo(() => {
    if (!selectedEvent?.startedAt) {
      return false;
    }

    const endMs =
      new Date(selectedEvent.startedAt).getTime() + selectedEvent.timeLimit * 60 * 1000;

    return Date.now() >= endMs;
  }, [selectedEvent]);

  const roomStatusText = useMemo(() => {
    if (!selectedEvent || !isJoinedSelectedEvent) {
      return null;
    }

    if (eventHasExpired) {
      return "Event room expired";
    }

    if (selectedEvent.status === "running") {
      return "Event has started";
    }

    return "Waiting for admin to start the event";
  }, [selectedEvent, isJoinedSelectedEvent, eventHasExpired]);

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
    if (view !== "play") {
      return;
    }

    refreshEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, view]);

  useEffect(() => {
    if (!selectedEvent || !isJoinedSelectedEvent || !selectedEvent.startedAt) {
      setRemainingSeconds(null);
      return;
    }

    const updateRemaining = () => {
      const endMs =
        new Date(selectedEvent.startedAt as string).getTime() +
        selectedEvent.timeLimit * 60 * 1000;
      const next = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
      setRemainingSeconds(next);
    };

    updateRemaining();
    const interval = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(interval);
  }, [selectedEvent, isJoinedSelectedEvent]);

  useEffect(() => {
    if (!selectedEvent || !isJoinedSelectedEvent) {
      return;
    }

    const refreshSelected = async () => {
      try {
        const details = await getEventDetails(accessToken, selectedEvent.id);
        setSelectedEvent(details);
      } catch {
        // Keep last known state if transient fetch fails.
      }
    };

    const interval = window.setInterval(refreshSelected, 8000);
    return () => window.clearInterval(interval);
  }, [accessToken, isJoinedSelectedEvent, selectedEvent]);

  const formatRemaining = (totalSeconds: number | null): string => {
    if (totalSeconds === null) {
      return "--:--";
    }

    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const handleSelectEvent = async (eventId: string) => {
    setError(null);
    try {
      const details = await getEventDetails(accessToken, eventId);
      setSelectedEvent(details);

      if (isParticipant) {
        const participants = await listParticipants(accessToken, eventId);
        const joined = participants.some((participant) => participant.userId === userId);
        setJoinedEventId(joined ? eventId : null);
      }
    } catch {
      setError("Could not load this event.");
    }
  };

  const handleJoinEvent = async () => {
    if (!selectedEvent || !isParticipant) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await joinEvent(accessToken, selectedEvent.id, {
        password: joinPassword.trim() || undefined,
      });
      setJoinedEventId(selectedEvent.id);
      setJoinPassword("");
      const details = await getEventDetails(accessToken, selectedEvent.id);
      setSelectedEvent(details);
    } catch {
      setError("Join failed. Check password or event status.");
    } finally {
      setIsSubmitting(false);
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
      <h2 className="section-title">Menu</h2>
      <div className="section-divider" />
      <p className="status-text">Welcome, {displayName}</p>

      {view === "menu" ? (
        <div className="menu-home">
          <ul className="menu-list">
            <li
              className="menu-item"
              role="button"
              tabIndex={0}
              onClick={() => setView("play")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  setView("play");
                }
              }}
            >
              Play
            </li>
            <li className="menu-item muted">Settings (Coming Soon)</li>
          </ul>
        </div>
      ) : null}

      {view === "play" ? (
        <>
          <div className="play-toolbar">
            <button type="button" className="secondary-button" onClick={() => setView("menu")}>
              Back to Menu
            </button>
            <p className="status-text compact">
              {isCoordinator ? "Coordinator view: create and manage events" : "Player view: browse scheduled events"}
            </p>
          </div>

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

                  {isParticipant && !isJoinedSelectedEvent ? (
                    <div className="join-panel">
                      <label htmlFor="joinPassword">Password (if required)</label>
                      <input
                        id="joinPassword"
                        type="text"
                        value={joinPassword}
                        onChange={(event) => setJoinPassword(event.target.value)}
                        placeholder="Enter event password"
                      />
                      <button
                        type="button"
                        className="primary-button"
                        onClick={handleJoinEvent}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Joining..." : "Join Event"}
                      </button>
                    </div>
                  ) : null}

                  {isParticipant && isJoinedSelectedEvent ? (
                    <div className="room-panel">
                      <p className="status-text room-text">{roomStatusText}</p>
                      {!eventHasExpired ? (
                        <p className="status-text room-text">
                          Time Remaining: {formatRemaining(remainingSeconds)}
                        </p>
                      ) : null}
                    </div>
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
        </>
      ) : null}
    </section>
  );
}
