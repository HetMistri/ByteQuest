import type { LeaderboardEntry } from "../lib/events";

type LeaderboardPanelProps = {
  entries: LeaderboardEntry[];
  showKick: boolean;
  isSubmitting: boolean;
  onKick?: (userId: string) => void;
};

export default function LeaderboardPanel({ entries, showKick, isSubmitting, onKick }: LeaderboardPanelProps) {
  return (
    <div className="event-column">
      <h3 className="section-title mini">Leaderboard</h3>
      {entries.length === 0 ? <p className="status-text">No participants joined yet.</p> : null}
      <ul className="menu-list">
        {entries.map((entry) => (
          <li key={entry.userId} className="menu-item participant-item">
            <span>
              #{entry.rank} {entry.displayName?.trim() || `${entry.userId.slice(0, 8)}...`} | Score: {entry.score} | Solved: {entry.solvedProblems}/{entry.totalProblems}
            </span>
            {showKick ? (
              <button
                type="button"
                className="secondary-button small"
                onClick={() => onKick?.(entry.userId)}
                disabled={isSubmitting}
              >
                Kick
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
