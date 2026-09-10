export function Circuit3DBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden"
    >
      {/* 1. Base Maker-Bench Clay Surface */}
      <div className="absolute inset-0 bg-[#f8fafc]" />

      {/* 2. Tactile Clay Pegboard Perforation Grid */}
      <svg className="absolute inset-0 h-full w-full opacity-65" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="clay-pegboard" width="36" height="36" patternUnits="userSpaceOnUse">
            {/* Outer soft specular light bounce on bottom-right */}
            <circle cx="18.5" cy="18.5" r="3.4" fill="#ffffff" opacity="0.95" />
            {/* Sunken inner shadow on top-left */}
            <circle cx="17.5" cy="17.5" r="3.2" fill="#cbd5e1" />
            {/* Hole cavity */}
            <circle cx="18" cy="18" r="2.6" fill="#94a3b8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#clay-pegboard)" />
      </svg>

      {/* 3. Team Ambient Flank Auras */}
      {/* Team Volt Warm Amber Aura on Left */}
      <div
        className="absolute -left-32 top-1/2 -translate-y-1/2 h-[600px] w-[500px] rounded-full blur-[110px] pointer-events-none opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.32) 0%, transparent 70%)' }}
      />
      {/* Team Ampere Cool Cyan Aura on Right */}
      <div
        className="absolute -right-32 top-1/2 -translate-y-1/2 h-[600px] w-[500px] rounded-full blur-[110px] pointer-events-none opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.32) 0%, transparent 70%)' }}
      />

      {/* 4. Subtle Laboratory Brass Anchor Rivets in 4 Viewport Corners */}
      <div className="absolute top-5 left-5 h-5 w-5 rounded-full border border-amber-300/60 bg-amber-400/25 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_2px_4px_rgba(0,0,0,0.06)]" />
      <div className="absolute top-5 right-5 h-5 w-5 rounded-full border border-cyan-300/60 bg-cyan-400/25 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_2px_4px_rgba(0,0,0,0.06)]" />
      <div className="absolute bottom-5 left-5 h-5 w-5 rounded-full border border-amber-300/60 bg-amber-400/25 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_2px_4px_rgba(0,0,0,0.06)]" />
      <div className="absolute bottom-5 right-5 h-5 w-5 rounded-full border border-cyan-300/60 bg-cyan-400/25 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_2px_4px_rgba(0,0,0,0.06)]" />
    </div>
  )
}
