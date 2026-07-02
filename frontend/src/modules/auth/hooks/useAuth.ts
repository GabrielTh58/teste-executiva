'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { login as loginApi } from '../api';
import { useSession } from '@/shared/context/SessionContext';
import { Role } from '@/shared/enums/Role';
import { register as registerUser } from '@/modules/auth/api';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  role: Role;
}


export function useAuth() {
  const [loading, setLoading] = useState(false);
  const { authenticate, logout } = useSession();
  const router = useRouter();

  async function submitLogin(data: LoginData) {
    setLoading(true);
    try {
      const tokens = await loginApi(data);
      authenticate(tokens.accessToken, tokens.refreshToken);
      router.push('/dashboard');
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { message?: string } } };
      if (err.response?.status === 401) {
        toast.error('Credenciais inválidas. Verifique seu e-mail e senha.');
      } else {
        toast.error(err.response?.data?.message || 'Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function submitRegister(data: RegisterData) {
    setLoading(true);
    try {
      await registerUser(data);
      toast.success('Usuário criado com sucesso!');
      router.back();
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { message?: string } } };
      if (err.response?.status === 409) {
        toast.error('E-mail já cadastrado. Tente outro endereço.');
      } else {
        toast.error(err.response?.data?.message || 'Erro ao criar usuário. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  function submitLogout() {
    logout();
    router.push('/login');
  }

  return { loading, submitLogin, submitLogout, submitRegister };
}
