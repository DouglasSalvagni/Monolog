# Feature Specification: Real Audio Capture

**Feature Branch**: `002-real-audio-capture`  
**Created**: 2026-05-09  
**Status**: Draft  
**Input**: User description: Substituir o fluxo mock de gravação por captura real de áudio do microfone

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Capturar Áudio do Microfone (Priority: P1)

O usuário pressiona `Alt+Shift+R` para iniciar uma gravação. O aplicativo
captura áudio do microfone padrão do sistema em tempo real. O usuário
pressiona `Alt+Shift+R` novamente para parar. O áudio capturado fica
disponível em memória para a próxima etapa do pipeline (transcrição).

**Why this priority**: Sem captura real de áudio, o aplicativo não passa de
um shell vazio. Esta é a funcionalidade central que habilita todo o
propósito do Monolog.

**Independent Test**: Iniciar gravação, falar "teste de áudio" por alguns
segundos, parar a gravação. Verificar no log do console que chunks de áudio
foram capturados (tamanho dos buffers, duração). O buffer resultante deve
conter dados de áudio PCM válidos.

**Acceptance Scenarios**:

1. **Given** o aplicativo está em estado idle, **When** o usuário pressiona
   `Alt+Shift+R`, **Then** o microfone começa a capturar áudio e o estado
   muda para "recording"
2. **Given** o aplicativo está gravando, **When** o usuário pressiona
   `Alt+Shift+R` novamente, **Then** a captura para e o buffer de áudio é
   retido em memória
3. **Given** a gravação parou, **When** o buffer de áudio é inspecionado,
   **Then** ele contém dados PCM brutos no formato esperado (16kHz, mono,
   16-bit)
4. **Given** o aplicativo está gravando, **When** a gravação atinge 10
   minutos de duração, **Then** a captura para automaticamente e o estado
   retorna para idle

---

### User Story 2 - Feedback Visual de Nível de Áudio (Priority: P2)

Enquanto grava, o usuário vê um indicador visual de nível de áudio em tempo
real na overlay. Barras ou uma forma de onda reagem à voz do usuário,
confirmando que o microfone está captando som.

**Why this priority**: O feedback visual dá confiança imediata ao usuário de
que a captura está funcionando. Sem ele, o usuário não sabe se está
falando em vão.

**Independent Test**: Iniciar gravação e falar em diferentes volumes.
Observar o indicador de nível na overlay reagir proporcionalmente. Falar
baixo → nível baixo. Falar alto → nível alto. Silêncio → nível próximo de
zero.

**Acceptance Scenarios**:

1. **Given** a gravação está ativa, **When** o usuário fala no microfone,
   **Then** um indicador visual de nível de áudio se move em tempo real
2. **Given** a gravação está ativa, **When** há silêncio total, **Then** o
   indicador mostra nível mínimo (ruído de fundo)
3. **Given** a gravação está ativa, **When** o usuário varia o volume da
   voz, **Then** o indicador responde em menos de 100ms

---

### User Story 3 - Tratamento de Erros de Microfone (Priority: P3)

Se o microfone padrão não estiver disponível (desconectado, sem permissão,
driver ausente), o aplicativo não trava. Uma mensagem clara é exibida na
overlay e o estado retorna para idle.

**Why this priority**: Um aplicativo que trava silenciosamente quando o
microfone não está disponível é frustrante. O tratamento robusto de erros
melhora a confiança do usuário no software.

**Independent Test**: Iniciar o aplicativo sem nenhum microfone conectado.
Pressionar `Alt+Shift+R`. Verificar que o aplicativo não trava, exibe uma
mensagem de erro como "Microfone não encontrado" e permanece em idle.

**Acceptance Scenarios**:

1. **Given** nenhum dispositivo de entrada de áudio está disponível,
   **When** o usuário tenta iniciar uma gravação, **Then** o estado não
   muda para recording e uma mensagem de erro é exibida
2. **Given** o microfone é desconectado durante a gravação, **When** o
   sistema detecta a perda do dispositivo, **Then** a gravação para e uma
   mensagem de erro é exibida
3. **Given** as permissões do microfone foram negadas pelo sistema
   operacional, **When** o usuário tenta gravar, **Then** uma mensagem
   informativa sobre permissões é exibida

---

### Edge Cases

- O que acontece se o usuário alternar rapidamente entre gravar/parar
  várias vezes? (Debounce de 500ms entre transições para evitar
  flickering/estados inconsistentes.)
