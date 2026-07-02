import { TemplateField } from '../../template/types/TemplateField.types';

export interface ContractContent {
  templateSnapshot: TemplateField[];
  answers: Record<string, string | number | boolean>;
}
