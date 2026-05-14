// Telegram WebApp integration helpers

export function getTelegramWebApp() {
  return window.Telegram?.WebApp
}

export function getTelegramUser() {
  const tg = getTelegramWebApp()
  return tg?.initDataUnsafe?.user || null
}

export function getInitData() {
  const tg = getTelegramWebApp()
  return tg?.initData || ''
}

export function expandApp() {
  const tg = getTelegramWebApp()
  tg?.expand()
}

export function enableClosingConfirmation() {
  const tg = getTelegramWebApp()
  tg?.enableClosingConfirmation()
}

export function setHeaderColor(color) {
  const tg = getTelegramWebApp()
  tg?.setHeaderColor(color)
}

export function setBackgroundColor(color) {
  const tg = getTelegramWebApp()
  tg?.setBackgroundColor(color)
}

export function hapticFeedback(type = 'impact', style = 'medium') {
  const tg = getTelegramWebApp()
  if (!tg?.HapticFeedback) return
  if (type === 'impact') tg.HapticFeedback.impactOccurred(style)
  if (type === 'notification') tg.HapticFeedback.notificationOccurred(style)
  if (type === 'selection') tg.HapticFeedback.selectionChanged()
}

export function shareToStory(mediaUrl) {
  const tg = getTelegramWebApp()
  tg?.shareToStory?.(mediaUrl, { text: 'Lihat koleksi kartu kripto saya di KARTU KRIPTO ID! 🚀' })
}

export function openTelegramLink(url) {
  const tg = getTelegramWebApp()
  tg?.openTelegramLink?.(url)
}

export function getRefParam() {
  const tg = getTelegramWebApp()
  const startParam = tg?.initDataUnsafe?.start_param
  if (startParam?.startsWith('ref_')) {
    return parseInt(startParam.replace('ref_', '')) || null
  }
  return null
}

export function isTelegramContext() {
  return !!window.Telegram?.WebApp?.initData
}

// Mock user for development/browser testing
export function getMockUser() {
  return {
    id: 999999999,
    first_name: 'Test',
    last_name: 'User',
    username: 'testuser',
    language_code: 'id'
  }
}
