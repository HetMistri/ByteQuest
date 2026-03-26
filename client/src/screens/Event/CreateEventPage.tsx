import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  addProblem,
  createEvent,
  listProblems,
  updateProblem,
  type CreateEventInput,
  type ProblemRecord,
} from "../../lib/events";

type CreateEventPageProps = {
  accessToken: string;
};

const PROBLEM_BUCKET = import.meta.env.VITE_SUPABASE_PROBLEM_BUCKET || "problem-assets";
const MIN_PROBLEMS_TO_START = 5;

type ProblemDraft = {
  title: string;
  description: string;
  solution: string;
  file: File | null;
  orderIndex?: number;
};

export default function CreateEventPage({ accessToken }: CreateEventPageProps) {
  const [eventInput, setEventInput] = useState<CreateEventInput>({
    name: "",
    timeLimit: 60,
    password: "",
  });
  const [eventId, setEventId] = useState<string | null>(null);
  const [problems, setProblems] = useState<ProblemRecord[]>([]);
  const [problemDraft, setProblemDraft] = useState<ProblemDraft>({
    title: "",
    description: "",
    solution: "",
    file: null,
  });
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const uploadProblemFile = async (currentEventId: string, file: File | null): Promise<string | undefined> => {
    if (!file) {
      return undefined;
    }

    const normalizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const filePath = `${currentEventId}/${Date.now()}-${normalizedFileName}`;

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

  const refreshProblems = async (currentEventId: string) => {
    const fetched = await listProblems(accessToken, currentEventId);
    setProblems(fetched);
  };

  const handleCreateEvent = async (submitEvent: React.FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const created = await createEvent(accessToken, {
        name: eventInput.name,
        timeLimit: Number(eventInput.timeLimit),
        password: eventInput.password?.trim() || undefined,
      });
      setEventId(created.id);
      setSuccess("Event created. Add and edit problems before starting.");
      await refreshProblems(created.id);
    } catch {
      setError("Could not create event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddOrUpdateProblem = async (submitEvent: React.FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    if (!eventId) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const downloadableContentUrl = await uploadProblemFile(eventId, problemDraft.file);

      if (!editingProblemId) {
        await addProblem(accessToken, eventId, {
          title: problemDraft.title,
          description: problemDraft.description,
          solution: problemDraft.solution,
          downloadableContentUrl,
          orderIndex: problemDraft.orderIndex,
        });
        setSuccess("Problem added.");
      } else {
        await updateProblem(accessToken, eventId, editingProblemId, {
          title: problemDraft.title,
          description: problemDraft.description,
          solution: problemDraft.solution,
          downloadableContentUrl,
          orderIndex: problemDraft.orderIndex,
        });
        setSuccess("Problem updated.");
      }

      setProblemDraft({ title: "", description: "", solution: "", file: null });
      setEditingProblemId(null);
      await refreshProblems(eventId);
    } catch {
      setError("Could not save problem. Ensure event is still scheduled.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (problem: ProblemRecord) => {
    setEditingProblemId(problem.id);
    setProblemDraft({
      title: problem.title,
      description: problem.description,
      solution: "",
      file: null,
      orderIndex: problem.orderIndex,
    });
  };

  return (
    <section className="menu-panel">
      <h2 className="section-title">Create Event</h2>
      <div className="section-divider" />

      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p className="success-text">{success}</p> : null}

      <div className="event-layout">
        <div className="event-column">
          <h3 className="section-title mini">Event Setup</h3>
          <form className="auth-form" onSubmit={handleCreateEvent}>
            <label htmlFor="eventName">Event Name</label>
            <input
              id="eventName"
              type="text"
              value={eventInput.name}
              onChange={(inputEvent) => setEventInput((previous) => ({ ...previous, name: inputEvent.target.value }))}
              required
            />

            <label htmlFor="eventTimeLimit">Time Limit (minutes)</label>
            <input
              id="eventTimeLimit"
              type="number"
              min={1}
              value={eventInput.timeLimit}
              onChange={(inputEvent) =>
                setEventInput((previous) => ({
                  ...previous,
                  timeLimit: Number(inputEvent.target.value),
                }))
              }
              required
            />

            <label htmlFor="eventPassword">Password (optional)</label>
            <input
              id="eventPassword"
              type="text"
              value={eventInput.password ?? ""}
              onChange={(inputEvent) => setEventInput((previous) => ({ ...previous, password: inputEvent.target.value }))}
            />

            <button type="submit" className="primary-button" disabled={isSubmitting || Boolean(eventId)}>
              {isSubmitting ? "Creating..." : eventId ? "Created" : "Create Event"}
            </button>
          </form>
        </div>

        <div className="event-column">
          <h3 className="section-title mini">Problems</h3>
          {!eventId ? <p className="status-text">Create event first.</p> : null}

          {eventId ? (
            <>
              <form className="auth-form" onSubmit={handleAddOrUpdateProblem}>
                <label htmlFor="problemTitle">Title</label>
                <input
                  id="problemTitle"
                  type="text"
                  value={problemDraft.title}
                  onChange={(inputEvent) => setProblemDraft((previous) => ({ ...previous, title: inputEvent.target.value }))}
                  required
                />

                <label htmlFor="problemDescription">Definition</label>
                <input
                  id="problemDescription"
                  type="text"
                  value={problemDraft.description}
                  onChange={(inputEvent) =>
                    setProblemDraft((previous) => ({
                      ...previous,
                      description: inputEvent.target.value,
                    }))
                  }
                  required
                />

                <label htmlFor="problemSolution">Solution</label>
                <input
                  id="problemSolution"
                  type="text"
                  value={problemDraft.solution}
                  onChange={(inputEvent) => setProblemDraft((previous) => ({ ...previous, solution: inputEvent.target.value }))}
                  required={!editingProblemId}
                />

                <label htmlFor="problemOrderIndex">Order Index (optional)</label>
                <input
                  id="problemOrderIndex"
                  type="number"
                  min={1}
                  value={problemDraft.orderIndex ?? ""}
                  onChange={(inputEvent) =>
                    setProblemDraft((previous) => ({
                      ...previous,
                      orderIndex: inputEvent.target.value ? Number(inputEvent.target.value) : undefined,
                    }))
                  }
                />

                <label htmlFor="problemFile">Downloadable Content (Supabase Bucket)</label>
                <input
                  id="problemFile"
                  type="file"
                  onChange={(inputEvent) =>
                    setProblemDraft((previous) => ({
                      ...previous,
                      file: inputEvent.target.files?.[0] ?? null,
                    }))
                  }
                />

                <button type="submit" className="primary-button" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : editingProblemId ? "Update Problem" : "Add Problem"}
                </button>
              </form>

              <ul className="menu-list">
                {problems.map((problem) => (
                  <li key={problem.id} className="menu-item participant-item">
                    <span>
                      #{problem.orderIndex} {problem.title}
                    </span>
                    <button type="button" className="secondary-button small" onClick={() => startEditing(problem)}>
                      Edit
                    </button>
                  </li>
                ))}
              </ul>

              <p className="status-text">
                Minimum required to start: {MIN_PROBLEMS_TO_START} problems ({problems.length} currently added).
              </p>

              <button
                type="button"
                className="secondary-button"
                onClick={() => navigate("/events")}
                disabled={problems.length < MIN_PROBLEMS_TO_START}
              >
                Done - Go to Events and Join/Start
              </button>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
