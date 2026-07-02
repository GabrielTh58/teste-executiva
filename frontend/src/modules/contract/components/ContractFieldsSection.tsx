import { Label } from "@/shared/components/ui/Label";
import { Controller } from "react-hook-form";
import { ContractFieldInput } from "./ContractFieldInput";
import { Contract, ContractAnswersPayload } from "../api";
import { useState } from "react";
import { ContractFormData, useContractForm } from "../hooks/useContractForm";
import { Button } from "@/shared/components/ui/Button";

interface ContractFieldsSectionProps {
  contract: Contract;
  onSave: (payload: ContractAnswersPayload) => Promise<void>;
}

export function ContractFieldsSection({ contract, onSave }: ContractFieldsSectionProps) {
  const [editing, setEditing] = useState(false);
  const fields = contract.content.templateSnapshot;
  const answers = contract.content.answers;

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useContractForm({ 
    fields,
    initialName: contract.name,
    initialAnswers: answers 
  });

  async function onSubmit(data: ContractFormData) {
    try {
      await onSave({ answers: data.answers });
      setEditing(false);
    } catch {
        console.log('Erro ao salvar os campos do contrato.'); 
    }
  }

  if (!editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-xl">Campos</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
            Editar campos
          </Button>
        </div>

        <dl className="space-y-2">
          {fields.map((field) => (
            <div key={field.key} className="flex justify-between border-b border-input pb-2 text-sm">
              <dt className="text-muted-foreground">{field.label}</dt>
              <dd className="font-medium">{String(answers[field.key] ?? '—')}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">// aqui
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Editar campos</h2>
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
          Cancelar
        </Button>
      </div>

      {fields.map((field) => (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={field.key}>
            {field.label}
            {field.required && <span className="text-destructive"> *</span>}
          </Label>
          <Controller
            name={`answers.${field.key as any}`} 
            control={control}
            render={({ field: controllerField }) => (
              <ContractFieldInput
                field={field}
                value={controllerField.value}// aqui
                onChange={controllerField.onChange}
              />
            )}
          />
          {(errors.answers)?.[field.key] && (
            <p className="text-sm text-destructive">
              {(errors.answers as any)[field.key]?.message}
            </p>
          )}
        </div>
      ))}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Salvando...' : 'Salvar'}
      </Button>
    </form>
  );
}
