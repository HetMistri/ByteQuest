type ProblemRoadmapProps = {
  totalProblems: number;
  currentQuestionIndex: number;
};

export default function ProblemRoadmap({ totalProblems, currentQuestionIndex }: ProblemRoadmapProps) {
  const steps = Array.from({ length: Math.max(totalProblems, 1) }, (_, index) => index + 1);

  return (
    <div className="roadmap-wrap" aria-label="Problem roadmap">
      {steps.map((step, index) => {
        const isCurrent = step === currentQuestionIndex;
        const isCompleted = step < currentQuestionIndex;

        return (
          <div key={step} className="roadmap-node-group">
            <div
              className={`roadmap-node ${isCurrent ? "current" : ""} ${isCompleted ? "done" : ""}`}
              aria-current={isCurrent ? "step" : undefined}
            >
              {step}
            </div>
            {index < steps.length - 1 ? <div className="roadmap-link" /> : null}
          </div>
        );
      })}
    </div>
  );
}
