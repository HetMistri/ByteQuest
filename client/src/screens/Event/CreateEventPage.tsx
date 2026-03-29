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

type Props = {
  accessToken: string;
};

const PROBLEM_BUCKET =
  import.meta.env.VITE_SUPABASE_PROBLEM_BUCKET || "problem-assets";

const MIN_PROBLEMS_TO_START = 5;

type ProblemDraft = {
  title: string;
  description: string;
  solution: string;
  file: File | null;
  existingFileUrl?: string | null;
  orderIndex?: number;
};

export default function CreateEventPage({ accessToken }: Props) {
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
    existingFileUrl: null,
  });

  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  /* ================= FILE UPLOAD ================= */

  const uploadProblemFile = async (
    eventId: string,
    file: File | null
  ): Promise<string | undefined> => {
    if (!file) return undefined;

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${eventId}/${Date.now()}-${safeName}`;

      const { error } = await supabase.storage
        .from(PROBLEM_BUCKET)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined,
        });

      if (error) {
        console.error("UPLOAD ERROR:", error);
        throw new Error(error.message);
      }

      const { data } = supabase.storage
        .from(PROBLEM_BUCKET)
        .getPublicUrl(path);

      return data.publicUrl;
    } catch (err) {
      console.error("UPLOAD FAILED:", err);
      throw err;
    }
  };

  const refreshProblems = async (eventId: string) => {
    const data = await listProblems(accessToken, eventId);
    setProblems(data);
  };

  /* ================= EVENT ================= */

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const created = await createEvent(accessToken, eventInput);
      setEventId(created.id);
      await refreshProblems(created.id);
      setSuccess("Event created. Now configure problems.");
    } catch (err) {
      console.error(err);
      setError("Could not create event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ================= PROBLEM ================= */

  const handleSaveProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const fileUrl =
        problemDraft.file
          ? await uploadProblemFile(eventId, problemDraft.file)
          : problemDraft.existingFileUrl ?? null;

      const payload = {
        title: problemDraft.title,
        description: problemDraft.description,
        solution: problemDraft.solution,
        downloadableContentUrl: fileUrl,
        orderIndex: problemDraft.orderIndex,
      };

      if (editingProblemId) {
        await updateProblem(
          accessToken,
          eventId,
          editingProblemId,
          payload
        );
      } else {
        await addProblem(accessToken, eventId, payload);
      }

      setProblemDraft({
        title: "",
        description: "",
        solution: "",
        file: null,
        existingFileUrl: null,
      });

      setEditingProblemId(null);
      await refreshProblems(eventId);
      setSuccess("Problem saved.");
    } catch (err) {
      console.error("SAVE ERROR:", err);
      setError("Failed to save problem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (p: ProblemRecord) => {
    setEditingProblemId(p.id);
    setProblemDraft({
      title: p.title,
      description: p.description,
      solution: "",
      file: null,
      existingFileUrl: p.resourceFile || null,
      orderIndex: p.orderIndex,
    });
  };

  /* ================= UI ================= */

  return (
    <section className="menu-panel">
      <h2 className="section-title">Create Event</h2>
      <div className="section-divider" />

      {error && <p className="error-text">{error}</p>}
      {success && <p className="success-text">{success}</p>}

      {/* EVENT SETUP */}
      <div className="create-block">
        <h3 className="section-title mini">[1] Event Setup</h3>

        <form onSubmit={handleCreateEvent} className="create-form">
          <input
            className="form-input"
            placeholder="> event_name"
            value={eventInput.name}
            onChange={(e) =>
              setEventInput((p) => ({ ...p, name: e.target.value }))
            }
            disabled={!!eventId}
          />

          <input
            type="number"
            className="form-input"
            value={eventInput.timeLimit}
            onChange={(e) =>
              setEventInput((p) => ({
                ...p,
                timeLimit: Number(e.target.value),
              }))
            }
            disabled={!!eventId}
          />

          <input
            className="form-input"
            placeholder="> optional_password"
            value={eventInput.password ?? ""}
            onChange={(e) =>
              setEventInput((p) => ({ ...p, password: e.target.value }))
            }
            disabled={!!eventId}
          />

          <button
            className="primary-button"
            disabled={isSubmitting || !!eventId}
          >
            {eventId ? "Created" : "Create Event"}
          </button>
        </form>
      </div>

      {/* PROBLEM WORKSPACE */}
      <div className="create-block">
        <h3 className="section-title mini">[2] Problem Workspace</h3>

        {!eventId && (
          <p className="status-text compact">Create event first.</p>
        )}

        {eventId && (
          <div className="problem-workspace">
            {/* EDITOR */}
            <form onSubmit={handleSaveProblem} className="create-form">
              <input
                className="form-input"
                placeholder="> problem_title"
                value={problemDraft.title}
                onChange={(e) =>
                  setProblemDraft((p) => ({
                    ...p,
                    title: e.target.value,
                  }))
                }
              />

              <input
                className="form-input"
                placeholder="> problem_description"
                value={problemDraft.description}
                onChange={(e) =>
                  setProblemDraft((p) => ({
                    ...p,
                    description: e.target.value,
                  }))
                }
              />

              <input
                className="form-input"
                placeholder="> solution"
                value={problemDraft.solution}
                onChange={(e) =>
                  setProblemDraft((p) => ({
                    ...p,
                    solution: e.target.value,
                  }))
                }
              />

              <input
                type="number"
                className="form-input"
                placeholder="> order_index"
                value={problemDraft.orderIndex ?? ""}
                onChange={(e) =>
                  setProblemDraft((p) => ({
                    ...p,
                    orderIndex: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
              />

              {/* FILE INPUT */}
              <input
                type="file"
                id="problemFileInput"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setProblemDraft((p) => ({
                    ...p,
                    file,
                    existingFileUrl: null,
                  }));
                  e.target.value = "";
                }}
              />

              {/* FILE UI */}
              {!problemDraft.file && !problemDraft.existingFileUrl && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    document.getElementById("problemFileInput")?.click()
                  }
                >
                  + Add Asset
                </button>
              )}

              {problemDraft.file && (
                <div className="file-chip">
                  <span>{problemDraft.file.name}</span>
                  <button
                    type="button"
                    className="file-remove"
                    onClick={() =>
                      setProblemDraft((p) => ({ ...p, file: null }))
                    }
                  >
                    ✕
                  </button>
                </div>
              )}

              {!problemDraft.file && problemDraft.existingFileUrl && (
                <div className="file-chip">
                  <span>Existing File</span>
                  <button
                    type="button"
                    className="file-remove"
                    onClick={() =>
                      setProblemDraft((p) => ({
                        ...p,
                        existingFileUrl: null,
                      }))
                    }
                  >
                    ✕
                  </button>
                </div>
              )}

              <button className="primary-button" disabled={isSubmitting}>
                {editingProblemId ? "Update Problem" : "Add Problem"}
              </button>
            </form>

            {/* LIST */}
            <div className="problem-list">
              {problems.map((p) => (
                <div key={p.id} className="problem-item">
                  <span>
                    #{p.orderIndex} {p.title}
                  </span>
                  <button
                    className="secondary-button small"
                    onClick={() => startEditing(p)}
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {eventId && (
          <>
            <p className="status-text">
              Min required: {MIN_PROBLEMS_TO_START} ({problems.length})
            </p>

            <button
              className="secondary-button"
              disabled={problems.length < MIN_PROBLEMS_TO_START}
              onClick={() => navigate("/events")}
            >
              Done
            </button>
          </>
        )}
      </div>
    </section>
  );
}