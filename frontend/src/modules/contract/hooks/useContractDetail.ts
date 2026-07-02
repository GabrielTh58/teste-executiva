'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Contract,
  ContractAnswersPayload,
  ContractStatus,
  getContractById,
  getContractHistory,
  HistoryEntry,
  PaginationMeta,
  updateContractFields,
  updateContractStatus,
} from '../api';

const HISTORY_TAKE = 10;

function extractErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } } };
  return e.response?.data?.message ?? fallback;
}

export function useContractDetail(id: string) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyMeta, setHistoryMeta] = useState<PaginationMeta>({
    total: 0,
    skip: 0,
    take: HISTORY_TAKE,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(
    async (skip: number) => {
      const result = await getContractHistory(id, { skip, take: HISTORY_TAKE });
      setHistory(result.data);
      setHistoryMeta(result.meta);
    },
    [id],
  );

  useEffect(() => {
    let ignore = false;

    Promise.all([getContractById(id), getContractHistory(id, { skip: 0, take: HISTORY_TAKE })])
      .then(([contractData, historyResult]) => {
        if (ignore) return;
        setContract(contractData);
        setHistory(historyResult.data);
        setHistoryMeta(historyResult.meta);
        setError(null);
      })
      .catch((err: unknown) => {
        if (ignore) return;
        setError(extractErrorMessage(err, 'Erro ao carregar contrato.'));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  async function saveFields(payload: ContractAnswersPayload) {
    try {
      const updated = await updateContractFields(id, payload);
      setContract(updated);
      await loadHistory(historyMeta.skip);
      toast.success('Campos atualizados com sucesso!');
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Erro ao salvar campos. Tente novamente.'));
      throw err;
    }
  }

  async function changeStatus(status: ContractStatus) {
    try {
      const updated = await updateContractStatus(id, { status });
      setContract(updated);
      await loadHistory(historyMeta.skip);
      toast.success('Status atualizado com sucesso!');
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Erro ao atualizar status. Tente novamente.'));
    }
  }

  function nextHistoryPage() {
    const nextSkip = historyMeta.skip + historyMeta.take;
    if (nextSkip < historyMeta.total) loadHistory(nextSkip);
  }

  function prevHistoryPage() {
    loadHistory(Math.max(0, historyMeta.skip - historyMeta.take));
  }

  return {
    contract,
    history,
    historyMeta,
    loading,
    error,
    saveFields,
    changeStatus,
    nextHistoryPage,
    prevHistoryPage,
  };
}
