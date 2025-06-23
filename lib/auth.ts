import { jwtDecode } from 'jwt-decode'

export function getTokenFromStorage(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

export function isTokenValid(token: string): boolean {
  try {
    const decoded = jwtDecode<any>(token)
    return decoded.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export function getUserFromToken(token: string) {
  try {
    const decoded = jwtDecode<any>(token)
    return decoded.user
  } catch {
    return null
  }
}
