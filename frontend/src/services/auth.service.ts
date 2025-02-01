import { http } from '@/core/axios';
import type { AxiosRequestConfig } from 'axios';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  createdAt: Date;
}

export const authService = {
  async login(payload: LoginRequest): Promise<void> {
    await http.post<void>(`auth/login`, payload, {
      skipAuthRefresh: true
    } as AxiosRequestConfig);
  },

  async logout(): Promise<void> {
    await http.post<void>(`auth/logout`, undefined, {
      withCredentials: true
    });
  },

  async register(payload: RegisterRequest): Promise<RegisterResponse> {
    return (await http.post<RegisterResponse>(`auth/register`, payload)).data;
  },

  async refresh(): Promise<void> {
    await http.post<void>(`auth/refresh`, {});
  }
};
