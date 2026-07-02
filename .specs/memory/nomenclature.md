# Nomenclatura do Projeto

## Backend (NestJS)

- **Arquivos:** `kebab-case.<tipo>.ts` (ex: `contract.service.ts`, `create-contract.dto.ts`).
- **Classes / Interfaces / Tipos:** `PascalCase` (ex: `ContractService`, `CreateContractDto`).
- **Variáveis e Métodos:** `camelCase` (ex: `createContract`, `findByTenantId`).
- **Constantes:** `UPPER_SNAKE_CASE` (ex: `JWT_ACCESS_EXPIRES_IN`).
- **Módulos:** `<Domínio>Module` (ex: `TenantModule`, `ContractModule`).
- **Controllers:** `<Domínio>.controller` (ex: `contract.controller`).
- **Services:** `<Domínio>.service` (ex: `contract.service`).
- **Providers:** `<Domínio>.provider` (ex: `contract.provider`).
- **Repositories:** `<Domínio>.repository` (ex: `contract.repository`).
- **DTOs:** `<Ação><Entidade>Dto` (ex: `CreateContractDto`, `UpdateTemplateDto`).
- **Guards:** `<Nome>Guard` (ex: `JwtAuthGuard`, `RolesGuard`).
- **Enums:** `PascalCase` (ex: `ContractStatus`, `Role`).

## Frontend (Next.js)

- **Componentes (arquivo e função):** `PascalCase.tsx` (ex: `ContractList.tsx`).
- **Hooks customizados:** `camelCase` prefixado com `use` (ex: `useAuth.ts`, `useContracts.ts`).
- **Páginas (App Router):** pasta de rota em `kebab-case` (ex: `app/contracts/[id]/page.tsx`).
- **Contextos:** `<Nome>Context.tsx` (ex: `SessionContext.tsx`).
- **Tipos e Interfaces compartilhados:** `PascalCase` (ex: `Contract`, `TenantOnboardingPayload`).
- **Funções utilitárias:** `camelCase` (ex: `formatCurrency`, `parseApiError`).
- **Variáveis de ambiente do cliente:** `NEXT_PUBLIC_UPPER_SNAKE_CASE` (ex: `NEXT_PUBLIC_API_URL`).

## Regras gerais

- Nunca usar abreviações ambíguas (`usr`, `tmpl`, `ctr`). Use o nome completo (`user`, `template`, `contract`).
- Nomes de métodos de Service/Repository descrevem a ação de negócio, não a implementação (`createTenantWithAdmin`, não `insertRows`).
- IDs de relacionamento seguem o padrão do Prisma: `<entidade>Id` (`tenantId`, `templateId`, `contractId`).
- Nomes de variáveis e métodos devem ser descritivos.