'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/Select';
import { useContracts } from '@/modules/contract/hooks/useContracts';
import { ContractStatus } from '@/modules/contract/api';
import { LoadingSpinner } from '@/shared/components/layout/LoadingSpinner';
import { ListContracts } from '@/modules/contract/components/ListContracts';

const STATUS_OPTIONS: { value: ContractStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'CLOSED', label: 'Encerrado' },
];

export default function ContractsPage() {
  const router = useRouter();
  const { contracts, meta, loading, error, setFilter, nextPage, prevPage } = useContracts();
  const [statusFilter, setStatusFilter] = useState('all');

  const handleClearFilters = () => {
    setStatusFilter('all');
    setFilter('status', undefined);
    setFilter('startDate', undefined);
    setFilter('endDate', undefined);
    setFilter('search', undefined);
    
    (document.getElementById('filters-form') as HTMLFormElement)?.reset();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Contratos</h1>
        <Button type="button" onClick={() => router.push('/contracts/new')}>
          Novo Contrato
        </Button>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClearFilters}
      >
        Limpar Filtros
      </Button>

      <form id="filters-form" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="filter-status">Status</Label>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              if (value === null) return;
              setStatusFilter(value);
              setFilter('status', value === 'all' ? undefined : (value as ContractStatus));
            }}
          >
            <SelectTrigger id="filter-status" className="w-full">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-start-date">Data início</Label>
          <Input
            id="filter-start-date"
            type="date"
            onChange={(e) => setFilter('startDate', e.target.value || undefined)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-end-date">Data fim</Label>
          <Input
            id="filter-end-date"
            type="date"
            onChange={(e) => setFilter('endDate', e.target.value || undefined)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-search">Buscar</Label>
          <Input
            id="filter-search"
            type="text"
            placeholder="Buscar por valor de campo"
            onChange={(e) => setFilter('search', e.target.value || undefined)}
          />
        </div>
      </form>

      {loading && <LoadingSpinner message="Carregando contratos..." />}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && contracts.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum contrato encontrado.</p>
      )}

      <ListContracts
        contracts={contracts}
        loading={loading}
        router={router} 
      />

      <Actions 
        meta={meta}
        nextPage={nextPage}
        prevPage={prevPage}   />
    </div>
  );
}

interface ActionsProps {
  meta: {
    total: number;
    skip: number;
    take: number;
  };
  nextPage: () => void;
  prevPage: () => void;
}

function Actions({ meta, nextPage, prevPage }: ActionsProps){
  return(
    <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {meta.total} contrato{meta.total === 1 ? '' : 's'}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={meta.skip === 0}
            onClick={prevPage}
          >
            Página anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={meta.skip + meta.take >= meta.total}
            onClick={nextPage}
          >
            Próxima página
          </Button>
        </div>
      </div>
  )
}