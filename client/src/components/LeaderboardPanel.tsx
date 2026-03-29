import type { LeaderboardEntry } from "../lib/events";

type LeaderboardPanelProps = {
  entries: LeaderboardEntry[];
  showKick: boolean;
  isSubmitting: boolean;
  onKick?: (userId: string) => void;
};

export default function LeaderboardPanel({ entries, showKick, isSubmitting, onKick }: LeaderboardPanelProps) {
  return (
    <div className="leaderboard">
      <h3 className="section-title mini">Leaderboard</h3>

      {entries.map((entry, index) => (
        <div
          key={entry.userId}
          className={`leaderboard-row rank-${index + 1}`}
        >
          <span className="rank">#{entry.rank}</span>

          <span className="name">
            {entry.displayName || entry.userId.slice(0, 6)}
          </span>

          <span className="score">{entry.score}</span>

          {showKick && (
            <button
              className="kick-btn text-center"
              onClick={() => onKick?.(entry.userId)}
              disabled={isSubmitting}
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
