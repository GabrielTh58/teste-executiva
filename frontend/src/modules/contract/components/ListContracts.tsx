import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/Table';
import { Contract } from "../api";
import { ContractStatusBadge } from './ContractStatusBadge';

interface ListContractProps {
  contracts: Contract[];
  loading: boolean;
  router: any;
}

export function ListContracts({ contracts, loading, router }: ListContractProps) {
  return (
    <>
      {!loading && contracts.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((contract) => (
              <TableRow
                key={contract.id}
                className="cursor-pointer"
                onClick={() => router.push(`/contracts/${contract.id}`)}
              >
                <TableCell className="font-medium text-foreground">
                  {contract.name}
                </TableCell>
                <TableCell>
                  <ContractStatusBadge status={contract.status} />
                </TableCell>
                <TableCell>{new Date(contract.createdAt).toLocaleDateString('pt-BR')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  )
}