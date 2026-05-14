export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-dark-900">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-neon-purple via-neon-blue to-neon-cyan flex items-center justify-center animate-float shadow-2xl neon-glow-purple">
          <span className="text-4xl">🃏</span>
        </div>
        <div className="absolute -inset-2 rounded-3xl holographic-border opacity-30" style={{padding:'2px',borderRadius:'20px'}} />
      </div>
      <h1 className="text-2xl font-black text-white mb-2 tracking-wider">
        KARTU <span className="text-neon-purple">KRIPTO</span> ID
      </h1>
      <p className="text-gray-400 text-sm mb-8">Memuat data...</p>
      <div className="flex gap-2">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-neon-purple animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}
