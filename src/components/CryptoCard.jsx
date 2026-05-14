import { RARITY_COLORS, RARITY_LABELS } from '../lib/gameEngine'

const RARITY_GRADIENT = {
  common: 'from-gray-800 to-gray-700',
  rare: 'from-blue-950 to-blue-800',
  epic: 'from-purple-950 to-purple-800',
  legendary: 'from-yellow-950 to-yellow-800',
}

const RARITY_BORDER = {
  common: 'border-gray-600',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-yellow-400',
}

const RARITY_GLOW = {
  common: '',
  rare: '0 0 12px rgba(59,130,246,0.5)',
  epic: '0 0 16px rgba(147,51,234,0.6)',
  legendary: '0 0 20px rgba(245,158,11,0.7), 0 0 40px rgba(245,158,11,0.3)',
}

export default function CryptoCard({ card, qty, size = 'md', onClick, selected, isNew }) {
  if (!card) return null

  const rarity = card.rarity || 'common'
  const colors = RARITY_COLORS[rarity]

  const sizeMap = {
    sm: { card: 'w-20 h-28', img: 'w-10 h-10 text-lg', atk: 'text-[9px]', name: 'text-[9px]', sym: 'text-xs' },
    md: { card: 'w-28 h-40', img: 'w-14 h-14 text-2xl', atk: 'text-[10px]', name: 'text-[10px]', sym: 'text-sm' },
    lg: { card: 'w-36 h-52', img: 'w-20 h-20 text-4xl', atk: 'text-xs', name: 'text-xs', sym: 'text-base' },
  }

  const s = sizeMap[size] || sizeMap.md

  return (
    <div
      onClick={onClick}
      className={`${s.card} relative rounded-xl border-2 bg-gradient-to-b ${RARITY_GRADIENT[rarity]} ${RARITY_BORDER[rarity]} flex flex-col overflow-hidden cursor-pointer transition-all duration-200 ${
        selected ? 'scale-105 ring-2 ring-neon-cyan' : 'hover:scale-102'
      } ${isNew ? 'animate-bounce-in' : ''}`}
      style={{ boxShadow: RARITY_GLOW[rarity] }}
    >
      {/* Holographic shimmer for legendary */}
      {rarity === 'legendary' && (
        <div className="absolute inset-0 card-shine pointer-events-none z-10" />
      )}

      {/* Rarity badge */}
      <div className={`absolute top-1 left-1 text-[8px] font-bold px-1 rounded ${colors.bg} ${colors.text}`}>
        {RARITY_LABELS[rarity]}
      </div>

      {/* Qty badge */}
      {qty > 1 && (
        <div className="absolute top-1 right-1 text-[8px] font-bold px-1 rounded bg-dark-800 text-white">
          x{qty}
        </div>
      )}

      {/* Card image area */}
      <div className="flex-1 flex items-center justify-center pt-4">
        {card.image_url ? (
          <img
            src={card.image_url}
            alt={card.name}
            className={`${s.img} rounded-full object-cover`}
            onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}
          />
        ) : null}
        <div className={`${s.img} rounded-full bg-dark-700 items-center justify-center text-2xl`} style={{display: card.image_url ? 'none' : 'flex'}}>
          🪙
        </div>
      </div>

      {/* Card footer */}
      <div className="bg-black/40 px-1.5 py-1">
        <div className={`${s.sym} font-black text-white text-center leading-tight`}>{card.symbol}</div>
        <div className="flex justify-between mt-0.5">
          <span className={`${s.atk} text-red-400`}>⚔ {card.current_atk || card.base_atk}</span>
          <span className={`${s.atk} text-blue-400`}>🛡 {card.current_def || card.base_def}</span>
        </div>
      </div>
    </div>
  )
}
