import { apiClient } from '@/shared/lib/api-client';
import { TemplateField } from './types/template-field.types';

export interface Template {
  id: string;
  name: string;
  fieldsConfig: { fields: TemplateField[] };
  isActive: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

interface TemplateFieldPayload {
  key?: string;
  label: string;
  type: TemplateField['type'];
  required: boolean;
}

export interface CreateTemplatePayload {
  name: string;
  fields: Omit<TemplateFieldPayload, 'key'>[];
}

export interface UpdateTemplatePayload {
  name?: string;
  fields?: TemplateFieldPayload[];
}

export async function getTemplates(): Promise<Template[]> {
  const response = await apiClient.get<Template[]>('/template');
  return response.data;
}

export async function getTemplateById(id: string): Promise<Template> {
  const response = await apiClient.get<Template>(`/template/${id}`);
  return response.data;
}

export async function createTemplate(payload: CreateTemplatePayload): Promise<Template> {
  const response = await apiClient.post<Template>('/template', payload);
  return response.data;
}

export async function updateTemplate(id: string, payload: UpdateTemplatePayload): Promise<Template> {
  const response = await apiClient.patch<Template>(`/template/${id}`, payload);
  return response.data;
}

export async function activateTemplate(id: string): Promise<Template> {
  const response = await apiClient.patch<Template>(`/template/${id}/activate`);
  return response.data;
}
