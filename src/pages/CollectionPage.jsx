import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { hapticFeedback } from '../lib/telegram'
import { RARITY_COLORS, RARITY_LABELS } from '../lib/gameEngine'

const FILTERS = ['semua', 'common', 'rare', 'epic', 'legendary']
const FILTER_LABELS = { semua: 'Semua', common: 'Biasa', rare: 'Langka', epic: 'Epik', legendary: 'Legenda' }

export default function CollectionPage({ gameState, onMerge }) {
  const { inventory, cards } = gameState
  const [filter, setFilter] = useState('semua')
  const [selectedCard, setSelectedCard] = useState(null)

  const filtered = useMemo(() => {
    if (filter === 'semua') return inventory
    return inventory.filter(item => item.card?.rarity === filter)
  }, [inventory, filter])

  const duplicates = useMemo(() => {
    const counts = {}
    inventory.forEach(item => {
      if (item.card_id) counts[item.card_id] = (counts[item.card_id] || 0) + 1
    })
    return counts
  }, [inventory])

  return (
    <div className="h-full scrollable">
      <div className="p-4">
        <h1 className="text-xl font-black text-white mb-1">🃏 Koleksi Kartu</h1>
        <p className="text-gray-400 text-sm mb-4">{inventory.length} kartu terkumpul</p>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollable pb-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => { hapticFeedback('selection'); setFilter(f) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                filter === f
                  ? 'bg-neon-purple text-white'
                  : 'bg-dark-800 text-gray-400'
              }`}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        {filtered.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center mt-8">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-400">Belum ada kartu {filter !== 'semua' ? FILTER_LABELS[filter] : ''}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <AnimatePresence>
              {filtered.map((item, i) => {
                const card = item.card
                if (!card) return null
                const style = RARITY_COLORS[card.rarity] || RARITY_COLORS.common
                const dupeCount = duplicates[item.card_id] || 1
                const canMerge = dupeCount >= 3

                return (
                  <motion.div
                    key={item.id || i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => {
                      hapticFeedback('impact', 'light')
                      setSelectedCard(selectedCard?.id === item.id ? null : item)
                    }}
                    className={`rounded-xl border ${style.border} ${style.bg} p-3 text-center cursor-pointer relative overflow-hidden ${
                      selectedCard?.id === item.id ? style.glow : ''
                    }`}
                  >
                    {canMerge && (
                      <div className="absolute top-1 right-1 bg-neon-green text-[8px] text-white font-bold px-1.5 py-0.5 rounded-full">
                        MERGE
                      </div>
                    )}
                    <div className="text-3xl mb-2">{card.emoji || '🪙'}</div>
                    <div className="text-xs text-white font-bold truncate">{card.symbol || card.name}</div>
                    <div className={`text-[10px] ${style.text} mb-1`}>{RARITY_LABELS[card.rarity]}</div>
                    <div className="flex justify-center gap-2 text-[9px] text-gray-300">
                      <span>⚔️{card.base_atk || 0}</span>
                      <span>🛡️{card.base_def || 0}</span>
                    </div>
                    {item.level > 1 && (
                      <div className="text-[9px] text-neon-cyan mt-1">Lv.{item.level}</div>
                    )}
                    {dupeCount > 1 && (
                      <div className="absolute bottom-1 right-1 bg-dark-700 text-[8px] text-gray-300 font-bold px-1.5 py-0.5 rounded-full">
                        x{dupeCount}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Selected Card Detail */}
        <AnimatePresence>
          {selectedCard && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-20 left-4 right-4 glass rounded-2xl p-4 z-30"
            >
              <div className="flex items-center gap-4">
                <div className={`text-4xl p-3 rounded-xl ${RARITY_COLORS[selectedCard.card?.rarity]?.bg}`}>
                  {selectedCard.card?.emoji || '🪙'}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold">{selectedCard.card?.name || selectedCard.card?.symbol}</h3>
                  <p className={`text-sm ${RARITY_COLORS[selectedCard.card?.rarity]?.text}`}>
                    {RARITY_LABELS[selectedCard.card?.rarity]} {selectedCard.level > 1 ? `• Lv.${selectedCard.level}` : ''}
                  </p>
                  <div className="flex gap-3 mt-1 text-xs text-gray-300">
                    <span>⚔️ ATK: {selectedCard.current_atk || selectedCard.card?.base_atk || 0}</span>
                    <span>🛡️ DEF: {selectedCard.current_def || selectedCard.card?.base_def || 0}</span>
                  </div>
                </div>
              </div>
              {(duplicates[selectedCard.card_id] || 0) >= 3 && (
                <button
                  onClick={() => {
                    hapticFeedback('impact', 'heavy')
                    onMerge(selectedCard)
                    setSelectedCard(null)
                  }}
                  className="w-full mt-3 py-2.5 bg-gradient-to-r from-neon-purple to-neon-blue rounded-xl text-white font-bold text-sm"
                >
                  ✨ Merge (3 kartu → Level Up)
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
