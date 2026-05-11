interface AudioMeterProps {
  level: number
  isRecording?: boolean
}

export function AudioMeter({ level, isRecording = false }: AudioMeterProps): React.JSX.Element {
  // Escalar o nível para um valor mais visível
  const scale = 1 + level * 2
  const opacity = 0.4 + level * 0.6
  
  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      {/* Outer Glow / Pulse */}
      <div 
        className={`absolute inset-0 rounded-full blur-xl transition-all duration-300 ${
          isRecording ? 'bg-studio-amber' : 'bg-studio-ink/10'
        }`}
        style={{ 
          transform: `scale(${scale * 1.2})`,
          opacity: isRecording ? opacity * 0.3 : 0
        }}
      />
      
      {/* The Core Orb (Ink Pulse) */}
      <div 
        className={`relative w-4 h-4 rounded-full transition-all duration-150 ease-out shadow-studio-soft ${
          isRecording ? 'bg-studio-amber' : 'bg-studio-ink'
        }`}
        style={{ 
          transform: `scale(${scale})`,
          opacity: isRecording ? 1 : 0.8
        }}
      >
        {/* Inner Ripples */}
        {isRecording && (
          <>
            <div className="absolute inset-0 rounded-full bg-studio-amber animate-ink-pulse opacity-40" />
            <div className="absolute inset-0 rounded-full bg-studio-amber animate-ink-pulse opacity-20 [animation-delay:1s]" />
          </>
        )}
      </div>

      {/* Decorative Rings */}
      <div className="absolute inset-0 border border-studio-metal rounded-full opacity-20 scale-[2.5]" />
      <div className="absolute inset-0 border border-studio-metal rounded-full opacity-10 scale-[4]" />
    </div>
  )
}
