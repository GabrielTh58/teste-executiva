'use client';

import { useFieldArray } from 'react-hook-form';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { useTemplateForm } from '../hooks/useTemplateForm';
import { Template } from '../api';
import { FieldRow } from './FieldRow';

interface TemplateFormProps {
  initialData?: Template;
  onSubmit: () => void;
}

export function TemplateForm({ initialData, onSubmit }: TemplateFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    loading,
    submit,
  } = useTemplateForm({ initialData, onSuccess: onSubmit }); 

  const { fields, append, remove } = useFieldArray({ control, name: 'fields' });
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do template</Label>
        <Input
          id="name"
          placeholder="Contrato de Prestação de Serviços"
          {...register('name')}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-3">
        <Label>Campos</Label>
        {fields.map((field, index) => (
         <FieldRow
            key={field.id}
            index={index}
            register={register} 
            control={control as any}   
            onRemove={() => remove(index)}
          />
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ label: '', type: 'text', required: false })}
        >
          Adicionar Campo
        </Button>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar'}
      </Button>
    </form>
  );
}
