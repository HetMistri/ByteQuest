import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEventDetails, type EventSummary } from "../lib/events";
import { clearActiveEventId, getActiveEventId } from "../lib/event-session";

type EventWaitingRoomProps = {
  accessToken: string;
};

export default function EventWaitingRoom({ accessToken }: EventWaitingRoomProps) {
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const navigate = useNavigate();

  const eventExpired = useMemo(() => {
    if (!event?.startedAt) {
      return false;
    }

    const endMs = new Date(event.startedAt).getTime() + event.timeLimit * 60 * 1000;
    return Date.now() >= endMs;
  }, [event]);

  useEffect(() => {
    const activeEventId = getActiveEventId();
    if (!activeEventId) {
      navigate("/events", { replace: true });
      return;
    }

    const loadEvent = async () => {
      try {
        const details = await getEventDetails(accessToken, activeEventId);
        setEvent(details);

        if (details.status === "running") {
          navigate("/event", { replace: true });
          return;
        }
      } catch {
        setError("Could not load waiting room event.");
      }
    };

    loadEvent();
    const interval = window.setInterval(loadEvent, 8000);
    return () => window.clearInterval(interval);
  }, [accessToken, navigate]);

  useEffect(() => {
    if (!event?.startedAt) {
      setRemainingSeconds(null);
      return;
    }

    const updateRemaining = () => {
      const endMs = new Date(event.startedAt as string).getTime() + event.timeLimit * 60 * 1000;
      const next = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
      setRemainingSeconds(next);

      if (next === 0) {
        clearActiveEventId();
      }
    };

    updateRemaining();
    const interval = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(interval);
  }, [event]);

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

  if (error) {
    return <p className="error-text">{error}</p>;
  }

  return (
    <section className="menu-panel">
      <h2 className="section-title">Waiting Room</h2>
      <div className="section-divider" />

      {event ? (
        <div className="room-panel">
          <p className="status-text room-text">Event: {event.name}</p>
          <p className="status-text room-text">Waiting for admin to start the event</p>
          {event.startedAt ? (
            <p className="status-text room-text">Time Remaining: {formatRemaining(remainingSeconds)}</p>
          ) : (
            <p className="status-text room-text">Timer starts when event starts</p>
          )}
          {eventExpired ? (
            <button type="button" className="secondary-button" onClick={() => navigate("/events", { replace: true })}>
              Event expired - Back to Events
            </button>
          ) : null}
        </div>
      ) : (
        <p className="status-text">Loading waiting room...</p>
      )}
    </section>
  );
}
