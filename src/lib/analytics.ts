/**
 * Fire-and-forget analytics event logger.
 * Never throws — analytics should never break the UI.
 */

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = sessionStorage.getItem("kyo_session");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("kyo_session", id);
    }
    return id;
  } catch {
    return "unknown";
  }
}

export function logEvent(tipo: string, valor?: string) {
  try {
    fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, valor, session_id: getSessionId() }),
    }).catch(() => {});
  } catch {
    // never throw
  }
}
