type CoordinatorEventControlsProps = {
  eventId: string;
  eventStatus: string;
  totalProblems: number;
  isSubmitting: boolean;
  onLifecycle: (action: "start" | "pause" | "end") => Promise<void>;
};

const MIN_PROBLEMS_TO_START = 1;

export default function CoordinatorEventControls({
  eventId,
  eventStatus,
  totalProblems,
  isSubmitting,
  onLifecycle,
}: CoordinatorEventControlsProps) {
  const canStart = totalProblems >= MIN_PROBLEMS_TO_START;

  const isRunning = eventStatus === "running";
  const isPaused = eventStatus === "paused";

  return (
    <div className="sidebar-block">
      {/* HEADER */}
      <div className="control-header">
        <span className="control-title">CTRL</span>
        <span className={`control-status status-${eventStatus}`}>
          {eventStatus.toUpperCase()}
        </span>
      </div>

      {/* META */}
      <div className="control-meta">
        <span>ID: {eventId.slice(0, 6)}</span>
        <span>
          {totalProblems}/{MIN_PROBLEMS_TO_START}
        </span>
      </div>

      {/* ICON ACTIONS */}
      <div className="control-actions-row">
        
        {/* START / RESUME */}
        <button
          className="control-icon start"
          onClick={() => onLifecycle("start")}
          disabled={isSubmitting || (!canStart && !isPaused)}
          title={isPaused ? "Resume Event" : "Start Event"}
        >
          ▶
        </button>

        {/* PAUSE */}
        <button
          className="control-icon pause"
          onClick={() => onLifecycle("pause")}
          disabled={isSubmitting || !isRunning}
          title="Pause Event"
        >
          ❚❚
        </button>

        {/* END */}
        <button
          className="control-icon end"
          onClick={() => onLifecycle("end")}
          disabled={isSubmitting}
          title="End Event"
        >
          ■
        </button>
      </div>
    </div>
  );
}