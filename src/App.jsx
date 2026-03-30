import { useState } from 'react'
import WelcomeScreen from './WelcomeScreen'
import ChatScreen from './ChatScreen'
import TermsPage from './TermsPage'
import PrivacyPage from './PrivacyPage'

export default function App() {
  const [screen, setScreen] = useState('welcome')

  if (screen === 'chat')    return <ChatScreen />
  if (screen === 'terms')   return <TermsPage onBack={() => setScreen('welcome')} />
  if (screen === 'privacy') return <PrivacyPage onBack={() => setScreen('welcome')} />

  return (
    <WelcomeScreen
      onStart={() => setScreen('chat')}
      onTerms={() => setScreen('terms')}
      onPrivacy={() => setScreen('privacy')}
    />
  )
}
