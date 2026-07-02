# Spec: Onboarding de Tenant

## 1. Visão Geral

Esta mudança implementa o fluxo de criação de um novo tenant na plataforma,
junto com seu primeiro usuário (Admin). É o ponto de entrada de qualquer empresa
cliente no sistema: sem essa rota, não existe tenant e não existe usuário possível,
já que `User.tenantId` é obrigatório no schema.

O fluxo é público (não exige autenticação prévia, pois ainda não existe usuário)
e transacional: tenant e usuário Admin são criados na mesma operação, ou nenhum
dos dois é criado.

Ao final do onboarding, o sistema **não** realiza login automático. O usuário criado
deve autenticar manualmente em `POST /auth/login` (spec separada). Isso mantém o
onboarding focado em uma única responsabilidade: criar o registro. A emissão de
tokens é responsabilidade exclusiva do módulo Auth.

## 2. Referências

- Nomenclatura: `.specs/memory/nomenclature.md`
- Arquitetura: `.specs/memory/architecture.md`
- Schema Prisma: `backend/prisma/schema.prisma` (models `Tenant`, `User`, enum `Role`)
- Regra de multi-tenancy (seção 4 do architecture.md): não se aplica à criação do
  tenant em si (não há `tenantId` ainda neste momento), mas se aplica a partir do
  primeiro recurso criado depois do onboarding.

## 3. Decisões de Negócio desta Feature

- O primeiro usuário criado no onboarding **sempre** recebe `role: ADMIN`. Não é
  parametrizável via payload — está fixo na regra de negócio, não no DTO.
- E-mail é único globalmente na tabela `User` (`@unique` no schema), não único por
  tenant. Se o e-mail já existir em qualquer tenant, a operação falha.
- Senha mínima de 6 caracteres, tipo string. Sem exigência de confirmação de senha
  (`confirmPassword`) no DTO — validação de força de senha fora de escopo.
- Hash de senha usa `hash.provider` que deve ser criado como um provider em src/shared/hash/, pois será consumido por múltiplos módulos no futuro. 
  Deve ter 2 métodos (encrypt e compare usando bcrypt). Use-o injetando no `tenant.service` ou outro módulo que seja necessário.
- A criação de tenant + usuário deve ser atômica: se a criação do usuário falhar
  por qualquer motivo, o tenant não pode ficar órfão no banco. Usar transação do
  Prisma (`prisma.$transaction`).

## 4. Tarefas

### 4.1 Negócio

- [ ] Definir `CreateTenantOnboardingDto` com os campos: `tenantName` (string,
      obrigatório, `MinLength(2)`), `adminEmail` (string, `IsEmail`),
      `adminPassword` (string, `MinLength(6)`).
- [ ] Regra: se `adminEmail` já existe na tabela `User` (de qualquer tenant),
      lançar `ConflictException` ("E-mail já cadastrado").
- [ ] Regra: criação de `Tenant` e `User` (role `ADMIN`, vinculado ao
      `tenant.id` recém-criado) ocorre dentro de uma única transação Prisma.
- [ ] Regra: senha é hasheada via `HashProvider` com bcrypt antes de persistir. Nunca a senha
      em texto puro chega ao Repository.

### 4.2 Backend

- [ ] Gerar módulo via CLI: `nest g module modules/tenant`,
      `nest g controller modules/tenant --no-spec`,
      `nest g service modules/tenant --no-spec`.
- [ ] Criar `modules/tenant/dto/create-tenant-onboarding.dto.ts` com os campos e
      validações da seção 4.1, usando `class-validator`.
- [ ] Criar `modules/tenant/tenant.repository.ts`:
      - Método `createWithAdmin(data: { tenantName: string; adminEmail: string; adminPasswordHash: string })`,
        executa a transação Prisma criando `Tenant` e `User` (role `ADMIN`) e
        retorna ambos os registros criados.
      - Método `findUserByEmail(email: string)` — usado pela validação de
        e-mail duplicado (reaproveitável futuramente pelo `AuthModule` se fizer
        sentido na spec de Auth).
- [ ] Criar `shared/hash/hash.provider.ts` (provider injetável simples, não
      módulo próprio) com métodos `hash(password: string)` e
      `compare(password: string, hash: string)` usando `bcrypt`.
- [ ] Criar `modules/tenant/tenant.service.ts`:
      - Método `onboard(dto: CreateTenantOnboardingDto)`: valida e-mail duplicado
        via Repository, hasheia a senha via `hash.provider` (injetado), chama `tenantRepository.createWithAdmin`, retorna o
        tenant e o usuário criado (sem o hash da senha no retorno). 
- [ ] Criar `modules/tenant/tenant.controller.ts`:
      - Rota `POST /tenant/onboarding`, pública (sem `JwtAuthGuard`), recebe o
        DTO, chama `tenantService.onboard`, retorna `201 Created` com o tenant
        e usuário criado (sem senha/hash no payload de resposta). 
- [ ] Retornar os registros criados utilizando o select ou omit do Prisma para garantir que o password nunca retorne
      na memória.
- [ ] Registrar `TenantModule` no `AppModule`.
- [ ] Criar teste unitário `tenant.service.spec.ts`: cobrir o caso de sucesso
      (cria tenant + admin) e o caso de e-mail duplicado (`ConflictException`),
      com `TenantRepository` e `HashProvider` mockados via `jest.fn()`.

### 4.3 Frontend

- [ ] Criar rota `app/(public)/onboarding/page.tsx` com formulário: nome do tenant,
     e-mail do admin, senha do admin.
- [ ] Construir a UI utilizando TailwindCSS e componentes do Shadcn UI (Input, Button, Label, Form, Toast/Sonner) para um 
      visual limpo e profissional.
- [ ] Criar formulário integrado com react-hook-form e zod para validação client-side: tenantName (obrigatório, min 2),
    adminEmail (formato válido), adminPassword (min 6).
- [ ] Criar hook `modules/tenant/hooks/useOnboarding.ts`: deve encapsular a chamada à API num bloco try/catch, gerenciar o 
      estado de loading do botão de submit e  redireciona para `/login`. Exibir mensagens descritivas ao usuário via Toast(error o u sucesso).
- [ ] Regra de UX: Em caso de sucesso (201), exibir Toast de sucesso e redirecionar imediatamente para a tela de /login.
      Em caso de erro 409 (E-mail duplicado), exibir o erro visualmente no formulário ou em um Toast de erro claro.

## 5. Checklist de Execução

(marcar conforme execução real)

- [ ] 4.1 Negócio — regras definidas e validadas
- [ ] 4.2 Backend — módulo implementado e testado
- [ ] 4.3 Frontend — tela funcional integrada à API

## 6. Evidência e Rastreabilidade

> Preencher ao final da execução de cada bloco de tarefas.

### Backend
- **Observações técnicas**:
- **Problemas encontrados e resolução**:

### Frontend
- **Observações técnicas**:
- **Problemas encontrados e resolução**: