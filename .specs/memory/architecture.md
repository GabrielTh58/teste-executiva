# Arquitetura do Projeto

## 1. Filosofia

- **YAGNI + Clean Code**: nada é construído antes de ser necessário. Sem abstrações
  especulativas, sem camadas extras "pra garantir flexibilidade futura".
- **Modularidade por domínio**: cada domínio é um módulo NestJS isolado, com suas
  próprias camadas internas. Comunicação entre domínios acontece via injeção de
  um Service no outro (nunca via Repository de outro módulo).

## 2. Organização de módulos (backend)

### Geração via CLI

Módulos, controllers e services nunca são criados manualmente arquivo por arquivo
— sempre via CLI do Nest, executado a partir de `backend/`:

```bash
nest g module <dominio>
nest g controller <dominio> --no-spec
nest g service <dominio> --no-spec
```

O `--no-spec` evita gerar um `.spec.ts` vazio; o teste é criado manualmente quando
a spec da feature pedir, com conteúdo real desde o início.

Para os Repositories, use o schematic de provider no nest:
`nest g provider <dominio>.repository --no-spec`  

### Onde cada arquivo vive

- **DTOs**: dentro de `<module>/dto/`, um arquivo por DTO
  (`create-<dominio>.dto.ts`, `update-<dominio>.dto.ts`). Nunca soltos na raiz do módulo.
- **Algo exclusivo de um módulo** (um Guard específico, um Service auxiliar como o
  `HashProvider` do Auth): fica **dentro do próprio módulo**, nunca em `shared/`,
  a menos que um segundo módulo precise reutilizá-lo.
- **Guards e decorators reutilizados por mais de um módulo**: `shared/guards/` e
  `shared/decorators/` respectivamente.
- **Acesso ao banco**: `shared/prisma/` — `PrismaModule` (global) e `PrismaService`.
  Nenhum outro módulo declara seu próprio acesso ao Prisma; todos injetam
  `PrismaService` apenas dentro do seu próprio Repository (ver regra de camada,
  seção 3).

Regra de decisão geral: **só vai pra `shared/` o que já é usado por mais de um
módulo.** Nada sobe para lá de forma especulativa.

## 3. Regras de camada (obrigatórias, sem exceção)

**Controller**
- Recebe a requisição HTTP, aplica DTO + `ValidationPipe`.
- Extrai o usuário autenticado via decorator (`@CurrentUser()`).
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

Toda query de leitura ou escrita inclui `tenantId` extraído do usuário autenticado via JWT. Exceto o endpoint de onboarding (tenant/onboarding)

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

`tenantId` nunca é lido de query param, body ou param de rota, sempre vem do
`@CurrentUser()` extraído do Access Token. Isso vale também para updates e deletes:
a query deve filtrar por `tenantId` E pelo id do recurso, garantindo que um tenant
nunca consiga alterar dado de outro mesmo sabendo o ID exato do registro.

## 5. Tratamento de erros

Usar exclusivamente exceptions nativas do NestJS, com status code semanticamente
correto:

| Cenário | Exception | Status |
|---|---|---|
| Recurso não encontrado | `NotFoundException` | 404 |
| Dado inválido / DTO falhou | `BadRequestException` | 400 |
| Conflito (ex: e-mail já existe) | `ConflictException` | 409 |
| Não autenticado / token inválido | `UnauthorizedException` | 401 |
| Autenticado mas sem permissão (role) | `ForbiddenException` | 403 |

Não criar exception filters customizados nem formatos de erro próprios.

## 6. Frontend — mesma lógica estrutural

O frontend segue a mesma filosofia modular do backend: cada domínio tem sua pasta
com componentes, hooks e chamadas de API isolados. Estilização via **Tailwind CSS**.
Lógica de estado e regra de apresentação ficam em **hooks** e **contexts**, não
dentro dos componentes — componente deve ser stateless(o mais "burro" possível), só renderiza.

```
frontend/src/
├── app/                    # Rotas (Next.js App Router)
├── modules/
│   ├── auth/
│   ├── tenant/
│   ├── template/
│   ├── contract/
│   └── history/
├── shared/
│   ├── context/
│   ├── components/         # Componentes verdadeiramente genéricos (Button, Input)
│   └── lib/
└── ...
```

Mesma regra de `shared/`: só sobe pra lá o que mais de um módulo usa.
Estilização via **Tailwind CSS** e componentes base gerados via **Shadcn UI** (que devem ficar em `shared/components/ui/`).

## 7. Referência de nomenclatura

Ver `.specs/shared/nomenclatura.md` para convenções de nomes de arquivos, classes,
variáveis e pastas.