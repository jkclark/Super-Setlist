// A simple interface that can be used across frontend and backend
export interface User {
  id: string
  name: string
  email: string
}

// A utility function that can be used in both frontend and backend
export function formatUser(user: User): string {
  return `${user.name} <${user.email}>`
}

// A simple validation function
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
