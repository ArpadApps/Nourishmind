import { useState } from 'react'
import WelcomeScreen from './WelcomeScreen'
import ChatScreen from './ChatScreen'

export default function App() {
  const [screen, setScreen] = useState('welcome')

  if (screen === 'welcome') {
    return <WelcomeScreen onStart={() => setScreen('chat')} />
  }

  return <ChatScreen />
}