- E se houver múltiplos microfones disponíveis? (Usar o dispositivo padrão
  do sistema, sem opção de seleção por enquanto.)
- Como o sistema se comporta se o computador suspender/retomar durante a
  gravação? (Reset para idle ao retomar, recursos de áudio são
  limpos/recriados.)
- E se o buffer de áudio crescer além do limite de segurança?
  (Auto-stop aos 10 minutos com aviso na overlay.)
- O que acontece se a biblioteca de captura de áudio não puder ser
  carregada? (Fallback gracioso para idle com mensagem de erro no log e na
  overlay.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE capturar áudio do microfone padrão do sistema
  quando a gravação é iniciada
- **FR-002**: O áudio capturado DEVE estar no formato 16kHz, mono, 16-bit
  signed PCM (padrão da indústria para STT)
- **FR-003**: O sistema DEVE bufferizar o áudio capturado em memória
  durante toda a duração da gravação
- **FR-004**: O sistema DEVE disponibilizar o buffer de áudio completo
  quando a gravação para, para consumo pela próxima etapa do pipeline
- **FR-005**: O sistema DEVE exibir um indicador visual de nível de áudio
  em tempo real durante a gravação
- **FR-006**: O sistema DEVE limitar a duração máxima de uma gravação a
  10 minutos, parando automaticamente ao atingir o limite
- **FR-007**: O sistema DEVE tratar graciosamente a ausência de microfone
  (dispositivo não encontrado, sem permissão, driver ausente) sem travar
- **FR-008**: O sistema NÃO DEVE persistir áudio em disco em nenhum momento
  do pipeline — os buffers são transitórios
- **FR-009**: O sistema DEVE limpar todos os recursos de áudio (streams,
  buffers, handles) quando a gravação para, seja por ação do usuário ou
  por limite de tempo
- **FR-010**: O sistema DEVE aplicar debounce de no mínimo 500ms entre
  transições de estado recording/idle para evitar toggles acidentais
- **FR-011**: O indicador de nível de áudio DEVE ser enviado do processo
  principal para a interface em intervalos de no máximo 100ms

### Key Entities

- **Audio Buffer**: Coleção de chunks de áudio PCM empilhados em memória
  durante uma sessão de gravação. Volume total limitado a ~100MB (~10min).
  É a matéria-prima para a transcrição.
- **Audio Level**: Valor numérico (0-1 ou dBFS) representando a amplitude
  instantânea do áudio capturado, usado para feedback visual em tempo real.
- **Recording Session**: Ciclo completo de captura (start → captura →
  stop). Gerencia o ciclo de vida do stream de áudio e do buffer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Usuário pode iniciar e parar uma gravação, e o buffer de
  áudio resultante tem tamanho proporcional à duração da fala (±10%) no
  formato PCM 16kHz mono — verificável via log ou teste automatizado
- **SC-002**: O indicador visual de nível de áudio reage a mudanças no
  volume da voz em menos de 100ms durante toda a gravação
- **SC-003**: O sistema trata todos os cenários de erro de microfone
 (dispositivo ausente, permissão negada, desconexão mid-recording) sem
  travar ou corromper estado — o app permanece responsivo e exibe
  mensagem clara ao usuário
- **SC-004**: A gravação para automaticamente em no máximo 10 minutos e
  5 segundos, liberando todos os recursos
- **SC-005**: O consumo de RAM durante a gravação mais longa (10min) não
  excede 150MB no total (incluindo o buffer de áudio)
- **SC-006**: O overlay de gravação mostra o nível de áudio em tempo real,
  permitindo ao usuário confirmar visualmente que o áudio está sendo
  captado

## Assumptions

- O sistema operacional alvo primário é Linux (PipeWire/PulseAudio/ALSA)
- O microfone padrão do sistema é a fonte de áudio desejada — não há
  necessidade de seleção de dispositivo nesta fase
- O áudio capturado permanece exclusivamente em memória RAM — não é salvo
  em arquivo temporário nem persistido de nenhuma forma
- A duração máxima de 10 minutos é suficiente para casos de uso típicos
  (notas rápidas, ditados, reuniões curtas)
- O formato 16kHz mono 16-bit PCM é compatível com os serviços de STT que
  serão integrados no futuro (Deepgram, Whisper, etc.)
- A latência de 100ms para o VU meter é aceitável para feedback visual em
  tempo real
- O usuário tem um microfone funcional conectado ao sistema na maioria dos
  casos de uso
- As permissões de áudio já estão concedidas no nível do sistema
  operacional (a gestão de permissões via UI do SO está fora de escopo)
