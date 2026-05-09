# Feature Specification: Electron App Shell

**Feature Branch**: `001-electron-app-shell`  
**Created**: 2026-05-08  
**Status**: Draft  
**Input**: User description: Iniciar projeto Electron com system tray, hotkey e UI shell

## User Scenarios & Testing *(mandatory)*

### User Story 1 - System Tray Presence (Priority: P1)

The user installs and launches the app. An icon appears in the system
tray/notification area. The user can right-click the icon to see a menu with
options: Show/Hide, Quit. The icon visually changes to indicate recording
status (idle vs active).

**Why this priority**: Without the tray icon, the user has no way to interact
with or even know the app is running. This is the foundation for all other
interactions.

**Independent Test**: Launch the app and verify a tray icon appears within 3
seconds. Right-click shows a menu. Quit from the menu terminates the process.

**Acceptance Scenarios**:

1. **Given** the app is running in the background, **When** the user looks at
   the system tray, **Then** an app icon is visible
2. **Given** the app icon is in the tray, **When** the user right-clicks it,
   **Then** a context menu appears with "Show/Hide" and "Quit" options
3. **Given** the context menu is open, **When** the user clicks "Quit",
   **Then** the app process terminates completely
4. **Given** the user is recording, **When** they check the tray icon,
   **Then** the icon shows a visual indicator (color change or badge)

---

### User Story 2 - Global Hotkey Recording Toggle (Priority: P2)

The user presses `Alt+Shift+R` from any application to start recording. The
tray icon changes to a recording state. The user presses the same shortcut
again to stop recording. Brief visual feedback confirms the state change
(e.g., a small popup or overlay).

**Why this priority**: The core value proposition is recording without
switching windows. This is the essential interaction pattern.

**Independent Test**: Press `Alt+Shift+R` while any other app is focused.
Verify the app responds (tray icon changes). Press again and verify it
returns to idle state.

**Acceptance Scenarios**:

1. **Given** the app is running and idle, **When** the user presses
   `Alt+Shift+R` from any application, **Then** recording state activates
   and tray icon reflects the change
2. **Given** the app is recording, **When** the user presses
   `Alt+Shift+R` again, **Then** recording stops and the app returns to idle
3. **Given** the hotkey is triggered, **When** the state changes,
   **Then** a brief visual overlay (≤3 seconds) confirms the new state

---

### User Story 3 - Recording State UI (Priority: P3)

When recording is active, a minimal, non-intrusive overlay displays the
current status: "Idle", "Recording...", or "Processing...". The overlay does
not steal focus from the current application. It can be dismissed or
auto-hides after a few seconds.

**Why this priority**: The user needs reassurance that the app is working
correctly. Visual feedback reduces uncertainty without being distracting.

**Independent Test**: Start recording and verify an overlay appears showing
"Recording...". Stop recording and verify it shows "Processing..." briefly,
then returns to idle.

**Acceptance Scenarios**:

1. **Given** the app is idle, **When** no recording is active, **Then** no
   overlay is shown (or shows "Idle" discreetly)
2. **Given** recording starts, **When** audio capture is active, **Then** an
   overlay displays "Recording..." without stealing focus
3. **Given** recording stops and text is being processed, **When** processing
   occurs, **Then** the overlay shows "Processing..." briefly
4. **Given** processing completes, **When** text is ready, **Then** the
   overlay auto-hides after 3 seconds

---

### User Story 4 - Clipboard Integration (Mock) (Priority: P3)

After the recording and processing flow completes, the resulting text is
automatically copied to the system clipboard. The user can immediately paste
it into any application with Ctrl+V / Cmd+V. (In this initial phase, the
"transcribed text" is a simulated placeholder — the pipeline is exercised
end-to-end with mock data.)

**Why this priority**: The clipboard is the delivery mechanism. Even with
mock data, validating this flow ensures the user experience is correct.

**Independent Test**: Start and stop a recording. Switch to a text editor and
press Ctrl+V. Verify placeholder text appears.

**Acceptance Scenarios**:

1. **Given** a recording cycle completes, **When** processing finishes,
   **Then** text is automatically placed on the system clipboard
2. **Given** text is on the clipboard, **When** the user pastes in any
   application, **Then** the pasted content is the expected transcribed text

---

### Edge Cases

- What happens if the user presses the hotkey while another app also uses
  `Alt+Shift+R`? (The system should handle the hotkey uniquely — warn if
  conflict detected.)
- How does the app behave if the system tray is full or unavailable?
  (Fallback to a floating window or minimal taskbar indicator.)
- What happens if the user rapidly toggles recording on/off? (Debounce or
  minimum state transition time to prevent flickering.)
- How are overlay and hotkey state kept in sync if the OS suspends/resumes?
  (Reset to idle on resume, or check state validity.)
- What if the user closes the overlay while recording is active? (Overlay
  re-appears on next state change or via tray menu.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display an icon in the OS system tray when the
  application is running
- **FR-002**: The tray icon MUST visually differentiate between idle and
  recording states
- **FR-003**: The tray context menu MUST include at minimum "Show/Hide" and
  "Quit" options
- **FR-004**: The system MUST register a global keyboard shortcut
  `Alt+Shift+R` to toggle recording on and off
- **FR-005**: The shortcut MUST work regardless of which application is
  currently focused
- **FR-006**: The system MUST show a brief non-intrusive overlay when
  recording state changes
- **FR-007**: The overlay MUST NOT steal keyboard focus from the currently
  active application
- **FR-008**: The system MUST copy processed text to the system clipboard
  automatically when processing completes
- **FR-009**: The system MUST support three recording states: idle,
  recording, processing
- **FR-010**: The application MUST continue running in the background when
  the main window is closed

### Key Entities

- **Recording State**: Current status of audio capture (idle, recording,
  processing). Tracks transitions and drives UI feedback.
- **Transcription Text**: The refined text output from a recording session.
  Initially populated with mock/placeholder content.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: App appears in system tray within 3 seconds of launch on both
  Linux and Windows
- **SC-002**: Global hotkey `Alt+Shift+R` triggers recording toggle from any
  active application without perceivable delay (<500ms response)
- **SC-003**: Visual feedback (overlay + tray icon change) appears within
  500ms of hotkey press
- **SC-004**: User can complete a full cycle (idle → record → stop →
  process → clipboard) in under 10 seconds with mock data
- **SC-005**: App process consumes ≤150MB of RAM during idle state
- **SC-006**: Closing the main window does not terminate the application —
  it continues in the system tray

## Assumptions

- Target platforms are Linux (primary) and Windows (secondary) for this
  initial phase
- The user has a functioning system tray / notification area on their OS
- The hotkey `Alt+Shift+R` does not conflict with any OS-level or
  application-level shortcuts (conflict detection is a future enhancement)
- Node.js is already installed on the development machine
- The user is familiar with basic CLI operations (npm, terminal commands)
  for the initial setup
- Audio capture hardware is available and accessible
- This phase uses mock/placeholder transcription text — real audio capture
  and STT integration is a follow-up feature
