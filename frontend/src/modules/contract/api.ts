import { apiClient } from '@/shared/lib/api-client';
import { ContractContent } from './types/contract-content.types';

export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';
export type HistoryAction = 'CREATE' | 'UPDATE_FIELD' | 'STATUS_CHANGE';

export interface Contract {
  id: string;
  name: string;
  status: ContractStatus;
  content: ContractContent;
  tenantId: string;
  templateId: string;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryEntry {
  id: string;
  action: HistoryAction;
  changedField: string | null;
  oldValue: string | null;
  newValue: string | null;
  contractId: string;
  changedById: string;
  changedBy: { email: string } | null;
  createdAt: string;
}

export interface PaginationMeta {
  total: number;
  skip: number;
  take: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ListContractsParams {
  status?: ContractStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  skip?: number;
  take?: number;
}

export interface ContractAnswersPayload {
  answers: Record<string, string | number | boolean>;
}

export interface UpdateContractStatusPayload {
  status: ContractStatus;
}

export async function createContract(payload: ContractAnswersPayload): Promise<Contract> {
  const response = await apiClient.post<Contract>('/contract', payload);
  return response.data;
}

export async function getContracts(
  params: ListContractsParams,
): Promise<PaginatedResult<Contract>> {
  const response = await apiClient.get<PaginatedResult<Contract>>('/contract', { params });
  return response.data;
}

export async function getContractById(id: string): Promise<Contract> {
  const response = await apiClient.get<Contract>(`/contract/${id}`);
  return response.data;
}

export async function updateContractFields(
  id: string,
  payload: ContractAnswersPayload,
): Promise<Contract> {
  const response = await apiClient.patch<Contract>(`/contract/${id}/fields`, payload);
  return response.data;
}

export async function updateContractStatus(
  id: string,
  payload: UpdateContractStatusPayload,
): Promise<Contract> {
  const response = await apiClient.patch<Contract>(`/contract/${id}/status`, payload);
  return response.data;
}

export async function getContractHistory(
  id: string,
  params: { skip?: number; take?: number },
): Promise<PaginatedResult<HistoryEntry>> {
  const response = await apiClient.get<PaginatedResult<HistoryEntry>>(
    `/contract/${id}/history`,
    { params },
  );
  return response.data;
}
