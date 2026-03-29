import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEventDetails, listParticipants, type EventSummary } from "../../lib/events";
import { clearActiveEventId, getActiveEventId, setCompletedEventId } from "../../lib/event-session";

type EventWaitingRoomProps = {
  accessToken: string;
  role: string;
  userId: string;
};

export default function EventWaitingRoom({ accessToken, role, userId }: EventWaitingRoomProps) {
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
    if (role === "coordinator") {
      navigate("/event", { replace: true });
      return;
    }

    const activeEventId = getActiveEventId();
    if (!activeEventId) {
      navigate("/events", { replace: true });
      return;
    }

    const loadEvent = async () => {
      try {
        const details = await getEventDetails(accessToken, activeEventId);
        setEvent(details);

        const participants = await listParticipants(accessToken, activeEventId);
        const isStillJoined = participants.some((participant) => participant.userId === userId);
        if (!isStillJoined) {
          clearActiveEventId();
          navigate("/events?kicked=1", { replace: true });
          return;
        }

        if (details.status === "running") {
          navigate("/event", { replace: true });
          return;
        }

        if (details.status === "ended") {
          setCompletedEventId(details.id);
          navigate("/event/results", { replace: true });
          return;
        }
      } catch {
        setError("Could not load waiting room event.");
      }
    };

    loadEvent();
    const interval = window.setInterval(loadEvent, 8000);
    return () => window.clearInterval(interval);
  }, [accessToken, navigate, role, userId]);

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
  <section className="menu-panel waiting-screen">
    <div className="waiting-container">
      <h2 className="section-title">WAITING ROOM</h2>

      {event ? (
        <>
          {/* ===== EVENT INFO ===== */}
          <div className="waiting-block">
            <h3 className="section-title mini">[ EVENT ]</h3>

            <p className="waiting-line">
              <span className="waiting-label">&gt; name:</span>
              <span className="waiting-value">{event.name}</span>
            </p>
          </div>

          {/* ===== STATUS ===== */}
          <div className="waiting-block">
            <h3 className="section-title mini">[ STATUS ]</h3>

            <p className="status-text">
              &gt; waiting for coordinator to start...
            </p>
          </div>

          {/* ===== TIMER ===== */}
          <div className="waiting-block">
            <h3 className="section-title mini">[ TIMER ]</h3>

            {event.startedAt ? (
              <p className="waiting-timer">
                {formatRemaining(remainingSeconds)}
              </p>
            ) : (
              <p className="status-text compact">
                &gt; timer will start on event start
              </p>
            )}
          </div>

          {/* ===== ACTION ===== */}
          {eventExpired && (
            <button
              type="button"
              className="secondary-button"
              onClick={() => navigate("/events", { replace: true })}
            >
              EXIT
            </button>
          )}
        </>
      ) : (
        <div className="system-loading">
          <span>&gt; connecting...</span>
          <span>&gt; loading event...</span>
        </div>
      )}
    </div>
  </section>
);
}
