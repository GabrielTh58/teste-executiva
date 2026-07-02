export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
} 

export interface TemplateField {
  key: string; 
  label: string; 
  type: FieldType; 
  required: boolean;
}

export interface TemplateFieldsConfig {
  fields: TemplateField[];
}
