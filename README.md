# ByteSolutions Ticket Management

Sistema de gerenciamento de tickets com:

- Backend: Node.js + Express + PostgreSQL
- Frontend: React (Vite)
- Auth com JWT (Owner + funcionários)
- CRUD de funcionários (área Admin)
- CRUD de tickets, follow-up, busca avançada e dashboard

## 1) Banco de dados recomendado

PostgreSQL é a melhor opção para este projeto porque oferece:

- melhor integridade relacional para tickets, usuários e histórico;
- ótima performance em filtros e buscas combinadas;
- escalabilidade para quando sair de ambiente local para servidor.

## 2) Configuração do PostgreSQL

1. Crie o banco:
   - `bytesolutions_tickets`
2. Copie `backend/.env.example` para `backend/.env` e ajuste as credenciais.
3. Execute os scripts SQL:
   - `backend/sql/schema.sql`
   - `backend/sql/seed_owner.sql`

Usuário inicial:

- Email: `owner@bytesolutions.com`
- Senha: `Admin@123`

Altere a senha depois do primeiro acesso.

## 3) Rodar backend

```bash
cd backend
npm install
npm run dev
```

API: `http://localhost:4000/api`

## 4) Rodar frontend

```bash
cd frontend
npm install
npm run dev
```

Web: `http://localhost:5173`

## Funcionalidades principais

- Login de Owner e funcionários ativos.
- Área separada de Admin (somente Owner):
  - CRUD de funcionários com username, email, senha, role, job title e status.
  - Exclusão de tickets em massa (todos ou selecionados), com confirmação.
- Área de Tickets:
  - criação e atualização de tickets;
  - fila principal e fila pessoal;
  - follow-up com histórico por usuário (nome, email, role, mensagem e data).
- Dashboard (Owner):
  - métricas por funcionário (fechados, atribuídos, em andamento);
  - filtro por período (today, week, month).
- Busca avançada integrada:
  - ID, título, descrição, data de criação, prioridade, data de atualização, role group, applied by, status.
- Cores visuais:
  - prioridade e status coloridos conforme regra solicitada.
- Idiomas:
  - Português, Inglês e Espanhol.
