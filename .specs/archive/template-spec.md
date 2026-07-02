# Spec: Módulo Template

## 1. Visão Geral

Esta spec implementa o gerenciamento de templates de contrato por tenant. Um
template define o esqueleto de um contrato: quais campos existem, seus tipos e
obrigatoriedade. Cada tenant pode ter múltiplos templates, mas apenas um está
ativo por vez, e somente a partir do template ativo é possível gerar contratos.

O Admin é o único que pode criar, editar e ativar templates. Viewers podem apenas
visualizar. Toda operação é isolada por `tenantId` extraído do `@CurrentUser()`.

## 2. Referências

Consulte para desenvolver:
- Arquitetura e camadas: `.specs\memory\architecture.md`
- Nomenclatura: `.specs\memory\nomenclature.md`
- Schema Prisma: `backend/prisma/schema.prisma` — model `Template`.

## 3. Decisões de Negócio desta Feature

- **`key` de campo é gerado pelo backend** via `uuid` no momento da criação do
  campo, nunca pelo cliente. O usuário envia apenas `label`, `type` e `required`.
  O `key` é imutável, preservado em updates para manter rastreabilidade com
  contratos já gerados a partir do template.
- **Estrutura rígida do JSONB**: `fieldsConfig` sempre respeita o tipo
  `TemplateFieldsConfig` — qualquer payload fora dessa estrutura é rejeitado
  antes de chegar ao banco.
- **Um único template ativo por tenant**: ao ativar um template, todos os outros
  do mesmo tenant têm `isActive` setado para `false` na mesma transação Prisma.
- **Edição é permitida em qualquer template**, ativo ou não, não afeta contratos
  existentes (snapshot já foi copiado no momento da geração do contrato).
- **Sem DELETE**: deletar template que já gerou contratos quebraria a integridade
  do snapshot histórico. Fora de escopo (YAGNI).

## 4. Contrato de Tipos (compartilhado entre backend e frontend)

```typescript
// backend: src/modules/template/types/template-field.types.ts
// frontend: src/modules/template/types/template-field.types.ts

export type FieldType = 'text' | 'number' | 'date' | 'boolean';

export interface TemplateField {
  key: string;       // UUID gerado pelo backend, imutável, nunca enviado pelo cliente
  label: string;     // Nome visível ao usuário
  type: FieldType;   // Restrito aos 4 tipos válidos
  required: boolean;
}

export interface TemplateFieldsConfig {
  fields: TemplateField[];
}
```

## 5. Tarefas

### 5.1 Negócio

- [x] Definir regra: `key` de cada campo é gerado via `randomUUID()` (nativo do
      Node, sem dependência extra) no `TemplateService` antes de persistir, 
      nunca aceito via payload de entrada.
- [x] Definir regra: em updates, o cliente envia os campos com ou sem `key`.
      Campos **com `key`** são atualizações de campos existentes (preserva o `key`).
      Campos **sem `key`** são novos campos (backend gera novo `key`). Campos do
      template anterior que não aparecem no payload são removidos. Isso permite
      adicionar, editar e remover campos em um único `PATCH`.
- [x] Definir regra: `label` não pode ser vazio e `type` deve ser um dos 4 valores
      válidos (`text`, `number`, `date`, `boolean`) — validado no DTO via
      `class-validator`.
- [x] Definir regra: não podem existir dois campos com o mesmo `label` dentro do
      mesmo `fieldsConfig`, validado no `TemplateService` antes de persistir
      (`BadRequestException` se duplicado).
- [x] Definir regra: ativar um template seta `isActive = true` nele e
      `isActive = false` em todos os outros do tenant, operação atômica via
      `prisma.$transaction`.

### 5.2 Backend

- [x] Gerar módulo via CLI:
      ```bash
      nest g module modules/template
      nest g controller modules/template --no-spec
      nest g service modules/template 
      ```
