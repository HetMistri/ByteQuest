import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  addProblem,
  endEvent,
  getEventDetails,
  kickParticipant,
  listParticipants,
  pauseEvent,
  startEvent,
  submitAnswer,
  type EventDetails,
  type ParticipantRecord,
  type SubmissionResult,
} from "../../lib/events";
import { clearActiveEventId, getActiveEventId } from "../../lib/event-session";
import EventProgressCard from "./components/EventProgressCard";
import ProblemWorkspace from "./components/ProblemWorkspace";
import CoordinatorEventControls from "./components/CoordinatorEventControls";
import LeaderboardPanel from "./components/LeaderboardPanel";

type EventRoomProps = {
  accessToken: string;
  role: string;
  userId: string;
};

const PROBLEM_BUCKET = import.meta.env.VITE_SUPABASE_PROBLEM_BUCKET || "problem-assets";

export default function EventRoom({ accessToken, role, userId }: EventRoomProps) {
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
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

      const joinedParticipants = await listParticipants(accessToken, activeEventId);
      setParticipants(joinedParticipants);

      if (!isCoordinator) {
        const isStillJoined = joinedParticipants.some((participant) => participant.userId === userId);
        if (!isStillJoined) {
          clearActiveEventId();
          navigate("/events?kicked=1", { replace: true });
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
    if (!event?.startedAt) {
      return;
    }

    const updateOnTick = () => {
      const startedAt = event.startedAt;
      if (!startedAt) {
        return;
      }

      const endMs = new Date(startedAt).getTime() + event.timeLimit * 60 * 1000;
      if (Date.now() >= endMs) {
        clearActiveEventId();
      }
    };

    const interval = window.setInterval(updateOnTick, 1000);
    return () => window.clearInterval(interval);
  }, [event]);

  const uploadProblemFile = async (eventId: string, file: File | null): Promise<string | undefined> => {
    if (!file) {
      return undefined;
    }

    const normalizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const filePath = `${eventId}/${Date.now()}-${normalizedFileName}`;

    const uploadResult = await supabase.storage.from(PROBLEM_BUCKET).upload(filePath, file, {
      upsert: false,
      contentType: file.type || undefined,
    });

    if (uploadResult.error) {
      throw new Error(uploadResult.error.message);
    }

    const { data } = supabase.storage.from(PROBLEM_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  };

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
      }

      await loadRoom();
    } catch {
      setError(`Could not ${action} event.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddProblem = async (input: {
    title: string;
    description: string;
    solution: string;
    file: File | null;
  }) => {
    if (!event || !isCoordinator) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const downloadableContentUrl = await uploadProblemFile(event.id, input.file);
      await addProblem(accessToken, event.id, {
        title: input.title,
        description: input.description,
        solution: input.solution,
        downloadableContentUrl,
      });
      await loadRoom();
    } catch {
      setError("Could not add problem. Check bucket permissions and payload.");
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
      setSubmissionResult(result);
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

  const eventExpired = useMemo(() => {
    if (!event?.startedAt) {
      return false;
    }

    return Date.now() >= new Date(event.startedAt).getTime() + event.timeLimit * 60 * 1000;
  }, [event]);

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

      <EventProgressCard
        eventName={event.name}
        status={event.status}
        currentQuestionIndex={event.currentQuestionIndex ?? 1}
        totalProblems={event.totalProblems ?? 0}
        totalElapsedSeconds={event.totalElapsedSeconds ?? 0}
        totalDurationSeconds={event.totalDurationSeconds ?? event.timeLimit * 60}
        problemTimeSpentSeconds={event.problemTimeSpentSeconds ?? 0}
        progressPercent={event.progressPercent ?? 0}
      />

      {eventExpired ? (
        <button type="button" className="secondary-button" onClick={() => navigate("/events", { replace: true })}>
          Back to Events
        </button>
      ) : null}

      <ProblemWorkspace
        isCoordinator={isCoordinator}
        event={event}
        answer={answer}
        onAnswerChange={setAnswer}
        onSubmitAnswer={handleSubmitAnswer}
        submissionResult={submissionResult}
        isSubmitting={isSubmitting}
      />

      <div className="event-layout">
        {isCoordinator ? (
          <CoordinatorEventControls
            eventId={event.id}
            eventStatus={event.status}
            isSubmitting={isSubmitting}
            onLifecycle={handleLifecycle}
            onAddProblem={handleAddProblem}
          />
        ) : null}

        <LeaderboardPanel
          participants={participants}
          showKick={isCoordinator}
          isSubmitting={isSubmitting}
          onKick={handleKickParticipant}
        />
      </div>
    </section>
  );
}
