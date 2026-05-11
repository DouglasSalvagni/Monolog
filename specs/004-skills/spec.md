# Feature Specification: Skills

**Feature Branch**: `004-skills`
**Created**: 2026-05-10
**Status**: Draft
**Input**: User description: criar uma feature onde na tela do programa seja possivel aplicar skills. A skill seria um filtro que pode ser ativado ou nao de forma opcional. A skill modifica a versao refined_text que é a copiavel. A skill pode ser criada pelo usuário e ela, quando ativada no uso, adiciona prompt de refinamento de output para a versao final refined_text

## User Scenarios & Testing

### User Story 1 - Aplicar Skill na Transcrição (Priority: P1)

O usuário grava um áudio, vê a transcrição na tela, e antes de copiar o texto refinado, pode selecionar uma skill para modificar o output final. Skill ativa modifica o prompt de refinamento enviado à Edge Function.

**Why this priority**: É o fluxo central da feature — aplicar uma skill ao texto refinado antes da cópia.

**Independent Test**: Gravar áudio, selecionar uma skill "Resumir" na UI, verificar que o texto refinado copiado reflete o prompt da skill.

**Acceptance Scenarios**:

1. **Given** o usuário finalizou a gravação, **When** ele ativa uma skill na interface, **Then** o texto refinado é processado com o prompt combinado (base + skill)
2. **Given** uma skill está ativa, **When** o texto refinado chega, **Then** o texto é copiado para a área de transferência já modificado pela skill
3. **Given** nenhuma skill está ativa, **When** o refinamento termina, **Then** o comportamento é o padrão (sem modificação por skill)
4. **Given** o usuário troca de skill entre gravações, **When** a nova gravação termina, **Then** a skill ativa é usada no refinamento

---

### User Story 2 - Gerenciar Skills (Priority: P1)

O usuário pode criar, editar, listar e excluir suas skills. Cada skill tem nome, descrição e um prompt que será combinado ao prompt base de refinamento.

**Why this priority**: O valor da feature está em skills customizáveis.

**Independent Test**: Criar uma skill com nome "Tom Formal" e prompt "Reescreva em tom formal". Verificar que aparece na lista. Editar o prompt. Excluir a skill.

**Acceptance Scenarios**:

1. **Given** o usuário abre o gerenciador de skills, **When** ele clica em "Nova Skill", **Then** um formulário é exibido com campos de nome e prompt
2. **Given** o formulário de skill está aberto, **When** o usuário preenche nome e prompt e salva, **Then** a skill é persistida no backend e aparece na lista
3. **Given** uma skill existe, **When** o usuário a edita, **Then** as alterações são salvas
4. **Given** uma skill existe, **When** o usuário a exclui, **Then** a skill é removida do banco e da interface

---

### User Story 3 - Sincronização de Skills (Priority: P2)

O usuário cria uma skill no computador A. Ao abrir o app no computador B (mesma conta), a skill está disponível.

**Why this priority**: Skills são definidas pelo usuário e devem acompanhá-lo entre dispositivos, consistente com a arquitetura multi-dispositivo do Monolog.

**Independent Test**: Criar skill no dispositivo A, verificar que aparece no dispositivo B em até 5 segundos.

**Acceptance Scenarios**:

1. **Given** o usuário cria uma skill no dispositivo A, **When** a skill é salva no Supabase, **Then** o dispositivo B recebe a atualização via Realtime em até 5 segundos
2. **Given** uma skill é excluída em um dispositivo, **When** a exclusão é confirmada, **Then** a skill desaparece no outro dispositivo

---

### Edge Cases

- O que acontece se o prompt da skill for vazio? (Skill sem prompt é inválida — não deve ser possível salvar)
- E se a Edge Function estiver offline? (Fallback local aplica o prompt da skill no cliente, se possível)
- O que acontece se o prompt combinado (base + skill) exceder o limite de tokens do LLM? (Truncar o prompt base ou notificar o usuário)
- E se o usuário excluir uma skill que está ativa? (Desativar a skill automaticamente, voltar ao comportamento padrão)
- Conflito de nomes: usuário cria duas skills com o mesmo nome? (Permitir nomes duplicados — identificador único é o UUID)

## Requirements

### Functional Requirements

- **FR-001**: O sistema DEVE permitir que o usuário crie skills com nome e prompt
- **FR-002**: O sistema DEVE permitir que o usuário edite e exclua skills existentes
- **FR-003**: O sistema DEVE listar todas as skills do usuário na interface
- **FR-004**: O sistema DEVE permitir que o usuário ative no máximo uma skill por vez
- **FR-005**: O sistema DEVE combinar o prompt da skill ativa com o prompt base de refinamento antes de enviar à Edge Function
- **FR-006**: O sistema DEVE persistir skills no Supabase com RLS (cada usuário vê apenas suas próprias skills)
- **FR-007**: O sistema DEVE sincronizar skills entre dispositivos via Supabase Realtime
- **FR-008**: O sistema DEVE copiar o texto refinado (modificado pela skill) para a área de transferência
- **FR-009**: O sistema DEVE desativar a skill automaticamente se ela for excluída
- **FR-010**: A skill ativa DEVE ser armazenada no estado da aplicação (Zustand) e refletida na UI

### Skill Data Model

- **id**: UUID (primary key)
- **user_id**: UUID (FK para User, RLS: user_id = authenticated user)
- **name**: string (obrigatório, exibido na UI)
- **prompt**: string (obrigatório, texto do prompt de refinamento)
- **description**: string (opcional, ajuda o usuário a lembrar o propósito)
- **created_at**: timestamptz
- **updated_at**: timestamptz

### UI Components

- **SkillSelector**: lista de skills disponíveis para ativação (dropdown ou toggle) na tela principal pós-gravação
- **SkillManager**: tela/dialog para criar, editar e excluir skills
- **SkillForm**: formulário com campos name, prompt, description

## Success Criteria

### Measurable Outcomes

- **SC-001**: Usuário pode criar uma skill em menos de 15 segundos
- **SC-002**: Skill ativa é aplicada ao refined_text com latência adicional < 500ms (prompt combinado não aumenta processamento significativamente)
- **SC-003**: Skills sincronizam entre dispositivos em menos de 5 segundos
- **SC-004**: Lista de skills carrega em menos de 1 segundo para até 100 skills
- **SC-005**: Apenas o dono da skill pode vê-la (RLS verificado)

## Clarifications

### Session 2026-05-10

- Q: Esta feature deve ser adicionada ao spec existente (003-supabase-backend) ou criar um novo? → A: Novo feature branch/spec separado (004-skills)
- Q: Onde as skills devem ser armazenadas? → A: Supabase (tabela + RLS), sincronizadas entre dispositivos
- Q: Como o prompt da skill interage com o pipeline de refinamento? → A: O prompt da skill é combinado ao prompt base enviado à Edge Function
- Q: Qual é o modelo de dados de uma skill? → A: id, name, prompt, description (opcional), created_at, updated_at
- Q: É possível ativar múltiplas skills simultaneamente? → A: Não — apenas uma skill ativa por vez

## Assumptions

- O prompt da skill será concatenado ao prompt base como instrução adicional para o LLM
- Skills são específicas do usuário (não há compartilhamento entre usuários)
- A Edge Function existente será modificada para aceitar um parâmetro opcional `skill_prompt`
- O número inicial de skills por usuário é pequeno (< 50)
- A interface de skills será adicionada à tela principal (pós-gravação) e não requer redesenho completo
- A skill ativa é um estado local (Zustand) — não persiste qual skill estava ativa entre sessões (opt-in a cada uso)
