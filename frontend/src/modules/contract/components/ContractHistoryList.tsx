import { HistoryAction, HistoryEntry } from '../api';

const ACTION_LABELS: Record<HistoryAction, string> = {
  CREATE: 'Criação',
  UPDATE_FIELD: 'Edição de campo',
  STATUS_CHANGE: 'Mudança de status',
};

interface ContractHistoryListProps {
  entries: HistoryEntry[];
}

export function ContractHistoryList({ entries }: ContractHistoryListProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum registro de histórico.</p>;
  }

  return (
    <ul className="space-y-3">
      {entries.map((entry) => (
        <li key={entry.id} className="rounded-lg border border-input p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{ACTION_LABELS[entry.action]}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {new Date(entry.createdAt).toLocaleString('pt-BR')}
            </span>
          </div>

          {entry.changedField && (
            <p className="mt-1 text-muted-foreground">Campo: {entry.changedField}</p>
          )}

          {(entry.oldValue !== null || entry.newValue !== null) && (
            <p className="mt-1 text-muted-foreground">
              {entry.oldValue ?? '—'} → {entry.newValue ?? '—'}
            </p>
          )}

          <p className="mt-1 text-xs text-muted-foreground">
            Por {entry.changedBy?.email ?? 'usuário desconhecido'}
          </p>
        </li>
      ))}
    </ul>
  );
}
