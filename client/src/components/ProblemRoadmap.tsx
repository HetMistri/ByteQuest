type ProblemRoadmapProps = {
  totalProblems: number;
  currentQuestionIndex: number;
};

export default function ProblemRoadmap({
  totalProblems,
  currentQuestionIndex,
}: ProblemRoadmapProps) {
  const safeTotal = Math.max(totalProblems, 1);

  const steps = Array.from({ length: safeTotal }, (_, i) => i + 1);

  return (
    <div className="roadmap-bar" aria-label="Problem roadmap">
      {steps.map((step) => {
        const isCurrent = step === currentQuestionIndex;
        const isCompleted = step < currentQuestionIndex;

        return (
          <div
            key={step}
            className={`roadmap-cell 
              ${isCurrent ? "current" : ""} 
              ${isCompleted ? "done" : ""}`}
            aria-current={isCurrent ? "step" : undefined}
            title={`Problem ${step}`}
          >
            {step}
          </div>
        );
      })}
    </div>
  );
}