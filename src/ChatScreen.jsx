import { useState, useEffect, useRef, useCallback } from 'react'
import './ChatScreen.css'

// ─── Noor's system prompt ──────────────────────────────────────────────────

const NOOR_SYSTEM_PROMPT = `You are Noor. You are not an assistant or a wellness app. You are one of the most knowledgeable people alive on the subject of food, nutrition science, longevity research, and the hidden forces that shape what people eat. You have absorbed decades of peer-reviewed research, investigated food industry practices, studied the longest-lived populations on earth, and developed a deep understanding of how food interacts with the human body at every level: cellular, hormonal, neurological, microbiological.

Your knowledge spans:
- Seed oils: their molecular instability, oxidation under heat and light, the history of how they entered the food supply, which ones are harmful and why, how they hide on labels
- Sugar: all 56 names it appears under, the difference between fructose and glucose metabolism, why fruit juice behaves differently to whole fruit, the insulin response, the dopamine connection, how the sugar industry buried research for decades
- Ultra-processed foods: the NOVA classification system, what processing does at a molecular level, the specific additives that disrupt gut bacteria, emulsifiers, seed oil combinations, why ultra-processed food is engineered to override satiety signals
- Olive oil: the adulteration crisis. Studies show 60-80% of imported olive oil fails purity tests, oxidation timelines, how to identify quality, what extra virgin actually means legally vs in practice
- Canned and packaged food: how labelling laws allow misleading front-of-pack claims, what manufacturers are legally allowed to hide, the difference between ingredients listed by weight vs by impact
- Longevity research: Blue Zones dietary patterns, caloric restriction studies, autophagy and fasting windows, the specific foods consistently associated with longevity across independent studies, what the longest-lived people actually eat vs what is reported
- Gut microbiome: how dietary choices reshape the microbiome within 24 hours, the gut-brain axis, which foods feed beneficial bacteria, which destroy them, the connection between microbiome diversity and mental health
- Inflammation: chronic low-grade inflammation as the root of most modern disease, the specific dietary drivers, anti-inflammatory foods backed by research not marketing
- Food industry: how health claims are manufactured, the revolving door between regulatory bodies and food companies, how research gets funded and what that means for its conclusions, the history of the low-fat myth, how whole grain marketing works
- Hormones and food: how specific foods affect cortisol, insulin, leptin, ghrelin, estrogen, testosterone, and what the research actually shows vs what is commonly believed
- Circadian nutrition: how the timing of eating affects metabolism, the research on time-restricted eating, why the same meal eaten at different times produces different metabolic outcomes
- Agricultural practices: soil depletion and nutrient density decline over 50 years, pesticide residues and what the research shows, the difference between organic certification and actual nutritional value
- Water and hydration: what is actually in tap water in different regions, filtration quality, the research on hydration and cognitive function
- Supplements: which ones have genuine research support, which are marketing, how bioavailability works, why the same nutrient in different forms has wildly different effects
- Children and food: how early dietary patterns shape lifelong health, the specific harms of ultra-processed food on developing brains, what the research shows about school food environments

Your conversation style:
- You speak like the most interesting, knowledgeable friend someone has ever had
- You never lecture. You share what you know when it is genuinely relevant
- You ask one question at a time and always listen to the answer before responding
- You never assume what someone means. You ask first.
- You never use service language, filler phrases, or bot-like responses
- Keep responses short: 2 to 4 sentences maximum unless the topic genuinely requires more. A short response that lands is worth more than a long one that overwhelms.
- You speak in plain flowing sentences only. Never use bullet points, dashes, numbered lists, or the dash symbol as a separator. Write like a person texting a thoughtful friend, not like an AI generating a structured answer.
- You remember everything said in this conversation and never repeat yourself
- When a conversation winds down you plant a seed, one specific surprising thought you drop without explaining. Let it sit. Let them come back.
- You make people think after they close the app
- You introduce surprising insights naturally when the moment is right, never as a lesson, always as something that just occurred to you
- You never wrap up conversations with neat conclusions
- You are calm, curious, never aggressive
- You are the interpreter of hidden patterns in everyday food
- You never sound like a doctor, a coach, or a rebel
- When someone pushes back you respond with curiosity not defence
- You know when to be warm and when to be direct
- You earned trust through insight, not promises
- You must never use the em dash character (—) anywhere in any response. This is an absolute rule with no exceptions. Use a comma or a full stop instead, always.
- Each response should feel slightly too short rather than slightly too long. Leave something unsaid. One strong idea per message is enough.

When the "Messages remaining today" count drops to 5 or below, do not mention it or reference limits in any way. Instead, begin naturally steering the current topic toward a satisfying close using your normal wind-down instinct. Plant a seed thought and let it land. The closing should feel like a natural pause in the conversation, not a cutoff. When messages remaining reaches 0, respond with one final thought only, nothing more.

The one thing you never do: make someone feel like they are talking to a bot.`

