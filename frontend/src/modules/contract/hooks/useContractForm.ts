'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TemplateField } from '@/modules/template/types/template-field.types';

export type ContractAnswers = Record<string, string | number | boolean>;

export interface ContractFormData {
  name: string;
  answers: ContractAnswers;
}

function fieldSchema(field: TemplateField): z.ZodTypeAny {
  switch (field.type) {
    case 'number':
      return field.required
        ? z.number({ message: `${field.label} deve ser um número` })
        : z.number().optional();
    case 'boolean':
      return z.boolean();
    case 'date':
    case 'text':
    default:
      return field.required
        ? z.string().min(1, `${field.label} é obrigatório`)
        : z.string().optional();
  }
}

function buildAnswersSchema(fields: TemplateField[]) {
  const answersShape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    answersShape[field.key] = fieldSchema(field);
  }
  return z.object({
    name: z.string().min(1, 'O título do contrato é obrigatório'),
    answers: z.object(answersShape),
  });
}

function buildDefaultValues(
  fields: TemplateField[],
  initialName?: string,
  initialAnswers?: ContractAnswers,
): ContractFormData {
  const defaults: ContractAnswers = {};
  for (const field of fields) {
    const initial = initialAnswers?.[field.key];
    if (initial !== undefined) {
      defaults[field.key] = initial;
    } else {
      defaults[field.key] = field.type === 'boolean' ? false : '';
    }
  }
  
  return {
    name: initialName || '',
    answers: defaults,
  };
}

interface UseContractFormOptions {
  fields: TemplateField[];
  initialName?: string;
  initialAnswers?: ContractAnswers;
}

export function useContractForm({ fields, initialName, initialAnswers }: UseContractFormOptions) {
  const schema = useMemo(() => buildAnswersSchema(fields), [fields]);
  const defaultValues = useMemo(
    () => buildDefaultValues(fields, initialName, initialAnswers),
    [fields, initialName, initialAnswers],
  );

  return useForm<ContractFormData>({
    resolver: zodResolver(schema) as any,
    values: defaultValues,
  });
}