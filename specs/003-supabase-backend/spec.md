# Feature Specification: Supabase Backend

**Feature Branch**: `003-supabase-backend`  
**Created**: 2026-05-09  
**Status**: Draft  
**Input**: User description: planeje o desenvolvimento do backend

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Autenticação de Usuário (Priority: P1)

O usuário abre o aplicativo e faz login com seu email e senha (ou OAuth).
Após autenticar, o app associa todas as transcrições à conta do usuário.

**Why this priority**: Sem autenticação, não é possível identificar a qual
usuário pertence cada transcrição. É a fundação para todos os outros
recursos do backend.

**Independent Test**: Abrir o app, clicar em "Login", criar uma conta com
email e senha. Verificar que o app exibe o email do usuário logado e o
estado de autenticação persiste entre reinicializações do app.

**Acceptance Scenarios**:

1. **Given** o usuário não está logado, **When** ele abre o app,
   **Then** uma tela de login/cadastro é exibida
2. **Given** o usuário está na tela de login, **When** ele cria uma conta
   com email e senha válidos, **Then** a conta é criada e o usuário é
   redirecionado ao app autenticado
3. **Given** o usuário está logado, **When** ele fecha e reabre o app,
   **Then** a sessão persiste (token de refresh)
4. **Given** o usuário está logado, **When** ele clica em "Logout",
   **Then** a sessão é encerrada e a tela de login é exibida

---

### User Story 2 - Refinamento via Backend (Priority: P1)

Após a transcrição do áudio, o app envia o texto bruto para o backend.
O backend processa com IA (LLM) e retorna o texto refinado. O backend
também salva a transcrição no banco de dados. O app copia o texto
refinado para a área de transferência.

**Why this priority**: Este é o pipeline central de valor do Monolog —
transcrever, refinar com IA, e disponibilizar o resultado. O backend
elimina a necessidade da chave de IA no desktop e persiste os dados.

**Independent Test**: Fazer login, gravar áudio, parar a gravação.
Verificar que o texto refinado aparece na UI e é copiado para a área
de transferência. Verificar que o texto aparece no histórico.

**Acceptance Scenarios**:

1. **Given** o usuário está logado e gravou um áudio, **When** a
   transcrição termina, **Then** o texto bruto é enviado ao backend
2. **Given** o backend recebe o texto bruto, **When** o processamento
   com IA termina, **Then** o texto refinado é retornado ao app
3. **Given** o backend retorna o texto refinado, **When** o app recebe,
   **Then** o texto é copiado para a área de transferência
4. **Given** o processamento termina, **When** a transcrição é salva,
   **Then** o registro fica disponível no histórico do usuário
5. **Given** a conexão com o backend falha, **When** a transcrição
   termina, **Then** o app usa o refinamento local (Groq direto) como
   fallback, e sincroniza quando a conexão for restaurada

---

### User Story 3 - Histórico de Transcrições (Priority: P2)

O usuário pode visualizar todas as suas transcrições anteriores em uma
lista no app. Cada item mostra a data, o texto refinado (com opção de
ver o texto bruto), e botões para copiar ou excluir.

**Why this priority**: O valor do Monolog cresce com o tempo — o usuário
acumula um arquivo de transcrições que pode ser consultado.

**Independent Test**: Fazer login, realizar 3 gravações. Navegar pelo
histórico e ver todas as 3 transcrições listadas com data e texto.
Copiar uma transcrição antiga. Excluir uma transcrição.

**Acceptance Scenarios**:

1. **Given** o usuário está logado, **When** ele abre o histórico,
   **Then** todas as transcrições são exibidas ordenadas da mais recente
   para a mais antiga
2. **Given** o histórico está visível, **When** o usuário clica em uma
   transcrição, **Then** o texto completo é exibido com opção de copiar
3. **Given** uma transcrição está visível, **When** o usuário clica em
   excluir, **Then** a transcrição é removida do banco de dados
4. **Given** o usuário está offline, **When** ele abre o histórico,
   **Then** as transcrições em cache local são exibidas (com indicador
   de dados offline)

---

### User Story 4 - Sincronização em Tempo Real (Priority: P3)

O usuário tem o Monolog instalado em dois computadores. Ele grava uma
transcrição no computador A. Imediatamente, o histórico no computador B
mostra a nova transcrição sem necessidade de refresh manual.

**Why this priority**: Sincronização multi-dispositivo é o diferencial
que torna o Monolog uma ferramenta profissional, não apenas um utilitário
local.

**Independent Test**: Logar com a mesma conta em duas instâncias do app.
Gravar no dispositivo A. Verificar que a transcrição aparece no
histórico do dispositivo B em menos de 5 segundos.

