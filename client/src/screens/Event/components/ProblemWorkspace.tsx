import type { FormEvent } from "react";
import type { EventDetails, SubmissionResult } from "../../../lib/events";

type ProblemWorkspaceProps = {
  isCoordinator: boolean;
  event: EventDetails;
  answer: string;
  onAnswerChange: (value: string) => void;
  onSubmitAnswer: (event: FormEvent<HTMLFormElement>) => void;
  submissionResult: SubmissionResult | null;
  isSubmitting: boolean;
};

export default function ProblemWorkspace({
  isCoordinator,
  event,
  answer,
  onAnswerChange,
  onSubmitAnswer,
  submissionResult,
  isSubmitting,
}: ProblemWorkspaceProps) {
  if (!event.currentProblem) {
    return (
      <div className="event-create-panel">
        <h3 className="section-title mini">Problem</h3>
        <p className="status-text compact">No unlocked problem yet.</p>
      </div>
    );
  }

  return (
    <div className="event-create-panel">
      <h3 className="section-title mini">
        Problem {event.currentProblem.orderIndex}: {event.currentProblem.title}
      </h3>
      <p className="status-text compact">{event.currentProblem.description}</p>

      {event.currentProblem.resourceFile ? (
        <a href={event.currentProblem.resourceFile} target="_blank" rel="noreferrer" className="secondary-button inline-link-button">
          Downloadable Content
        </a>
      ) : null}

      {!isCoordinator ? (
        <form className="auth-form" onSubmit={onSubmitAnswer}>
          <label htmlFor="problemAnswer">Submit Answer</label>
          <input
            id="problemAnswer"
            type="text"
            value={answer}
            onChange={(inputEvent) => onAnswerChange(inputEvent.target.value)}
            placeholder="Enter answer"
            required
          />
          <button type="submit" className="primary-button" disabled={isSubmitting || event.status !== "running"}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
          {event.status !== "running" ? <p className="status-text compact">Submissions are enabled when event is running.</p> : null}
        </form>
      ) : null}

      {submissionResult ? (
        <p className={submissionResult.isCorrect ? "success-text" : "error-text"}>{submissionResult.message}</p>
      ) : null}
    </div>
  );
}
