import { Button } from '@/shared/components/ui/Button';
import { Template } from '../api';

interface TemplateCardProps {
  template: Template;
  onEdit: (template: Template) => void;
  onActivate: (template: Template) => void;
}

export function TemplateCard({ template, onEdit, onActivate }: TemplateCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium capitalize">{template.name}</h3>
          {template.isActive && (
            <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-primary">
              Ativo
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Criado em {new Date(template.createdAt).toLocaleDateString('pt-BR')}
        </p>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => onEdit(template)}>
          Editar
        </Button>
        {!template.isActive && (
          <Button type="button" size="sm" onClick={() => onActivate(template)}>
            Ativar
          </Button>
        )}
      </div>
    </div>
  );
}
