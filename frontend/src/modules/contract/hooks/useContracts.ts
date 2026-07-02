'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Contract, getContracts, ListContractsParams, PaginationMeta } from '../api';

const DEFAULT_TAKE = 10;

const DEFAULT_META: PaginationMeta = { total: 0, skip: 0, take: DEFAULT_TAKE };

export function useContracts() {
  const [filters, setFilters] = useState<ListContractsParams>({ skip: 0, take: DEFAULT_TAKE });
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(DEFAULT_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

 useEffect(() => {
    let ignore = false;

    const fetchContracts = async () => {
      try {
        const result = await getContracts(filters);
        if (ignore) return;
        
        setContracts(result.data);
        setMeta(result.meta);
        setError(null);
      } catch (err: unknown) {
        if (ignore) return;
        
        const e = err as { response?: { data?: { message?: string } } };
        const message = e.response?.data?.message ?? 'Erro ao carregar contratos. Tente novamente.';
        
        setError(message);
        toast.error(message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchContracts();

    return () => {
      ignore = true;
    };
  }, [filters]);

  const setFilter = useCallback(
    <K extends keyof ListContractsParams>(key: K, value: ListContractsParams[K]) => {
      setLoading(true);
      setFilters((prev) => ({
        ...prev,
        [key]: value,
        skip: key === 'skip' ? (value as number) : 0,
      }));
    },
    [],
  );

  const nextPage = useCallback(() => {
    setLoading(true);
    setFilters((prev) => ({ ...prev, skip: (prev.skip ?? 0) + (prev.take ?? DEFAULT_TAKE) }));
  }, []);

  const prevPage = useCallback(() => {
    setLoading(true);
    setFilters((prev) => ({
      ...prev,
      skip: Math.max(0, (prev.skip ?? 0) - (prev.take ?? DEFAULT_TAKE)),
    }));
  }, []);

  return { contracts, meta, loading, error, setFilter, nextPage, prevPage };
}