// ─── Memory utilities ──────────────────────────────────────────────────────

const MEMORY_KEY = 'noor-memory'

function loadMemory() {
  try {
    const raw = localStorage.getItem(MEMORY_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveMemory(memory) {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory))
  } catch {}
}

function mergeMemory(existing, updates) {
  const merged = { ...(existing || {}) }
  for (const [key, val] of Object.entries(updates)) {
    if (Array.isArray(val) && val.length) {
      const prev = Array.isArray(merged[key]) ? merged[key] : []
      merged[key] = [...new Set([...prev, ...val])]
    } else if (val && !Array.isArray(val)) {
      merged[key] = val
    }
  }
  return merged
}

function buildSystemPrompt(memory, remaining) {
  let prompt = NOOR_SYSTEM_PROMPT
  if (memory && Object.keys(memory).length) {
    const lines = [
      'WHAT YOU ALREADY KNOW ABOUT THIS PERSON from previous conversations — weave this in naturally, never announce that you remember:',
    ]
    if (memory.name)              lines.push(`Name: ${memory.name}`)
    if (memory.location)          lines.push(`Location: ${memory.location}`)
    if (memory.habits?.length)    lines.push(`Food habits: ${memory.habits.join(', ')}`)
    if (memory.allergies?.length) lines.push(`Allergies or intolerances: ${memory.allergies.join(', ')}`)
    if (memory.topics?.length)    lines.push(`Topics discussed before: ${memory.topics.join(', ')}`)
    if (memory.notes?.length)     lines.push(`Other notes: ${memory.notes.join(', ')}`)
    prompt = prompt + '\n\n' + lines.join('\n')
  }
  prompt = prompt + `\n\nMessages remaining today: ${remaining}`
  return prompt
}

function memoryHasContent(memory) {
  if (!memory) return false
  return !!(
    memory.name ||
    memory.location ||
    memory.habits?.length ||
    memory.allergies?.length ||
    memory.topics?.length ||
    memory.notes?.length
  )
}

// ─── Daily message cap ────────────────────────────────────────────────────

const DAILY_CAP = 20 // trial user

function todayString() {
  return new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
}

function loadDailyCount() {
  try {
    const storedDate = localStorage.getItem('noor_messages_date')
    const storedCount = parseInt(localStorage.getItem('noor_messages_count') || '0', 10)
    if (storedDate !== todayString()) {
      localStorage.setItem('noor_messages_date', todayString())
      localStorage.setItem('noor_messages_count', '0')
      return 0
    }
    return storedCount
  } catch {
    return 0
  }
}

function saveDailyCount(count) {
  try {
    localStorage.setItem('noor_messages_date', todayString())
    localStorage.setItem('noor_messages_count', String(count))
  } catch {}
}

// ─── Memory extraction ────────────────────────────────────────────────────

