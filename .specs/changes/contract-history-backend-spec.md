# Spec: Módulo Contract + History

## 1. Visão Geral

Esta spec implementa a geração e gestão de contratos a partir de templates ativos,
incluindo o registro de histórico de todas as alterações. Um contrato é uma
instância de um template: o usuário preenche os valores dos campos definidos pelo
Admin e o sistema salva um snapshot imutável da estrutura do template junto com
as respostas.

Toda alteração em um contrato (criação, edição de campos, mudança de status) gera
automaticamente uma entrada no `History`, garantindo rastreabilidade completa.

O módulo History não tem lógica de negócio própria, serve exclusivamente como
receptor de registros gerados pelo `ContractService` e como provedor de listagem
para o frontend.

## 2. Referências

Consulte para desenvolver:
- Arquitetura e camadas: `.specs/memory/architecture.md`
- Nomenclatura: `.specs/shared/nomenclature.md`
- Schema Prisma: `backend/prisma/schema.prisma` — models `Contract`, `History`,
  enums `ContractStatus`, `HistoryAction`

## 3. Decisões de Negócio desta Feature

### Formato do `ContractContent`

```typescript
// src/modules/contract/types/contract-content.types.ts
import { TemplateField } from '../template/types/template-field.types';

export interface ContractContent {
  templateSnapshot: TemplateField[]; // cópia exata do fieldsConfig no momento da criação
  answers: Record<string, string | number | boolean>; // key do campo → valor preenchido
}
```

O `templateSnapshot` é copiado do template ativo no momento da criação e nunca
mais alterado. As edições futuras só tocam em `answers`. Isso garante que o
contrato sempre carrega seu próprio manual de instruções, independente do que
aconteça com o template original.

### Validação de answers

A validação acontece no `ContractService` contra o `templateSnapshot` (na criação)
ou contra o `content.templateSnapshot` já salvo (na edição):

- Campo `required: true` sem valor correspondente em `answers` → `BadRequestException`
- Valor em `answers` com tipo incompatível com `field.type` → `BadRequestException`
  - `text` → `typeof value === 'string'`
  - `number` → `typeof value === 'number'`
  - `date` → string no formato ISO (`YYYY-MM-DD`), validada via `Date.parse()`
  - `boolean` → `typeof value === 'boolean'`

### Transição de status

Livre — qualquer status (`DRAFT`, `ACTIVE`, `CLOSED`) pode transitar para qualquer
outro. Sem regra de transição, sem bloqueio de edição por status. O contrato pode
ser reativado a qualquer momento.

### Registro de histórico

Toda operação que altera o contrato gera entrada(s) em `History` dentro da mesma
transação Prisma que altera o contrato:

| Operação | `action` | `changedField` | `oldValue` | `newValue` | changedBy
|---|---|---|---|---|
| Criação | `CREATE` | `null` | `null` | `null` | user_id
| Edição de campo | `UPDATE_FIELD` | label do campo (via templateSnapshot) | valor anterior | valor novo | user_id
| Mudança de status | `STATUS_CHANGE` | `null` | status anterior | novo status | user_id

Edição de múltiplos campos em uma única requisição gera **uma entrada por campo
alterado**, não uma entrada só para toda a edição.

### Busca por valor de campo

Feita via operador JSONB do Prisma (`string_contains` no path `answers`). Busca
em todos os valores de `answers` de uma vez — sem SQL raw, sem busca campo a campo.

### Acoplamento entre módulos

```
ContractModule importa TemplateModule  → acessa TemplateService.findActive()
ContractModule importa HistoryModule   → acessa HistoryService.createEntry()
HistoryModule não importa nenhum módulo de domínio
```

## 4. Rotas

```
POST   /contract                    → Criar contrato (todos os roles)
GET    /contract                    → Listar contratos do tenant (paginado + filtros)
GET    /contract/:id                → Detalhe do contrato
PATCH  /contract/:id/fields         → Editar answers (todos os roles)
PATCH  /contract/:id/status         → Mudar status (todos os roles)
GET    /contract/:id/history        → Listar histórico do contrato (paginado)
```

## 5. Tarefas

### 5.1 Negócio

- [x] Criação só é possível se existir template ativo no tenant(`BadRequestException`: "Nenhum template ativo encontrado").
- [x] Answers são validados contra o `templateSnapshot` antes de persistir, campos required sem valor e tipos incompatíveis lançam
      `BadRequestException` com mensagem identificando o campo (`label`).
- [x] Edição de campos compara `answers` antigos com novos e gera uma entrada em `History` por campo alterado, campos não enviados no payload
      mantêm o valor atual (merge, não substituição total).
- [x] Mudança de status registra `oldValue` e `newValue` como string do enum ContractStatus(`'DRAFT'`, `'ACTIVE'`, `'CLOSED'`).
- [x] `GET /contract/:id` valida `tenantId` — contrato de outro tenant retorna `NotFoundException` (não revelar
      existência de recursos de outros tenants com `ForbiddenException`).

### 5.2 Backend — History (implementar primeiro, pois Contract depende dele)

