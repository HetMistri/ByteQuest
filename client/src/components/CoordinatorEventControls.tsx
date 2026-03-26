type CoordinatorEventControlsProps = {
  eventId: string;
  eventStatus: string;
  totalProblems: number;
  isSubmitting: boolean;
  onLifecycle: (action: "start" | "pause" | "end") => Promise<void>;
};

const MIN_PROBLEMS_TO_START = 5;

export default function CoordinatorEventControls({
  eventId,
  eventStatus,
  totalProblems,
  isSubmitting,
  onLifecycle,
}: CoordinatorEventControlsProps) {
  const canStart = totalProblems >= MIN_PROBLEMS_TO_START;

  return (
    <div className="event-column">
      <h3 className="section-title mini">Event Controls</h3>
      <p className="status-text compact">Event ID: {eventId}</p>
      <p className="status-text compact">Problems are editable only in Create Event while status is scheduled.</p>
      <p className="status-text compact">Problems added: {totalProblems} / {MIN_PROBLEMS_TO_START} minimum to start.</p>
      <div className="lifecycle-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={() => onLifecycle("start")}
          disabled={isSubmitting || !canStart}
        >
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
  );
}
