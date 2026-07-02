'use client';

import { Template } from "@/modules/template/api";
import { ContractFormData, useContractForm } from "../hooks/useContractForm";
import { createContract } from "../api";
import { Controller } from "react-hook-form";
import { Label } from "@/shared/components/ui/Label";
import { Input } from "@/shared/components/ui/Input"; // Corrigido para Shadcn
import { Button } from "@/shared/components/ui/Button"; // Corrigido para Shadcn
import { ContractFieldInput } from "./ContractFieldInput";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface NewContractFormProps {
  template: Template;
  onCreated: (id: string) => void;
}

export function NewContractForm({ template, onCreated }: NewContractFormProps) {
  const router = useRouter();
  
  const fields = template.fieldsConfig.fields;
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useContractForm({ fields });

  async function onSubmit(data: ContractFormData) {
    try {
      const contract = await createContract(data);
      toast.success('Contrato criado com sucesso!');
      onCreated(contract.id);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Erro ao criar contrato. Tente novamente.');
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
       <div className="flex items-center gap-2 text-muted-foreground cursor-pointer hover:text-blue-600/80" onClick={() => router.push('/contracts')}>
        <ArrowLeft className="size-4" />
        <span>Voltar</span>
      </div>
      
      <h1 className="text-2xl font-bold tracking-tight">Novo Contrato</h1>
      <p className="text-sm text-muted-foreground">Template: {template.name}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2 mb-6 p-4 border rounded-md bg-card">
          <Label htmlFor="name" className="text-base font-semibold">
            Título do Contrato <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Ex: Contrato de Prestação de Serviços - Zaytek"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message as string}</p>
          )}
        </div>
        
        <hr className="my-4" />
        
        {fields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
            <Controller
              name={`answers.${field.key}`} // <-- AQUI ESTÁ A MÁGICA DE VOLTA!
              control={control}
              render={({ field: controllerField }) => (
                <ContractFieldInput
                  field={field}
                  value={controllerField.value as string | number | boolean}
                  onChange={controllerField.onChange}
                />
              )}
            />
            {errors.answers?.[field.key] && (
              <p className="text-sm text-destructive">{errors.answers[field.key]?.message as string}</p>
            )}
          </div>
        ))}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Criando contrato...' : 'Criar contrato'}
        </Button>
      </form>
    </div>
  );
}