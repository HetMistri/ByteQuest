import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  endEvent,
  getEventDetails,
  getLeaderboard,
  kickParticipant,
  listParticipants,
  listProblems,
  pauseEvent,
  startEvent,
  submitAnswer,
  type EventDetails,
  type LeaderboardEntry,
  type ProblemRecord,
  type SubmissionResult,
} from "../../lib/events";

import {
  clearActiveEventId,
  getActiveEventId,
  setCompletedEventId,
} from "../../lib/event-session";

import ProblemWorkspace from "../../components/ProblemWorkspace";
import CoordinatorEventControls from "../../components/CoordinatorEventControls";
import LeaderboardPanel from "../../components/LeaderboardPanel";
import ProblemRoadmap from "../../components/ProblemRoadmap";

type EventRoomProps = {
  accessToken: string;
  role: string;
  userId: string;
};

const formatDuration = (totalSeconds: number): string => {
  const safe = Math.max(0, totalSeconds);
  const m = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const s = (safe % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

export default function EventRoom({
  accessToken,
  role,
  userId,
}: EventRoomProps) {
  const navigate = useNavigate();
  const isCoordinator = role === "coordinator";
  const activeEventId = getActiveEventId();

  const MIN_PROBLEMS_TO_START = 5;

  /* ================= STATE ================= */

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [problems, setProblems] = useState<ProblemRecord[]>([]);

  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [tickNow, setTickNow] = useState<number>(Date.now());

  const [answer, setAnswer] = useState("");
  const [submissionResult, setSubmissionResult] =
    useState<SubmissionResult | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ================= LOAD ================= */

  const loadRoom = useCallback(async () => {
    if (!activeEventId) {
      navigate("/events", { replace: true });
      return;
    }

    try {
      const details = await getEventDetails(accessToken, activeEventId);
      setEvent(details);
      setLastSyncAt(Date.now());

      const participants = await listParticipants(
        accessToken,
        activeEventId
      );

      // leaderboard only for coordinator or ended
      if (isCoordinator || details.status === "ended") {
        const lb = await getLeaderboard(accessToken, activeEventId);
        setLeaderboard(lb);
      } else {
        setLeaderboard([]);
      }

      // coordinator fetches all problems
      if (isCoordinator) {
        const probs = await listProblems(accessToken, activeEventId);
        setProblems(probs);
      }

      // participant flow guards
      if (!isCoordinator) {
        const stillJoined = participants.some(
          (p) => p.userId === userId
        );

        if (!stillJoined) {
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
      setError("Failed to load event room.");
    }
  }, [accessToken, activeEventId, isCoordinator, navigate, userId]);

  useEffect(() => {
    loadRoom();
    const interval = setInterval(loadRoom, 8000);
    return () => clearInterval(interval);
  }, [loadRoom]);

  // ticking timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTickNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // auto redirect if ended
  useEffect(() => {
    if (event?.status === "ended") {
      setCompletedEventId(event.id);
      navigate("/event/results", { replace: true });
    }
  }, [event, navigate]);

  /* ================= ACTIONS ================= */

  const handleLifecycle = async (action: "start" | "pause" | "end") => {
    if (!event || !isCoordinator) return;

    if (
      action === "start" &&
      (event.totalProblems ?? 0) < MIN_PROBLEMS_TO_START
    ) {
      setError(
        `Minimum ${MIN_PROBLEMS_TO_START} problems required to start.`
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (action === "start") await startEvent(accessToken, event.id);
      if (action === "pause") await pauseEvent(accessToken, event.id);
      if (action === "end") {
        await endEvent(accessToken, event.id);
        setCompletedEventId(event.id);
        clearActiveEventId();
        navigate("/event/coordinator-results", { replace: true });
        return;
      }

      await loadRoom();
    } catch {
      setError(`Failed to ${action} event.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!event || !event.currentProblem || isCoordinator) return;

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
              message:
                "Correct! Completed all problems. Waiting for event end...",
            }
          : result
      );

      setAnswer("");
      await loadRoom();
    } catch {
      setError("Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKick = async (targetUserId: string) => {
    if (!event || !isCoordinator) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await kickParticipant(accessToken, event.id, targetUserId);
      await loadRoom();
    } catch {
      setError("Failed to kick participant.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ================= COMPUTED ================= */

  const elapsedSeconds = useMemo(() => {
    if (!event) return 0;

    const base = event.totalElapsedSeconds ?? 0;
    const total = event.totalDurationSeconds ?? event.timeLimit * 60;

    if (event.status !== "running" || !lastSyncAt) {
      return Math.min(total, base);
    }

    const delta = Math.floor((tickNow - lastSyncAt) / 1000);
    return Math.min(total, base + delta);
  }, [event, lastSyncAt, tickNow]);

  const remainingSeconds = useMemo(() => {
    if (!event) return 0;
    const total = event.totalDurationSeconds ?? event.timeLimit * 60;
    return Math.max(0, total - elapsedSeconds);
  }, [event, elapsedSeconds]);

  const isCompleted = useMemo(() => {
    if (!event || isCoordinator) return false;
    return (event.totalProblems ?? 0) > 0 && !event.currentProblem;
  }, [event, isCoordinator]);

  /* ================= UI ================= */

  if (error) return <p className="error-text">{error}</p>;
  if (!event) return <p className="status-text">Loading...</p>;

  return (
    <section className="event-room">
      {/* HEADER */}
      <div className="event-status-bar">
        <div>
          <span>{event.name}</span>
          <span> [{event.status}]</span>
        </div>

        {!isCoordinator && (
          <div>
            ⏱ {formatDuration(elapsedSeconds)} /{" "}
            {formatDuration(
              event.totalDurationSeconds ?? event.timeLimit * 60
            )}
            {" | "}
            ⏳ {formatDuration(remainingSeconds)}
          </div>
        )}
      </div>

      {/* BODY */}
      <div className="event-room-layout">
        <div className="event-main">
          {!isCoordinator && (
            <ProblemRoadmap
              totalProblems={event.totalProblems ?? 0}
              currentQuestionIndex={event.currentQuestionIndex ?? 1}
            />
          )}

          {isCompleted ? (
            <div className="completion-panel">
              <h3>Completed</h3>
              <p>Waiting for event to end...</p>
            </div>
          ) : (
            <ProblemWorkspace
              isCoordinator={isCoordinator}
              event={event}
              problems={problems}
              answer={answer}
              onAnswerChange={setAnswer}
              onSubmitAnswer={handleSubmitAnswer}
              submissionResult={submissionResult}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        <div className="event-sidebar">
          <LeaderboardPanel
            entries={leaderboard}
            showKick={isCoordinator}
            isSubmitting={isSubmitting}
            onKick={handleKick}
          />

          {isCoordinator && (
            <CoordinatorEventControls
              eventId={event.id}
              eventStatus={event.status}
              totalProblems={event.totalProblems ?? 0}
              isSubmitting={isSubmitting}
              onLifecycle={handleLifecycle}
            />
          )}
        </div>
      </div>
    </section>
  );
}