import { fetchJson } from '../../app/api'
import type { User, UserCreateInput, UserUpdateRoleInput } from './types'

export async function listUsers(): Promise<User[]> {
  return fetchJson<User[]>('/api/users')
}

export async function createUser(payload: UserCreateInput): Promise<User> {
  return fetchJson<User>('/api/users', { method: 'POST', body: payload })
}

export async function updateUserRole(userId: number, payload: UserUpdateRoleInput): Promise<User> {
  return fetchJson<User>(`/api/users/${userId}/role`, { method: 'PATCH', body: payload })
}

export async function deleteUser(userId: number): Promise<void> {
  return fetchJson<void>(`/api/users/${userId}`, { method: 'DELETE' })
}


