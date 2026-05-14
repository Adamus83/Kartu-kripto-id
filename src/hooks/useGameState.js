import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getTelegramUser, getRefParam, isTelegramContext, getMockUser } from '../lib/telegram'
import { ENERGY_REFILL_MINUTES, MAX_ENERGY } from '../lib/gameEngine'

export function useGameState() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cards, setCards] = useState([])
  const [inventory, setInventory] = useState([])

  const telegramUser = isTelegramContext() ? getTelegramUser() : getMockUser()

  const refreshUser = useCallback(async () => {
    if (!telegramUser?.id) return
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramUser.id)
      .single()
    if (data) setUser(data)
  }, [telegramUser?.id])

  const refreshInventory = useCallback(async () => {
    if (!user?.id) return
    const { data } = await supabase
      .from('inventory')
      .select('*, card:cards(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setInventory(data)
  }, [user?.id])

  // Login/register with Telegram
  useEffect(() => {
    if (!telegramUser?.id) {
      setError('Buka lewat Telegram untuk bermain.')
      setLoading(false)
      return
    }

    async function initUser() {
      try {
        // Fetch all cards first
        const { data: allCards } = await supabase.from('cards').select('*').order('base_atk', { ascending: false })
        if (allCards) setCards(allCards)

        // Find or create user
        let { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('telegram_id', telegramUser.id)
          .single()

        if (!existingUser) {
          // New user - check referral
          const refBy = getRefParam()

          const { data: newUser, error: createErr } = await supabase
            .from('users')
            .insert({
              telegram_id: telegramUser.id,
              telegram_username: telegramUser.username || null,
              telegram_first_name: telegramUser.first_name || 'Pemain',
              diamonds: 0,
              gold: 500,
              energy: MAX_ENERGY,
              energy_updated_at: new Date().toISOString(),
              mmr: 1000,
              ref_by: refBy,
            })
            .select()
            .single()

          if (createErr) throw createErr
          existingUser = newUser

          // If referred, handle referral bonus (5 free packs granted via UI)
          if (refBy) {
            const { data: referrer } = await supabase
              .from('users')
              .select('id')
              .eq('telegram_id', refBy)
              .single()

            if (referrer) {
              // Add L1 referral
              await supabase.from('referrals').insert({
                referrer_id: referrer.id,
                referred_id: newUser.id,
                level: 1,
              }).then(() => {}, () => {})

              // Check if referrer has a referrer too (L2)
              const { data: referrerUser } = await supabase
                .from('users')
                .select('ref_by')
                .eq('id', referrer.id)
                .single()

              if (referrerUser?.ref_by) {
                const { data: l2Referrer } = await supabase
                  .from('users')
                  .select('id')
                  .eq('telegram_id', referrerUser.ref_by)
                  .single()

                if (l2Referrer) {
                  await supabase.from('referrals').insert({
                    referrer_id: l2Referrer.id,
                    referred_id: newUser.id,
                    level: 2,
                  }).then(() => {}, () => {})
                }
              }
            }
          }
        } else {
          // Update name if changed
          await supabase.from('users').update({
            telegram_username: telegramUser.username || null,
            telegram_first_name: telegramUser.first_name || existingUser.telegram_first_name,
            updated_at: new Date().toISOString(),
          }).eq('id', existingUser.id).then(() => {}, () => {})
        }

        setUser(existingUser)
      } catch (err) {
        console.error('Init user error:', err)
        setError('Gagal memuat data. Coba lagi.')
      } finally {
        setLoading(false)
      }
    }

    initUser()
  }, [telegramUser?.id])

  // Load inventory when user ready
  useEffect(() => {
    if (user?.id) refreshInventory()
  }, [user?.id])

  // Compute current energy (auto-refill over time)
  function getCurrentEnergy() {
    if (!user) return 0
    const now = new Date()
    const lastUpdate = new Date(user.energy_updated_at || now)
    const minutesPassed = Math.floor((now - lastUpdate) / 60000)
    const refilled = Math.floor(minutesPassed / ENERGY_REFILL_MINUTES)
    return Math.min(MAX_ENERGY, (user.energy || 0) + refilled)
  }

  async function spendEnergy(amount = 1) {
    if (!user) return false
    const currentEnergy = getCurrentEnergy()
    if (currentEnergy < amount) return false

    const now = new Date()
    const lastUpdate = new Date(user.energy_updated_at || now)
    const minutesPassed = Math.floor((now - lastUpdate) / 60000)
    const refilled = Math.floor(minutesPassed / ENERGY_REFILL_MINUTES)
    const newEnergy = Math.min(MAX_ENERGY, user.energy + refilled) - amount

    const { error } = await supabase
      .from('users')
      .update({ energy: newEnergy, energy_updated_at: now.toISOString() })
      .eq('id', user.id)

    if (!error) {
      setUser(prev => ({ ...prev, energy: newEnergy, energy_updated_at: now.toISOString() }))
      return true
    }
    return false
  }

  async function addGold(amount) {
    if (!user) return
    const { error } = await supabase
      .from('users')
      .update({ gold: (user.gold || 0) + amount })
      .eq('id', user.id)
    if (!error) setUser(prev => ({ ...prev, gold: (prev.gold || 0) + amount }))
  }

  async function addDiamonds(amount) {
    if (!user) return
    const { error } = await supabase
      .from('users')
      .update({ diamonds: (user.diamonds || 0) + amount })
      .eq('id', user.id)
    if (!error) setUser(prev => ({ ...prev, diamonds: (prev.diamonds || 0) + amount }))
  }

  async function updateMMR(delta) {
    if (!user) return
    const newMMR = Math.max(0, (user.mmr || 1000) + delta)
    await supabase.from('users').update({ mmr: newMMR }).eq('id', user.id)
    setUser(prev => ({ ...prev, mmr: newMMR }))
  }

  async function hasBattlePass() {
    if (!user?.battle_pass_expires_at) return false
    return new Date(user.battle_pass_expires_at) > new Date()
  }

  return {
    user,
    cards,
    inventory,
    loading,
    error,
    refreshUser,
    refreshInventory,
    getCurrentEnergy,
    spendEnergy,
    addGold,
    addDiamonds,
    updateMMR,
    hasBattlePass,
    telegramUser,
  }
}
