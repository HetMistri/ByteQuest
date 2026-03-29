import { apiGet, apiPatch, apiPost } from "../api/http";

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
  downloadableContentUrl?: string | null;
  orderIndex?: number;
};

export type UpdateProblemInput = {
  title?: string;
  description?: string;
  solution?: string;
  downloadableContentUrl?: string | null;
  orderIndex?: number;
};

export type SubmissionResult = {
  success: boolean;
  isCorrect: boolean;
  isFirstCorrect: boolean;
  attemptCount: number;
  awardedPoints?: number;
  message: string;
  nextQuestionIndex?: number;
  completed?: boolean;
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  displayName?: string | null;
  score: number;
  solvedProblems: number;
  totalProblems: number;
  progressPercent: number;
  joinedAt: string;
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

export function listScheduledEvents(token: string): Promise<EventSummary[]> {
  return apiGet<EventSummary[]>("/events", token);
}

export function getEventDetails(token: string, eventId: string): Promise<EventDetails> {
  return apiGet<EventDetails>(`/events/${eventId}`, token);
}

export function createEvent(token: string, input: CreateEventInput): Promise<EventSummary> {
  return apiPost<EventSummary>("/events", input, token);
}

export function joinEvent(
  token: string,
  eventId: string,
  input: JoinEventInput,
): Promise<ParticipantRecord> {
  return apiPost<ParticipantRecord>(`/events/${eventId}/join`, input, token);
}

export function listParticipants(token: string, eventId: string): Promise<ParticipantRecord[]> {
  return apiGet<ParticipantRecord[]>(`/events/${eventId}/participants`, token);
}

export function getLeaderboard(token: string, eventId: string): Promise<LeaderboardEntry[]> {
  return apiGet<LeaderboardEntry[]>(`/events/${eventId}/leaderboard`, token);
}

export function kickParticipant(token: string, eventId: string, userId: string): Promise<void> {
  return apiPost<void>(`/events/${eventId}/kick/${userId}`, undefined, token);
}

export function addProblem(
  token: string,
  eventId: string,
  input: CreateProblemInput,
): Promise<ProblemRecord> {
  return apiPost<ProblemRecord>(`/events/${eventId}/problems`, input, token);
}

export function listProblems(token: string, eventId: string): Promise<ProblemRecord[]> {
  return apiGet<ProblemRecord[]>(`/events/${eventId}/problems`, token);
}

export function updateProblem(
  token: string,
  eventId: string,
  problemId: string,
  input: UpdateProblemInput,
): Promise<ProblemRecord> {
  return apiPatch<ProblemRecord>(`/events/${eventId}/problems/${problemId}`, input, token);
}

export function submitAnswer(
  token: string,
  eventId: string,
  answer: string,
): Promise<SubmissionResult> {
  return apiPost<SubmissionResult>(`/events/${eventId}/submit`, { answer }, token);
}

export function getPersonalResults(token: string, eventId: string): Promise<PersonalResultsResponse> {
  return apiGet<PersonalResultsResponse>(`/events/${eventId}/results/me`, token);
}

function updateLifecycle(token: string, eventId: string, action: "start" | "pause" | "end") {
  return apiPost<EventSummary>(`/events/${eventId}/${action}`, undefined, token);
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
