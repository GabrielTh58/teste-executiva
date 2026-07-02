# Arquitetura do Projeto

## 1. Filosofia

- **YAGNI + Clean Code**: nada é construído antes de ser necessário. Sem abstrações
  especulativas, sem camadas extras "pra garantir flexibilidade futura".
- **Modularidade por domínio**: cada domínio é um módulo NestJS isolado, com suas
  próprias camadas internas. Comunicação entre domínios acontece via injeção de
  um Service no outro.

## 2. Como organizar um módulo novo (backend)

Não existe uma árvore de pastas fixa decorada de antemão — existe uma **lógica** que
todo módulo de domínio segue. Ao criar um módulo novo (`modules/<dominio>/`):

1. Crie `<dominio>.module.ts`, `<dominio>.controller.ts`, `<dominio>.service.ts`,
   `<dominio>.repository.ts`.
2. Crie a subpasta `dto/` com um arquivo por DTO de entrada (`create-<dominio>.dto.ts`,
   `update-<dominio>.dto.ts`).
3. Se o módulo precisar de algo exclusivo dele (um Guard, um Service auxiliar como o
   `HashService` do Auth), esse arquivo fica **dentro do próprio módulo**, nunca em
   `shared/`, a menos que outro módulo já precise reutilizá-lo.
4. Use o módulo `Tenant` (primeiro implementado neste projeto) como referência viva
   de como as camadas se conectam — veja `## 8. Exemplo de referência` abaixo.

Infraestrutura compartilhada por todos os domínios fica em `src/shared/`:
- `shared/prisma/` — `PrismaModule` (global) e `PrismaService`.
- `shared/guards/` — apenas guards reutilizados por mais de um módulo (ex: `JwtAuthGuard`,
  `RolesGuard`, que protegem rotas de qualquer domínio).
- `shared/decorators/` — `@CurrentUser()`, `@Roles()`.

Regra de decisão: **só vai pra `shared/` o que já é usado por mais de um módulo.**
Se hoje só o Auth usa, fica no Auth. Promove pra `shared/` quando o segundo uso aparecer.

## 3. Regras de camada (obrigatórias, sem exceção)

**Controller**
- Recebe a requisição HTTP, aplica DTO + `ValidationPipe`.
- Extrai o usuário autenticado via `@CurrentUser()`.
- Chama o Service e retorna a resposta.
- Nunca acessa Repository diretamente. Nunca contém regra de negócio.

**Service**
- Contém toda a regra de negócio.
- Recebe o Repository via injeção de dependência no construtor.
- Nunca injeta `PrismaService` diretamente.
- Pode injetar Services de outros módulos quando precisar orquestrar (ex:
  `ContractService` injeta `HistoryService` para registrar alterações).

**Repository**
- Única camada autorizada a injetar `PrismaService`.
- Executa queries e retorna dados brutos ou tipos gerados pelo Prisma.
- Nunca contém regra de negócio.

## 4. Multi-tenancy (crítico, sem exceção)

Toda query de leitura ou escrita inclui `tenantId` extraído do usuário autenticado via JWT.

```typescript
// CORRETO
findAll(tenantId: string) {
  return this.prisma.contract.findMany({ where: { tenantId } });
}

// PROIBIDO
findAll() {
  return this.prisma.contract.findMany();
}
```

`tenantId` nunca é lido de query param, body ou param de rota — sempre do `@CurrentUser()`
extraído do Access Token. Isso vale também para updates e deletes: a query deve
filtrar por `tenantId` E pelo id do recurso, garantindo que um tenant nunca consiga
alterar dado de outro mesmo sabendo o ID exato do registro.

## 5. Padrão de Snapshot (Template → Contract)

`Template.fieldsConfig` guarda apenas a estrutura: quais campos existem, tipo e
obrigatoriedade.

```json
{
  "fields": [
    { "key": "clientName", "label": "Nome do Cliente", "type": "text", "required": true },
    { "key": "value", "label": "Valor", "type": "number", "required": true }
  ]
}
```

No momento da criação do contrato, o `ContractService` copia o `fieldsConfig` do
template ativo para dentro de `Contract.content`, junto com os valores preenchidos:

```json
{
  "snapshot": [
    { "key": "clientName", "label": "Nome do Cliente", "type": "text", "required": true }
  ],
  "values": {
    "clientName": "Empresa ABC"
  }
}
```

Alterações futuras no template **não afetam** contratos já criados, porque o contrato
carrega sua própria cópia da estrutura.

