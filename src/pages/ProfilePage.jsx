import { useState, useEffect } from 'react'
import CurrencyBar from '../components/CurrencyBar'
import { supabase } from '../lib/supabase'
import { formatNumber } from '../lib/gameEngine'

export default function ProfilePage({ gameState, isAdmin, onAdminClick }) {
  const { user, inventory, getCurrentEnergy, refreshUser } = gameState
  const [leaderboard, setLeaderboard] = useState([])
  const [referrals, setReferrals] = useState([])
  const [transactions, setTransactions] = useState([])
  const [activeTab, setActiveTab] = useState('stats')

  useEffect(() => {
    fetchLeaderboard()
    if (user?.id) {
      fetchReferrals()
      fetchTransactions()
    }
  }, [user?.id])

  async function fetchLeaderboard() {
    const { data } = await supabase
      .from('users')
      .select('id, telegram_id, telegram_first_name, telegram_username, mmr, diamonds')
      .order('mmr', { ascending: false })
      .limit(50)
    if (data) setLeaderboard(data)
  }

  async function fetchReferrals() {
    const { data } = await supabase
      .from('referrals')
      .select('*, referred:referred_id(telegram_first_name, telegram_username, created_at), level')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setReferrals(data)
  }

  async function fetchTransactions() {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setTransactions(data)
  }

  const totalCards = inventory.reduce((s, i) => s + (i.qty || 0), 0)
  const uniqueCards = inventory.filter(i => i.qty > 0).length
  const myRank = leaderboard.findIndex(u => u.id === user?.id) + 1

  return (
    <div className="flex flex-col h-full">
      <CurrencyBar user={user} getCurrentEnergy={getCurrentEnergy} />

      <div className="flex-1 scrollable">
        {/* Profile header */}
        <div className="px-4 pt-5 pb-4 text-center bg-gradient-to-b from-dark-800 to-dark-900">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center text-4xl mx-auto mb-3 shadow-lg neon-glow-purple">
            {user?.telegram_first_name?.[0]?.toUpperCase() || '?'}
          </div>
          <h2 className="text-xl font-black text-white">{user?.telegram_first_name || 'Pemain'}</h2>
          {user?.telegram_username && (
            <p className="text-gray-400 text-sm">@{user.telegram_username}</p>
          )}
          <div className="flex justify-center gap-4 mt-3">
            <div className="text-center">
              <div className="text-lg font-black text-yellow-400">#{myRank || '?'}</div>
              <div className="text-xs text-gray-500">Rank</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-black text-neon-purple">{user?.mmr || 1000}</div>
              <div className="text-xs text-gray-500">MMR</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-black text-neon-cyan">{uniqueCards}</div>
              <div className="text-xs text-gray-500">Kartu Unik</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-black text-green-400">{referrals.length}</div>
              <div className="text-xs text-gray-500">Referral</div>
            </div>
          </div>

          {/* Battle Pass badge */}
          {user?.battle_pass_expires_at && new Date(user.battle_pass_expires_at) > new Date() && (
            <div className="mt-3 inline-flex items-center gap-1 bg-yellow-900/50 border border-yellow-500/30 rounded-full px-3 py-1">
              <span className="text-sm">✨</span>
              <span className="text-xs text-yellow-300 font-bold">Battle Pass Aktif</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-dark-800 mx-4 mt-2 rounded-xl p-1">
          {[
            { id: 'stats', label: 'Statistik' },
            { id: 'leaderboard', label: '🏆 Top' },
            { id: 'referral', label: '👥 Referral' },
            { id: 'history', label: '💳 Riwayat' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                activeTab === tab.id ? 'bg-neon-purple text-white' : 'text-gray-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="px-4 py-4 space-y-3">
          {/* STATS */}
          {activeTab === 'stats' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Diamond', value: `💎 ${formatNumber(user?.diamonds || 0)}`, color: 'text-neon-cyan' },
                  { label: 'Total Gold', value: `🪙 ${formatNumber(user?.gold || 0)}`, color: 'text-yellow-400' },
                  { label: 'Total Kartu', value: `🃏 ${totalCards}`, color: 'text-white' },
                  { label: 'Kartu Unik', value: `✨ ${uniqueCards}`, color: 'text-neon-purple' },
                ].map(stat => (
                  <div key={stat.label} className="glass rounded-xl p-4 text-center">
                    <div className={`text-xl font-black ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="glass rounded-xl p-4">
                <div className="text-sm font-bold text-white mb-3">Distribusi Kartu</div>
                {['legendary', 'epic', 'rare', 'common'].map(rarity => {
                  const count = inventory.filter(i => i.card?.rarity === rarity).length
                  const colors = { legendary: 'bg-yellow-500', epic: 'bg-purple-500', rare: 'bg-blue-500', common: 'bg-gray-500' }
                  const labels = { legendary: '👑 Legenda', epic: '💜 Epik', rare: '💙 Langka', common: '⬜ Biasa' }
                  return (
                    <div key={rarity} className="flex items-center gap-3 mb-2">
                      <span className="text-xs w-20 text-gray-300">{labels[rarity]}</span>
                      <div className="flex-1 h-2 bg-dark-700 rounded-full">
                        <div
                          className={`h-full ${colors[rarity]} rounded-full transition-all`}
                          style={{ width: uniqueCards > 0 ? `${(count / uniqueCards) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-6">{count}</span>
                    </div>
                  )
                })}
              </div>

              <div className="glass rounded-xl p-4">
                <div className="text-xs text-gray-400">Member sejak</div>
                <div className="text-white font-bold mt-1">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                </div>
              </div>

              {isAdmin && (
                <button
                  onClick={onAdminClick}
                  className="w-full py-3 bg-gradient-to-r from-red-900 to-red-700 border border-red-500/40 rounded-xl text-white font-bold flex items-center justify-center gap-2"
                >
                  🔑 Admin Dashboard
                </button>
              )}
            </>
          )}

          {/* LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-2">
              <div className="text-xs text-gray-400 mb-2">Top 50 berdasarkan MMR</div>
              {leaderboard.map((u, idx) => (
                <div
                  key={u.id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    u.id === user?.id
                      ? 'bg-neon-purple/20 border border-neon-purple/40'
                      : 'bg-dark-800'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                    idx === 0 ? 'bg-yellow-500 text-black' :
                    idx === 1 ? 'bg-gray-400 text-black' :
                    idx === 2 ? 'bg-orange-600 text-white' :
                    'bg-dark-600 text-gray-300'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">
                      {u.telegram_first_name || u.telegram_username || 'Pemain'}
                    </div>
                    <div className="text-xs text-gray-400">MMR: {u.mmr}</div>
                  </div>
                  <div className="text-xs text-neon-cyan font-bold">💎 {formatNumber(u.diamonds)}</div>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <div className="text-center text-gray-400 py-8">Belum ada data leaderboard</div>
              )}
            </div>
          )}

          {/* REFERRAL */}
          {activeTab === 'referral' && (
            <div>
              <div className="glass rounded-xl p-4 mb-3">
                <div className="text-sm font-bold text-white mb-1">Program Referral</div>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>🎯 L1 (langsung): 20% dari pembelian Diamond temanmu</div>
                  <div>🎯 L2 (teman dari teman): 5% dari pembelian Diamond</div>
                </div>
              </div>
              {referrals.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">👥</div>
                  <p className="text-gray-400 text-sm">Belum ada referral</p>
                  <p className="text-gray-500 text-xs mt-1">Bagikan link referral dari Beranda!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {referrals.map(ref => (
                    <div key={ref.id} className="bg-dark-800 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-white">
                          {ref.referred?.telegram_first_name || 'Pemain Baru'}
                        </div>
                        <div className="text-xs text-gray-400">
                          Level {ref.level} • {new Date(ref.created_at).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                      <div className="text-xs text-green-400 font-bold">
                        +{ref.total_commission_diamonds || 0} 💎
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TRANSACTION HISTORY */}
          {activeTab === 'history' && (
            <div>
              <div className="text-xs text-gray-400 mb-2">Riwayat pembelian Diamond</div>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">💳</div>
                  <p className="text-gray-400 text-sm">Belum ada transaksi</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map(tx => (
                    <div key={tx.id} className="bg-dark-800 rounded-xl p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-bold text-white capitalize">{tx.pack_type.replace(/_/g, ' ')}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{tx.midtrans_order_id}</div>
                          <div className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleDateString('id-ID')}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs font-bold ${
                            tx.status === 'paid' ? 'text-green-400' :
                            tx.status === 'pending' ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {tx.status === 'paid' ? '✅' : tx.status === 'pending' ? '⏳' : '❌'} {tx.status}
                          </div>
                          {tx.diamonds > 0 && (
                            <div className="text-xs text-neon-cyan">+{tx.diamonds} 💎</div>
                          )}
                          <div className="text-xs text-gray-400">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(tx.amount_rp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
