import { Control, Controller, UseFormRegister } from 'react-hook-form';
import { Button } from '@/shared/components/ui/Button';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/Select';
import { FieldType } from '../types/template-field.types';

interface FieldRowProps {
  index: number;
  onRemove: () => void;
  register: UseFormRegister<any>;
  control: Control<any>;
}

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Texto',
  number: 'Número',
  date: 'Data',
  boolean: 'Booleano',
};

export function FieldRow({ index, onRemove, register, control }: FieldRowProps) {
  return (
    <div className="flex items-end gap-3 rounded-lg border border-input p-3">
      
      <div className="flex-1 space-y-2">
        <Label htmlFor={`field-label-${index}`}>Nome do Campo</Label>
        <Input
          id={`field-label-${index}`}
          placeholder="Ex: Nome da Empresa"
          {...register(`fields.${index}.label`)}
        />
      </div>

      <div className="w-40 space-y-2">
        <Label htmlFor={`field-type-${index}`}>Tipo</Label>
        <Controller
          control={control}
          name={`fields.${index}.type`}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={`field-type-${index}`} className="w-full">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FIELD_TYPE_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex items-center gap-2 pb-2">
        <Controller
          control={control}
          name={`fields.${index}.required`}
          render={({ field }) => (
            <Checkbox
              id={`field-required-${index}`}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Label htmlFor={`field-required-${index}`}>Obrigatório</Label>
      </div>

      <Button type="button" variant="destructive" size="sm" onClick={onRemove}>
        Remover
      </Button>
    </div>
  );
}