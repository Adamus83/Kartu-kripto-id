import { useState } from 'react'
import { motion } from 'framer-motion'
import { RARITY_COLORS, RARITY_LABELS } from '../lib/gameEngine'
import { supabase } from '../lib/supabase'
import { hapticFeedback } from '../lib/telegram'

export default function MergeModal({ gameState, card, onClose }) {
  const { user } = gameState
  const [phase, setPhase] = useState('confirm') // confirm, merging, done
  const [error, setError] = useState(null)
  const [newCard, setNewCard] = useState(null)

  const cardData = card?.card
  const canMerge = (card?.qty || 0) >= 3 && cardData?.rarity !== 'legendary'

  async function handleMerge() {
    if (!canMerge || !user || !cardData) return

    hapticFeedback('impact', 'heavy')
    setPhase('merging')

    try {
      const { data, error: mergeErr } = await supabase.rpc('merge_cards', {
        p_user_id: user.id,
        p_card_id: cardData.id,
      })

      if (mergeErr) throw mergeErr

      hapticFeedback('notification', 'success')
      setNewCard(data?.new_card || data)
      setPhase('done')
    } catch (err) {
      console.error('Merge error:', err)
      setError(err.message || 'Gagal merge kartu. Coba lagi.')
      setPhase('done')
    }
  }

  const style = RARITY_COLORS[cardData?.rarity] || RARITY_COLORS.common
  const newStyle = newCard ? (RARITY_COLORS[newCard.rarity] || RARITY_COLORS.common) : style

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="w-full max-w-sm mx-4 glass rounded-2xl p-6"
      >
        {/* Confirm Phase */}
        {phase === 'confirm' && (
          <div className="text-center">
            <h2 className="text-xl font-black text-white mb-4">✨ Merge Kartu</h2>

            <div className={`inline-block rounded-xl border-2 ${style.border} ${style.bg} p-4 mb-4`}>
              {cardData?.image_url
                ? <img src={cardData.image_url} alt={cardData.symbol} className="w-12 h-12 rounded-full mx-auto mb-2 object-cover" onError={e => { e.target.style.display = 'none' }} />
                : <div className="text-4xl mb-2">🪙</div>
              }
              <div className="text-sm text-white font-bold">{cardData?.symbol || cardData?.name}</div>
              <div className={`text-xs ${style.text}`}>{RARITY_LABELS[cardData?.rarity]}</div>
              <div className="text-xs text-gray-300 mt-1">
                ⚔ {cardData?.current_atk || cardData?.base_atk} &nbsp; 🛡 {cardData?.current_def || cardData?.base_def}
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-2">
              Gabungkan 3 kartu <span className="text-white font-bold">{cardData?.symbol || cardData?.name}</span> yang sama
            </p>
            <p className="text-gray-500 text-xs mb-1">
              Kamu punya: <span className="text-neon-cyan font-bold">{card?.qty}</span>x kartu ini
            </p>
            <p className="text-gray-500 text-xs mb-6">
              3 kartu dilebur → 1 kartu rarity lebih tinggi
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  hapticFeedback('selection')
                  onClose()
                }}
                className="flex-1 py-3 bg-dark-700 rounded-xl text-gray-300 font-bold text-sm"
              >
                Batal
              </button>
              <button
                onClick={handleMerge}
                disabled={!canMerge}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                  canMerge
                    ? 'bg-gradient-to-r from-neon-purple to-neon-blue text-white active:scale-95'
                    : 'bg-dark-600 text-gray-500 cursor-not-allowed'
                }`}
              >
                {canMerge ? '✨ Merge!' : 'Butuh 3 kartu'}
              </button>
            </div>
          </div>
        )}

        {/* Merging Phase */}
        {phase === 'merging' && (
          <div className="text-center py-8">
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-6xl mb-4"
            >
              ✨
            </motion.div>
            <h2 className="text-lg font-bold text-white mb-2">Sedang Merge...</h2>
            <p className="text-gray-400 text-sm">Menggabungkan kartu</p>
          </div>
        )}

        {/* Done Phase */}
        {phase === 'done' && (
          <div className="text-center">
            {error ? (
              <>
                <div className="text-5xl mb-4">⚠️</div>
                <h2 className="text-lg font-bold text-white mb-2">Ups!</h2>
                <p className="text-gray-400 text-sm mb-6">{error}</p>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10 }}
                  className="text-6xl mb-4"
                >
                  🎉
                </motion.div>
                <h2 className="text-xl font-black text-white mb-4">✨ Berhasil Merge!</h2>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className={`inline-block rounded-xl border-2 ${newStyle.border} ${newStyle.bg} p-4 mb-4`}
                >
                  <div className="text-4xl mb-2">
                    {newCard?.image_url
                      ? <img src={newCard.image_url} alt={newCard.symbol} className="w-12 h-12 rounded-full mx-auto object-cover" />
                      : '🪙'}
                  </div>
                  <div className="text-sm text-white font-bold">{newCard?.symbol || newCard?.name || cardData?.symbol}</div>
                  <div className={`text-xs text-neon-cyan font-bold mt-1`}>
                    {RARITY_LABELS[newCard?.rarity]}
                  </div>
                  <div className="flex justify-center gap-3 text-xs text-gray-300 mt-1">
                    <span className="text-green-400">⚔ {newCard?.current_atk}</span>
                    <span className="text-blue-400">🛡 {newCard?.current_def}</span>
                  </div>
                </motion.div>

                <p className="text-gray-400 text-sm mb-6">
                  ATK dan DEF meningkat! 💪
                </p>
              </>
            )}
            <button
              onClick={() => {
                hapticFeedback('impact', 'light')
                onClose()
              }}
              className="w-full py-3 bg-neon-purple rounded-xl text-white font-bold text-sm active:scale-95 transition"
            >
              {error ? 'Tutup' : 'Mantap! 🔥'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
