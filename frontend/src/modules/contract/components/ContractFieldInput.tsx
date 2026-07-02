import { Checkbox } from '@/shared/components/ui/Checkbox';
import { Input } from '@/shared/components/ui/Input';
import { TemplateField } from '@/modules/template/types/template-field.types';

interface ContractFieldInputProps {
  field: TemplateField;
  value: string | number | boolean | undefined;
  onChange: (value: string | number | boolean) => void;
}

export function ContractFieldInput({ field, value, onChange }: ContractFieldInputProps) {
  switch (field.type) {
    case 'number':
      return (
        <Input
          type="number"
          value={value === undefined ? '' : Number(value)}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
      );
    case 'date':
      return (
        <Input
          type="date"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'boolean':
      return (
        <Checkbox
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(checked === true)}
        />
      );
    case 'text':
    default:
      return (
        <Input
          type="text"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}
