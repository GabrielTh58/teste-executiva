'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { useSession } from '@/shared/context/SessionContext';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { Role } from '@/shared/enums/Role';


const schema = z.object({
  email: z.email('Informe um e-mail válido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(Role, { message: 'Selecione uma função' }),
});

type FormData = z.infer<typeof schema>;

export default function NewUserPage() {
  const { user } = useSession();
  const { loading, submitRegister } = useAuth();  

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (user?.role !== 'ADMIN') {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Acesso restrito a administradores.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8"> 
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Nova Conta de Equipe</h1>
        <p className="text-muted-foreground">
          Cadastre um novo usuário para gerenciar os contratos do seu Tenant.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <form
          onSubmit={handleSubmit(submitRegister)}
          className="space-y-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@empresa.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha de acesso</Label>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Nível de Permissão</Label>
            <select
              id="role"
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register('role')}
            >
              <option value="" disabled selected>Selecione uma função</option>
              <option value="ADMIN">Administrador (Acesso Total)</option>
              <option value="VIEWER">Visualizador (Somente Leitura)</option>
            </select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? 'Criando conta...' : 'Cadastrar Membro'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}