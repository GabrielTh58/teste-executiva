'use client';

import { useSession } from '@/shared/context/SessionContext';

export default function DashboardPage() {
  const { user } = useSession();

  return (
    <div className="mx-auto max-w-3xl space-y-2 px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Bem-vindo</h1>
      <p className="text-sm text-muted-foreground">
        Você está autenticado como <span className="font-medium">{user?.role}</span>. Use o menu
        lateral para navegar entre Templates e Contratos.
      </p>
    </div>
  );
}
