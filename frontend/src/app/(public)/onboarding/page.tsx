'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { useOnboarding } from '@/modules/tenant/hooks/useOnboarding';
import Link from 'next/link';

const schema = z.object({
  tenantName: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres'),
  adminEmail: z.email('Informe um e-mail válido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function OnboardingPage() {
  const { loading, submit } = useOnboarding();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Criar conta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Configure sua empresa e crie o acesso de administrador
          </p>
        </div>

        <form onSubmit={handleSubmit(submit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="tenantName">Nome da empresa</Label>
            <Input
              id="tenantName"
              placeholder="Acme Corp"
              {...register('tenantName')}
            />
            {errors.tenantName && (
              <p className="text-sm text-destructive">{errors.tenantName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminEmail">E-mail do administrador</Label>
            <Input
              id="adminEmail"
              type="email"
              placeholder="admin@empresa.com"
              {...register('adminEmail')}
            />
            {errors.adminEmail && (
              <p className="text-sm text-destructive">{errors.adminEmail.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <Link href="/login" className="font-medium underline underline-offset-4 hover:text-primary">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
