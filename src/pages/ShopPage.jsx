import { useState } from 'react'
import { motion } from 'framer-motion'
import CurrencyBar from '../components/CurrencyBar'
import { PACKS, DIAMOND_PACKAGES, formatRupiah } from '../lib/gameEngine'
import { supabase } from '../lib/supabase'
import { hapticFeedback } from '../lib/telegram'

const MIDTRANS_CLIENT_KEY = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-xxxxxxx'
const MIDTRANS_SNAP_URL = 'https://app.sandbox.midtrans.com/snap/snap.js'

function loadMidtrans(clientKey) {
  return new Promise((resolve) => {
    if (window.snap) return resolve(window.snap)
    const script = document.createElement('script')
    script.src = MIDTRANS_SNAP_URL
    script.setAttribute('data-client-key', clientKey)
    script.onload = () => resolve(window.snap)
    document.head.appendChild(script)
  })
}

export default function ShopPage({ gameState, onOpenPack }) {
  const { user, getCurrentEnergy, refreshUser } = gameState
  const [activeSection, setActiveSection] = useState('pack')
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  async function handleBuyDiamonds(pkg) {
    if (!user) return
    hapticFeedback('impact', 'medium')
    setLoading(true)
    setStatusMsg('Memproses transaksi...')

    try {
      const orderId = `kkid-diam-${user.id}-${Date.now()}`

      // Record pending transaction
      await supabase.from('transactions').insert({
        user_id: user.id,
        midtrans_order_id: orderId,
        pack_type: pkg.id,
        amount_rp: pkg.rupiah,
        diamonds: pkg.diamonds + (pkg.bonus || 0),
        status: 'pending',
      })

      // Create Snap token via Edge Function
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

      const res = await fetch(`${SUPABASE_URL}/functions/v1/midtrans-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          orderId,
          amount: pkg.rupiah,
          diamonds: pkg.diamonds + (pkg.bonus || 0),
          userId: user.id,
          customerName: user.telegram_first_name || 'Pemain',
          itemName: `${pkg.diamonds + (pkg.bonus || 0)} Diamond - Kartu Kripto ID`,
        }),
      })

      const data = await res.json()

      if (!data.token) {
        // Demo mode - simulate payment
        setStatusMsg('Mode Demo: Diamond dikreditkan!')
        await supabase.from('users').update({
          diamonds: (user.diamonds || 0) + pkg.diamonds + (pkg.bonus || 0)
        }).eq('id', user.id)
        await supabase.from('transactions').update({ status: 'paid' })
          .eq('midtrans_order_id', orderId)
        await refreshUser()
        setTimeout(() => setStatusMsg(''), 2000)
        setLoading(false)
        return
      }

      const snap = await loadMidtrans(MIDTRANS_CLIENT_KEY)
      setLoading(false)
      setStatusMsg('')

      snap.pay(data.token, {
        onSuccess: async (result) => {
          setStatusMsg('✅ Pembayaran berhasil! Diamond sedang dikreditkan...')
          await supabase.from('transactions').update({
            status: 'paid',
            midtrans_transaction_id: result.transaction_id,
            payment_method: result.payment_type,
            paid_at: new Date().toISOString(),
          }).eq('midtrans_order_id', orderId)
          await supabase.from('users').update({
            diamonds: (user.diamonds || 0) + pkg.diamonds + (pkg.bonus || 0)
          }).eq('id', user.id)
          await refreshUser()
          setTimeout(() => setStatusMsg(''), 3000)
        },
        onPending: () => setStatusMsg('⏳ Menunggu pembayaran...'),
        onError: () => {
          setStatusMsg('❌ Pembayaran gagal')
          supabase.from('transactions').update({ status: 'failed' }).eq('midtrans_order_id', orderId).then(() => {}, () => {})
          setTimeout(() => setStatusMsg(''), 3000)
        },
        onClose: () => setStatusMsg(''),
      })
    } catch (err) {
      console.error(err)
      setStatusMsg('❌ Terjadi kesalahan. Coba lagi.')
      setTimeout(() => setStatusMsg(''), 3000)
      setLoading(false)
    }
  }

  async function handleBuyBattlePass() {
    if (!user) return
    hapticFeedback('impact', 'heavy')
    setLoading(true)
    setStatusMsg('Memproses Battle Pass...')

    try {
      const orderId = `kkid-bp-${user.id}-${Date.now()}`

      await supabase.from('transactions').insert({
        user_id: user.id,
        midtrans_order_id: orderId,
        pack_type: 'battle_pass',
        amount_rp: 29000,
        diamonds: 0,
        status: 'pending',
      })

      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

      const res = await fetch(`${SUPABASE_URL}/functions/v1/midtrans-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
        body: JSON.stringify({
          orderId,
          amount: 29000,
          diamonds: 0,
          userId: user.id,
          customerName: user.telegram_first_name || 'Pemain',
          itemName: 'Battle Pass - Kartu Kripto ID',
          isBattlePass: true,
        }),
      })

      const data = await res.json()
      if (!data.token) {
        // Demo mode
        const expires = new Date()
        expires.setMonth(expires.getMonth() + 1)
        await supabase.from('users').update({ battle_pass_expires_at: expires.toISOString() }).eq('id', user.id)
        await supabase.from('transactions').update({ status: 'paid' }).eq('midtrans_order_id', orderId)
        await refreshUser()
        setStatusMsg('✅ Battle Pass aktif! (Demo Mode)')
        setTimeout(() => setStatusMsg(''), 3000)
        setLoading(false)
        return
      }

      const snap = await loadMidtrans(MIDTRANS_CLIENT_KEY)
      setLoading(false)
      setStatusMsg('')

      snap.pay(data.token, {
        onSuccess: async (result) => {
          const expires = new Date()
          expires.setMonth(expires.getMonth() + 1)
          await supabase.from('users').update({ battle_pass_expires_at: expires.toISOString() }).eq('id', user.id)
          await supabase.from('transactions').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('midtrans_order_id', orderId)
          await refreshUser()
          setStatusMsg('✅ Battle Pass aktif!')
          setTimeout(() => setStatusMsg(''), 3000)
        },
        onError: () => setStatusMsg('❌ Pembayaran gagal'),
        onClose: () => setStatusMsg(''),
      })
    } catch (err) {
      setStatusMsg('❌ Terjadi kesalahan.')
      setTimeout(() => setStatusMsg(''), 3000)
      setLoading(false)
    }
  }

  async function handleBuyPackWithDiamonds(packId) {
    const pack = PACKS[packId]
    if (!pack || !user) return
    if ((user.diamonds || 0) < pack.diamonds) {
      setStatusMsg('💎 Diamond tidak cukup! Beli Diamond terlebih dahulu.')
      setTimeout(() => setStatusMsg(''), 3000)
      return
    }
    onOpenPack(packId)
  }

  const hasBattlePass = user?.battle_pass_expires_at && new Date(user.battle_pass_expires_at) > new Date()

  return (
    <div className="flex flex-col h-full">
      <CurrencyBar user={user} getCurrentEnergy={getCurrentEnergy} />

      <div className="px-4 pt-4 pb-2">
        <h1 className="text-lg font-black text-white mb-3">💎 Toko</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-dark-800 rounded-xl p-1 mb-4">
          {[
            { id: 'pack', label: '📦 Pack' },
            { id: 'diamond', label: '💎 Diamond' },
            { id: 'special', label: '✨ Spesial' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeSection === tab.id ? 'bg-neon-purple text-white' : 'text-gray-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status message */}
      {statusMsg && (
        <div className={`mx-4 mb-3 py-2 px-4 rounded-xl text-xs font-bold text-center ${
          statusMsg.startsWith('✅') ? 'bg-green-900/50 text-green-400 border border-green-500/30' :
          statusMsg.startsWith('❌') ? 'bg-red-900/50 text-red-400 border border-red-500/30' :
          'bg-dark-700 text-gray-300 border border-dark-500'
        }`}>
          {statusMsg}
        </div>
      )}

      <div className="flex-1 scrollable px-4 pb-4 space-y-3">
        {/* PACK SECTION */}
        {activeSection === 'pack' && (
          <>
            <p className="text-xs text-gray-400">Beli dengan Diamond yang kamu miliki</p>
            {Object.values(PACKS).map(pack => (
              <motion.div
                key={pack.id}
                className={`relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br ${pack.color}`}
              >
                {pack.popular && (
                  <div className="absolute top-2 right-2 bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                    POPULER
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{pack.emoji}</span>
                    <div>
                      <h3 className="font-black text-white text-lg">{pack.name}</h3>
                      <p className="text-xs text-white/70">{pack.desc}</p>
                      {pack.guaranteed && (
                        <span className="text-xs bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded-full">
                          Garansi {pack.guaranteed}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-neon-cyan font-black">💎 {pack.diamonds.toLocaleString()} Diamond</div>
                      <div className="text-xs text-white/50">≈ {formatRupiah(pack.rupiah)}</div>
                    </div>
                    <button
                      onClick={() => handleBuyPackWithDiamonds(pack.id)}
                      disabled={loading || (user?.diamonds || 0) < pack.diamonds}
                      className={`px-5 py-2.5 rounded-xl font-black text-sm transition-all ${
                        (user?.diamonds || 0) >= pack.diamonds
                          ? 'bg-white text-dark-900 hover:bg-gray-100 active:scale-95'
                          : 'bg-dark-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {(user?.diamonds || 0) >= pack.diamonds ? 'Buka!' : 'Diamond Kurang'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </>
        )}

        {/* DIAMOND SECTION */}
        {activeSection === 'diamond' && (
          <>
            <p className="text-xs text-gray-400 mb-1">Pembelian Diamond — item digital untuk hiburan</p>
            <div className="text-[10px] text-gray-600 bg-dark-800 rounded-lg p-2 mb-3">
              ⚠️ Game hiburan — kartu tidak memiliki nilai finansial real, tidak dapat diuangkan
            </div>
            {DIAMOND_PACKAGES.map(pkg => (
              <motion.button
                key={pkg.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleBuyDiamonds(pkg)}
                disabled={loading}
                className={`w-full rounded-2xl border overflow-hidden ${
                  pkg.popular ? 'border-neon-purple' : 'border-dark-500'
                }`}
              >
                {pkg.popular && (
                  <div className="bg-neon-purple text-white text-[10px] font-black py-1 text-center">
                    💎 PALING POPULER
                  </div>
                )}
                <div className="bg-dark-800 p-4 flex items-center justify-between">
                  <div className="text-left">
                    <div className="font-black text-white text-xl">💎 {(pkg.diamonds).toLocaleString()}</div>
                    {pkg.bonus > 0 && (
                      <div className="text-xs text-green-400">+{pkg.bonus} Bonus Diamond</div>
                    )}
                    <div className="text-xs text-gray-400">{pkg.label}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-neon-cyan text-lg">{formatRupiah(pkg.rupiah)}</div>
                    <div className="text-[10px] text-gray-500">QRIS · Dana · OVO · GoPay</div>
                  </div>
                </div>
              </motion.button>
            ))}
          </>
        )}

        {/* SPECIAL SECTION */}
        {activeSection === 'special' && (
          <>
            {/* Battle Pass */}
            <div className={`rounded-2xl overflow-hidden border ${hasBattlePass ? 'border-yellow-500' : 'border-neon-purple'}`}>
              {hasBattlePass ? (
                <div className="p-4 bg-gradient-to-br from-yellow-900 to-yellow-700">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">✨</span>
                    <div>
                      <h3 className="font-black text-white text-lg">Battle Pass Aktif</h3>
                      <p className="text-xs text-yellow-200">Berakhir: {new Date(user.battle_pass_expires_at).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                  <div className="text-xs text-yellow-100 space-y-1">
                    <div>✅ +50% Gold dari battle</div>
                    <div>✅ 1 Pack Harian gratis per hari</div>
                    <div>✅ Card back eksklusif</div>
                    <div>✅ Prioritas matchmaking</div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gradient-to-br from-purple-950 to-purple-800">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">✨</span>
                    <div>
                      <h3 className="font-black text-white text-lg">Battle Pass Bulanan</h3>
                      <p className="text-xs text-purple-200">Berlaku 30 hari penuh</p>
                    </div>
                  </div>
                  <div className="text-xs text-purple-100 space-y-1 mb-4">
                    <div>💛 +50% Gold dari setiap battle</div>
                    <div>📦 1 Pack Harian gratis tiap hari</div>
                    <div>🎨 Card back eksklusif</div>
                    <div>🚀 Prioritas matchmaking PvP</div>
                  </div>
                  <button
                    onClick={handleBuyBattlePass}
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-neon-purple to-neon-blue rounded-xl text-white font-black"
                  >
                    Beli Battle Pass — {formatRupiah(29000)}/bulan
                  </button>
                </div>
              )}
            </div>

            {/* Energy pack */}
            <div className="rounded-2xl bg-dark-800 border border-dark-500 p-4">
              <h3 className="font-bold text-white mb-2">⚡ Isi Energi</h3>
              <p className="text-xs text-gray-400 mb-3">10 Energi = 200 Diamond (Rp2.000)</p>
              <button
                onClick={async () => {
                  if ((user?.diamonds || 0) < 200) {
                    setStatusMsg('💎 Diamond tidak cukup!')
                    setTimeout(() => setStatusMsg(''), 2000)
                    return
                  }
                  const { error } = await supabase.from('users').update({
                    diamonds: user.diamonds - 200,
                    energy: Math.min(20, (user.energy || 0) + 10),
                    energy_updated_at: new Date().toISOString(),
                  }).eq('id', user.id)
                  if (!error) { await gameState.refreshUser(); setStatusMsg('✅ Energi ditambah!') }
                  setTimeout(() => setStatusMsg(''), 2000)
                }}
                disabled={loading}
                className="w-full py-2.5 bg-orange-600 rounded-xl text-white font-bold text-sm hover:bg-orange-500 active:scale-95 transition"
              >
                💎 200 Diamond → +10 ⚡ Energi
              </button>
            </div>
          </>
        )}

        {loading && (
          <div className="text-center py-4 text-gray-400 text-sm">
            ⏳ Memproses...
          </div>
        )}
      </div>
    </div>
  )
}