**Acceptance Scenarios**:

1. **Given** duas instâncias do app logadas na mesma conta,
   **When** uma nova transcrição é criada em uma delas,
   **Then** a transcrição aparece na outra instância em até 5 segundos
2. **Given** uma transcrição é excluída em um dispositivo,
   **When** a exclusão é confirmada,
   **Then** a transcrição desaparece do histórico no outro dispositivo

---

### Edge Cases

- O que acontece se o usuário criar uma transcrição sem conexão com a
  internet? (A transcrição deve ser armazenada localmente e sincronizada
  quando a conexão for restabelecida — fila offline)
- Como lidar com conflitos se o mesmo registro for modificado em dois
  dispositivos simultaneamente? (Last-write-wins com timestamp do servidor)
- E se a Edge Function exceder o tempo limite (timeout) durante o
  refinamento? (Timeout configurável, com retry no cliente)
- O que acontece se o usuário tentar acessar o histórico de outro
  usuário? (RLS impede — cada usuário vê apenas seus próprios dados)
- Como lidar com tokens de acesso expirados? (Refresh automático via
  Supabase Auth)
- E se o plano gratuito do Supabase atingir os limites de requisições
  da Edge Function? (Implementar rate limiting e feedback para o usuário)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir que usuários criem contas com email
  e senha via Supabase Auth
- **FR-002**: O sistema DEVE suportar login via OAuth (Google, GitHub)
  como método alternativo
- **FR-003**: O sistema DEVE persistir a sessão entre reinicializações
  do app (token refresh automático)
- **FR-004**: O sistema DEVE fornecer uma Edge Function que recebe texto
  bruto, chama um LLM para refinamento, e retorna o texto refinado
- **FR-005**: A Edge Function DEVE salvar a transcrição (bruta + refinada)
  no banco de dados PostgreSQL
- **FR-006**: O sistema DEVE implementar Row-Level Security (RLS) para
  garantir que cada usuário veja apenas suas próprias transcrições
- **FR-007**: O sistema DEVE permitir listar, visualizar e excluir
  transcrições do histórico
- **FR-008**: O sistema DEVE suportar sincronização em tempo real via
  Supabase Realtime para novas transcrições
- **FR-009**: O app desktop DEVE enviar transcrições para o backend
  quando estiver online, e encaminhar localmente quando offline (fila
  offline)
- **FR-010**: A chave da API do LLM (Groq/OpenAI) DEVE ficar apenas na
  Edge Function — NUNCA no cliente
- **FR-011**: O sistema DEVE retornar o texto refinado em menos de 3
  segundos para transcrições de até 1 minuto de áudio
- **FR-012**: O app desktop DEVE exibir uma tela de login quando o
  usuário não está autenticado

### Key Entities

- **User**: Conta do usuário gerenciada pelo Supabase Auth. Atributos:
  id (UUID), email, created_at.
- **Transcription**: Registro de uma transcrição completa. Atributos:
  id (UUID), user_id (FK para User), raw_text, refined_text,
  duration_seconds, created_at. RLS: user_id = authenticated user.
- **OfflineQueue**: (local, no cliente) Fila de transcrições não
  sincronizadas. Estrutura: id, raw_text, duration, created_at, status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Usuário pode criar conta e fazer login em menos de 30
  segundos
- **SC-002**: Texto refinado é retornado pela Edge Function em menos de
  3 segundos para 90% das requisições com áudio de até 1 minuto
- **SC-003**: Histórico carrega em menos de 2 segundos para usuários com
  até 500 transcrições
- **SC-004**: Nova transcrição aparece em dispositivos conectados em
  menos de 5 segundos após a criação
- **SC-005**: Sistema funciona offline sem perda de dados — transcrições
  são sincronizadas quando a conexão é restaurada
- **SC-006**: Usuários não autenticados não conseguem acessar dados de
  outros usuários (RLS verificado)

## Assumptions

- O Supabase é a plataforma de backend escolhida (conforme constituição do
  projeto)
- O LLM de refinamento será acessado via API OpenAI-compatible (Groq no
  MVP, com possibilidade de trocar o provedor)
- O banco de dados PostgreSQL gerenciado pelo Supabase tem capacidade
  suficiente para o volume inicial de usuários (plano gratuito/Pro)
- O cliente desktop tem conectividade intermitente — o modo offline é
  necessário
- A autenticação via email/senha é suficiente para o MVP; OAuth será
  adicionado como melhoria
- A Edge Function será implementada em Deno (runtime padrão do Supabase)
- O Supabase Realtime utiliza WebSockets para push de dados
- O número inicial de usuários é pequeno (< 100), permitindo crescimento
  gradual sem necessidade de escalabilidade agressiva
