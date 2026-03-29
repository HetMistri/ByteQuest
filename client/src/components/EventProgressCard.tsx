type EventProgressCardProps = {
  eventName: string;
  status: string;
  currentQuestionIndex: number;
  totalProblems: number;
  totalElapsedSeconds: number;
  totalDurationSeconds: number;
  problemTimeSpentSeconds: number;
  progressPercent: number;
};

const formatDuration = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

export default function EventProgressCard({
  eventName,
  status,
  currentQuestionIndex,
  totalProblems,
  totalElapsedSeconds,
  totalDurationSeconds,
  problemTimeSpentSeconds,
  progressPercent,
}: EventProgressCardProps) {
  const safeTotalProblems = Math.max(totalProblems, 1);

  return (
    <div className="progress-card">
      {/* HEADER */}
      <div className="progress-header">
        <span className="progress-title">{eventName}</span>
        <span className={`progress-status status-${status}`}>
          {status.toUpperCase()}
        </span>
      </div>

      {/* TIMERS */}
      <div className="progress-timers">
        <span>
          ⏱ {formatDuration(totalElapsedSeconds)} /{" "}
          {formatDuration(totalDurationSeconds)}
        </span>
        <span>⏳ {formatDuration(problemTimeSpentSeconds)}</span>
      </div>

      {/* PROGRESS BAR */}
      <div className="progress-bar">
        <div
          className="progress-fill-bar"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* META */}
      <div className="progress-meta">
        <span>{progressPercent}%</span>
        <span>
          Q {currentQuestionIndex} / {safeTotalProblems}
        </span>
      </div>
    </div>
  );
}