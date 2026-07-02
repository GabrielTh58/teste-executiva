import { TemplateField } from '@/modules/template/types/template-field.types';

export interface ContractContent {
  templateSnapshot: TemplateField[];
  answers: Record<string, string | number | boolean>;
}
