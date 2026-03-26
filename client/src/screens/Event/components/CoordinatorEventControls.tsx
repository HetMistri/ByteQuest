import { useState, type FormEvent } from "react";

type CoordinatorEventControlsProps = {
  eventId: string;
  eventStatus: string;
  isSubmitting: boolean;
  onLifecycle: (action: "start" | "pause" | "end") => Promise<void>;
  onAddProblem: (input: {
    title: string;
    description: string;
    solution: string;
    file: File | null;
  }) => Promise<void>;
};

export default function CoordinatorEventControls({
  eventId,
  eventStatus,
  isSubmitting,
  onLifecycle,
  onAddProblem,
}: CoordinatorEventControlsProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [solution, setSolution] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    await onAddProblem({ title, description, solution, file });
    setTitle("");
    setDescription("");
    setSolution("");
    setFile(null);
  };

  return (
    <>
      <div className="event-column">
        <h3 className="section-title mini">Event Controls</h3>
        <p className="status-text compact">Event ID: {eventId}</p>
        <div className="lifecycle-actions">
          <button type="button" className="secondary-button" onClick={() => onLifecycle("start")} disabled={isSubmitting}>
            {eventStatus === "paused" ? "Resume" : "Start"}
          </button>
          <button type="button" className="secondary-button" onClick={() => onLifecycle("pause")} disabled={isSubmitting}>
            Pause
          </button>
          <button type="button" className="secondary-button" onClick={() => onLifecycle("end")} disabled={isSubmitting}>
            End
          </button>
        </div>
      </div>

      <div className="event-column">
        <h3 className="section-title mini">Add Problem</h3>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="problemTitle">Problem Definition (Title)</label>
          <input
            id="problemTitle"
            type="text"
            value={title}
            onChange={(inputEvent) => setTitle(inputEvent.target.value)}
            required
          />

          <label htmlFor="problemDescription">Problem Definition (Statement)</label>
          <input
            id="problemDescription"
            type="text"
            value={description}
            onChange={(inputEvent) => setDescription(inputEvent.target.value)}
            required
          />

          <label htmlFor="problemSolution">Problem Solution</label>
          <input
            id="problemSolution"
            type="text"
            value={solution}
            onChange={(inputEvent) => setSolution(inputEvent.target.value)}
            required
          />

          <label htmlFor="problemFile">Downloadable Content (Supabase Bucket)</label>
          <input
            id="problemFile"
            type="file"
            onChange={(inputEvent) => setFile(inputEvent.target.files?.[0] ?? null)}
          />

          <button type="submit" className="primary-button" disabled={isSubmitting || eventStatus !== "scheduled"}>
            {isSubmitting ? "Adding..." : "Add Problem"}
          </button>
          {eventStatus !== "scheduled" ? (
            <p className="status-text compact">Problems can only be added while event is scheduled.</p>
          ) : null}
        </form>
      </div>
    </>
  );
}
