export type UserRole = 'user' | 'manager' | 'admin'

export interface User {
  id: number
  full_name: string
  login: string
  email: string
  role: UserRole
}

export interface UserCreateInput {
  full_name: string
  login: string
  email: string
  password: string
  role: UserRole
}

export interface UserUpdateRoleInput {
  role: UserRole
}


