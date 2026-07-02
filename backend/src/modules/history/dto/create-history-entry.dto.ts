import { HistoryAction } from '../../../../generated/prisma/client';

export class CreateHistoryEntryDto {
  action!: HistoryAction;
  contractId!: string;
  changedById!: string;
  changedField?: string;
  oldValue?: string;
  newValue?: string;
}
