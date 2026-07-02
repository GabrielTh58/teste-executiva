import { Badge } from '@/shared/components/ui/Badge';
import { ContractStatus } from '../api';

const STATUS_CONFIG: Record<ContractStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Rascunho', className: 'bg-muted text-muted-foreground' },
  ACTIVE: { label: 'Ativo', className: 'bg-green-100 text-green-700' },
  CLOSED: { label: 'Encerrado', className: 'bg-red-100 text-red-700' },
};

interface ContractStatusBadgeProps {
  status: ContractStatus;
}

export function ContractStatusBadge({ status }: ContractStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return <Badge className={config.className}>{config.label}</Badge>;
}
