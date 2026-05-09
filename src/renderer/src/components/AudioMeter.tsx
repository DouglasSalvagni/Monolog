interface AudioMeterProps {
  level: number
}

export function AudioMeter({ level }: AudioMeterProps): React.JSX.Element {
  const pct = Math.min(Math.max(level * 100, 0), 100)
  const bars = 10
  const activeBars = Math.ceil((pct / 100) * bars)

  return (
    <div className="flex items-center gap-[2px] h-4">
      {Array.from({ length: bars }, (_, i) => {
        const isActive = i < activeBars
        const intensity = i / bars
        const hue = intensity < 0.6 ? 142 : intensity < 0.8 ? 48 : 0
        return (
          <div
            key={i}
            className={`w-[3px] rounded-sm transition-all duration-75 ${
              isActive ? 'opacity-100' : 'opacity-20'
            }`}
            style={{
              height: `${20 + (i / bars) * 80}%`,
              backgroundColor: isActive ? `hsl(${hue}, 80%, 50%)` : 'rgb(156 163 175)'
            }}
          />
        )
      })}
    </div>
  )
}
