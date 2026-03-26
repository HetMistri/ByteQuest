const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export type EventStatus = "scheduled" | "running" | "paused" | "ended";

export type EventSummary = {
  id: string;
  name: string;
  status: EventStatus;
  timeLimit: number;
  createdBy: string;
  startedAt: string | null;
  createdAt: string;
};

export type ProblemRecord = {
  id: string;
  eventId: string;
  title: string;
  description: string;
  resourceFile?: string | null;
  orderIndex: number;
  createdAt: string;
};

export type EventDetails = EventSummary & {
  totalProblems?: number;
  currentQuestionIndex?: number;
  totalDurationSeconds?: number;
  totalElapsedSeconds?: number;
  timeRemainingSeconds?: number;
  problemTimeSpentSeconds?: number;
  userTotalTimeSpentSeconds?: number;
  progressPercent?: number;
  currentProblem?: ProblemRecord | null;
  canSubmit?: boolean;
};

export type ParticipantRecord = {
  userId: string;
  displayName?: string | null;
  eventId: string;
  currentQuestion: number;
  score: number;
  flags: number;
  joinedAt: string;
};

export type CreateEventInput = {
  name: string;
  timeLimit: number;
  password?: string;
};

export type JoinEventInput = {
  password?: string;
};

export type CreateProblemInput = {
  title: string;
  description: string;
  solution: string;
  downloadableContentUrl?: string;
  orderIndex?: number;
};

export type UpdateProblemInput = {
  title?: string;
  description?: string;
  solution?: string;
  downloadableContentUrl?: string;
  orderIndex?: number;
};

export type SubmissionResult = {
  success: boolean;
  isCorrect: boolean;
  isFirstCorrect: boolean;
  attemptCount: number;
  message: string;
  nextQuestionIndex?: number;
  completed?: boolean;
};

export type PersonalResultItem = {
  problemId: string;
  orderIndex: number;
  title: string;
  attempts: number;
  solved: boolean;
  firstSolvedAt: string | null;
  timeSpentSeconds: number | null;
  timeToSolveSeconds: number | null;
};

export type PersonalResultsResponse = {
  eventId: string;
  eventName: string;
  status: EventStatus;
  startedAt: string | null;
  totalTimeSpentSeconds: number;
  totalElapsedSeconds: number;
  timeRemainingSeconds: number;
  history: PersonalResultItem[];
};

const jsonHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export async function listScheduledEvents(token: string): Promise<EventSummary[]> {
  const response = await fetch(`${API_URL}/events`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load scheduled events");
  }

  return (await response.json()) as EventSummary[];
}

export async function getEventDetails(token: string, eventId: string): Promise<EventDetails> {
  const response = await fetch(`${API_URL}/events/${eventId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load event details");
  }

  return (await response.json()) as EventDetails;
}

export async function createEvent(token: string, input: CreateEventInput): Promise<EventSummary> {
  const response = await fetch(`${API_URL}/events`, {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Failed to create event");
  }

  return (await response.json()) as EventSummary;
}

export async function joinEvent(
  token: string,
  eventId: string,
  input: JoinEventInput,
): Promise<ParticipantRecord> {
  const response = await fetch(`${API_URL}/events/${eventId}/join`, {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Failed to join event");
  }

  return (await response.json()) as ParticipantRecord;
}

export async function listParticipants(token: string, eventId: string): Promise<ParticipantRecord[]> {
  const response = await fetch(`${API_URL}/events/${eventId}/participants`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load participants");
  }

  return (await response.json()) as ParticipantRecord[];
}

export async function kickParticipant(token: string, eventId: string, userId: string): Promise<void> {
  const response = await fetch(`${API_URL}/events/${eventId}/kick/${userId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to kick participant");
  }
}

export async function addProblem(
  token: string,
  eventId: string,
  input: CreateProblemInput,
): Promise<ProblemRecord> {
  const response = await fetch(`${API_URL}/events/${eventId}/problems`, {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Failed to add problem");
  }

  return (await response.json()) as ProblemRecord;
}

export async function listProblems(token: string, eventId: string): Promise<ProblemRecord[]> {
  const response = await fetch(`${API_URL}/events/${eventId}/problems`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load problems");
  }

  return (await response.json()) as ProblemRecord[];
}

export async function updateProblem(
  token: string,
  eventId: string,
  problemId: string,
  input: UpdateProblemInput,
): Promise<ProblemRecord> {
  const response = await fetch(`${API_URL}/events/${eventId}/problems/${problemId}`, {
    method: "PATCH",
    headers: jsonHeaders(token),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Failed to update problem");
  }

  return (await response.json()) as ProblemRecord;
}

export async function submitAnswer(
  token: string,
  eventId: string,
  answer: string,
): Promise<SubmissionResult> {
  const response = await fetch(`${API_URL}/events/${eventId}/submit`, {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify({ answer }),
  });

  if (!response.ok) {
    throw new Error("Failed to submit answer");
  }

  return (await response.json()) as SubmissionResult;
}

export async function getPersonalResults(token: string, eventId: string): Promise<PersonalResultsResponse> {
  const response = await fetch(`${API_URL}/events/${eventId}/results/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load personal results");
  }

  return (await response.json()) as PersonalResultsResponse;
}

async function updateLifecycle(token: string, eventId: string, action: "start" | "pause" | "end") {
  const response = await fetch(`${API_URL}/events/${eventId}/${action}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to ${action} event`);
  }

  return (await response.json()) as EventSummary;
}

export function startEvent(token: string, eventId: string) {
  return updateLifecycle(token, eventId, "start");
}

export function pauseEvent(token: string, eventId: string) {
  return updateLifecycle(token, eventId, "pause");
}

export function endEvent(token: string, eventId: string) {
  return updateLifecycle(token, eventId, "end");
}
