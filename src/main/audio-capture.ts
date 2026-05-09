import * as portAudio from 'naudiodon'
import { type IoStreamRead } from 'naudiodon'

export type ErrorCode =
  | 'DEVICE_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'STREAM_ERROR'
  | 'AUDIO_SYSTEM_UNAVAILABLE'

export interface AudioErrorPayload {
  message: string
  code: ErrorCode
}

export type AudioCaptureListener = {
  onLevel?: (level: number) => void
  onError?: (error: AudioErrorPayload) => void
  onStop?: () => void
}

const SAMPLE_RATE = 16000
const CHANNEL_COUNT = 1
const SAMPLE_FORMAT = portAudio.SampleFormat16Bit
const MAX_DURATION_MS = 10 * 60 * 1000
const LEVEL_INTERVAL_MS = 100
const DEBOUNCE_MS = 500

interface AudioCaptureSession {
  chunks: Buffer[]
  startTime: number
  chunkCount: number
  totalBytes: number
}

let session: AudioCaptureSession | null = null
let stream: IoStreamRead | null = null
let levelTimer: ReturnType<typeof setInterval> | null = null
let safetyTimer: ReturnType<typeof setTimeout> | null = null
let listener: AudioCaptureListener | null = null
let lastToggleTime = 0

export function setListener(l: AudioCaptureListener | null): void {
  listener = l
}

export function isRecording(): boolean {
  return stream !== null
}

function calcRmsLevel(buf: Buffer): number {
  let sumSquares = 0
  const sampleCount = buf.length / 2
  for (let i = 0; i < buf.length; i += 2) {
    const sample = buf.readInt16LE(i)
    sumSquares += sample * sample
  }
  const rms = Math.sqrt(sumSquares / sampleCount)
  return Math.min(rms / 32768, 1.0)
}

function getInputDeviceId(): number {
  const devices = portAudio.getDevices()
  for (const d of devices) {
    if (d.maxInputChannels > 0 && d.name.toLowerCase().includes('default')) {
      return d.id
    }
  }
  return -1
}

function hasInputDevices(): boolean {
  return portAudio.getDevices().some((d) => d.maxInputChannels > 0)
}

export function canRecord(): boolean {
  return hasInputDevices()
}

export function getDevices(): portAudio.DeviceInfo[] {
  return portAudio.getDevices()
}

export function startCapture(): boolean {
  const now = Date.now()
  if (now - lastToggleTime < DEBOUNCE_MS) {
    return false
  }
  lastToggleTime = now

  if (stream) {
    return false
  }

  if (!hasInputDevices()) {
    emitError('Nenhum dispositivo de entrada de áudio encontrado.', 'DEVICE_NOT_FOUND')
    return false
  }

  let ai: IoStreamRead
  try {
    ai = portAudio.AudioIO({
      inOptions: {
        channelCount: CHANNEL_COUNT,
        sampleFormat: SAMPLE_FORMAT,
        sampleRate: SAMPLE_RATE,
        deviceId: getInputDeviceId(),
        closeOnError: true
      }
    }) as IoStreamRead
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido ao inicializar áudio.'
    emitError(msg, 'PERMISSION_DENIED')
    return false
  }

  stream = ai
  session = {
    chunks: [],
    startTime: Date.now(),
    chunkCount: 0,
    totalBytes: 0
  }

  ai.on('data', (buf: Buffer) => {
    if (!session) return
    session.chunks.push(buf)
    session.chunkCount++
    session.totalBytes += buf.length
  })

  ai.on('error', (err: Error) => {
    emitError(err.message, 'STREAM_ERROR')
    stopCapture()
  })

  ai.on('close', () => {
    stream = null
  })

  try {
    ai.start()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao iniciar stream de áudio.'
    emitError(msg, 'STREAM_ERROR')
    cleanup()
    return false
  }

  startLevelTimer()
  startSafetyTimer()

  return true
}

export function stopCapture(): Buffer | null {
  const now = Date.now()
  if (now - lastToggleTime < DEBOUNCE_MS) {
    return null
  }
  lastToggleTime = now

  if (!stream || !session) {
    return null
  }

  stopTimers()

  try {
    stream.quit()
  } catch {
    // best effort cleanup
  }
  stream = null

  const result = concatSession()
  session = null

  return result
}

function concatSession(): Buffer | null {
  if (!session || session.chunks.length === 0) return null
  return Buffer.concat(session.chunks, session.totalBytes)
}

function startLevelTimer(): void {
  levelTimer = setInterval(() => {
    if (!session || session.chunks.length === 0) return
    const lastChunk = session.chunks[session.chunks.length - 1]
    const level = calcRmsLevel(lastChunk)
    listener?.onLevel?.(level)
  }, LEVEL_INTERVAL_MS)
}

function startSafetyTimer(): void {
  safetyTimer = setTimeout(() => {
    listener?.onLevel?.(0)
    listener?.onStop?.()
    emitError('Tempo máximo de gravação atingido (10 minutos).', 'STREAM_ERROR')
    stopCapture()
  }, MAX_DURATION_MS)
}

function stopTimers(): void {
  if (levelTimer) {
    clearInterval(levelTimer)
    levelTimer = null
  }
  if (safetyTimer) {
    clearTimeout(safetyTimer)
    safetyTimer = null
  }
}

function cleanup(): void {
  stopTimers()
  try {
    stream?.quit()
  } catch {
    // best effort cleanup
  }
  stream = null
  session = null
}

function emitError(message: string, code: ErrorCode): void {
  listener?.onError?.({ message, code })
}

export function cleanupCapture(): void {
  cleanup()
  listener = null
}
