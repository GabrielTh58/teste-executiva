'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useNewContractForm } from '@/modules/contract/hooks/useNewContract';
import { NewContractForm } from '@/modules/contract/components/NewContractForm';

export default function NewContractPage() {
  const router = useRouter();
  const { template } = useNewContractForm();

  if (template === undefined) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-muted-foreground">Carregando template ativo...</p>
      </div>
    );
  }

  if (template === null) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight">Novo Contrato</h1>
        <p className="text-sm text-muted-foreground">
          Nenhum template ativo encontrado. Ative um template para criar contratos.
        </p>
        <Link href="/templates" className="text-sm font-medium text-blue-600 underline underline-offset-4">
          Ir para Templates
        </Link>
      </div>
    );
  }

  return <NewContractForm template={template} onCreated={(id) => router.push(`/contracts/${id}`)} />;
}


