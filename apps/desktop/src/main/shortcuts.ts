import { globalShortcut } from 'electron'
import { uIOhook, UiohookKey } from 'uiohook-napi'
import { toggleRecording } from './recording'

let useUiohook = false

export function registerShortcuts(): void {
  const isWay = process.env.XDG_SESSION_TYPE === 'wayland' || !!process.env.WAYLAND_DISPLAY

  if (isWay) {
    useUiohook = true
    console.log('[shortcuts] Wayland detected — using uiohook-napi instead of globalShortcut')

    uIOhook.on('keydown', (event) => {
      if (event.altKey && event.shiftKey && event.keycode === UiohookKey.R) {
        console.log('[shortcuts] Alt+Shift+R detected via uiohook')
        toggleRecording()
      }
    })

    try {
      uIOhook.start()
      console.log('[shortcuts] uiohook started successfully')
    } catch (err) {
      console.error('[shortcuts] uiohook start failed:', err)
    }
    return
  }

  const registered = globalShortcut.register('Alt+Shift+R', () => {
    toggleRecording()
  })

  if (!registered) {
    console.warn('[shortcuts] Falha ao registrar Alt+Shift+R — atalho pode estar em uso.')
  }
}

export function unregisterShortcuts(): void {
  if (useUiohook) {
    try {
      uIOhook.stop()
      console.log('[shortcuts] uiohook stopped')
    } catch (err) {
      console.error('[shortcuts] uiohook stop failed:', err)
    }
  } else {
    globalShortcut.unregisterAll()
  }
}
