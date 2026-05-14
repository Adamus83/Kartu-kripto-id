import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import CurrencyBar from '../components/CurrencyBar'
import CryptoCard from '../components/CryptoCard'
import { PACKS, formatNumber, RARITY_COLORS, RARITY_LABELS, MAX_ENERGY } from '../lib/gameEngine'
import { getRefParam, hapticFeedback } from '../lib/telegram'

export default function HomePage({ gameState, onOpenPack, onTabChange }) {
  const { user, inventory, cards, getCurrentEnergy } = gameState
  const [energy, setEnergy] = useState(getCurrentEnergy())

  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy(getCurrentEnergy())
    }, 10000)
    return () => clearInterval(interval)
  }, [getCurrentEnergy])

  const uniqueCards = new Set(inventory.map(i => i.card_id)).size
  const totalCards = cards.length

  const rarityCount = {
    common: inventory.filter(i => i.card?.rarity === 'common').length,
    rare: inventory.filter(i => i.card?.rarity === 'rare').length,
    epic: inventory.filter(i => i.card?.rarity === 'epic').length,
    legendary: inventory.filter(i => i.card?.rarity === 'legendary').length,
  }

  return (
    <div className="h-full scrollable">
      <div className="p-4 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black text-white">
              Halo, <span className="text-neon-purple">{user?.telegram_first_name || 'Pemain'}</span>! 👋
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">Selamat datang di Kartu Kripto ID</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-dark-800 rounded-lg px-3 py-1.5">
              <span className="text-sm">💎</span>
              <span className="text-sm font-bold text-neon-purple">{formatNumber(user?.diamonds || 0)}</span>
            </div>
            <div className="flex items-center gap-1 bg-dark-800 rounded-lg px-3 py-1.5">
              <span className="text-sm">🪙</span>
              <span className="text-sm font-bold text-neon-yellow">{formatNumber(user?.gold || 0)}</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-3 text-center"
          >
            <div className="text-2xl mb-1">⚡</div>
            <div className="text-lg font-bold text-white">{energy}/{MAX_ENERGY}</div>
            <div className="text-[10px] text-gray-400">Energi</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl p-3 text-center"
          >
            <div className="text-2xl mb-1">🃏</div>
            <div className="text-lg font-bold text-white">{uniqueCards}/{totalCards}</div>
            <div className="text-[10px] text-gray-400">Koleksi</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-xl p-3 text-center"
          >
            <div className="text-2xl mb-1">⚔️</div>
            <div className="text-lg font-bold text-white">{user?.mmr || 1000}</div>
            <div className="text-[10px] text-gray-400">MMR</div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <h2 className="text-lg font-bold text-white mb-3">Buka Pack Sekarang</h2>
        <div className="space-y-3 mb-6">
          {Object.values(PACKS).map((pack) => (
            <motion.button
              key={pack.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                hapticFeedback('impact', 'medium')
                onOpenPack(pack.id)
              }}
              className={`w-full bg-gradient-to-r ${pack.color} rounded-xl p-4 flex items-center gap-4 relative overflow-hidden`}
            >
              {pack.popular && (
                <div className="absolute top-0 right-0 bg-neon-pink text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
                  POPULER
                </div>
              )}
              <span className="text-3xl">{pack.emoji}</span>
              <div className="flex-1 text-left">
                <div className="text-white font-bold">{pack.name}</div>
                <div className="text-white/70 text-xs">{pack.desc}</div>
              </div>
              <div className="text-right">
                <div className="text-white font-bold text-sm">💎 {formatNumber(pack.diamonds)}</div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Collection Preview */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">Koleksi Terbaru</h2>
          <button
            onClick={() => { hapticFeedback('selection'); onTabChange('collection') }}
            className="text-neon-purple text-sm font-semibold"
          >
            Lihat Semua →
          </button>
        </div>

        {inventory.length === 0 ? (
          <div className="glass rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-400 text-sm">Belum ada kartu. Buka pack pertamamu!</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 mb-6">
            {inventory.slice(0, 8).map((item, i) => {
              const card = item.card
              if (!card) return null
              const rarityStyle = RARITY_COLORS[card.rarity] || RARITY_COLORS.common
              return (
                <motion.div
                  key={item.id || i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-lg border ${rarityStyle.border} ${rarityStyle.bg} p-2 text-center`}
                >
                  <div className="text-2xl mb-1">{card.emoji || '🪙'}</div>
                  <div className="text-[9px] text-white font-bold truncate">{card.symbol || card.name}</div>
                  <div className={`text-[8px] ${rarityStyle.text}`}>{RARITY_LABELS[card.rarity]}</div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Rarity Breakdown */}
        <h2 className="text-lg font-bold text-white mb-3">Statistik Kartu</h2>
        <div className="glass rounded-xl p-4 space-y-2 mb-4">
          {Object.entries(rarityCount).map(([rarity, count]) => {
            const style = RARITY_COLORS[rarity]
            return (
              <div key={rarity} className="flex items-center justify-between">
                <span className={`text-sm ${style.text}`}>{RARITY_LABELS[rarity]}</span>
                <span className="text-sm text-white font-bold">{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