- [x] Gerar módulo via CLI:
      ```bash
      nest g module modules/history
      nest g service modules/history --no-spec
      ```
      History não tem Controller próprio — o endpoint `GET /contract/:id/history`
      vive no `ContractController`.

- [x] Criar `src/modules/history/dto/create-history-entry.dto.ts` (interno, não exposto via HTTP):
      ```typescript
      export class CreateHistoryEntryDto {
        action: HistoryAction;
        contractId: string;
        changedById: string;
        changedField?: string;
        oldValue?: string;
        newValue?: string;
      }
      ```

- [x] Criar `src/modules/history/history.repository.ts` com métodos:
      - `create(data: CreateHistoryEntryDto)` → `History`
      - `createMany(data: CreateHistoryEntryDto[])` → usado para múltiplos `UPDATE_FIELD` em uma única edição
      - `findByContract(contractId: string, skip: number, take: number)` → `{ data: History[], total: number }` ordenado por `createdAt DESC`

- [x] Criar `history.service.ts` com métodos:
      - `createEntry(dto: CreateHistoryEntryDto)` → chama `repository.create`
      - `createEntries(dtos: CreateHistoryEntryDto[])` → chama `repository.createMany`
      - `findByContract(contractId: string, skip: number, take: number)` → chama `repository.findByContract`

- [x] Registrar e exportar `HistoryModule` no `AppModule` (exportar `HistoryService`
      para uso pelo `ContractModule`).

### 5.3 Backend — Contract

- [x] Criar arquivo de tipos:`src/modules/contract/types/contract-content.types.ts` com interface `ContractContent` conforme seção 3.
- [x] Gerar módulo via CLI:
      ```bash
      nest g module modules/contract
      nest g controller modules/contract --no-spec
      nest g service modules/contract 
      ```
- [x] Criar método privado `validateAnswers(snapshot, answers)` no `ContractService`:
      Itera o `snapshot`, verifica campos required e valida compatibilidade de tipos. Lança `BadRequestException` indicando o `label` do erro.
- [x] Criar DTOs:
      - `CreateContractDto` e `UpdateContractFieldsDto`: `answers` (`@IsObject()`, obrigatório).
      - `UpdateContractStatusDto`: `status` (`@IsEnum(ContractStatus)`, obrigatório).
      - `ListContractsDto` (Query): 
            - `status`: `@IsEnum(ContractStatus)`, opcional.
            - `startDate`/`endDate` (opcionais, data ISO)
            - `search` (opcional, string)
            - `skip`: `@IsInt()`, `@Min(0)`, default `0`.
            - `take`: `@IsInt()`, `@Min(1)`, `@Max(50)`, default `10`.

- [x] Criar `ContractRepository`:
      - `create(tenantId, templateId, content, userId)`: Retorna `Contract`.
      - `findAll(tenantId, filters: ListContractsDto)`: constrói cláusula `where`
        dinamicamente com os filtros opcionais, executa `findMany` + `count` em
        `Promise.all`, retorna envelope de paginação.
      - `findById(id, tenantId)`: Retorna contrato isolado por tenant.
      - `updateFields(id, tenantId, answers)`: Faz merge dos answers usando spread operator sobre o `content.answers` existente.
      - `updateStatus(id, tenantId, status)`: Atualiza apenas o status.

- [x] Implementar `ContractService`:
      - `create`: Busca template ativo. Monta `ContractContent`. Roda `validateAnswers`. Executa `prisma.$transaction` para criar o Contrato e a entrada no `History` (`action: CREATE`).
      - `findAll` e `findById`: Repassam para o repositório.
      - `updateFields`: Busca contrato. Valida os novos answers contra o `templateSnapshot` salvo no contrato. Identifica campos alterados. Executa `$transaction`: atualiza o contrato e cria uma entrada em `History` para CADA campo alterado (`action: UPDATE_FIELD`, `oldValue`, `newValue`).
      - `updateStatus`: Executa `$transaction`: atualiza status e cria entrada no `History` (`action: STATUS_CHANGE`).
      - `findHistory`: Valida posse do contrato pelo tenant, repassa para `HistoryService.findByContract`.

