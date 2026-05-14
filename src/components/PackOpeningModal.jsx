import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { rollPackCards, PACKS, RARITY_COLORS, RARITY_LABELS } from '../lib/gameEngine'
import { hapticFeedback } from '../lib/telegram'
import CryptoCard from './CryptoCard'

export default function PackOpeningModal({ gameState, packType, onClose }) {
  const { user, cards, refreshUser, refreshInventory } = gameState
  const [phase, setPhase] = useState('confirm') // confirm | opening | reveal
  const [revealedCards, setRevealedCards] = useState([])
  const [revealIndex, setRevealIndex] = useState(-1)
  const [error, setError] = useState(null)
  const isFree = packType?.startsWith('free')

  const pack = PACKS[packType]

  async function handleOpenPack() {
    if (!user) return
    setError(null)

    if (!isFree && (user.diamonds || 0) < (pack?.diamonds || 0)) {
      setError('💎 Diamond tidak cukup!')
      return
    }

    hapticFeedback('impact', 'heavy')
    setPhase('opening')

    try {
      const rolled = rollPackCards(cards, packType)

      if (!isFree) {
        // Deduct diamonds
        await supabase.from('users').update({ diamonds: (user.diamonds || 0) - pack.diamonds }).eq('id', user.id)
      }

      // Add cards to inventory
      for (const card of rolled) {
        const { data: existing } = await supabase.from('inventory')
          .select('id, qty').eq('user_id', user.id).eq('card_id', card.id).single()
        if (existing) {
          await supabase.from('inventory').update({ qty: existing.qty + 1 }).eq('id', existing.id)
        } else {
          await supabase.from('inventory').insert({ user_id: user.id, card_id: card.id, qty: 1 })
        }
      }

      await supabase.from('pack_openings').insert({ user_id: user.id, pack_type: packType, cards_received: rolled.map(c => ({ id: c.id })) })

      await refreshUser()
      setRevealedCards(rolled)

      setTimeout(() => {
        setPhase('reveal')
        setRevealIndex(0)
      }, 1500)
    } catch (err) {
      console.error('Pack opening error:', err)
      setError('Gagal membuka pack. Coba lagi.')
      setPhase('confirm')
    }
  }

  useEffect(() => {
    if (phase === 'reveal' && revealIndex >= 0 && revealIndex < revealedCards.length) {
      hapticFeedback('impact', 'light')
      const timer = setTimeout(() => {
        setRevealIndex(prev => prev + 1)
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [phase, revealIndex, revealedCards.length])

  const allRevealed = revealIndex >= revealedCards.length

  if (!isFree && !pack) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && allRevealed) onClose() }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-dark-800 rounded-2xl w-full max-w-sm max-h-[85vh] overflow-hidden border border-dark-500"
      >
        {/* Header */}
        <div className={`p-4 bg-gradient-to-r ${pack?.color || 'from-green-900 to-teal-700'} text-center`}>
          <span className="text-4xl">{pack?.emoji || '🎁'}</span>
          <h2 className="text-lg font-black text-white mt-1">{isFree ? 'Pack Gratis' : pack?.name}</h2>
          <p className="text-xs text-white/70">{isFree ? 'Kartu gratis untukmu!' : pack?.desc}</p>
        </div>

        {/* Content */}
        <div className="p-4">
          {phase === 'confirm' && (
            <div className="text-center">
              <div className="text-6xl mb-4">{isFree ? '🎁' : pack?.emoji}</div>
              <p className="text-gray-300 text-sm mb-2">
                {isFree ? 'Buka pack gratis kamu!' : <>Buka dengan <span className="text-neon-cyan font-bold">💎 {pack?.diamonds?.toLocaleString()}</span> Diamond?</>}
              </p>
              {!isFree && <p className="text-gray-500 text-xs mb-4">Kamu punya 💎 {(user?.diamonds || 0).toLocaleString()}</p>}
              {error && <p className="text-red-400 text-xs mb-3 bg-red-900/30 rounded-lg p-2">{error}</p>}
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 bg-dark-700 rounded-xl text-gray-300 font-bold text-sm">Batal</button>
                <button
                  onClick={handleOpenPack}
                  disabled={!isFree && (user?.diamonds || 0) < (pack?.diamonds || 0)}
                  className={`flex-1 py-3 rounded-xl font-black text-sm transition-all active:scale-95 ${isFree || (user?.diamonds || 0) >= (pack?.diamonds || 0) ? 'bg-gradient-to-r from-neon-purple to-neon-blue text-white' : 'bg-dark-700 text-gray-500 cursor-not-allowed'}`}
                >
                  {isFree ? '🎁 Buka Gratis!' : `Buka! 💎 ${pack?.diamonds?.toLocaleString()}`}
                </button>
              </div>
            </div>
          )}

          {phase === 'opening' && (
            <div className="text-center py-8">
              <motion.div
                animate={{ rotate: [0, 10, -10, 10, -10, 0], scale: [1, 1.1, 1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                {pack.emoji}
              </motion.div>
              <p className="text-white font-bold">Membuka pack...</p>
              <div className="flex justify-center gap-2 mt-4">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-neon-purple animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {phase === 'reveal' && (
            <div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <AnimatePresence>
                  {revealedCards.map((card, i) => {
                    const isRevealed = i <= revealIndex
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.5, rotateY: 180 }}
                        animate={isRevealed ? { opacity: 1, scale: 1, rotateY: 0 } : { opacity: 0.3, scale: 0.8 }}
                        transition={{ duration: 0.4, type: 'spring' }}
                      >
                        {isRevealed ? (
                          <CryptoCard card={card} size="sm" isNew />
                        ) : (
                          <div className="w-20 h-28 rounded-xl bg-dark-700 border-2 border-dark-500 flex items-center justify-center text-2xl">❓</div>
                        )}
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>

              {allRevealed && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <p className="text-neon-cyan text-sm font-bold mb-3">
                    🎉 Kamu mendapat {revealedCards.length} kartu!
                  </p>
                  <button
                    onClick={onClose}
                    className="w-full py-3 bg-gradient-to-r from-neon-purple to-neon-blue rounded-xl text-white font-black text-sm active:scale-95 transition-all"
                  >
                    Keren! 🎉
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
