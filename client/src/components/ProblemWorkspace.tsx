import type { FormEvent } from "react";
import type {
  EventDetails,
  SubmissionResult,
  ProblemRecord,
} from "../lib/events";

type ProblemWorkspaceProps = {
  isCoordinator: boolean;
  event: EventDetails | null; // ✅ allow null
  problems?: ProblemRecord[];
  answer: string;
  onAnswerChange: (value: string) => void;
  onSubmitAnswer: (event: FormEvent<HTMLFormElement>) => void;
  submissionResult: SubmissionResult | null;
  isSubmitting: boolean;
};

export default function ProblemWorkspace({
  isCoordinator,
  event,
  problems = [],
  answer,
  onAnswerChange,
  onSubmitAnswer,
  submissionResult,
  isSubmitting,
}: ProblemWorkspaceProps) {
  /* ================= SAFETY GUARD ================= */

  if (!event) {
    return (
      <div className="event-create-panel">
        <p className="status-text">Loading problem...</p>
      </div>
    );
  }

  /* ================= COORDINATOR VIEW ================= */

  if (isCoordinator) {
    return (
      <div className="event-create-panel">
        <h3 className="section-title mini">All Problems</h3>

        {problems.length === 0 ? (
          <p className="status-text compact">No problems added.</p>
        ) : (
          <div className="problem-list">
            {problems.map((problem) => (
              <div key={problem.id} className="problem-item">
                <div className="problem-info">
                  <span>
                    #{problem.orderIndex} {problem.title}
                  </span>

                  <p className="problem-desc">
                    {problem.description}
                  </p>

                  {problem.resourceFile && (
                    <span className="resource-indicator">
                      📎 resource attached
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ================= PARTICIPANT VIEW ================= */

  if (!event.currentProblem) {
    return (
      <div className="event-create-panel">
        <h3 className="section-title mini">Problem</h3>
        <p className="status-text compact">No unlocked problem yet.</p>
      </div>
    );
  }

  const problem = event.currentProblem;

  return (
    <div className="event-create-panel problem-workspace">
      <h3 className="section-title mini">
        #{problem.orderIndex} {problem.title}
      </h3>

      <p className="problem-desc">{problem.description}</p>

      {/* ===== RESOURCE ===== */}
      {problem.resourceFile && (
        <div className="problem-resource">
          <span className="resource-indicator">
            📎 resource attached
          </span>

          <a
            href={problem.resourceFile}
            target="_blank"
            rel="noreferrer"
            download
            className="secondary-button resource-button"
          >
            ⬇ DOWNLOAD
          </a>
        </div>
      )}

      {/* ===== ANSWER FORM ===== */}
      <form className="auth-form" onSubmit={onSubmitAnswer}>
        <label htmlFor="problemAnswer">&gt; submit_answer</label>

        <input
          id="problemAnswer"
          type="text"
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="enter answer"
          required
        />

        <button
          type="submit"
          className="primary-button"
          disabled={isSubmitting || event.status !== "running"}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>

        {event.status !== "running" && (
          <p className="status-text compact">
            submissions locked
          </p>
        )}
      </form>

      {submissionResult && (
        <p
          className={
            submissionResult.isCorrect
              ? "success-text"
              : "error-text"
          }
        >
          {submissionResult.message}
        </p>
      )}
    </div>
  );
}