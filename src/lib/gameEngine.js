// Game mechanics - pack opening, battle simulation, etc.

const RARITY_WEIGHTS = {
  common: 70,
  rare: 25,
  epic: 4.5,
  legendary: 0.5,
}

export function weightedRarityRoll(forceMinRarity = null) {
  if (forceMinRarity === 'epic') {
    const r = Math.random() * 5
    if (r < 0.5) return 'legendary'
    return 'epic'
  }
  const roll = Math.random() * 100
  if (roll < 0.5) return 'legendary'
  if (roll < 5) return 'epic'
  if (roll < 30) return 'rare'
  return 'common'
}

export function rollPackCards(cards, packType) {
  const cardsByRarity = {
    common: cards.filter(c => c.rarity === 'common'),
    rare: cards.filter(c => c.rarity === 'rare'),
    epic: cards.filter(c => c.rarity === 'epic'),
    legendary: cards.filter(c => c.rarity === 'legendary'),
  }

  const packSizes = { harian: 5, premium: 8, sultan: 10, free: 3, free_referral: 3, free_ad: 3 }
  const size = packSizes[packType] || 5
  const result = []

  const isSultan = packType === 'sultan'

  for (let i = 0; i < size; i++) {
    let rarity
    // Sultan pack guarantees 1 epic
    if (isSultan && i === size - 1 && !result.find(c => c.rarity === 'epic' || c.rarity === 'legendary')) {
      rarity = weightedRarityRoll('epic')
    } else {
      rarity = weightedRarityRoll()
    }

    const pool = cardsByRarity[rarity]
    if (!pool || pool.length === 0) {
      const fallback = cardsByRarity.common
      result.push(fallback[Math.floor(Math.random() * fallback.length)])
      continue
    }
    result.push(pool[Math.floor(Math.random() * pool.length)])
  }

  return result
}

export function simulateBattle(playerDeck, botDeck) {
  // Simple ATK/DEF battle simulation
  const playerCards = [...playerDeck]
  const botCards = [...botDeck]
  const log = []

  let playerHP = 100
  let botHP = 100
  let round = 0

  while (playerHP > 0 && botHP > 0 && round < 10) {
    round++
    const playerCard = playerCards[round % playerCards.length]
    const botCard = botCards[round % botCards.length]

    if (!playerCard || !botCard) break

    const playerAtk = (playerCard.current_atk || playerCard.base_atk || 50)
    const playerDef = (playerCard.current_def || playerCard.base_def || 50)
    const botAtk = (botCard.current_atk || botCard.base_atk || 50)
    const botDef = (botCard.current_def || botCard.base_def || 50)

    // Player attacks bot
    const dmgToBot = Math.max(1, Math.floor((playerAtk - botDef * 0.3) * (0.8 + Math.random() * 0.4)))
    botHP -= dmgToBot

    // Bot attacks player
    const dmgToPlayer = Math.max(1, Math.floor((botAtk - playerDef * 0.3) * (0.8 + Math.random() * 0.4)))
    playerHP -= dmgToPlayer

    log.push({
      round,
      playerCard: playerCard.symbol,
      botCard: botCard.symbol,
      dmgToBot,
      dmgToPlayer,
      playerHP: Math.max(0, playerHP),
      botHP: Math.max(0, botHP),
    })
  }

  const playerWon = playerHP > botHP
  const goldReward = playerWon
    ? Math.floor(50 + Math.random() * 100)
    : Math.floor(10 + Math.random() * 20)

  return {
    winner: playerWon ? 'player' : 'bot',
    playerHP: Math.max(0, playerHP),
    botHP: Math.max(0, botHP),
    goldReward,
    log,
  }
}

export function generateBotDeck(cards, playerMMR = 1000) {
  const level = Math.floor(playerMMR / 200)
  const minAtk = Math.min(40 + level * 5, 80)

  const eligible = cards.filter(c => (c.current_atk || c.base_atk) >= minAtk)
  const pool = eligible.length >= 5 ? eligible : cards
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 5)
}

export function formatNumber(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K'
  return num?.toString() || '0'
}

export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export const PACKS = {
  harian: {
    id: 'harian',
    name: 'Pack Harian',
    diamonds: 500,
    rupiah: 5000,
    cards: 5,
    color: 'from-blue-900 to-blue-600',
    accent: '#3b82f6',
    emoji: '📦',
    desc: '5 kartu acak',
  },
  premium: {
    id: 'premium',
    name: 'Pack Premium',
    diamonds: 2000,
    rupiah: 20000,
    cards: 8,
    color: 'from-purple-900 to-purple-600',
    accent: '#9333ea',
    emoji: '💎',
    desc: '8 kartu, lebih banyak Rare',
    popular: true,
  },
  sultan: {
    id: 'sultan',
    name: 'Pack Sultan',
    diamonds: 5000,
    rupiah: 50000,
    cards: 10,
    color: 'from-yellow-900 to-yellow-600',
    accent: '#f59e0b',
    emoji: '👑',
    desc: '10 kartu, garansi 1 Epic',
    guaranteed: 'Epic',
  },
}

export const DIAMOND_PACKAGES = [
  { id: 'diam_600', diamonds: 600, rupiah: 10000, bonus: 100, label: 'Starter' },
  { id: 'diam_1500', diamonds: 1500, rupiah: 25000, bonus: 300, label: 'Popular', popular: true },
  { id: 'diam_3500', diamonds: 3500, rupiah: 50000, bonus: 1000, label: 'Value' },
  { id: 'diam_7500', diamonds: 7500, rupiah: 100000, bonus: 2500, label: 'Big Saver' },
]

export const RARITY_COLORS = {
  common: { bg: 'bg-gray-700', text: 'text-gray-300', border: 'border-gray-500', glow: '' },
  rare: { bg: 'bg-blue-900', text: 'text-blue-300', border: 'border-blue-500', glow: 'neon-glow-blue' },
  epic: { bg: 'bg-purple-900', text: 'text-purple-300', border: 'border-purple-500', glow: 'neon-glow-purple' },
  legendary: { bg: 'bg-yellow-900', text: 'text-yellow-300', border: 'border-yellow-500', glow: 'neon-glow-gold' },
}

export const RARITY_LABELS = {
  common: 'Biasa',
  rare: 'Langka',
  epic: 'Epik',
  legendary: 'Legenda',
}

export const ENERGY_REFILL_MINUTES = 20
export const MAX_ENERGY = 20
export const PVE_BATTLES_PER_DAY = 5
