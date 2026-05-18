import { globalShortcut } from 'electron'
import { uIOhook, UiohookKey } from 'uiohook-napi'
import { toggleRecording } from './recording'

let useUiohook = false

export function registerShortcuts(): void {
  const isWindows = process.platform === 'win32'
  const isLinux = process.platform === 'linux'
  const isWay =
    isLinux && (process.env.XDG_SESSION_TYPE === 'wayland' || !!process.env.WAYLAND_DISPLAY)

  // No Windows e Linux (especialmente Wayland), o uiohook é mais confiável que o globalShortcut
  if (isWindows || isWay) {
    useUiohook = true
    console.log(`[shortcuts] ${isWindows ? 'Windows' : 'Wayland'} detected — using uiohook-napi`)

    uIOhook.on('keydown', (event) => {
      // No uiohook, verificamos as flags de modificadores
      // Alt = 18, Shift = 16, R = 19 (os códigos podem variar, mas uiohook-napi tem as constantes)
      if (event.altKey && event.shiftKey && event.keycode === UiohookKey.R) {
        console.log('[shortcuts] Alt+Shift+R detected via uiohook')
        toggleRecording()
      }
    })

    try {
      uIOhook.start()
      console.log('[shortcuts] uiohook hook installed')
    } catch (err) {
      console.error('[shortcuts] uiohook failed to start:', err)
      // Se o uiohook falhar, tentamos o globalShortcut como última esperança
      registerNativeShortcut()
    }
  } else {
    registerNativeShortcut()
  }
}

function registerNativeShortcut(): void {
  try {
    const registered = globalShortcut.register('Alt+Shift+R', () => {
      console.log('[shortcuts] Alt+Shift+R detected via globalShortcut')
      toggleRecording()
    })

    if (registered) {
      console.log('[shortcuts] Alt+Shift+R registered via native globalShortcut')
    } else {
      console.warn(
        '[shortcuts] Falha ao registrar Alt+Shift+R nativo — atalho pode estar em uso por outro app.'
      )
    }
  } catch (err) {
    console.error('[shortcuts] Error registering native shortcut:', err)
  }
}

export function unregisterShortcuts(): void {
  if (useUiohook) {
    try {
      uIOhook.stop()
      console.log('[shortcuts] uiohook stopped')
    } catch (err) {
      // Ignorar erro no stop
    }
  }
  globalShortcut.unregisterAll()
}
