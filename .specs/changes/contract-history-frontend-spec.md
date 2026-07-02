# 1. Contexto
backend do módulo X já implementado conforme spec em `.specs\changes\contract-history-frontend-spec.md`
Agora implemente a seção 5.4 Frontend da mesma spec.

# 2. Referências:
 `.specs/memory/architecture.md`   
 `.specs/shared/nomenclature.md`
 `.specs\changes\contract-history-backend-spec.md`

# 3. Decisões de Design
- Cor primária: tailwind blue-600 — botões de ação, links ativos, destaques.
- Componentes UI: usar Shadcn UI 
- Sidebar retrátil: alterna entre w-64 (expandida, ícones + labels) e w-16 (retraída, só ícones). Estado interno com botão de toggle usando ícone PanelLeft do Lucide (já disponível com Shadcn).
- Responsividade: em mobile, sidebar oculta (hidden md:flex) e acessível via Sheet acionado por botão hambúrguer no Header.
- Formulários: react-hook-form com zodResolver. Schema Zod 

# 3. Frontend
- [ ] **Criar o Layout Base do Dashboard (`app/(private)/layout.tsx`):**
      - O layout deve ser um "Premium SaaS Dashboard" altamente componentizado em `shared/components/layout/`.
      - Fundo da tela em `bg-background`, sidebar com `bg-muted/40` e borda sutil.
      - `<Sidebar />`: Menu lateral fixo contendo links para "Início", "Templates" e "Contratos". Link ativo destacado com fundo `bg-blue-50` e texto `text-blue-600`.
      - `<Header />`: Barra superior com título da página/breadcrumbs e dropdown de usuário (nome, role e logout usando o `SessionContext`).
      - Inserir a lógica de responsividade (Sheet para mobile) descrita nas decisões de design.
      
- [ ] Criar tipos espelhados em `frontend/src/modules/contract/types/contract-content.types.ts`
      com interface `ContractContent` (mesma estrutura da seção 3).
- [ ] Criar `api.ts` do módulo contract mapeando todas as rotas (CRUD e History) usando o `apiClient`.
      - `createContract(payload)` → `POST /contract`
      - `getContracts(params)` → `GET /contract` com query params de filtro
      - `getContractById(id)` → `GET /contract/:id`
      - `updateContractFields(id, payload)` → `PATCH /contract/:id/fields`
      - `updateContractStatus(id, payload)` → `PATCH /contract/:id/status`
      - `getContractHistory(id, params)` → `GET /contract/:id/history`
      Todas usam `apiClient` de `shared/lib/api-client.ts`.

- [ ] Criar hooks de dados:
      - `useContracts.ts`: encapsula `getContracts` com os filtros como estado interno (status,
      datas, search, paginação), expõe `contracts`, `meta`, `loading`, `error`, `setFilter`, `nextPage`, `prevPage`.
      -`useContractDetail.ts`: encapsula `getContractById`, `updateContractFields`, `updateContractStatus`,
      `getContractHistory`, gerencia estado de loading/erro e recarrega dados após cada mutação.
      -`useContractForm.ts`: recebe o template ativo (já carregado pela page), renderiza os campos do
      `templateSnapshot` dinamicamente conforme `field.type`, gerencia estado dos
      `answers`, valida campos required no client antes do submit.
- [ ] Criar componentes de UI do domínio (em `components/` do módulo):
      -`ContractFieldInput.tsx`: renderiza o input correto conforme `field.type`:
            - `text` → `<Input type="text" />`
            - `number` → `<Input type="number" />`
            - `date` → `<Input type="date" />`
            - `boolean` → `<Checkbox />`
      Recebe `field: TemplateField`, `value`, `onChange` como props. Reutiliza
      `Input` e `Checkbox` de `shared/components/`. Preparado para ser controlado pelo `react-hook-form`.

- [ ] Criar componente `ContractStatusBadge.tsx`:
      Retorna uma badge com cores semânticas por status (DRAFT=cinza, ACTIVE=verde, CLOSED=vermelho)..

- [ ] Criar componente `ContractHistoryList.tsx`:
      lista de entradas de histórico. Cada entrada exibe: ação (`CREATE`,
      `UPDATE_FIELD`, `STATUS_CHANGE`), campo alterado, valor anterior → valor
      novo, nome do usuário, data/hora formatada. Recebe `entries: History[]`
      como prop.

- [ ] Criar page `frontend/src/app/(private)/contracts/page.tsx`:
      - Usa `useContracts` para carregar lista paginada.
      - Filtros na parte superior: select de status, inputs de data início/fim,
        campo de busca por texto — cada alteração chama `setFilter` do hook.
      - Tabela/lista de contratos com `ContractStatusBadge`, data de criação.
      - Botão "Novo Contrato" → navega para `/contracts/new`.
      - Clique na linha → navega para `/(private)/contracts/:id`. 

- [ ] Criar page `frontend/src/app/(private)/contracts/new/page.tsx`:
      - Busca template ativo via `getTemplates()` filtrando `isActive`.
      - Se não há template ativo: exibe aviso com link para `/(private)/templates`.
      - Renderiza `ContractFieldInput` para cada campo do template ativo usando
        `useContractForm`.
      - Submit → `createContract`, redireciona para `/(private)/contracts/:id`
        do contrato criado.

- [ ] Criar page `frontend/src/app/(private)/contracts/[id]/page.tsx`:
      - Usa `useContractDetail` para carregar dados do contrato e histórico.
      - Duas abas: **"Detalhes"** e **"Histórico"**.
      - Aba Detalhes:
        - Exibe `ContractStatusBadge` + botões de mudança de status
          (`DRAFT`, `ACTIVE`, `CLOSED`) — ao clicar, chama `updateContractStatus`.
        - Lista os campos do `templateSnapshot` com os valores atuais de `answers`.
        - Botão "Editar campos" → ativa modo de edição inline, renderizando
          `ContractFieldInput` para cada campo com os valores atuais preenchidos.
        - Botão "Salvar" → chama `updateContractFields` com os answers alterados.
      - Aba Histórico:
        - Renderiza `ContractHistoryList` com as entradas do histórico.
        - Paginação simples (próxima página / página anterior).




## 4. Checklist de Execução
- [ ] Frontend — telas funcionais integradas à API 
- [ ] Frontend — layout do dashboard 

## 5. Evidência e Rastreabilidade
- **Observações técnicas**:
- **Problemas encontrados e resolução**