> Decisão pendente de definição na spec do módulo Contract: quando o usuário edita um
> contrato existente, se altera apenas `values` ou se versiona `content` inteiro
> guardando o estado anterior em `History`. Resolver no início da spec de Contract.

## 6. Tratamento de erros

Usar exclusivamente exceptions nativas do NestJS, com status code semanticamente
correto:

| Cenário | Exception | Status |
|---|---|---|
| Recurso não encontrado | `NotFoundException` | 404 |
| Dado inválido / DTO falhou | `BadRequestException` | 400 |
| Conflito (ex: e-mail já existe) | `ConflictException` | 409 |
| Não autenticado / token inválido | `UnauthorizedException` | 401 |
| Autenticado mas sem permissão (role) | `ForbiddenException` | 403 |

Não criar exception filters customizados nem formatos de erro próprios. O formato
padrão de erro do NestJS é suficiente.

## 7. Autenticação (JWT)

- **Access Token**: expiração de 15 minutos. Payload contém `sub` (id do usuário),
  `tenantId`, `role`, `type: 'access'`.
- **Refresh Token**: expiração de 7 dias. Payload contém `sub`, `type: 'refresh'`.
- **Sem persistência de refresh token.** Stateless puro: qualquer refresh token com
  assinatura válida, não expirado e `type === 'refresh'` gera um novo par de tokens.
  Não há rotação, não há uso único, não há revogação individual.
  - *Trade-off consciente*: um refresh token vazado continua válido até expirar
    naturalmente (até 7 dias). Para este escopo de projeto, manter simples (YAGNI)
    pesa mais do que implementar revogação — decisão documentada aqui e no README.
- Ambos os tokens retornam no **body** da resposta de login/refresh (não via
  `Set-Cookie` do servidor).
- O **frontend** grava os tokens em cookies **não-httpOnly** (legíveis por JS) e os
  mantém também no `SessionContext` em memória.
  - *Trade-off consciente*: cookie não-httpOnly é acessível via JS, logo exposto a
    XSS. Aceito para este escopo; em produção real a recomendação seria httpOnly +
    CSRF token.
- `JwtAuthGuard` valida o Access Token e rejeita qualquer token com
  `type !== 'access'` (um refresh token nunca deve autenticar uma rota protegida).
- `POST /auth/refresh` recebe o refresh token no body, valida `type === 'refresh'`,
  e emite um novo par.
- Logout é responsabilidade exclusiva do client: apagar os cookies. Não existe
  endpoint de logout no backend (não há estado para invalidar).

## 8. Paginação e formato de resposta

Endpoints de listagem paginada retornam envelope:

```json
{
  "data": [ ... ],
  "meta": { "total": 42, "skip": 0, "take": 10 }
}
```

`total` vem de `prisma.<model>.count()` executado em paralelo ao `findMany` (via
`Promise.all`) com o mesmo filtro de `where`. Endpoints de item único (`GET /x/:id`)
retornam o objeto puro, sem envelope.

## 9. Testes

Apenas testes unitários, focados na camada Service (regra de negócio). Repository e
Controller não são testados isoladamente neste escopo — são cobertos indiretamente
pela validação manual via Docker. Mock do Repository é feito via `jest.fn()` /
`createMock` do `@nestjs/testing`. Teste nasce junto com o Service, na mesma tarefa
da spec, não em etapa separada.

## 10. Frontend — mesma lógica estrutural

O frontend segue a mesma filosofia modular do backend: cada domínio tem sua pasta
com componentes, hooks e chamadas de API isolados. Estrutura de referência:

```
frontend/src/
├── app/                    # Rotas (Next.js App Router)
├── modules/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api.ts
│   ├── tenant/
│   ├── template/
│   ├── contract/
│   └── history/
├── shared/
│   ├── context/
│   │   └── session-context.tsx
│   ├── components/         # Componentes verdadeiramente genéricos (Button, Input)
│   └── lib/
│       └── api-client.ts   # Cliente HTTP base, injeta Access Token no header
└── 
```

Mesma regra de `shared/`: só sobe pra lá o que mais de um módulo usa.

## 11. Referência de nomenclatura

Ver `.specs\memory\nomenclature.md` para convenções de nomes de arquivos, classes,
variáveis e pastas. Não duplicar essas regras aqui.

## 12. Exemplo de referência

Após a implementação do módulo `Tenant` (primeiro módulo do projeto), o código real
desse módulo passa a ser a referência viva de como Controller, Service, Repository
e DTOs se conectam na prática. Specs futuras devem apontar para
`backend/src/modules/tenant/` como exemplo, em vez de repetir snippets aqui.