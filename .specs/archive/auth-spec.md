# Spec: Autenticação (Auth)

## 1. Visão Geral

Esta mudança implementa a autenticação da plataforma via JWT (Access + Refresh
Token) e o cadastro de novos usuários **dentro de um tenant já existente**, feito
por um Admin autenticado.

Este módulo é o que dá acesso à plataforma a quem já tem tenant criado. Três rotas compõem o fluxo:

- `POST /auth/login` — pública, autentica usuário existente, retorna par de tokens.
- `POST /auth/register` — protegida, exige Admin autenticado; cria um novo usuário
  (Admin ou Viewer) **dentro do tenant do Admin que está fazendo a requisição**.
- `POST /auth/refresh` — pública (recebe o refresh token no body, não depende de
  Access Token válido), emite novo par de tokens.

Diferença para o Onboarding: onboarding cria tenant + primeiro Admin do zero, sem
autenticação. Register pressupõe tenant e Admin já existentes, e serve para esse
Admin popular seu tenant com mais usuários.

## 2. Referências

- Nomenclatura: `.specs/memory/nomenclature.md`
- Arquitetura: `.specs/memory/architecture.md`
- Schema Prisma: `backend/prisma/schema.prisma` (model `User`, enum `Role`)

## 3. Decisões de Negócio desta Feature

### Estratégia de tokens
- **Access Token**: expiração de 15 minutos. Payload: `sub` (id do usuário),
  `tenantId`, `role`, `type: 'access'`.
- **Refresh Token**: expiração de 7 dias. Payload: `sub`, `type: 'refresh'`.
- **Sem persistência de refresh token.** Stateless: qualquer refresh token com
  assinatura válida, não expirado e `type === 'refresh'` gera novo par. Sem
  rotação, sem uso único, sem revogação individual.
- Tokens retornam no **body** da resposta (`POST /auth/login` e
  `POST /auth/refresh`), nunca via `Set-Cookie` do servidor.
- `JwtAuthGuard` rejeita qualquer token com `type !== 'access'` — um refresh
  token nunca autentica uma rota protegida.
- Geração e validação de tokens usam `@nestjs/jwt` (`JwtService`).

### Register (criação de usuário por Admin)
- Exige `JwtAuthGuard` + `RolesGuard` restrito a `role: ADMIN`.
- O novo usuário é criado **sempre** no mesmo `tenantId` do Admin autenticado
  (extraído do `@CurrentUser()`, nunca do body da requisição) — reforço direto
  da regra de multi-tenancy do `architecture.md`.
- DTO de register permite definir a `role` do novo usuário (`ADMIN` ou `VIEWER`).
- E-mail único globalmente (mesma regra do Onboarding) — `ConflictException` se
  já existir.
- Senha mínima de 6 caracteres, hasheada via `hash.provider` antes de persistir.

### Login
- Busca usuário por e-mail; se não existir, `UnauthorizedException` genérica
  ("Credenciais inválidas") — não revelar se o problema foi e-mail ou senha,
  por segurança.
- Compara senha via `HashProvider.compare`.

## 4. Tarefas

### 4.1 Negócio

- [ ] Regra de login: e-mail não encontrado ou senha incorreta retornam a mesma
      mensagem genérica de erro (não vazar qual dos dois falhou).
- [ ] Regra de register: `tenantId` do novo usuário é sempre o do Admin logado,
      nunca aceito via body.
- [ ] Regra de refresh: token deve ter `type === 'refresh'` e assinatura válida;
      qualquer outro caso retorna `UnauthorizedException`.
- [ ] Payload do Access Token deve conter `sub`, `tenantId`, `role` — esses três
      dados são o que `@CurrentUser()` vai expor para todos os outros módulos.

### 4.2 Backend

- [ ] Instalar `@nestjs/jwt`, `@nestjs/passport` e `passport-jwt` e configurar `jwt.strategy`
      (registrar com secret via variável de ambiente — `JWT_SECRET` no `.env`).
- [ ] Gerar módulo via CLI: `nest g module auth`,
      `nest g controller auth --no-spec`,
      `nest g service auth --no-spec`.
- [ ] Criar `auth/jwt.strategy.ts` estendendo `PassportStrategy(Strategy)`. Ele deve extrair o token via `ExtractJwt.fromAuthHeaderAsBearerToken()` e usar o `JWT_SECRET`. 
      No método `validate(payload)`, validar estritamente se `payload.type === 'access'`. Se não for, lançar `UnauthorizedException`.
- [ ] Consumir o `HashProvider` (previamente criado no `shared/auth/hash`) injetando-o no `auth.service` para a comparação de senhas.
- [ ] Criar DTOs com mensagem de erro:
    - `auth/dto/login.dto.ts`: email,password. 
    - `auth/dto/register.dto.ts`: email, password, role(`shared/enums/Role`)
    - `auth/dto/refresh-token.dto.ts`: `refreshToken` (string, obrigatório).
