export type FieldType = 'text' | 'number' | 'date' | 'boolean';

export interface TemplateField {
  key: string; 
  label: string; 
  type: FieldType; 
  required: boolean;
}

export interface TemplateFieldsConfig {
  fields: TemplateField[];
}