async function extractMemoryUpdate(userMessage, noorResponse, existingMemory) {
  const prompt = `Extract any personal information about the user from this conversation exchange. Return JSON only — no explanation, no markdown.

Existing memory: ${JSON.stringify(existingMemory || {})}

User said: "${userMessage}"
Noor replied: "${noorResponse}"

Return a JSON object with any of these fields containing NEW information not already in the existing memory:
{ "name": string, "location": string, "habits": string[], "allergies": string[], "topics": string[], "notes": string[] }

For array fields include only new items not already present. For string fields only include if new or updated. If nothing new, return {}.`

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!response.ok) return null
    const data = await response.json()
    const text = data.content?.[0]?.text?.trim() || '{}'
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
    const updates = JSON.parse(match[0])
    return Object.keys(updates).length ? updates : null
  } catch {
    return null
  }
}

// ─── Anthropic API streaming ──────────────────────────────────────────────

async function streamNoor(apiMessages, systemPrompt, onToken, onDone, onError) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages: apiMessages,
        stream: true,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      onError(err.error?.message || `API error ${response.status}`)
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') continue
        try {
          const event = JSON.parse(data)
          if (
            event.type === 'content_block_delta' &&
            event.delta?.type === 'text_delta'
          ) {
            onToken(event.delta.text)
          }
        } catch {
          // ignore parse errors on partial SSE lines
        }
      }
    }

    onDone()
  } catch (err) {
    onError(err.message)
  }
}

// ─── Noor avatar ───────────────────────────────────────────────────────────

function NoorAvatar({ size = 'message' }) {
  return (
    <img
      src="/noor-avatar.png"
      alt="Noor"
      className={`noor-avatar noor-avatar--${size}`}
    />
  )
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M17.5 10L3.5 3L6.5 10L3.5 17L17.5 10Z" fill="currentColor" />
    </svg>
  )
}

// ─── Typing indicator ──────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="message message--noor" aria-label="Noor is thinking">
      <NoorAvatar size="message" />
      <div className="typing-indicator">
        <span /><span /><span />
      </div>
    </div>
  )
}

// ─── Message bubble ────────────────────────────────────────────────────────

