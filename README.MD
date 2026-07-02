# Executiva Service - SaaS de Gestão de Contratos

Plataforma Multi-tenant para geração, gestão e histórico de contratos dinâmicos.

--- 

## 🚀 Como Rodar o Projeto

1. **Suba a infraestrutura (PostgreSQL):**
O ambiente foi totalmente conteinerizado. Um único comando sobe o Banco de Dados, a API e o Frontend, executando as migrations e o seed automaticamente.

1. Clone o repositório.
2. Na raiz do projeto, execute:
```bash
   docker compose up --build
```
--- 

## 🔑 Credenciais de Acesso (Seed)
O banco já vem populado com dois tenants e os seguintes usuários para teste:

Tenant Alpha:
- Admin: admin@alpha.com | Senha: password123
- Viewer: viewer@alpha.com | Senha: password123

Tenant Beta:
-   Admin: admin@beta.com | Senha: password123

--- 

## 🛠️ Decisões Técnicas

- **Modelagem JSONB vs EAV:** Adotada abordagem de Snapshot via JSONB para manter o histórico imutável de dados. Isso evita a complexidade de tabelas e a lentidão de múltiplos JOINs gerados pelo padrão Entity-Attribute-Value (EAV).
- **Spec-Driven Development (SDD):** Utilização de ferramentas de IA integradas à especificação técnica da API para acelerar a geração de boilerplate e código base. A abordagem aumentou drasticamente a produtividade, permitindo focar o tempo de desenvolvimento na arquitetura, segurança e regras de negócio.
- **Paradigma Funcional / Procedural:** Opção por não utilizar Programação Orientada a Objetos (POO). A escolha reduz a complexidade desnecessária e o excesso de abstrações (boilerplate) para o contexto de um teste técnico.
- **Desacoplamento do ORM:** As queries do Prisma foram isoladas fora da camada de serviços. Isso impede o acoplamento direto da lógica de negócio ao ORM, facilitando futuras trocas de tecnologia ou testes unitários.
- **JWT Stateless com Refresh Token:** Implementação de autenticação stateless via JWT com Refresh Tokens armazenados em cookies. A estratégia equilibra segurança e performance, evitando a infraestrutura adicional de persistência de sessões em banco de dados para este escopo.