- [x] Criar arquivo de tipos compartilhados:
      `src/modules/template/types/template-field.types.ts`
      com `FieldType`, `TemplateField` e `TemplateFieldsConfig` conforme seção 4.
- [x] Criar DTOs em `src/modules/template/dto`:
      1. `create-template.dto.ts`:
        - `name` (`@IsString()`).
        - `fields`: array de objetos. DEVE usar os decorators `@IsArray()`, `@ValidateNested({ each: true })` e `@Type(() => TemplateFieldDto)`.
        - Criar a classe `TemplateFieldDto` no mesmo arquivo contendo: `label` (`@IsString()`, `@MinLength(1)`), `type` (`@IsEnum(['text','number','date','boolean'])`), 
        `required` (`@IsBoolean()`).
      2.update-template.dto.ts:
      - `name`: opcional, mesmas regras do create.
      - `fields`: opcional, array de objetos com `key` opcional (`@IsString()`
        quando presente), `label`, `type`, `required` — mesmas regras do create.
- [x] Criar `src/modules/template/template.repository.ts` com métodos:
      - `create(tenantId: string, data: { name: string; fieldsConfig: TemplateFieldsConfig })` → `Template`
      - `findAllByTenant(tenantId: string)` → `Template[]` ordenado por `isActive DESC, createdAt DESC` (ativo primeiro)
      - `findById(id: string, tenantId: string)` → `Template | null` (sempre filtra por `tenantId`)
      - `update(id: string, tenantId: string, data: { name?: string; fieldsConfig?: TemplateFieldsConfig })` → `Template`
      - `activate(id: string, tenantId: string)` → executa `prisma.$transaction`:
        seta `isActive = false` em todos do tenant, depois `isActive = true` no
        template alvo. Retorna o template ativado.
      - `findActiveByTenant(tenantId: string)` → `Template | null` — usado pelo
        ContractModule futuramente via `TemplateService`.
- [x] Criar `template/template.service.ts`:
      - `create(dto: CreateTemplateDto, tenantId: string)`:injeta `key` via `randomUUID()` em cada field do `dto.fields`, monta
        o `TemplateFieldsConfig`, valida labels duplicados(`BadRequestException`), chama `repository.create`.
      - `findAll(tenantId: string)`: chama `repository.findAllByTenant`.
      - `findById(id: string, tenantId: string)`: chama `repository.findById`,lança `NotFoundException` se null.
      - `update(id: string, dto: UpdateTemplateDto, tenantId: string)`: busca template existente (`NotFoundException` se não existir), processa
        o array de fields (preserva `key` dos existentes, gera novo `key` para campos sem `key`), valida labels duplicados, chama `repository.update`.
      - `activate(id: string, tenantId: string)`: verifica existência (`NotFoundException`), chama `repository.activate`.
      - `findActive(tenantId: string)`: chama `repository.findActiveByTenant` — método público para ser consumido pelo `ContractModule` futuramente.
- [x] Criar `template/template.controller.ts`:
      - Todas as rotas aplicam `JwtAuthGuard`.
      - `POST /template` — `@Roles('ADMIN')`, chama `service.create(dto, currentUser.tenantId)`, retorna `201`.
      - `GET /template` — sem restrição de role, chama `service.findAll(currentUser.tenantId)`.
      - `GET /template/:id` — sem restrição de role, chama `service.findById(id, currentUser.tenantId)`.
      - `PATCH /template/:id` — `@Roles('ADMIN')`, chama `service.update(id, dto, currentUser.tenantId)`.
      - `PATCH /template/:id/activate` — `@Roles('ADMIN')`, chama `service.activate(id, currentUser.tenantId)`, retorna template ativado.
