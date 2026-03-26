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
  return (
    <div className="room-panel">
      <p className="status-text room-text">Event: {eventName}</p>
      <p className="status-text room-text">Status: {status}</p>
      <p className="status-text room-text">
        Total Timer: {formatDuration(totalElapsedSeconds)} / {formatDuration(totalDurationSeconds)}
      </p>
      <p className="status-text room-text">Problem Time Spent: {formatDuration(problemTimeSpentSeconds)}</p>

      <div className="progress-wrap" aria-label="Progress">
        <div className="progress-meta">
          <span>Progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="status-text compact">
          Problem {currentQuestionIndex} / {Math.max(totalProblems, 1)}
        </p>
      </div>
    </div>
  );
}
