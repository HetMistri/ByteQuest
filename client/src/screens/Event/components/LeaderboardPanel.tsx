import type { ParticipantRecord } from "../../../lib/events";

type LeaderboardPanelProps = {
  participants: ParticipantRecord[];
  showKick: boolean;
  isSubmitting: boolean;
  onKick?: (userId: string) => void;
};

export default function LeaderboardPanel({ participants, showKick, isSubmitting, onKick }: LeaderboardPanelProps) {
  return (
    <div className="event-column">
      <h3 className="section-title mini">Leaderboard</h3>
      {participants.length === 0 ? <p className="status-text">No participants joined yet.</p> : null}
      <ul className="menu-list">
        {participants.map((participant) => (
          <li key={`${participant.eventId}-${participant.userId}`} className="menu-item participant-item">
            <span>
              {participant.displayName?.trim() || `${participant.userId.slice(0, 8)}...`} | Score: {participant.score}
            </span>
            {showKick ? (
              <button
                type="button"
                className="secondary-button small"
                onClick={() => onKick?.(participant.userId)}
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
