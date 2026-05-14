import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatNumber, formatRupiah } from '../lib/gameEngine'

export default function AdminPage({ gameState }) {
  const { user, cards } = gameState
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({ totalUsers: 0, totalTransactions: 0, totalRevenue: 0 })
  const [users, setUsers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchUsers()
    fetchTransactions()
  }, [])

  async function fetchStats() {
    setLoading(true)
    try {
      const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true })
      const { data: txData } = await supabase.from('transactions').select('amount_rp, status')
      const paidTx = txData?.filter(t => t.status === 'paid') || []
      const totalRevenue = paidTx.reduce((sum, t) => sum + (t.amount_rp || 0), 0)

      setStats({
        totalUsers: totalUsers || 0,
        totalTransactions: paidTx.length,
        totalRevenue,
      })
    } catch (err) {
      console.error('Admin stats error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchUsers() {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    if (data) setUsers(data)
  }

  async function fetchTransactions() {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    if (data) setTransactions(data)
  }

  async function grantDiamonds(userId, amount) {
    const target = users.find(u => u.id === userId)
    if (!target) return
    await supabase.from('users').update({
      diamonds: (target.diamonds || 0) + amount,
    }).eq('id', userId)
    fetchUsers()
  }

  return (
    <div className="h-full scrollable">
      <div className="p-4">
        <h1 className="text-xl font-black text-white mb-1">🔑 Admin Dashboard</h1>
        <p className="text-gray-400 text-sm mb-4">Kelola game Kartu Kripto ID</p>

        {/* Tabs */}
        <div className="flex gap-1 bg-dark-800 rounded-xl p-1 mb-4">
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'users', label: '👥 Users' },
            { id: 'transactions', label: '💳 Transaksi' },
            { id: 'cards', label: '🃏 Cards' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all ${
                activeTab === tab.id ? 'bg-neon-purple text-white' : 'text-gray-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && activeTab === 'overview' && (
          <div className="text-center py-8 text-gray-400">⏳ Memuat data...</div>
        )}

        {/* OVERVIEW */}
        {activeTab === 'overview' && !loading && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="glass rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">👥</div>
                <div className="text-lg font-black text-white">{formatNumber(stats.totalUsers)}</div>
                <div className="text-[10px] text-gray-400">Total Users</div>
              </div>
              <div className="glass rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">💳</div>
                <div className="text-lg font-black text-white">{stats.totalTransactions}</div>
                <div className="text-[10px] text-gray-400">Transaksi</div>
              </div>
              <div className="glass rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">💰</div>
                <div className="text-lg font-black text-neon-green">{formatRupiah(stats.totalRevenue)}</div>
                <div className="text-[10px] text-gray-400">Revenue</div>
              </div>
            </div>

            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-2">Total Kartu di Database</h3>
              <div className="text-2xl font-black text-neon-purple">{cards.length}</div>
            </div>

            <button
              onClick={() => { fetchStats(); fetchUsers(); fetchTransactions() }}
              className="w-full py-2.5 bg-dark-700 rounded-xl text-gray-300 font-bold text-sm"
            >
              🔄 Refresh Data
            </button>
          </div>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
          <div className="space-y-2">
            <div className="text-xs text-gray-400 mb-2">{users.length} users (terbaru 100)</div>
            {users.map(u => (
              <div key={u.id} className="bg-dark-800 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <div className="text-sm font-bold text-white">
                      {u.telegram_first_name || 'Pemain'}
                      {u.telegram_username && <span className="text-gray-400 text-xs ml-1">@{u.telegram_username}</span>}
                    </div>
                    <div className="text-xs text-gray-500">
                      TG ID: {u.telegram_id} • MMR: {u.mmr || 1000}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-neon-cyan">💎 {formatNumber(u.diamonds || 0)}</div>
                    <div className="text-xs text-yellow-400">🪙 {formatNumber(u.gold || 0)}</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => grantDiamonds(u.id, 1000)}
                    className="px-3 py-1 bg-neon-purple/20 border border-neon-purple/40 rounded-lg text-[10px] text-neon-purple font-bold"
                  >
                    +1000 💎
                  </button>
                  <button
                    onClick={() => grantDiamonds(u.id, 5000)}
                    className="px-3 py-1 bg-neon-cyan/20 border border-neon-cyan/40 rounded-lg text-[10px] text-neon-cyan font-bold"
                  >
                    +5000 💎
                  </button>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="text-center py-8 text-gray-400">Belum ada user</div>
            )}
          </div>
        )}

        {/* TRANSACTIONS */}
        {activeTab === 'transactions' && (
          <div className="space-y-2">
            <div className="text-xs text-gray-400 mb-2">{transactions.length} transaksi (terbaru 100)</div>
            {transactions.map(tx => (
              <div key={tx.id} className="bg-dark-800 rounded-xl p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-bold text-white capitalize">{(tx.pack_type || '').replace(/_/g, ' ')}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{tx.midtrans_order_id}</div>
                    <div className="text-xs text-gray-600">User: {tx.user_id}</div>
                    <div className="text-xs text-gray-600">
                      {tx.created_at ? new Date(tx.created_at).toLocaleDateString('id-ID') : '-'}
                    </div>
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
                      {formatRupiah(tx.amount_rp || 0)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center py-8 text-gray-400">Belum ada transaksi</div>
            )}
          </div>
        )}

        {/* CARDS */}
        {activeTab === 'cards' && (
          <div className="space-y-2">
            <div className="text-xs text-gray-400 mb-2">{cards.length} kartu di database</div>
            {cards.map(card => {
              const rarityColors = {
                common: 'border-gray-500 bg-gray-700',
                rare: 'border-blue-500 bg-blue-900',
                epic: 'border-purple-500 bg-purple-900',
                legendary: 'border-yellow-500 bg-yellow-900',
              }
              const style = rarityColors[card.rarity] || rarityColors.common
              return (
                <div key={card.id} className={`rounded-xl border ${style} p-3 flex items-center gap-3`}>
                  <div className="text-3xl">{card.emoji || '🪙'}</div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">{card.name || card.symbol}</div>
                    <div className="text-xs text-gray-300">{card.symbol} • {card.rarity}</div>
                    <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                      <span>⚔️ ATK: {card.base_atk}</span>
                      <span>🛡️ DEF: {card.base_def}</span>
                    </div>
                  </div>
                </div>
              )
            })}
            {cards.length === 0 && (
              <div className="text-center py-8 text-gray-400">Belum ada kartu di database</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
