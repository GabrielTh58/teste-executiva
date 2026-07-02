'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { post } from '@/shared/lib/api';

interface OnboardingData {
  tenantName: string;
  adminEmail: string;
  password: string;
}

export function useOnboarding() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(data: OnboardingData) {
    setLoading(true);
    try {
      await post('/tenant/onboarding', data);
      toast.success('Conta criada com sucesso! Faça login para continuar.');
      router.push('/login');
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      if (err.status === 409) {
        toast.error('E-mail já cadastrado. Tente outro endereço.');
      } else {
        toast.error(err.message || 'Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  return { loading, submit };
}