- [x] Criar `src/modules/contract/contract.service.ts` com métodos:
      - `create(dto: CreateContractDto, currentUser: CurrentUserPayload)`:
        1. Busca template ativo via `TemplateService.findActive(tenantId)`
           → `BadRequestException` se null.
        2. Monta `ContractContent` com `templateSnapshot` copiado do template
           e `answers` do DTO.
        3. Valida answers via método privado `validateAnswers`.
        4. Executa `prisma.$transaction`: cria `Contract` + cria entrada em
           `History` (`action: CREATE`) via `HistoryService.createEntry`.
        5. Retorna contrato criado.
      - `findAll(filters: ListContractsDto, tenantId: string)`:
        chama `repository.findAll`, retorna envelope `{ data, meta }`.
      - `findById(id: string, tenantId: string)`:
        chama `repository.findById` → `NotFoundException` se null.
      - `updateFields(id: string, dto: UpdateContractFieldsDto, currentUser)`:
        1. Busca contrato existente → `NotFoundException` se null.
        2. Valida answers do DTO via `validateAnswers` contra
           `contract.content.templateSnapshot`.
        3. Identifica campos alterados comparando `answers` antigos com novos.
        4. Executa `prisma.$transaction`:
           - Atualiza `content.answers` no contrato (merge).
           - Cria uma entrada em `History` por campo alterado
             (`action: UPDATE_FIELD`, `changedField: field.label`,
             `oldValue`, `newValue` como string).
        5. Retorna contrato atualizado.
      - `updateStatus(id: string, dto: UpdateContractStatusDto, currentUser)`:
        1. Busca contrato existente → `NotFoundException` se null.
        2. Executa `prisma.$transaction`:
           - Atualiza `status` no contrato.
           - Cria entrada em `History` (`action: STATUS_CHANGE`,
             `oldValue: status anterior`, `newValue: novo status`).
        3. Retorna contrato atualizado.
      - `findHistory(contractId: string, tenantId: string, skip: number, take: number)`:
        1. Verifica que o contrato pertence ao tenant → `NotFoundException` se não.
        2. Chama `HistoryService.findByContract`, retorna envelope `{ data, meta }`.

- [x] Criar `src/modules/contract/contract.controller.ts`:
      - Todas as rotas aplicam `JwtAuthGuard`. Nenhuma restrição de role.    
      - `GET /contract/:id/history` → `service.findHistory(id, currentUser.tenantId,
        skip, take)`, retorna `{ data, meta }`.
      - Mapear endpoints CRUD padrão (`POST /`, `GET /`, `GET /:id`, `PATCH /:id/fields`, `PATCH /:id/status`) e histórico (`GET /:id/history`). Passar sempre `currentUser.tenantId`.

- [x] Registrar `ContractModule` no `AppModule`. Importar `TemplateModule` e `HistoryModule` no `ContractModule`.

- [x] Criar `src/modules/contract/contract.service.spec.ts` cobrindo:
      - `create`: sucesso, verifica que `templateSnapshot` foi copiado do template.
      - `create`: sem template ativo → `BadRequestException`.
      - `create`: campo required sem valor em answers → `BadRequestException`.
      - `create`: tipo de valor incompatível com field.type → `BadRequestException`.
      - `updateFields`: campo alterado gera entrada em History com `oldValue`
        e `newValue` corretos.
      - `updateFields`: campo não enviado no payload mantém valor anterior (merge).
      - `updateStatus`: gera entrada em History com status anterior e novo.
      - `findById`: contrato de outro tenant → `NotFoundException`.
      - `ContractRepository`, `TemplateService` e `HistoryService` mockados via
        `jest.fn()`.



## 6. Checklist de Execução

- [x] 5.1 Negócio — regras definidas e validadas
- [x] 5.2 Backend History — módulo implementado
- [x] 5.3 Backend Contract — módulo implementado e testado

## 7. Evidência e Rastreabilidade

### Backend History
- **Observações técnicas**: Módulo implementado exatamente conforme especificado
  (repository + service com `create`/`createMany`/`findByContract`). Na prática,
  `createEntry`/`createEntries` (o caminho de escrita) não são chamados pelo
  `ContractModule` — ver desvio de arquitetura documentado abaixo em Contract.
  `HistoryModule` é usado por `ContractService` apenas para leitura
  (`findByContract`, via `findHistory`).
- **Problemas encontrados e resolução**: Nenhum.

### Backend Contract
- **Observações técnicas**:
  - **Desvio de arquitetura (decidido com o usuário)**: a spec original previa
    `ContractService` chamando `prisma.$transaction` diretamente, o que viola a
    regra de `architecture.md` de que somente Repositories injetam
    `PrismaService`. Resolução adotada: `ContractRepository` é o único ponto que
    injeta `PrismaService` e executa o `$transaction`, escrevendo diretamente
    nas tabelas `contracts` e `history` (via `tx.history.create`/`createMany`)
    dentro da mesma transação. `ContractService` monta os dados da entrada de
    `History` (action, changedField/oldValue/newValue, changedById) e os passa
    como parâmetro para os métodos do repositório. `HistoryService` continua
    sendo usado pelo `ContractModule`, mas somente na leitura
    (`GET /contract/:id/history`).
  - Em `updateFields`, a validação (`validateAnswers`) roda contra o conjunto
    de answers já mesclado (`{ ...answers antigos, ...answers novos }`), não
    apenas contra o payload parcial recebido — isso evita que campos
    `required` já preenchidos anteriormente (e não reenviados nesta edição)
    disparem `BadRequestException` indevidamente. As entradas de `History` são
    geradas somente para as chaves efetivamente enviadas no payload e cujo
    valor mudou.
- **Problemas encontrados e resolução**: Nenhum bloqueio. `npm run lint`,
  `npx jest` (suíte nova: 8/8 passando) e `npx nest build` executados com
  sucesso; as duas falhas pré-existentes na suíte (`app.controller.spec.ts`
  referenciando `app.service.ts` já removido, e um bug pré-existente em
  `template.service.spec.ts`) são anteriores a esta implementação e não foram
  tocadas.

