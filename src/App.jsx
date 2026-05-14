import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useGameState } from './hooks/useGameState'
import { expandApp, setHeaderColor, setBackgroundColor } from './lib/telegram'
import BottomNav from './components/BottomNav'
import LoadingScreen from './components/LoadingScreen'
import HomePage from './pages/HomePage'
import CollectionPage from './pages/CollectionPage'
import ShopPage from './pages/ShopPage'
import BattlePage from './pages/BattlePage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'
import PackOpeningModal from './components/PackOpeningModal'
import MergeModal from './components/MergeModal'

export const ADMIN_TELEGRAM_IDS = [
  123456789, // Replace with actual admin Telegram IDs
  987654321,
]

function AppContent() {
  const gameState = useGameState()
  const { user, loading, error } = gameState
  const [activeTab, setActiveTab] = useState('home')
  const [packModal, setPackModal] = useState(null) // { packType }
  const [mergeModal, setMergeModal] = useState(null) // { card }

  useEffect(() => {
    expandApp()
    setHeaderColor('#0a0a1a')
    setBackgroundColor('#0a0a1a')
  }, [])

  if (loading) return <LoadingScreen />
  if (error) return (
    <div className="flex flex-col items-center justify-center h-full bg-dark-900 text-center px-8">
      <div className="text-6xl mb-4">⚠️</div>
      <h2 className="text-xl font-bold text-white mb-2">Ups!</h2>
      <p className="text-gray-400 text-sm">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 px-6 py-3 bg-neon-purple rounded-xl text-white font-bold"
      >
        Coba Lagi
      </button>
    </div>
  )

  const isAdmin = user && ADMIN_TELEGRAM_IDS.includes(user.telegram_id)

  const renderPage = () => {
    switch (activeTab) {
      case 'home': return <HomePage gameState={gameState} onOpenPack={(type) => setPackModal({ packType: type })} onTabChange={setActiveTab} />
      case 'collection': return <CollectionPage gameState={gameState} onMerge={(card) => setMergeModal({ card })} />
      case 'shop': return <ShopPage gameState={gameState} onOpenPack={(type) => setPackModal({ packType: type })} />
      case 'battle': return <BattlePage gameState={gameState} />
      case 'profile': return <ProfilePage gameState={gameState} isAdmin={isAdmin} onAdminClick={() => setActiveTab('admin')} />
      case 'admin': return isAdmin ? <AdminPage gameState={gameState} /> : <Navigate to="home" />
      default: return <HomePage gameState={gameState} onOpenPack={(type) => setPackModal({ packType: type })} onTabChange={setActiveTab} />
    }
  }

  return (
    <div className="flex flex-col h-full bg-dark-900">
      <div className="flex-1 overflow-hidden relative">
        {renderPage()}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin} user={user} />

      {packModal && (
        <PackOpeningModal
          gameState={gameState}
          packType={packModal.packType}
          onClose={() => { setPackModal(null); gameState.refreshInventory() }}
        />
      )}

      {mergeModal && (
        <MergeModal
          gameState={gameState}
          card={mergeModal.card}
          onClose={() => { setMergeModal(null); gameState.refreshInventory(); gameState.refreshUser() }}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppContent />
    </BrowserRouter>
  )
}
