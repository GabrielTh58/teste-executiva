'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { createTemplate, updateTemplate, Template } from '../api';

const fieldSchema = z.object({
  key: z.string().optional(),
  label: z.string().min(1, 'Label é obrigatório'),
  type: z.enum(['text', 'number', 'date', 'boolean'], { message: 'Selecione um tipo' }),
  required: z.boolean(),
});

const templateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  fields: z.array(fieldSchema),
});

export type TemplateFormValues = z.infer<typeof templateSchema>;

interface UseTemplateFormOptions {
  initialData?: Template;
  onSuccess?: () => void;
}

export function useTemplateForm({ initialData, onSuccess }: UseTemplateFormOptions = {}) {
  const [loading, setLoading] = useState(false);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      fields: initialData?.fieldsConfig.fields ?? [],
    },
  });

  async function submit(data: TemplateFormValues) {
    setLoading(true);
    try {
      if (initialData) {
        await updateTemplate(initialData.id, data);
        toast.success('Template atualizado com sucesso!');
      } else {
        await createTemplate(data);
        toast.success('Template criado com sucesso!');
      }
      onSuccess?.();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Erro ao salvar template. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return { ...form, loading, submit };
}
