# RotaPro Driver

Aplicativo React/Vite para operação de motoristas, com frontend mobile-first e backend HTTP Fastify integrado. O backend **não utiliza banco de dados**: por padrão trabalha com repositórios em memória e pode opcionalmente gravar um snapshot JSON local para desenvolvimento. A camada `server/store.js` mantém o contrato de persistência abstrato para uma implementação futura sem alterar os endpoints.

## Execução rápida

```bash
npm install
npm run dev
```

`npm run dev` inicia o backend em `http://localhost:8787` e o frontend em `http://localhost:5173`, com `VITE_API_MODE=http`.

Comandos alternativos:

```bash
npm run server       # somente API
npm run dev:mock     # somente frontend usando adaptador local
npm run build        # build de produção do frontend
npm run test:server  # testes de contrato da API sem banco
```

O usuário demo é:

```text
CPF: 12345678900
Senha: 1234
```

## Qualidade e tooling

```bash
npm run typecheck          # tsc --noEmit (strict)
npm run lint               # ESLint (flat config, jsx-a11y como erro em código novo)
npm run lint:fix
npm run format              # Prettier --write
npm run format:check
npm run test                 # Vitest + Testing Library + vitest-axe
npm run test:watch
npm run test:server          # node --test, contrato da API Fastify
npm run test:visual:baseline # recaptura as 16 telas em 390x844 (precisa do dev server rodando)
npm run test:visual:compare  # compara contra tests/visual/baseline
```

Este projeto está em refatoração ativa (TypeScript, remoção do dispatcher de
cliques por texto, offline-first, etc.). Estado real, decisões e pendências
de produto ficam em `MIGRATION_PROGRESS.md`, `docs/DECISIONS.md` e
`docs/OPEN_QUESTIONS.md` — não neste README.

CI (`.github/workflows/ci.yml`) roda `typecheck → lint → test → build` no
frontend e `test:server` no backend a cada push/PR.

## Configuração

Copie `.env.example` se quiser configurar a API manualmente. Variáveis principais:

| Variável          | Padrão                       | Descrição                                                             |
| ----------------- | ---------------------------- | --------------------------------------------------------------------- |
| `VITE_API_MODE`   | `mock` fora de `npm run dev` | `mock` ou `http`                                                      |
| `VITE_API_URL`    | `http://localhost:8787`      | URL da API usada pelo frontend                                        |
| `API_PORT`        | `8787`                       | Porta do Fastify                                                      |
| `CORS_ORIGIN`     | `*`                          | Origem permitida em desenvolvimento                                   |
| `ROTA_STORE_FILE` | vazio                        | Se definido, salva snapshot JSON local; sem ele, tudo fica em memória |

Não são necessários PostgreSQL, Prisma, migrations, Redis, BullMQ, MinIO ou qualquer serviço externo.

## Arquitetura do backend

`server/store.js` define o repositório abstrato com `get`, `set`, `update` e `snapshot`. A implementação atual é `createMemoryStore`, com seed determinístico do wireframe e snapshot JSON opcional. `server/app.js` concentra autenticação, regras de domínio, idempotência e contratos HTTP; `server/index.js` apenas inicializa o serviço. Eventos em tempo real usam um event bus em memória e SSE, sem broker externo.

A autenticação de desenvolvimento usa `accessToken` (15 minutos) e `refreshToken` rotativo, e credenciais mockadas com senha em texto puro no seed. **Aviso de segurança confirmado (ver `docs/SECURITY.md` a partir da Fase 7):** o token atual (`server/app.js`, funções `token()`/`decode()`) é apenas `base64url(payload) + '.' + hexAleatório` — não há assinatura HMAC nem verificação de integridade, ou seja, qualquer pessoa pode forjar um token válido para qualquer motorista. Isso ainda não foi corrigido; não rode este backend fora de `localhost` até a Fase 7 (hash de senha + HMAC) estar concluída. O OTP de desenvolvimento é `123456` e é registrado pelo logger. Em produção, o repositório, o hash de senha, o provedor de OTP e o storage podem ser substituídos atrás das mesmas fronteiras de serviço.

## API `/v1`

| Grupo           | Endpoints                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------- |
| Auth            | `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/otp/request`, `/auth/otp/verify` |
| Motorista       | `GET /me`                                                                                    |
| Rotas           | `GET /routes/today`, `/routes/history`, `/routes/:id`                                        |
| Paradas         | `POST /stops/:id/arrive`, `/deliver`, `/fail`                                                |
| Checklists      | `GET/POST /checklists`                                                                       |
| Recibos         | `GET /receipts`, `/receipts/:id`, `POST /receipts/:id/sign`, `/contest`                      |
| Suporte         | `GET/POST /tickets`                                                                          |
| Notificações    | `GET /notifications`, `POST /notifications/:id/read`                                         |
| Push/arquivos   | `POST /push/subscribe`, `/uploads/presign`                                                   |
| Eventos         | `GET /events` via Server-Sent Events                                                         |
| Backoffice demo | `POST /admin/routes/import` protegido por papel/demo                                         |

Operações de escrita aceitam `Idempotency-Key`. Entregas, ocorrências, checklists e recibos atualizam o estado compartilhado do frontend quando `VITE_API_MODE=http`.

## Estado atual e limites intencionais

O backend já está funcional e integrado para o fluxo principal de login, rota, entrega, falha, recibos, checklists, notificações, SSE e chamados. Jobs de PDF/push são representados por eventos e pontos de extensão em memória; não há worker externo ou fila persistente por decisão explícita de não criar Redis/BullMQ nesta etapa. O snapshot JSON é opcional e não é um banco de dados.
