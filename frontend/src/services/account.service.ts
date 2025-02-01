import { http } from '@/core/axios';

export interface MeResponse {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  createdAt: Date;
  lastLoginAt?: Date | undefined | null;
  status: string;
  gameType?: string;
  gameId?: string;
  mmr: number;
}

export interface AccountResponse {
  id: string;
  username: string;
  isAdmin: boolean;
  createdAt: Date;
  lastLoginAt?: Date | undefined | null;
  mmr: number;
}

export const accountService = {
  async me(): Promise<MeResponse> {
    return (await http.get<MeResponse>(`accounts/me`)).data;
  },

  async get(accountId: string): Promise<AccountResponse> {
    return (await http.get<AccountResponse>(`accounts/${accountId}`)).data;
  }
};
