'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/Button';
import { useSession } from '@/shared/context/SessionContext';
import { useTemplates } from '@/modules/template/hooks/useTemplates';
import { TemplateCard } from '@/modules/template/components/TemplateCard';
import { TemplateForm } from '@/modules/template/components/TemplateForm';
import { Template } from '@/modules/template/api';
import { LoadingSpinner } from '@/shared/components/layout/LoadingSpinner';

type Panel = { mode: 'create' } | { mode: 'edit'; template: Template } | null;

export default function TemplatesPage() {
  const { user } = useSession();
  const { templates, loading, refetch, handleActivate } = useTemplates();
  const [panel, setPanel] = useState<Panel>(null);

  function handleFormSubmit() {
    setPanel(null);
    refetch();
  } 

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
        {user?.role === 'ADMIN' && (
          <Button type="button" onClick={() => setPanel({ mode: 'create' })}>
            Novo Template
          </Button>
        )}
      </div>

      {panel && (
        <div className="rounded-lg border border-input p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium">  
              {panel.mode === 'edit' ? 'Editar template' : 'Novo template'}
            </h2>
            <Button type="button" variant="ghost" size="sm" onClick={() => setPanel(null)}>
              Fechar
            </Button>
          </div>
          <TemplateForm
            initialData={panel.mode === 'edit' ? panel.template : undefined}
            onSubmit={handleFormSubmit}
          />
        </div>
      )}

      <div className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground"><LoadingSpinner message="Carregando templates..." /></p>}
        {!loading && templates.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum template cadastrado.</p>
        )}
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onEdit={(selected) => setPanel({ mode: 'edit', template: selected })}
            onActivate={handleActivate}
          />
        ))}
      </div>
    </div>
  );
}