- [x] Registrar `TemplateModule` no `AppModule`. Exportar `TemplateService` no `TemplateModule` (será importado pelo `ContractModule` na spec seguinte).
- [x] Criar teste unitario com jest `template/template.service.spec.ts` cobrindo:
      - `create`: sucesso (verifica que `key` foi injetado em cada field).
      - `create`: labels duplicados no mesmo payload → `BadRequestException`.
      - `update`: template não encontrado → `NotFoundException`.
      - `update`: campo com `key` existente preserva o `key`; campo sem `key` recebe novo `key`.
      - `activate`: template não encontrado → `NotFoundException`.
      - `TemplateRepository` mockado via `jest.fn()`.

### 5.3 Frontend

- [x] Criar tipos espelhados em `frontend/src/modules/template/types/template-field.types.ts` (mesma estrutura da seção 4).
- [x] Criar `frontend/src/modules/template/api.ts` com funções:
      - `getTemplates()` → `GET /template`
      - `getTemplateById(id)` → `GET /template/:id`
      - `createTemplate(payload)` → `POST /template`
      - `updateTemplate(id, payload)` → `PATCH /template/:id`
      - `activateTemplate(id)` → `PATCH /template/:id/activate`
      Todas usam o `apiClient` de `shared/lib/api-client.ts`. 
- [x] Criar hook `useTemplates.ts` dentro do modulo template:
      encapsula `getTemplates`, estado de loading/erro, retorna lista ordenada (ativo primeiro já vem da API).
- [x] Criar hook `frontend/src/modules/template/hooks/useTemplateForm.ts`:
      gerencia estado do formulário de criação/edição, lista de fields dinâmica (adicionar, remover, editar field), submit que chama `createTemplate` ou
      `updateTemplate` conforme o contexto, estado de loading/erro.
- [x] Criar componente reutilizável dentro do modulo:
      1. `FieldRow.tsx`:
        representa uma linha de campo no formulário com inputs para `label`, select para `type` e checkbox para `required`, além de botão "Remover".
        Recebe `field`, `index`, `onChange` e `onRemove` como props.
      2. `TemplateForm.tsx`:
        - O componente `TemplateForm.tsx` DEVE obrigatoriamente utilizar o `useFieldArray` do pacote `react-hook-form` para gerenciar a lista dinâmica de `FieldRow`. Isso evita re-renderizações desnecessárias e perda de foco nos inputs ao digitar.
        - Formulário completo de criação/edição. Recebe `initialData` (opcional, para edição) e `onSubmit`. Renderiza o campo `name` do template e a lista dinâmica de `FieldRow`. O botão "Adicionar Campo" acrescenta um field vazio à lista. Chama `useTemplateForm` para toda a lógica de estado.
      3.`TemplateCard.tsx`:
        card de exibição de um template na listagem. Exibe `name`, badge "Ativo"  se `isActive`, data de criação. Botões "Editar" e "Ativar" (Ativar só
        aparece se não for o ativo). Recebe `template`, `onEdit`, `onActivate` como props.
- [x] Criar page `frontend/src/app/dashboard/templates/page.tsx`:
      - Usa `useTemplates` para carregar e exibir lista de `TemplateCard`.
      - Botão "Novo Template" visível apenas para `role === 'ADMIN'`
        (verificado via `SessionContext`).
      - Estado local controla qual modal/painel está aberto: criação ou edição.
      - Ao clicar "Editar" em um card: abre `TemplateForm` preenchido com os dados do template selecionado.
      - Ao clicar "Novo Template": abre `TemplateForm` vazio.
      - Ao clicar "Ativar": chama `activateTemplate(id)`, recarrega lista.
      - `TemplateForm` e `TemplateCard` são importados do módulo template, reutilizáveis futuramente se necessário.
- [x] Componentes genéricos (`Button`, `Input`, `Select`, `Checkbox`) devem ser criados em `shared/components/` se
      ainda não existirem, nascem aqui e ficam disponíveis para os módulos de Contract e History.

## 6. Checklist de Execução

- [x] 5.1 Negócio — regras definidas e validadas
- [x] 5.2 Backend — módulo implementado e testado
- [x] 5.3 Frontend — telas funcionais integradas à API

