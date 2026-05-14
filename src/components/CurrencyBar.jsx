import { MAX_ENERGY } from '../lib/gameEngine'

export default function CurrencyBar({ user, getCurrentEnergy }) {
  if (!user) return null
  const energy = getCurrentEnergy?.() ?? user.energy ?? 0

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-dark-800 border-b border-dark-600">
      {/* Diamonds */}
      <div className="flex items-center gap-1 bg-dark-700 rounded-full px-3 py-1">
        <span className="text-sm">💎</span>
        <span className="text-xs font-bold text-neon-cyan">{(user.diamonds || 0).toLocaleString('id-ID')}</span>
      </div>
      {/* Gold */}
      <div className="flex items-center gap-1 bg-dark-700 rounded-full px-3 py-1">
        <span className="text-sm">🪙</span>
        <span className="text-xs font-bold text-yellow-400">{(user.gold || 0).toLocaleString('id-ID')}</span>
      </div>
      {/* Energy */}
      <div className="flex items-center gap-1 bg-dark-700 rounded-full px-3 py-1 ml-auto">
        <span className="text-sm">⚡</span>
        <span className={`text-xs font-bold ${energy >= MAX_ENERGY ? 'text-neon-green' : 'text-orange-400'}`}>
          {energy}/{MAX_ENERGY}
        </span>
      </div>
    </div>
  )
}