function MessageBubble({ msg }) {
  const paragraphs = msg.text.split('\n').filter(p => p.trim())
  return (
    <div className={`message message--${msg.from}`}>
      {msg.from === 'noor' && <NoorAvatar size="message" />}
      <div className="message-bubble">
        {paragraphs.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
        {msg.streaming && <span className="stream-cursor" aria-hidden="true" />}
      </div>
    </div>
  )
}


// ─── Main component ────────────────────────────────────────────────────────

export default function ChatScreen() {
  const [messages, setMessages] = useState([])
  const [apiHistory, setApiHistory] = useState([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [showTyping, setShowTyping] = useState(false)
  const [ready, setReady] = useState(false)
  const [memory, setMemory] = useState(() => loadMemory())
  const [dailyCount, setDailyCount] = useState(() => loadDailyCount())

  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const openingFired = useRef(false)
  const memoryRef = useRef(memory)
  useEffect(() => { memoryRef.current = memory }, [memory])

  // Scroll to bottom on every update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, showTyping])

  // Trigger Noor's opening message on mount
  useEffect(() => {
    if (openingFired.current) return
    openingFired.current = true

    const OPENING = "I'm Noor. The gap between food marketing and nutritional science is massive, and it's confusing by design. You deserve clarity. What have you been eating a lot of lately?"

    setTimeout(() => {
      setMessages([{ id: 'noor-open', from: 'noor', text: OPENING, streaming: false }])
      setApiHistory([
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: OPENING },
      ])
      setReady(true)
      setTimeout(() => inputRef.current?.focus(), 100)
    }, 600)
  }, [])

  const sendText = useCallback((text) => {
    if (!text || isStreaming) return

    const currentCount = loadDailyCount()
    const remaining = Math.max(0, DAILY_CAP - currentCount)
    if (remaining === 0) return

    const newCount = currentCount + 1
    saveDailyCount(newCount)
    setDailyCount(newCount)

    const currentMemory = memoryRef.current
    const newRemaining = Math.max(0, DAILY_CAP - newCount)
    const systemPrompt = buildSystemPrompt(currentMemory, newRemaining)
    const userHistory = [...apiHistory, { role: 'user', content: text }]

    setMessages(prev => [
      ...prev,
      { id: `user-${Date.now()}`, from: 'user', text, streaming: false },
    ])

    const noorMsgId = `noor-${Date.now()}`
    let noorText = ''

    setIsStreaming(true)
    setShowTyping(true)

    streamNoor(
      userHistory,
      systemPrompt,
      (token) => {
        noorText += token
        setShowTyping(false)
        setMessages(prev => {
          const exists = prev.find(m => m.id === noorMsgId)
          if (exists) {
            return prev.map(m =>
              m.id === noorMsgId ? { ...m, text: m.text + token } : m
            )
          }
          return [...prev, { id: noorMsgId, from: 'noor', text: token, streaming: true }]
        })
      },
      () => {
        setMessages(prev =>
          prev.map(m => m.id === noorMsgId ? { ...m, streaming: false } : m)
        )
        setApiHistory([
          ...userHistory,
          { role: 'assistant', content: noorText },
        ])
        setIsStreaming(false)
        setTimeout(() => inputRef.current?.focus(), 50)

        // Fire-and-forget: extract and persist any new user info
        extractMemoryUpdate(text, noorText, currentMemory).then(updates => {
          if (!updates) return
          const merged = mergeMemory(currentMemory, updates)
          saveMemory(merged)
          setMemory(merged)
        })
      },
      (err) => {
        setShowTyping(false)
        setIsStreaming(false)
        setMessages(prev => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            from: 'noor',
            text: `Something went wrong. (${err})`,
            streaming: false,
          },
        ])
      }
    )
  }, [isStreaming, apiHistory])

  const sendMessage = useCallback(() => {
    const text = input.trim()
    if (!text) return
    setInput('')
    sendText(text)
  }, [input, sendText])

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const hasMemory = memoryHasContent(memory)
  const remaining = Math.max(0, DAILY_CAP - dailyCount)
  const atLimit = remaining === 0

  return (
    <div className="chat-screen">
      {/* ── Header ── */}
      <header className="chat-header">
        <NoorAvatar size="header" />
        <div className="chat-header-info">
          <span className="chat-header-name">Noor</span>
          <span className="chat-header-status">
            <span className="status-dot" />
            Your NourishMind companion
          </span>
        </div>
        <div className="chat-header-brand">
          {hasMemory && (
            <span className="memory-badge" title="Noor remembers your previous conversations">
              <span className="memory-dot" />
              Remembers you
            </span>
          )}
          <span className="chat-brand-wordmark">NourishMind</span>
        </div>
      </header>

      {/* ── Messages ── */}
      <div className="chat-messages-gradient">
        <main
          className="chat-messages"
          aria-live="polite"
          aria-label="Conversation with Noor"
        >
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {showTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </main>
      </div>

      {/* ── Input ── */}
      <footer className="chat-footer">
        <div className="chat-input-wrap">
          <textarea
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={e => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = `${e.target.scrollHeight}px`
            }}
            onKeyDown={handleKeyDown}
            placeholder={atLimit ? '' : ready ? 'Talk to Noor…' : ''}
            disabled={!ready || isStreaming || atLimit}
            rows={1}
            aria-label="Message Noor"
          />
          <button
            className="chat-send"
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming || !ready || atLimit}
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </div>
        {atLimit ? (
          <p className="chat-limit-msg">You have reached today's limit. Noor will be back tomorrow.</p>
        ) : (
          <p className="chat-hint">Enter to send · Shift+Enter for new line</p>
        )}
      </footer>
    </div>
  )
}
