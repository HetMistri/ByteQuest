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
    <section className="menu-panel">
      <h2 className="section-title">Results</h2>
      <div className="section-divider" />
      <p className="status-text">Event: {results.eventName}</p>
      <p className="status-text">Status: {results.status}</p>
      <p className="status-text">Your Total Time Spent: {formatDuration(results.totalTimeSpentSeconds)}</p>
      <p className="status-text">Event Elapsed: {formatDuration(results.totalElapsedSeconds)}</p>
      <p className="status-text">Time Remaining: {formatDuration(results.timeRemainingSeconds)}</p>

      <div className="event-create-panel">
        <h3 className="section-title mini">Podium</h3>
        {podium.length === 0 ? <p className="status-text">Leaderboard is not available.</p> : null}
        <ul className="menu-list">
          {podium.map((entry) => (
            <li key={entry.userId} className="menu-item">
              {entry.rank} place: {entry.displayName?.trim() || `${entry.userId.slice(0, 8)}...`} | Score: {entry.score}
            </li>
          ))}
        </ul>
      </div>

      <div className="event-create-panel">
        <h3 className="section-title mini">Personal History</h3>
        <ul className="menu-list">
          {results.history.map((item) => (
            <li key={item.problemId} className="menu-item">
              #{item.orderIndex} {item.title} | Attempts: {item.attempts} | Time spent: {formatDuration(item.timeSpentSeconds)} | Time to solve: {formatDuration(item.timeToSolveSeconds)}
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        className="secondary-button"
        onClick={() => {
          clearCompletedEventId();
          clearActiveEventId();
          navigate("/events", { replace: true });
        }}
      >
        Back to Events
      </button>
    </section>
  );
}
