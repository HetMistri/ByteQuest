const ACTIVE_EVENT_KEY = "bytequest.activeEventId";
const COMPLETED_EVENT_KEY = "bytequest.completedEventId";

export function setActiveEventId(eventId: string) {
  localStorage.setItem(ACTIVE_EVENT_KEY, eventId);
}

export function getActiveEventId(): string | null {
  return localStorage.getItem(ACTIVE_EVENT_KEY);
}

export function clearActiveEventId() {
  localStorage.removeItem(ACTIVE_EVENT_KEY);
}

export function setCompletedEventId(eventId: string) {
  localStorage.setItem(COMPLETED_EVENT_KEY, eventId);
}

export function getCompletedEventId(): string | null {
  return localStorage.getItem(COMPLETED_EVENT_KEY);
}

export function clearCompletedEventId() {
  localStorage.removeItem(COMPLETED_EVENT_KEY);
}
