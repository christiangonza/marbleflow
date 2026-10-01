/** Minimal synthesized "impact" sound (no audio assets) behind a mute toggle. */
let audioCtx: AudioContext | null = null
let enabled = false

export function isSoundEnabled() {
  return enabled
}

export function setSoundEnabled(value: boolean) {
  enabled = value
  if (!value) return

  if (!audioCtx) {
    const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audioCtx = new AudioContextClass()
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume()
  }
}

export function playImpactSound(intensity: number) {
  if (!enabled || !audioCtx) return

  const now = audioCtx.currentTime
  const oscillator = audioCtx.createOscillator()
  const gain = audioCtx.createGain()

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(220 + intensity * 260, now)
  oscillator.frequency.exponentialRampToValueAtTime(80, now + 0.08)

  gain.gain.setValueAtTime(Math.min(0.25, 0.05 + intensity * 0.2), now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)

  oscillator.connect(gain)
  gain.connect(audioCtx.destination)
  oscillator.start(now)
  oscillator.stop(now + 0.13)
}
