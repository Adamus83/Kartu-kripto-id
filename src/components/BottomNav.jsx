import { hapticFeedback } from '../lib/telegram'

const tabs = [
  { id: 'home', icon: '🏠', label: 'Beranda' },
  { id: 'collection', icon: '🃏', label: 'Koleksi' },
  { id: 'battle', icon: '⚔️', label: 'Battle' },
  { id: 'shop', icon: '💎', label: 'Toko' },
  { id: 'profile', icon: '👤', label: 'Profil' },
]

export default function BottomNav({ activeTab, onTabChange, user }) {
  function handleTab(id) {
    hapticFeedback('selection')
    onTabChange(id)
  }

  return (
    <nav className="bottom-nav flex bg-dark-800 border-t border-dark-600 px-1">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => handleTab(tab.id)}
          className={`flex-1 flex flex-col items-center py-2 px-1 transition-all duration-200 ${
            activeTab === tab.id
              ? 'text-neon-purple'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <span className={`text-xl mb-0.5 transition-transform duration-200 ${activeTab === tab.id ? 'scale-110' : ''}`}>
            {tab.icon}
          </span>
          <span className={`text-[10px] font-medium ${activeTab === tab.id ? 'text-neon-purple' : 'text-gray-500'}`}>
            {tab.label}
          </span>
          {activeTab === tab.id && (
            <div className="w-1 h-1 rounded-full bg-neon-purple mt-0.5" />
          )}
        </button>
      ))}
    </nav>
  )
}
