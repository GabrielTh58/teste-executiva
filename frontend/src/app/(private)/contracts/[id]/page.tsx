'use client';

import { use } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { LoadingSpinner } from '@/shared/components/layout/LoadingSpinner';
import { useContractDetail } from '@/modules/contract/hooks/useContractDetail';
import { ContractStatusBadge } from '@/modules/contract/components/ContractStatusBadge';
import { ContractHistoryList } from '@/modules/contract/components/ContractHistoryList';
import { ContractStatus } from '@/modules/contract/api';
import { ArrowLeft } from 'lucide-react';
import { ContractFieldsSection } from '@/modules/contract/components/ContractFieldsSection';
import { useRouter } from 'next/navigation';

const STATUS_OPTIONS: { value: ContractStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'CLOSED', label: 'Encerrado' },
];

interface ContractDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ContractDetailPage({ params }: ContractDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  
  const {
    contract,
    history,
    historyMeta,
    loading,
    error,
    saveFields,
    changeStatus,
    nextHistoryPage,
    prevHistoryPage,
  } = useContractDetail(id);

  if (loading) return <LoadingSpinner />;

  if (error || !contract) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-destructive">{error ?? 'Contrato não encontrado.'}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex items-center gap-2 text-muted-foreground cursor-pointer hover:text-blue-600/80" onClick={() => router.back()}>
        <ArrowLeft className="size-4" />
        <span>Voltar</span>
      </div>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Contrato</h1>
        <ContractStatusBadge status={contract.status} />
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6 pt-4 cursor-pointer">
          <div className="flex flex-wrap gap-2 cursor-pointer">
            {STATUS_OPTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant="outline"
                size="sm"
                disabled={contract.status === option.value}
                onClick={() => changeStatus(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <ContractFieldsSection 
            contract={contract}
            onSave={saveFields} 
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4 pt-4 cursor-pointer">
          <ContractHistoryList entries={history} />
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{historyMeta.total} registro(s)</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={historyMeta.skip === 0}
                onClick={prevHistoryPage}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={historyMeta.skip + historyMeta.take >= historyMeta.total}
                onClick={nextHistoryPage}
              >
                Próxima
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

