import { createClient } from './supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = createClient()

  // getSession() first, refresh if needed
  const { data: { session } } = await supabase.auth.getSession()

  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` }
  }

  // Try refreshing the session
  const { data: { session: refreshed } } = await supabase.auth.refreshSession()
  if (refreshed?.access_token) {
    return { Authorization: `Bearer ${refreshed.access_token}` }
  }

  throw new Error('Session expired. Please sign in again.')
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => null)
    const detail = err?.detail

    if (res.status === 401) throw new Error('Session expired. Please sign in again.')
    if (res.status === 429) throw new Error(detail ?? 'Too many requests. Please wait a moment and try again.')
    if (res.status === 404) throw new Error('Not found.')
    if (res.status >= 500) throw new Error('Server error. Please try again in a moment.')
    throw new Error(detail ?? 'Something went wrong. Please try again.')
  }

  return res.json() as Promise<T>
}

export const apiClient = {
  get:    <T>(path: string)              => request<T>('GET',    path),
  post:   <T>(path: string, body: unknown) => request<T>('POST',  path, body),
  patch:  <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string)              => request<T>('DELETE', path),
}