- [ ] Criar `auth/auth.controller.ts`:
      - `POST /auth/login` — pública, retorna par de tokens.
      - `POST /auth/register` — protegida com `JwtAuthGuard` + `RolesGuard(ADMIN)`,
        usa `@CurrentUser()` para extrair o Admin logado.
      - `POST /auth/refresh` — pública, retorna novo par de tokens.
- [ ] Criar `auth/auth.repository.ts`:
      - `findUserByEmail(email: string)` (retorna usuário com hash da senha, usado só internamente pelo Service).
      - `createUser(data: { email, passwordHash, role, tenantId })`: salva atrelando ao tenant.
- [ ] Criar `auth/auth.service.ts`:
      - `login(dto: LoginDto)`: busca usuário, valida senha via `HashService`,
        gera par de tokens via `JwtService`, retorna `{ accessToken, refreshToken }`.
      - `register(dto: RegisterDto, currentUser: CurrentUserPayload)`: valida
        e-mail duplicado, hasheia senha, cria usuário no `tenantId` do
        `currentUser`, retorna usuário criado sem senha.
      - `refresh(dto: RefreshTokenDto)`: valida o refresh token (assinatura +
        `type === 'refresh'`), busca usuário pelo `sub` para montar payload
          atualizado (`tenantId`, `role` podem ter mudado), gera novo par de
          tokens.
      - Método privado `generateTokenPair(user)`: centraliza a geração dos dois
        tokens para não duplicar lógica entre `login` e `refresh`.
- [ ] Criar `shared/decorators/user.decorator.ts`: extrai `{ sub, tenantId, role }` do `request.user` (populado pela JWT Strategy).
- [ ] Criar `shared/guards/roles.guard.ts` + `shared/decorators/roles.decorator.ts` (`@Roles('ADMIN')`): injeta o `Reflector` no Guard
      para comparar as roles definidas no decorator da rota com a role extraída de `request.user`.
- [ ] Criar `auth/jwt-auth.guard.ts`: estende `AuthGuard('jwt')`. Ele vai acionar a `jwt.strategy` automaticamente para proteger a rota
- [ ] Criar teste unitário `auth.service.spec.ts`: cobrir login com sucesso,
      login com e-mail inexistente, login com senha incorreta, register com
      e-mail duplicado, refresh com token de tipo errado — `auth.repository`,
      `hash.provider` e `JwtService` mockados via `jest.fn()`.

### 4.3 Frontend

- [ ] Criar `shared/context/session-context.tsx`: `SessionContext` com estado
      `{ user, accessToken, refreshToken }`, funções `login`, `logout`,
      `refreshSession`. Lê/grava tokens em cookies(js-cookies) não-httpOnly.
- [ ] Utilizar a biblioteca js-cookie para persistir e ler o accessToken e refreshToken dentro do provider do contexto. O contexto React deve ser a fonte da verdade da UI.
- [ ] Criar `shared/lib/api-client.ts`: cliente HTTP base que injeta
      `Authorization: Bearer <accessToken>` em toda requisição, lendo do
      `SessionContext` 
- [ ] Configurar um Axios Interceptor no api-client.ts:
      1. Injetar o `Authorization: Bearer <accessToken>` lendo diretamente do js-cookie.
      2. Se uma requisição receber erro 401, o interceptor deve pausar, chamar POST `/auth/refresh` com o refresh token atual, 
      atualizar os cookies com os novos tokens e re-executar a chamada que falhou. Se falhar novamente, limpar os cookies e forçar logout (redirecionar para /login).
- [ ] Criar `modules/auth/api.ts`: funções login(data) e register(data) chamando os endpoints da API usando o api-client.
- [ ] Criar hook modules/auth/hooks/useAuth.ts: encapsula a chamada de login/logout, conecta com o SessionContext para salvar os tokens recebidos e expõe estado de loading.
- [ ] Implementar lógica de refresh automático: ao receber `401` de qualquer
      chamada da API, tentar `refreshToken` uma vez; se falhar, limpar sessão e
      redirecionar para `/login`.
- [ ] Construir as UIs utilizando Tailwind CSS e componentes do Shadcn UI quando necessário, com formulários tipados via react-hook-form e zod.
- [ ] Criar `app/(public)/login/page.tsx`: formulário de e-mail/senha. Em caso de sucesso, chama iniciarSessao e redireciona para o dashboard.
- [ ] Criar `app/(dashboard)/users/new/page.tsx`: Tela restrita para o Admin cadastrar um novo usuário (usando o endpoint de register). 
      Só deve ser acessível se user.role === 'ADMIN'.

## 5. Checklist de Execução

- [ ] 4.1 Negócio — regras definidas e validadas
- [ ] 4.2 Backend — módulo implementado e testado
- [ ] 4.3 Frontend — login, register e refresh funcionais e integrados

## 6. Evidência e Rastreabilidade

### Backend
- **Observações técnicas**:
- **Problemas encontrados e resolução**:

### Frontend
- **Observações técnicas**:
- **Problemas encontrados e resolução**: