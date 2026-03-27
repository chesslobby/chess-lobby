export const API_URL = 'http://localhost:4000'

export async function apiPost(endpoint: string, body: any) {
  const res = await fetch(API_URL + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw { status: res.status, ...data }
  return data
}

export async function apiGet(endpoint: string) {
  const token = localStorage.getItem('chess_token')
  const res = await fetch(API_URL + endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  const data = await res.json()
  if (!res.ok) throw { status: res.status, ...data }
  return data
}

export function getUser() {
  try { return JSON.parse(localStorage.getItem('chess_user') || 'null') }
  catch { return null }
}

export function getToken() {
  return localStorage.getItem('chess_token')
}

export function saveAuth(token: string, user: any) {
  localStorage.setItem('chess_token', token)
  localStorage.setItem('chess_user', JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem('chess_token')
  localStorage.removeItem('chess_user')
}

export function isLoggedIn() {
  return !!localStorage.getItem('chess_token')
}