## 7. Evidência e Rastreabilidade

### Backend
- **Observações técnicas**:
  - `nest g provider modules/template/template.repository` gera o arquivo dentro de uma subpasta
    (`template.repository/template.repository.ts`); foi movido manualmente para
    `template.repository.ts` na raiz do módulo, conforme convenção do projeto.
  - `fieldsConfig` (Json no Prisma) exige cast explícito para `Prisma.InputJsonValue` no
    `TemplateRepository`, pois `TemplateFieldsConfig` não possui index signature de `string`.
  - `TemplateService.create` precisou ser `async` (mesmo delegando a promise do repository)
    para que exceptions síncronas (`BadRequestException` de labels duplicados) se propaguem
    como rejection e sejam testáveis com `rejects.toThrow`.
  - Guards aplicados em duas camadas: `@UseGuards(JwtAuthGuard)` no controller (todas as rotas)
    e `@UseGuards(RolesGuard) @Roles(Role.ADMIN)` por método nas rotas administrativas
    (`create`, `update`, `activate`), replicando o padrão já usado em `AuthController`.
  - 5/5 testes de `template.service.spec.ts` passam. `npx tsc --noEmit` limpo, exceto um erro
    pré-existente e não relacionado em `app.controller.spec.ts` (importa `./app.service`, que já
    estava deletado do repositório antes desta spec — fora do escopo desta mudança).
- **Problemas encontrados e resolução**:
  - Ver acima (path do repository gerado pelo CLI e cast de JSON do Prisma).

### Frontend
- **Observações técnicas**:
  - Página criada em `frontend/src/app/(dashboard)/templates/page.tsx` (route group `(dashboard)`),
    seguindo o padrão já existente em `app/(dashboard)/users/new/page.tsx` — o caminho literal
    `app/dashboard/templates/page.tsx` da spec não reflete a estrutura de route groups já adotada
    no projeto.
  - `Select` e `Checkbox` não existiam em `shared/components/ui/`; foram gerados via
    `npx shadcn add select checkbox` (mesmo estilo `base-nova` dos componentes existentes) em vez
    de escritos à mão, para manter consistência com `Button`/`Input`/`Label`.
  - `TemplateForm.tsx` usa `useForm` + `useFieldArray` diretamente (via `control` exposto por
    `useTemplateForm`), e repassa `field`/`index`/`onChange`/`onRemove` para `FieldRow`, que
    permanece um componente controlado e "burro" (sem `register` interno), conforme os dois
    requisitos da spec (useFieldArray obrigatório no componente + FieldRow via props).
  - `useTemplates.ts` inicialmente chamava `setLoading(true)` de forma síncrona dentro do
    `useEffect` de carregamento — bloqueado pela regra `react-hooks/set-state-in-effect` do
    ESLint (React Compiler). Corrigido inicializando `loading` como `true` por padrão e só
    disparando `setState` dentro do `.then/.catch/.finally` da promise; `refetch` (chamado por
    handlers de clique, não por efeito) continua chamando `setLoading(true)` de forma síncrona,
    o que é permitido.
  - Não existe um componente de modal/dialog em `shared/components/`; o "painel" de
    criação/edição foi implementado como uma seção condicional inline na própria página
    (sem overlay), evitando construir um `Dialog` genérico não pedido pela spec (YAGNI).
  - `npx eslint .`, `npx tsc --noEmit` e `npx next build` (Turbopack) rodam limpos para todos os
    arquivos novos; os únicos avisos/erros restantes do lint pertencem a arquivos pré-existentes
    (`SessionContext.tsx`, `shared/lib/api-client.ts`), fora do escopo desta spec.
- **Problemas encontrados e resolução**:
  - Ver acima (route group, geração de Select/Checkbox via shadcn, regra de lint em efeito
    assíncrono, ausência de componente de modal).
