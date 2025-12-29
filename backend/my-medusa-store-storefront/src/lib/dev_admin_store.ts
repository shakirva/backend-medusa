// Simple in-memory store for dev admin session cookies.
// This is intentionally minimal and only for local development convenience.
// It maps a random session id -> backend cookie string returned by Medusa.

const store = new Map<string, string>()

export function setDevAdminCookie(sid: string, cookie: string) {
  store.set(sid, cookie)
}

export function getDevAdminCookie(sid: string) {
  return store.get(sid)
}

export function clearDevAdminCookie(sid: string) {
  store.delete(sid)
}

export default store
