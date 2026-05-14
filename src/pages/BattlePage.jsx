import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CurrencyBar from '../components/CurrencyBar'
import CryptoCard from '../components/CryptoCard'
import { simulateBattle, generateBotDeck, PVE_BATTLES_PER_DAY } from '../lib/gameEngine'
import { supabase } from '../lib/supabase'
import { hapticFeedback } from '../lib/telegram'

const PHASES = { SELECT: 'select', BATTLE: 'battle', RESULT: 'result' }

export default function BattlePage({ gameState }) {
  const { user, cards, inventory, getCurrentEnergy, spendEnergy, addGold, updateMMR, refreshUser } = gameState
  const [phase, setPhase] = useState(PHASES.SELECT)
  const [selectedDeck, setSelectedDeck] = useState([])
  const [battleResult, setBattleResult] = useState(null)
  const [animRound, setAnimRound] = useState(0)
  const [playerHP, setPlayerHP] = useState(100)
  const [botHP, setBotHP] = useState(100)
  const [botDeck, setBotDeck] = useState([])
  const [pveBattlesLeft, setPveBattlesLeft] = useState(PVE_BATTLES_PER_DAY)
  const [battleLog, setBattleLog] = useState([])
  const [extraBattleCost] = useState(2)

  useEffect(() => {
    if (!user) return
    const today = new Date().toDateString()
    const resetDate = user.pve_reset_at ? new Date(user.pve_reset_at).toDateString() : null
    if (resetDate === today) {
      setPveBattlesLeft(Math.max(0, PVE_BATTLES_PER_DAY - (user.pve_battles_today || 0)))
    } else {
      setPveBattlesLeft(PVE_BATTLES_PER_DAY)
    }
  }, [user])

  function toggleCardInDeck(item) {
    hapticFeedback('selection')
    const card = item.card
    if (!card) return
    setSelectedDeck(prev => {
      const exists = prev.find(c => c.id === card.id)
      if (exists) return prev.filter(c => c.id !== card.id)
      if (prev.length >= 5) return prev
      return [...prev, card]
    })
  }

  async function startBattle(payExtra = false) {
    if (selectedDeck.length < 1) return
    const energy = getCurrentEnergy()
    if (energy < 1) { alert('Energi tidak cukup!'); return }
    const isFreeSlot = pveBattlesLeft > 0
    if (!isFreeSlot && !payExtra) return
    if (payExtra && (user?.diamonds || 0) < extraBattleCost) { alert('Diamond tidak cukup!'); return }
    hapticFeedback('impact', 'medium')
    await spendEnergy(1)
    if (payExtra) {
      await supabase.from('users').update({ diamonds: user.diamonds - extraBattleCost }).eq('id', user.id)
      await refreshUser()
    }
    const today = new Date().toDateString()
    const resetDate = user.pve_reset_at ? new Date(user.pve_reset_at).toDateString() : null
    const currentBattles = resetDate === today ? (user.pve_battles_today || 0) : 0
    await supabase.from('users').update({ pve_battles_today: currentBattles + 1, pve_reset_at: new Date().toISOString() }).eq('id', user.id)
    if (isFreeSlot) setPveBattlesLeft(prev => Math.max(0, prev - 1))
    const bot = generateBotDeck(cards, user?.mmr || 1000)
    setBotDeck(bot)
    const result = simulateBattle(selectedDeck, bot)
    setBattleResult(result)
    setPhase(PHASES.BATTLE)
    setPlayerHP(100); setBotHP(100); setBattleLog([]); setAnimRound(0)
    let roundIdx = 0
    const interval = setInterval(() => {
      if (roundIdx >= result.log.length) {
        clearInterval(interval)
        setTimeout(() => { setPhase(PHASES.RESULT); finalizeBattle(result) }, 500)
        return
      }
      const round = result.log[roundIdx]
      setPlayerHP(round.playerHP); setBotHP(round.botHP)
      setBattleLog(prev => [...prev, round])
      setAnimRound(roundIdx + 1)
      roundIdx++
      hapticFeedback('impact', 'light')
    }, 700)
  }

  async function finalizeBattle(result) {
    const hasBP = user?.battle_pass_expires_at && new Date(user.battle_pass_expires_at) > new Date()
    const goldReward = hasBP ? Math.floor(result.goldReward * 1.5) : result.goldReward
    const mmrDelta = result.winner === 'player' ? +25 : -15
    await addGold(goldReward)
    await updateMMR(mmrDelta)
    await supabase.from('battles').insert({ player1_id: user.id, battle_type: 'pve', player1_deck: selectedDeck.map(c => c.id), winner_id: result.winner === 'player' ? user.id : null, gold_reward: goldReward, status: 'completed', completed_at: new Date().toISOString() }).then(() => {}, () => {})
    setBattleResult(prev => ({ ...prev, goldReward, mmrDelta }))
    hapticFeedback('notification', result.winner === 'player' ? 'success' : 'error')
  }

  function resetBattle() {
    setPhase(PHASES.SELECT); setSelectedDeck([]); setBattleResult(null); setBotDeck([]); setBattleLog([])
    refreshUser()
  }

  const ownedCards = inventory.filter(i => i.card)

  return (
    <div className="flex flex-col h-full">
      <CurrencyBar user={user} getCurrentEnergy={getCurrentEnergy} />

      {phase === PHASES.SELECT && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-lg font-black text-white">⚔️ Battle PvE</h1>
              <span className={`text-xs font-bold ${pveBattlesLeft > 0 ? 'text-green-400' : 'text-red-400'}`}>
                ⚡ {pveBattlesLeft}/{PVE_BATTLES_PER_DAY} gratis
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-3">Pilih 1-5 kartu. 1 Energi per battle.</p>
            <div className="flex gap-2 items-center mb-2">
              <div className="flex-1 flex gap-1 overflow-x-auto pb-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`w-12 h-14 rounded-lg border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${selectedDeck[i] ? 'border-neon-purple bg-dark-700 text-white' : 'border-dark-500 bg-dark-800 text-gray-600'}`}>
                    {selectedDeck[i] ? selectedDeck[i].symbol : (i + 1)}
                  </div>
                ))}
              </div>
              <button
                onClick={() => startBattle(pveBattlesLeft === 0)}
                disabled={selectedDeck.length === 0 || getCurrentEnergy() < 1}
                className={`px-4 py-3 rounded-xl font-black text-sm transition-all flex-shrink-0 ${selectedDeck.length > 0 && getCurrentEnergy() >= 1 ? 'bg-red-600 text-white active:scale-95' : 'bg-dark-700 text-gray-500 cursor-not-allowed'}`}
              >
                {pveBattlesLeft > 0 ? '⚔️ Battle!' : `💎${extraBattleCost}`}
              </button>
            </div>
          </div>
          <div className="flex-1 scrollable px-4 pb-4">
            {ownedCards.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-gray-400 text-sm text-center">Belum punya kartu! Buka pack dulu.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {ownedCards.map(item => (
                  <CryptoCard key={item.id} card={item.card} qty={item.qty} size="md"
                    selected={selectedDeck.some(c => c.id === item.card?.id)}
                    onClick={() => toggleCardInDeck(item)} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {phase === PHASES.BATTLE && (
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          <h2 className="text-center text-lg font-black text-white mb-4">⚔️ Battle!</h2>
          <div className="space-y-3 mb-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neon-cyan font-bold">{user?.telegram_first_name || 'Kamu'}</span>
                <span className="text-neon-cyan font-bold">{playerHP} HP</span>
              </div>
              <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-neon-cyan to-neon-blue rounded-full transition-all duration-500" style={{ width: `${playerHP}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-red-400 font-bold">Bot</span>
                <span className="text-red-400 font-bold">{botHP} HP</span>
              </div>
              <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-600 to-red-800 rounded-full transition-all duration-500" style={{ width: `${botHP}%` }} />
              </div>
            </div>
          </div>
          <div className="flex justify-around items-center mb-4">
            <div className="text-center">
              {selectedDeck[animRound % Math.max(1, selectedDeck.length)] && (
                <CryptoCard card={selectedDeck[animRound % Math.max(1, selectedDeck.length)]} size="sm" />
              )}
              <div className="text-xs text-neon-cyan mt-1">Kamu</div>
            </div>
            <div className="text-3xl font-black text-red-500 animate-pulse">VS</div>
            <div className="text-center">
              {botDeck[animRound % Math.max(1, botDeck.length)] && (
                <CryptoCard card={botDeck[animRound % Math.max(1, botDeck.length)]} size="sm" />
              )}
              <div className="text-xs text-red-400 mt-1">Bot</div>
            </div>
          </div>
          <div className="flex-1 scrollable bg-dark-800 rounded-xl p-3 space-y-2">
            {battleLog.map((log, i) => (
              <div key={i} className="text-xs text-gray-300">
                <span className="text-yellow-400 font-bold">R{log.round}:</span>{' '}
                <span className="text-neon-cyan">{log.playerCard}</span> vs <span className="text-red-400">{log.botCard}</span>{' • '}
                <span className="text-red-300">-{log.dmgToPlayer}HP</span>{' / '}
                <span className="text-green-400">-{log.dmgToBot} Bot</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === PHASES.RESULT && battleResult && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
            <div className="text-7xl mb-4">{battleResult.winner === 'player' ? '🏆' : '💀'}</div>
            <h2 className={`text-3xl font-black mb-2 ${battleResult.winner === 'player' ? 'text-yellow-400' : 'text-red-400'}`}>
              {battleResult.winner === 'player' ? 'MENANG!' : 'KALAH!'}
            </h2>
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-center gap-2">
                <span className="text-yellow-400 text-2xl">🪙</span>
                <span className="text-white font-black text-xl">+{battleResult.goldReward} Gold</span>
              </div>
              <div className={`text-sm ${battleResult.mmrDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                MMR: {battleResult.mmrDelta >= 0 ? '+' : ''}{battleResult.mmrDelta}
              </div>
            </div>
            <button onClick={resetBattle} className="w-48 py-4 bg-gradient-to-r from-neon-purple to-neon-blue rounded-xl text-white font-black text-lg">
              Battle Lagi!
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
