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

export type ParticipantRecord = {
  userId: string;
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

export async function getEventDetails(token: string, eventId: string): Promise<EventSummary> {
  const response = await fetch(`${API_URL}/events/${eventId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load event details");
  }

  return (await response.json()) as EventSummary;
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
