import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  endEvent,
  getEventDetails,
  kickParticipant,
  listParticipants,
  listProblems,
  pauseEvent,
  startEvent,
  submitAnswer,
  type EventDetails,
  type ParticipantRecord,
  type ProblemRecord,
  type SubmissionResult,
  updateProblem,
} from "../../lib/events";
import { clearActiveEventId, getActiveEventId, setCompletedEventId } from "../../lib/event-session";
import ProblemWorkspace from "./components/ProblemWorkspace";
import CoordinatorEventControls from "./components/CoordinatorEventControls";
import LeaderboardPanel from "./components/LeaderboardPanel";
import ProblemRoadmap from "./components/ProblemRoadmap";

type EventRoomProps = {
  accessToken: string;
  role: string;
  userId: string;
};

const formatDuration = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

export default function EventRoom({ accessToken, role, userId }: EventRoomProps) {
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [lastSyncAtMs, setLastSyncAtMs] = useState<number | null>(null);
  const [tickNowMs, setTickNowMs] = useState<number>(Date.now());
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const [problems, setProblems] = useState<ProblemRecord[]>([]);
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [problemEditDraft, setProblemEditDraft] = useState({
    title: "",
    description: "",
    solution: "",
    orderIndex: "",
  });
  const [answer, setAnswer] = useState("");
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const isCoordinator = role === "coordinator";
  const activeEventId = getActiveEventId();

  const loadRoom = useCallback(async () => {
    if (!activeEventId) {
      navigate("/events", { replace: true });
      return;
    }

    try {
      const details = await getEventDetails(accessToken, activeEventId);
      setEvent(details);
      setLastSyncAtMs(Date.now());

      const joinedParticipants = await listParticipants(accessToken, activeEventId);
      setParticipants(joinedParticipants);

      if (isCoordinator) {
        const eventProblems = await listProblems(accessToken, activeEventId);
        setProblems(eventProblems);
      }

      if (!isCoordinator) {
        const isStillJoined = joinedParticipants.some((participant) => participant.userId === userId);
        if (!isStillJoined) {
          clearActiveEventId();
          navigate("/events?kicked=1", { replace: true });
          return;
        }

        if (details.status === "ended") {
          setCompletedEventId(details.id);
          navigate("/event/results", { replace: true });
          return;
        }

        if (details.status !== "running") {
          navigate("/event/waiting", { replace: true });
        }
      }
    } catch {
      setError("Could not load event room.");
    }
  }, [accessToken, activeEventId, isCoordinator, navigate, userId]);

  useEffect(() => {
    loadRoom();
    const interval = window.setInterval(loadRoom, 8000);
    return () => window.clearInterval(interval);
  }, [loadRoom]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTickNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (event?.status === "ended" && !isCoordinator) {
      setCompletedEventId(event.id);
      navigate("/event/results", { replace: true });
    }
  }, [event, isCoordinator, navigate]);

  const handleLifecycle = async (action: "start" | "pause" | "end") => {
    if (!event || !isCoordinator) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (action === "start") {
        await startEvent(accessToken, event.id);
      }
      if (action === "pause") {
        await pauseEvent(accessToken, event.id);
      }
      if (action === "end") {
        await endEvent(accessToken, event.id);
        clearActiveEventId();
        navigate("/events", { replace: true });
        return;
      }

      await loadRoom();
    } catch {
      setError(`Could not ${action} event.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAnswer = async (submitEvent: React.FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();

    if (!event || !event.currentProblem || isCoordinator) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitAnswer(accessToken, event.id, answer);
      if (result.completed) {
        setCompletedEventId(event.id);
      }

      setSubmissionResult(
        result.completed
          ? {
              ...result,
              message: "Correct! You completed all problems. Waiting for event end...",
            }
          : result,
      );
      setAnswer("");
      await loadRoom();
    } catch {
      setError("Could not submit answer.");
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
      await loadRoom();
    } catch {
      setError("Could not kick participant.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const beginEditProblem = (problem: ProblemRecord) => {
    setEditingProblemId(problem.id);
    setProblemEditDraft({
      title: problem.title,
      description: problem.description,
      solution: "",
      orderIndex: String(problem.orderIndex),
    });
  };

  const handleUpdateProblem = async (submitEvent: React.FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();

    if (!event || !isCoordinator || !editingProblemId) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await updateProblem(accessToken, event.id, editingProblemId, {
        title: problemEditDraft.title,
        description: problemEditDraft.description,
        solution: problemEditDraft.solution.trim() || undefined,
        orderIndex: problemEditDraft.orderIndex ? Number(problemEditDraft.orderIndex) : undefined,
      });
      setEditingProblemId(null);
      setProblemEditDraft({ title: "", description: "", solution: "", orderIndex: "" });
      await loadRoom();
    } catch {
      setError("Could not update problem. Problems are editable only while event is scheduled.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const computedTotalElapsedSeconds = useMemo(() => {
    if (!event) {
      return 0;
    }

    const baseElapsed = event.totalElapsedSeconds ?? 0;
    const totalDuration = event.totalDurationSeconds ?? event.timeLimit * 60;

    if (event.status !== "running" || !lastSyncAtMs) {
      return Math.min(totalDuration, baseElapsed);
    }

    const elapsedSinceSync = Math.max(0, Math.floor((tickNowMs - lastSyncAtMs) / 1000));
    return Math.min(totalDuration, baseElapsed + elapsedSinceSync);
  }, [event, lastSyncAtMs, tickNowMs]);

  const computedProblemTimeSpentSeconds = useMemo(() => {
    if (!event) {
      return 0;
    }

    const baseProblemElapsed = event.problemTimeSpentSeconds ?? 0;

    if (event.status !== "running" || !event.currentProblem || !lastSyncAtMs) {
      return baseProblemElapsed;
    }

    const elapsedSinceSync = Math.max(0, Math.floor((tickNowMs - lastSyncAtMs) / 1000));
    return baseProblemElapsed + elapsedSinceSync;
  }, [event, lastSyncAtMs, tickNowMs]);

  const computedUserTotalTimeSpentSeconds = useMemo(() => {
    if (!event) {
      return 0;
    }

    const baseUserTotal = event.userTotalTimeSpentSeconds ?? 0;
    const totalDuration = event.totalDurationSeconds ?? event.timeLimit * 60;

    if (event.status !== "running" || !event.currentProblem || !lastSyncAtMs) {
      return Math.min(totalDuration, baseUserTotal);
    }

    const elapsedSinceSync = Math.max(0, Math.floor((tickNowMs - lastSyncAtMs) / 1000));
    return Math.min(totalDuration, baseUserTotal + elapsedSinceSync);
  }, [event, lastSyncAtMs, tickNowMs]);

  const computedTimeRemainingSeconds = useMemo(() => {
    if (!event) {
      return 0;
    }

    const totalDuration = event.totalDurationSeconds ?? event.timeLimit * 60;
    return Math.max(0, totalDuration - computedTotalElapsedSeconds);
  }, [event, computedTotalElapsedSeconds]);

  const eventExpired = useMemo(() => {
    if (!event) {
      return false;
    }

    const totalDuration = event.totalDurationSeconds ?? event.timeLimit * 60;
    return computedTotalElapsedSeconds >= totalDuration;
  }, [event, computedTotalElapsedSeconds]);

  const canShowLeaderboard = isCoordinator || event?.status === "ended";

  const isParticipantCompleted = useMemo(() => {
    if (!event || isCoordinator) {
      return false;
    }

    return (event.totalProblems ?? 0) > 0 && !event.currentProblem;
  }, [event, isCoordinator]);

  if (error) {
    return <p className="error-text">{error}</p>;
  }

  if (!event) {
    return <p className="status-text">Loading event room...</p>;
  }

  return (
    <section className="menu-panel">
      <h2 className="section-title">Event Room</h2>
      <div className="section-divider" />

      <div className="room-panel">
        <p className="status-text room-text">Event: {event.name}</p>
        <p className="status-text room-text">Status: {event.status}</p>
        {!isCoordinator ? (
          <>
            <p className="status-text room-text">
              Total Timer: {formatDuration(computedTotalElapsedSeconds)} / {formatDuration(event.totalDurationSeconds ?? event.timeLimit * 60)}
            </p>
            <p className="status-text room-text">Your Total Time Spent: {formatDuration(computedUserTotalTimeSpentSeconds)}</p>
            <p className="status-text room-text">Problem Time Spent: {formatDuration(computedProblemTimeSpentSeconds)}</p>
            <p className="status-text room-text">Time Remaining: {formatDuration(computedTimeRemainingSeconds)}</p>
          </>
        ) : null}
      </div>

      {!isCoordinator ? (
        <ProblemRoadmap
          totalProblems={event.totalProblems ?? 0}
          currentQuestionIndex={event.currentQuestionIndex ?? 1}
        />
      ) : null}

      {isCoordinator ? (
        <div className="event-create-panel">
          <h3 className="section-title mini">Problem Set</h3>
          {problems.length === 0 ? <p className="status-text">No problems added yet.</p> : null}
          <ul className="menu-list">
            {problems.map((problem) => (
              <li key={problem.id} className="menu-item participant-item">
                <span>
                  #{problem.orderIndex} {problem.title}
                </span>
                {event.status === "scheduled" ? (
                  <button
                    type="button"
                    className="secondary-button small"
                    onClick={() => beginEditProblem(problem)}
                  >
                    Edit
                  </button>
                ) : null}
              </li>
            ))}
          </ul>

          {event.status !== "scheduled" ? (
            <p className="status-text">Problems are locked once event starts.</p>
          ) : null}

          {editingProblemId && event.status === "scheduled" ? (
            <form className="auth-form" onSubmit={handleUpdateProblem}>
              <label htmlFor="editTitle">Title</label>
              <input
                id="editTitle"
                type="text"
                value={problemEditDraft.title}
                onChange={(inputEvent) =>
                  setProblemEditDraft((previous) => ({ ...previous, title: inputEvent.target.value }))
                }
                required
              />

              <label htmlFor="editDescription">Definition</label>
              <input
                id="editDescription"
                type="text"
                value={problemEditDraft.description}
                onChange={(inputEvent) =>
                  setProblemEditDraft((previous) => ({ ...previous, description: inputEvent.target.value }))
                }
                required
              />

              <label htmlFor="editSolution">Solution (leave empty to keep existing)</label>
              <input
                id="editSolution"
                type="text"
                value={problemEditDraft.solution}
                onChange={(inputEvent) =>
                  setProblemEditDraft((previous) => ({ ...previous, solution: inputEvent.target.value }))
                }
              />

              <label htmlFor="editOrder">Order Index</label>
              <input
                id="editOrder"
                type="number"
                min={1}
                value={problemEditDraft.orderIndex}
                onChange={(inputEvent) =>
                  setProblemEditDraft((previous) => ({ ...previous, orderIndex: inputEvent.target.value }))
                }
              />

              <button type="submit" className="primary-button" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Problem"}
              </button>
            </form>
          ) : null}
        </div>
      ) : null}

      {eventExpired ? (
        <button type="button" className="secondary-button" onClick={() => navigate("/events", { replace: true })}>
          Back to Events
        </button>
      ) : null}

      {isParticipantCompleted ? (
        <div className="event-create-panel">
          <h3 className="section-title mini">All Problems Completed</h3>
          <p className="status-text">
            You have solved all unlocked problems. Wait for the coordinator to end the event to view final results.
          </p>
          {event.status === "ended" ? (
            <button type="button" className="primary-button" onClick={() => navigate("/event/results", { replace: true })}>
              View Results
            </button>
          ) : null}
        </div>
      ) : (
        <ProblemWorkspace
          isCoordinator={isCoordinator}
          event={event}
          answer={answer}
          onAnswerChange={setAnswer}
          onSubmitAnswer={handleSubmitAnswer}
          submissionResult={submissionResult}
          isSubmitting={isSubmitting}
        />
      )}

      <div className="event-layout">
        {isCoordinator ? (
          <CoordinatorEventControls
            eventId={event.id}
            eventStatus={event.status}
            isSubmitting={isSubmitting}
            onLifecycle={handleLifecycle}
          />
        ) : null}

        {canShowLeaderboard ? (
          <LeaderboardPanel
            participants={participants}
            showKick={isCoordinator}
            isSubmitting={isSubmitting}
            onKick={handleKickParticipant}
          />
        ) : (
          <div className="event-column">
            <h3 className="section-title mini">Leaderboard</h3>
            <p className="status-text">Leaderboard unlocks when event ends.</p>
          </div>
        )}
      </div>
    </section>
  );
}
