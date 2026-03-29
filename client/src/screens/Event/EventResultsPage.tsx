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
  getPersonalResults,
  type LeaderboardEntry,
  type PersonalResultsResponse,
} from "../../lib/events";

type EventResultsPageProps = {
  accessToken: string;
};

const formatDuration = (totalSeconds: number | null): string => {
  if (totalSeconds === null) {
    return "--";
  }

  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (safe % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

export default function EventResultsPage({ accessToken }: EventResultsPageProps) {
  const [results, setResults] = useState<PersonalResultsResponse | null>(null);
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
        const [response, leaderboard] = await Promise.all([
          getPersonalResults(accessToken, targetEventId),
          getLeaderboard(accessToken, targetEventId),
        ]);

        setResults(response);
        setPodium(leaderboard.slice(0, 3));
      } catch {
        setError("Could not load personal results.");
      }
    };

    loadResults();
  }, [accessToken, navigate]);

  if (error) {
    return <p className="error-text">{error}</p>;
  }

  if (!results) {
    return <p className="status-text">Loading results...</p>;
  }

  return (
    <section className="menu-panel results-screen">
      <div className="results-container">
        <h2 className="section-title">RESULTS</h2>


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
                    {entry.displayName?.trim() ||
                      `${entry.userId.slice(0, 8)}...`}
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
            <span>{results.eventName}</span>
          </p>

          <p className="results-line">
            <span className="results-label">&gt; status:</span>
            <span>[{results.status}]</span>
          </p>

          <p className="results-line">
            <span className="results-label">&gt; your_time:</span>
            <span>{formatDuration(results.totalTimeSpentSeconds)}</span>
          </p>

          <p className="results-line">
            <span className="results-label">&gt; elapsed:</span>
            <span>{formatDuration(results.totalElapsedSeconds)}</span>
          </p>

          <p className="results-line">
            <span className="results-label">&gt; remaining:</span>
            <span>{formatDuration(results.timeRemainingSeconds)}</span>
          </p>
        </div>

        {/* ===== HISTORY ===== */}
        <div className="results-block">
          <h3 className="section-title mini">[ HISTORY ]</h3>

          <div className="results-history">
            {results.history.map((item) => (
              <div key={item.problemId} className="history-row">
                <div className="history-main">
                  <span>
                    #{item.orderIndex} {item.title}
                  </span>
                </div>

                <div className="history-meta">
                  <span>Attempts: {item.attempts}</span>
                  <span>Time: {formatDuration(item.timeSpentSeconds)}</span>
                  <span>Solve: {formatDuration(item.timeToSolveSeconds)}</span>
                </div>
              </div>
            ))}
          </div>
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
