import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearActiveEventId,
  clearCompletedEventId,
  getActiveEventId,
  getCompletedEventId,
} from "../../lib/event-session";
import {
  getLeaderboard,
  getEventDetails,
  type LeaderboardEntry,
  type EventDetails,
} from "../../lib/events";


type CoordinatorResultPageProps = {
  accessToken: string;
};

export default function CoordinatorResultPage({ accessToken }: CoordinatorResultPageProps) {
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [podium, setPodium] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const targetEventId = getCompletedEventId() ?? getActiveEventId();
    if (!targetEventId) {
      navigate("/events", { replace: true });
      return;
    }

    const loadResults = async () => {
      try {
        const [eventDetails, leaderboard] = await Promise.all([
          getEventDetails(accessToken, targetEventId),
          getLeaderboard(accessToken, targetEventId),
        ]);
        setEvent(eventDetails);
        setPodium(leaderboard.slice(0, 3));
      } catch {
        setError("Could not load event results.");
      }
    };

    loadResults();
  }, [accessToken, navigate]);

  if (error) {
    return <p className="error-text">{error}</p>;
  }

  if (!event) {
    return <p className="status-text">Loading results...</p>;
  }

  return (
    <section className="menu-panel results-screen">
      <div className="results-container">
        <h2 className="section-title">EVENT SUMMARY (COORDINATOR)</h2>
        <p className="status-text">You are viewing the event summary as a coordinator. No personal stats are shown.</p>

        {/* ===== PODIUM ===== */}
        <div className="results-block">
          <h3 className="section-title mini">[ PODIUM ]</h3>
          {podium.length === 0 ? (
            <p className="status-text">No leaderboard data.</p>
          ) : (
            <div className="leaderboard">
              {podium.map((entry) => (
                <div
                  key={entry.userId}
                  className={`leaderboard-row rank-${entry.rank}`}
                >
                  <span>#{entry.rank}</span>
                  <span>
                    {entry.displayName?.trim() || `${entry.userId.slice(0, 8)}...`}
                  </span>
                  <span>{entry.score}</span>
                  <span>★</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== SUMMARY ===== */}
        <div className="results-block">
          <h3 className="section-title mini">[ SUMMARY ]</h3>
          <p className="results-line">
            <span className="results-label">&gt; event:</span>
            <span>{event.name}</span>
          </p>
          <p className="results-line">
            <span className="results-label">&gt; status:</span>
            <span>[{event.status}]</span>
          </p>
          <p className="results-line">
            <span className="results-label">&gt; time_limit:</span>
            <span>{event.timeLimit} min</span>
          </p>
          <p className="results-line">
            <span className="results-label">&gt; started:</span>
            <span>{event.startedAt ? new Date(event.startedAt).toLocaleString() : "--"}</span>
          </p>
          <p className="results-line">
            <span className="results-label">&gt; created:</span>
            <span>{new Date(event.createdAt).toLocaleString()}</span>
          </p>
        </div>

        {/* ===== ACTION ===== */}
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            clearCompletedEventId();
            clearActiveEventId();
            navigate("/events", { replace: true });
          }}
        >
          EXIT
        </button>
      </div>
    </section>
  );
}
