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
  updateProblem,
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
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

export default function EventRoom({
  accessToken,
  role,
  userId,
}: EventRoomProps) {
  const MIN_PROBLEMS_TO_START = 5;

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [lastSyncAtMs, setLastSyncAtMs] = useState<number | null>(null);
  const [tickNowMs, setTickNowMs] = useState<number>(Date.now());

  const [leaderboardEntries, setLeaderboardEntries] = useState<
    LeaderboardEntry[]
  >([]);

  const [problems, setProblems] = useState<ProblemRecord[]>([]); // ✅ IMPORTANT

  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [problemEditDraft, setProblemEditDraft] = useState({
    title: "",
    description: "",
    solution: "",
    orderIndex: "",
  });

  const [answer, setAnswer] = useState("");
  const [submissionResult, setSubmissionResult] =
    useState<SubmissionResult | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const isCoordinator = role === "coordinator";
  const activeEventId = getActiveEventId();

  /* ================= LOAD ================= */

  const loadRoom = useCallback(async () => {
    if (!activeEventId) {
      navigate("/events", { replace: true });
      return;
    }

    try {
      const details = await getEventDetails(accessToken, activeEventId);
      setEvent(details);
      setLastSyncAtMs(Date.now());

      const joinedParticipants = await listParticipants(
        accessToken,
        activeEventId
      );

      if (isCoordinator || details.status === "ended") {
        const ranking = await getLeaderboard(accessToken, activeEventId);
        setLeaderboardEntries(ranking);
      } else {
        setLeaderboardEntries([]);
      }

      /* 🔥 KEY: Fetch problems for coordinator */
      if (isCoordinator) {
        const eventProblems = await listProblems(
          accessToken,
          activeEventId
        );
        setProblems(eventProblems);
      }

      if (!isCoordinator) {
        const isStillJoined = joinedParticipants.some(
          (p) => p.userId === userId
        );

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
    const interval = setInterval(loadRoom, 8000);
    return () => clearInterval(interval);
  }, [loadRoom]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickNowMs(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
        `Add at least ${MIN_PROBLEMS_TO_START} problems before starting.`
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
        setCompletedEventId(event.id); // 🔥 CRITICAL
        clearActiveEventId();
        navigate("/event/results", { replace: true }); // 🔥 REDIRECT

        return;
      }

      await loadRoom();
    } catch {
      setError(`Could not ${action} event.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent<HTMLFormElement>) => {
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
      setError("Could not submit answer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKickParticipant = async (targetUserId: string) => {
    if (!event || !isCoordinator) return;

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

  /* ================= COMPUTED ================= */

  const computedTotalElapsedSeconds = useMemo(() => {
    if (!event) return 0;

    const base = event.totalElapsedSeconds ?? 0;
    const total = event.totalDurationSeconds ?? event.timeLimit * 60;

    if (event.status !== "running" || !lastSyncAtMs) {
      return Math.min(total, base);
    }

    const delta = Math.floor((tickNowMs - lastSyncAtMs) / 1000);
    return Math.min(total, base + delta);
  }, [event, lastSyncAtMs, tickNowMs]);

  const computedTimeRemainingSeconds = useMemo(() => {
    if (!event) return 0;
    const total = event.totalDurationSeconds ?? event.timeLimit * 60;
    return Math.max(0, total - computedTotalElapsedSeconds);
  }, [event, computedTotalElapsedSeconds]);

  const isParticipantCompleted = useMemo(() => {
    if (!event || isCoordinator) return false;
    return (event.totalProblems ?? 0) > 0 && !event.currentProblem;
  }, [event, isCoordinator]);

  /* ================= UI ================= */

  if (error) return <p className="error-text">{error}</p>;
  if (!event) return <p className="status-text">Loading event room...</p>;

  return (
    <section className="event-room">
      {/* STATUS BAR */}
      <div className="event-status-bar">
        <div className="status-left">
          <span>{event.name}</span>
          <span>[{event.status}]</span>
        </div>

        {!isCoordinator && (
          <div className="status-right">
            <span>
              ⏱ {formatDuration(computedTotalElapsedSeconds)} /{" "}
              {formatDuration(
                event.totalDurationSeconds ?? event.timeLimit * 60
              )}
            </span>
            <span>⏳ {formatDuration(computedTimeRemainingSeconds)}</span>
          </div>
        )}
      </div>

      {/* MAIN */}
      <div className="event-room-layout">
        <div className="event-main">
          {!isCoordinator && (
            <ProblemRoadmap
              totalProblems={event.totalProblems ?? 0}
              currentQuestionIndex={event.currentQuestionIndex ?? 1}
            />
          )}

          {isParticipantCompleted ? (
            <div className="completion-panel">
              <h3>All Problems Completed</h3>
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
            entries={leaderboardEntries}
            showKick={isCoordinator}
            isSubmitting={isSubmitting}
            onKick={handleKickParticipant}
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