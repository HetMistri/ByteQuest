import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  endEvent,
  getEventDetails,
  kickParticipant,
  listParticipants,
  pauseEvent,
  startEvent,
  type EventSummary,
  type ParticipantRecord,
} from "../../lib/events";
import { clearActiveEventId, getActiveEventId } from "../../lib/event-session";

type EventRoomProps = {
  accessToken: string;
  role: string;
  userId: string;
};

export default function EventRoom({ accessToken, role, userId }: EventRoomProps) {
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const isCoordinator = role === "coordinator";

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

    const loadRoom = async () => {
      try {
        const details = await getEventDetails(accessToken, activeEventId);
        setEvent(details);

        const joinedParticipants = await listParticipants(accessToken, activeEventId);
        setParticipants(joinedParticipants);

        if (!isCoordinator) {
          const isStillJoined = joinedParticipants.some((participant) => participant.userId === userId);
          if (!isStillJoined) {
            clearActiveEventId();
            navigate("/events?kicked=1", { replace: true });
            return;
          }
        }

        if (!isCoordinator && details.status !== "running") {
          navigate("/event/waiting", { replace: true });
        }
      } catch {
        setError("Could not load event room.");
      }
    };

    loadRoom();
    const interval = window.setInterval(loadRoom, 8000);
    return () => window.clearInterval(interval);
  }, [accessToken, isCoordinator, navigate, userId]);

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

  const handleLifecycle = async (action: "start" | "pause" | "end") => {
    if (!event || !isCoordinator) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const updated =
        action === "start"
          ? await startEvent(accessToken, event.id)
          : action === "pause"
            ? await pauseEvent(accessToken, event.id)
            : await endEvent(accessToken, event.id);

      setEvent(updated);

      if (action === "end") {
        clearActiveEventId();
        navigate("/events", { replace: true });
      } else if (action === "pause") {
        navigate("/event/waiting", { replace: true });
      }
    } catch {
      setError(`Could not ${action} event.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKickParticipant = async (targetUserId: string) => {
    if (!event || !isCoordinator) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await kickParticipant(accessToken, event.id, targetUserId);
      const joinedParticipants = await listParticipants(accessToken, event.id);
      setParticipants(joinedParticipants);
    } catch {
      setError("Could not kick participant.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return <p className="error-text">{error}</p>;
  }

  return (
    <section className="menu-panel">
      <h2 className="section-title">Event Room</h2>
      <div className="section-divider" />

      {event ? (
        <>
          <div className="room-panel">
            <p className="status-text room-text">Event: {event.name}</p>
            <p className="status-text room-text">Event has started</p>
            {!eventExpired ? (
              <p className="status-text room-text">Time Remaining: {formatRemaining(remainingSeconds)}</p>
            ) : (
              <p className="status-text room-text">Event expired</p>
            )}
            {eventExpired ? (
              <button type="button" className="secondary-button" onClick={() => navigate("/events", { replace: true })}>
                Back to Events
              </button>
            ) : null}
          </div>

          {isCoordinator ? (
            <div className="event-layout">
              <div className="event-column">
                <h3 className="section-title mini">Event Options</h3>
                <div className="lifecycle-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleLifecycle("start")}
                    disabled={isSubmitting}
                  >
                    {event.status === "paused" ? "Resume" : "Start"}
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
              </div>

              <div className="event-column">
                <h3 className="section-title mini">Joined Participants</h3>
                {participants.length === 0 ? <p className="status-text">No participants joined yet.</p> : null}
                <ul className="menu-list">
                  {participants.map((participant) => (
                    <li key={`${participant.eventId}-${participant.userId}`} className="menu-item participant-item">
                      <span>
                        {participant.displayName?.trim() || `${participant.userId.slice(0, 8)}...`} | Score: {participant.score}
                      </span>
                      <button
                        type="button"
                        className="secondary-button small"
                        onClick={() => handleKickParticipant(participant.userId)}
                        disabled={isSubmitting}
                      >
                        Kick
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <p className="status-text">Loading event room...</p>
      )}
    </section>
  );
}
