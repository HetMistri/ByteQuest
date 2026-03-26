type CoordinatorEventControlsProps = {
  eventId: string;
  eventStatus: string;
  isSubmitting: boolean;
  onLifecycle: (action: "start" | "pause" | "end") => Promise<void>;
};

export default function CoordinatorEventControls({
  eventId,
  eventStatus,
  isSubmitting,
  onLifecycle,
}: CoordinatorEventControlsProps) {
  return (
    <div className="event-column">
      <h3 className="section-title mini">Event Controls</h3>
      <p className="status-text compact">Event ID: {eventId}</p>
      <p className="status-text compact">Problems are editable only in Create Event while status is scheduled.</p>
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
  );
}
