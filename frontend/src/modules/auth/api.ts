import { apiClient } from '@/shared/lib/api-client';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  role: 'ADMIN' | 'VIEWER';
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface RegisteredUser {
  id: string;
  email: string;
  role: string;
  tenantId: string;
  createdAt: string;
}

export async function login(data: LoginData): Promise<TokenPair> {
  const response = await apiClient.post<TokenPair>('/auth/login', data);
  return response.data;
}

export async function register(data: RegisterData): Promise<RegisteredUser> {
  const response = await apiClient.post<RegisteredUser>('/auth/register', data);
  return response.data;
}
