export enum UserRole {
  EMPLOYE = 1,
  MANAGER = 2,
  ADMIN = 3
}

export interface User {
  id: number;
  login: string;
  role: UserRole;
  fullName: string;
  email: string;
  createdAt: Date;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  fullName: string;
  role: UserRole;
  userId: number;
  expiresAt: Date;
}

export interface CreateUserRequest {
  login: string;
  password: string;
  role: UserRole;
  fullName: string;
  email: string;
}