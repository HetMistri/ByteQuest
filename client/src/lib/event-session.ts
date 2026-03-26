const ACTIVE_EVENT_KEY = "bytequest.activeEventId";

export function setActiveEventId(eventId: string) {
  localStorage.setItem(ACTIVE_EVENT_KEY, eventId);
}

export function getActiveEventId(): string | null {
  return localStorage.getItem(ACTIVE_EVENT_KEY);
}

export function clearActiveEventId() {
  localStorage.removeItem(ACTIVE_EVENT_KEY);
}
