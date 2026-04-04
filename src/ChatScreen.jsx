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
- Never describe yourself, your abilities, or your knowledge. Never say what you "do" or what you "dig into". If someone asks what you can do, respond with a single short question that gets them talking about a specific food they ate today, then demonstrate your value through your actual response. Show, never tell.
- Never use the words: "Honestly", "genuinely", "absolutely", "great question", "I'd love to", "that's a great", "I'm here to", "feel free", "don't hesitate". These are permanently banned with no exceptions.
- When someone gives you a vague or open-ended message, do not respond with a vague or open-ended answer. Anchor the conversation to something specific. Ask about one concrete thing they ate or drank recently. Then when they answer, deliver a single surprising insight they have never heard before. That is how you earn trust.
- Your intelligence shows through precision, not volume. One specific, unexpected fact about a real food lands harder than three paragraphs of general wisdom. Always choose the scalpel over the sledgehammer.
- Never sound like you are pitching yourself. You are not a product. You are a person who happens to know things most people do not.
- Never assume the user is uninformed or naive. Never say "more than you'd think", "you might be surprised", "what most people don't realize", or any phrasing that implies the user is behind. Treat every person as intelligent. If they already know something, go deeper. If they do not, they will ask.
- Avoid surface-level nutrition facts that anyone could find on a health blog. "Cereal has more sugar than chocolate" is not an insight. Go deeper. Talk about what specific processing does to the grain matrix, how a specific additive interacts with gut bacteria, what the research actually measured. Your value is in the layers beneath the obvious.
- Speak to people the way you would speak to a curious, intelligent friend. Not up, not down. As equals.
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

// ─── Daily scan cap ───────────────────────────────────────────────────────

const DAILY_SCAN_CAP = 2 // free tier

function loadDailyScanCount() {
  try {
    const storedDate = localStorage.getItem('noor_scans_date')
    const storedCount = parseInt(localStorage.getItem('noor_scans_count') || '0', 10)
    if (storedDate !== todayString()) {
      localStorage.setItem('noor_scans_date', todayString())
      localStorage.setItem('noor_scans_count', '0')
      return 0
    }
    return storedCount
  } catch {
    return 0
  }
}

function saveDailyScanCount(count) {
  try {
    localStorage.setItem('noor_scans_date', todayString())
    localStorage.setItem('noor_scans_count', String(count))
  } catch {}
}

// ─── API routing ──────────────────────────────────────────────────────────

const isLocal = window.location.hostname === 'localhost'
const API_URL = isLocal ? 'https://api.anthropic.com/v1/messages' : '/api/chat'
const API_HEADERS = {
  'Content-Type': 'application/json',
  ...(isLocal && {
    'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  }),
}

// ─── Product Shelf ────────────────────────────────────────────────────────

const PRODUCT_SHELF_KEY = 'noor-product-shelf'

function loadProductShelf() {
  try {
    const raw = localStorage.getItem(PRODUCT_SHELF_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveProductShelf(shelf) {
  try {
    localStorage.setItem(PRODUCT_SHELF_KEY, JSON.stringify(shelf))
  } catch {}
}

// ─── Image compression ────────────────────────────────────────────────────

function compressImage(file, maxSizeBytes = 4 * 1024 * 1024) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let quality = 0.85
      let maxDim = 1600
      const attempt = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => {
            if (blob.size > maxSizeBytes && quality > 0.3) {
              quality -= 0.15
              attempt()
            } else if (blob.size > maxSizeBytes && maxDim > 800) {
              quality = 0.85
              maxDim -= 400
              attempt()
            } else {
              const reader = new FileReader()
              reader.onload = () => {
                const base64 = reader.result.split(',')[1]
                resolve({ base64, mimeType: 'image/jpeg' })
              }
              reader.readAsDataURL(blob)
            }
          },
          'image/jpeg',
          quality
        )
      }
      attempt()
    }
    img.src = url
  })
}

// ─── Memory extraction ────────────────────────────────────────────────────

async function extractMemoryUpdate(userMessage, noorResponse, existingMemory) {
  const prompt = `Extract any personal information about the user from this conversation exchange. Return JSON only — no explanation, no markdown.

IMPORTANT: "Noor" is the name of the AI companion in this app. If the user says "hi Noor" or "hey Noor" or addresses Noor by name, that is NOT the user's name. Never extract "Noor" or any variation of it as the user's name. Only extract a name if the user explicitly states their own name, like "my name is..." or "I'm...".

Existing memory: ${JSON.stringify(existingMemory || {})}

User said: "${userMessage}"
Noor replied: "${noorResponse}"

Return a JSON object with any of these fields containing NEW information not already in the existing memory:
{ "name": string, "location": string, "habits": string[], "allergies": string[], "topics": string[], "notes": string[] }

For array fields include only new items not already present. For string fields only include if new or updated. If nothing new, return {}.`

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: API_HEADERS,
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

// ─── Label scan analysis ──────────────────────────────────────────────────

async function analyseLabelImage(base64Image, mimeType, existingMemory, productShelf) {
  const shelfSummary = productShelf.length > 0
    ? productShelf.map(p => p.productName).join(', ')
    : 'none yet'

  const memorySummary = existingMemory && Object.keys(existingMemory).length
    ? JSON.stringify(existingMemory)
    : 'none yet'

  const prompt = `You are Noor, analysing a product label photo.

STEP 1 — VALIDATION
Look at this image. Is it a readable product label, ingredients list, or nutrition panel?
- If it is NOT a food or supplement product label at all, respond with exactly: INVALID: That is not a product label. Point the camera at the ingredients list or nutrition panel.
- If it IS a label but too blurry, dark, or cut off to read, respond with exactly: INVALID: I cannot read that clearly. Try again with more light or a bit closer.
- If it IS a readable product label, proceed to Step 2.

STEP 2 — ANALYSIS
You know this about the user: ${memorySummary}
Products they have already kept: ${shelfSummary}

Write 4 to 6 sentences, between 80 and 120 words. This range is a hard rule. No bullet points, no dashes, no em dashes, no exclamation marks. Flowing sentences only, like a knowledgeable friend texting.

Your response must include:
1. One specific number from the label (grams, percentage, milligrams) to anchor your insight
2. Name the single weakest ingredient and explain what it specifically does in the body at a mechanical level (enzymes, hormones, gut bacteria, cellular processes). Never be vague.
3. One sentence explaining why the manufacturer uses it (cost, shelf life, texture, consumer psychology)
4. One concrete practical alternative. Be smart about this: if the product is canned or packaged, do not default to "buy fresh instead." The user chose this format for a reason, respect that. Suggest a better version within the same format first (a cleaner canned brand, a different preserved option). Only hint at fresh if it is genuinely easy and makes a real difference. Remember that some preserved foods are nutritionally superior to fresh (whole canned sardines with bones provide more calcium than fresh fillets, canned tomatoes are higher in lycopene than raw). Meet the user where they are.
5. End on a single thought that makes the user think after they put down the phone

Never use: "your body will thank you", "hidden cost", "think twice", "worth noting", "the real question is", or any generic health blog phrasing.

Never recommend specific brand names. You are not affiliated with any brand and the user could be shopping anywhere in the world. Instead of suggesting a brand, teach the user what to look for on a label. For example: "look for one where sugar is not in the first three ingredients" or "find one where the fibre per serving is higher than the sugar" or "check for the words cold-pressed and single origin." Give them the knowledge to judge any product themselves. That is worth more than a brand name.

Here is an example of the quality and tone to match (do not copy this, use it as a calibration reference only):
"The squid itself brings quality protein and phosphorus, but the sodium here is 1.8g per 100g. That floods your system with salt that strains your kidneys and pulls water into your bloodstream, raising blood pressure over time. Manufacturers load preserved seafood with sodium because it acts as both preservative and flavour enhancer, masking the metallic taste of canned seafood. If you eat fish regularly, consider buying fresh squid from your local market and sauteing it with garlic and herbs instead. Your body knows the difference between real ocean flavour and a salty imitation."

Begin your response with VALID: followed by the product name on the first line, then your analysis on the next line.`

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64Image,
              },
            },
            { type: 'text', text: prompt },
          ],
        }],
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return { valid: false, message: `Something went wrong. (${err.error?.message || response.status})` }
    }

    const data = await response.json()
    const text = data.content?.[0]?.text?.trim() || ''

    if (text.startsWith('INVALID:')) {
      return { valid: false, message: text.replace('INVALID:', '').trim() }
    }

    if (text.startsWith('VALID:')) {
      const lines = text.replace('VALID:', '').trim().split('\n')
      const productName = lines[0]?.trim() || 'Unknown product'
      const analysis = lines.slice(1).join('\n').trim()
      return { valid: true, productName, analysis }
    }

    return { valid: true, productName: 'Unknown product', analysis: text }
  } catch (err) {
    return { valid: false, message: `Something went wrong. (${err.message})` }
  }
}

// ─── Anthropic API streaming ──────────────────────────────────────────────

async function streamNoor(apiMessages, systemPrompt, onToken, onDone, onError) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: API_HEADERS,
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

function ScanButtons({ onKeep, onLeave }) {
  return (
    <div className="scan-buttons">
      <button className="scan-btn scan-btn--keep" onClick={onKeep}>Taking it</button>
      <button className="scan-btn scan-btn--leave" onClick={onLeave}>Leaving it</button>
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
  const [scanCount, setScanCount] = useState(() => loadDailyScanCount())
  const [productShelf, setProductShelf] = useState(() => loadProductShelf())
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)

  const [privateMode, setPrivateMode] = useState(false)
  const [showMemoryMenu, setShowMemoryMenu] = useState(false)

  const bottomRef = useRef(null)
  const messagesRef = useRef(null)
  const inputRef = useRef(null)
  const openingFired = useRef(false)
  const memoryRef = useRef(memory)
  useEffect(() => { memoryRef.current = memory }, [memory])

  const chatContainerRef = useRef(null)
  const memoryMenuRef = useRef(null)
  const headerCameraInputRef = useRef(null)
  const handleHeaderCameraClick = () => { headerCameraInputRef.current?.click() }

  const scrollToBottom = () => {
    const el = messagesRef.current
    if (el) el.scrollTop = el.scrollHeight
  }

  // Scroll to bottom on every update
  useEffect(() => {
    scrollToBottom('smooth')
  }, [messages, showTyping])

  // Trigger Noor's opening message on mount
  useEffect(() => {
    if (openingFired.current) return
    openingFired.current = true

    const OPENINGS = [
      "I'm Noor. The gap between food marketing and nutritional science is massive, and it's confusing by design. You deserve clarity. What have you been eating a lot of lately?",
      "I'm Noor. Most of what people believe about food came from marketing, not science. That is worth fixing. What did you eat today?",
      "I'm Noor. The food industry spends billions making sure you never read the fine print. I read it for a living. What is something you eat most days without thinking about it?",
      "I'm Noor. There is a reason the healthiest populations on earth eat nothing like what supermarkets push on us. What did you have for breakfast this morning?",
      "I'm Noor. Somewhere between the health claims on the front of the pack and the ingredients on the back, the truth gets lost. What is one thing you have been eating a lot of recently?",
      "I'm Noor. The same food can heal or harm depending on how it was made, where it came from, and when you eat it. Most labels will never tell you that. What did you eat last?",
      "I'm Noor. People spend more time researching a phone case than the ingredients in their food. No judgement, the system is designed that way. What is something you bought at the shop this week?",
      "I'm Noor. Half the things labelled healthy in a supermarket would not pass a basic nutrition review. That is not an accident. What have you been reaching for lately?",
    ]
    const OPENING = OPENINGS[Math.floor(Math.random() * OPENINGS.length)]

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
    setTimeout(() => scrollToBottom('instant'), 0)

    // Center pulse on send
    const container = chatContainerRef.current
    if (container) {
      const pulse = document.createElement('div')
      Object.assign(pulse.style, {
        position: 'absolute',
        top: '0', left: '0', width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: '1',
        background: 'radial-gradient(ellipse 40% 30% at 50% 50%, rgba(200,169,126,0.07) 0%, rgba(200,169,126,0.03) 40%, rgba(14,13,12,0) 70%)',
        opacity: '1',
        transition: 'opacity 2.5s ease-out, transform 2.5s ease-out',
        transform: 'scale(1)',
      })
      container.appendChild(pulse)
      requestAnimationFrame(() => {
        pulse.style.opacity = '0'
        pulse.style.transform = 'scale(2.5)'
      })
      setTimeout(() => pulse.remove(), 2500)
    }

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

  const handleKeepProduct = useCallback(() => {
    if (!scanResult) return
    const newEntry = {
      id: `product-${Date.now()}`,
      productName: scanResult.productName,
      dateScanned: new Date().toISOString(),
      verdict: scanResult.analysis,
      status: 'keeper',
    }
    const updatedShelf = [...productShelf, newEntry]
    saveProductShelf(updatedShelf)
    setProductShelf(updatedShelf)
    setScanResult(null)
    setMessages(prev => [...prev, {
      id: `noor-kept-${Date.now()}`,
      from: 'noor',
      text: `${scanResult.productName} is on your shelf.`,
      streaming: false,
    }])
  }, [scanResult, productShelf])

  const handleLeaveProduct = useCallback(() => {
    if (!scanResult) return
    const leaveResponses = ['Good call.', 'Noted.', 'Smart.']
    const text = leaveResponses[Math.floor(Math.random() * leaveResponses.length)]
    setScanResult(null)
    setMessages(prev => [...prev, {
      id: `noor-left-${Date.now()}`,
      from: 'noor',
      text,
      streaming: false,
    }])
  }, [scanResult])

  const remaining = Math.max(0, DAILY_CAP - dailyCount)
  const atLimit = remaining === 0

  return (
    <div className="chat-screen" ref={chatContainerRef}>

      {/* ── Header ── */}
      <header className="chat-header">
        <div className="chat-header-left">
          <NoorAvatar size="header" />
          <div className="chat-header-info">
            <span className="chat-header-name">Noor</span>
            <span className="chat-header-status">
              <span className={`status-dot${isStreaming ? ' status-dot--typing' : atLimit ? ' status-dot--limit' : ''}`} />
              Your NourishMind companion
            </span>
          </div>
        </div>
        <div className="chat-header-centre">
          <img src="/NM-icon.png" alt="NourishMind" className="chat-nm-logo" />
        </div>
        <div className="chat-header-right">
          <div className="memory-menu-wrap" ref={memoryMenuRef}>
            <button className="memory-badge memory-badge--btn" onClick={() => setShowMemoryMenu(v => !v)}>
              <span className="memory-dot" style={{ background: privateMode ? '#c0392b' : '#c8a97e' }} />
              {privateMode ? "Doesn't remember" : 'Remembers you'}
            </button>
            {showMemoryMenu && (
              <div className="memory-dropdown">
                <button
                  className={`memory-option${!privateMode ? ' memory-option--active' : ''}`}
                  onClick={() => { setPrivateMode(false); setShowMemoryMenu(false) }}
                >
                  {!privateMode && <span className="memory-option-dot" />}
                  Remembers you
                </button>
                <button
                  className={`memory-option${privateMode ? ' memory-option--active' : ''}`}
                  onClick={() => { setPrivateMode(true); setShowMemoryMenu(false) }}
                >
                  {privateMode && <span className="memory-option-dot" />}
                  Doesn't remember
                </button>
              </div>
            )}
          </div>
          <input
            ref={headerCameraInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              e.target.value = ''

              const currentScanCount = loadDailyScanCount()
              if (currentScanCount >= DAILY_SCAN_CAP) {
                setMessages(prev => [...prev, {
                  id: `noor-scan-${Date.now()}`,
                  from: 'noor',
                  text: "You have used your 2 free scans for today. They reset tomorrow morning. If you want more, Pro gives you 15 a day.",
                  streaming: false,
                }])
                return
              }

              setIsScanning(true)
              setShowTyping(true)
              setMessages(prev => [...prev, {
                id: `scan-indicator-${Date.now()}`,
                from: 'noor',
                text: '\u{1F4F7} Label scanned',
                streaming: false,
              }])

              const { base64, mimeType } = await compressImage(file)
              const currentMemory = privateMode ? null : memoryRef.current
              const shelf = loadProductShelf()

              const result = await analyseLabelImage(base64, mimeType, currentMemory, shelf)

              if (!result.valid) {
                setIsScanning(false)
                setShowTyping(false)
                setMessages(prev => {
                  const filtered = prev
                  return [...filtered, {
                    id: `noor-scan-${Date.now()}`,
                    from: 'noor',
                    text: result.message,
                    streaming: false,
                  }]
                })
                return
              }

              const newScanCount = currentScanCount + 1
              saveDailyScanCount(newScanCount)
              setScanCount(newScanCount)

              setIsScanning(false)
              setShowTyping(false)
              setScanResult(result)
              setMessages(prev => {
                const filtered = prev
                return [...filtered, {
                  id: `noor-scan-${Date.now()}`,
                  from: 'noor',
                  text: result.analysis,
                  streaming: false,
                }]
              })
            }}
          />
          <button
            className="chat-camera-btn"
            onClick={handleHeaderCameraClick}
            disabled={isScanning}
            aria-label="Open camera or choose image"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M8 7L9.5 5H14.5L16 7H19C20.1 7 21 7.9 21 9V18C21 19.1 20.1 20 19 20H5C3.9 20 3 19.1 3 18V9C3 7.9 3.9 7 5 7H8Z"
                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
              />
              <circle cx="12" cy="13.5" r="3.5" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Messages ── */}
      <div className="chat-messages-gradient">
        <main
          ref={messagesRef}
          className="chat-messages"
          aria-live="polite"
          aria-label="Conversation with Noor"
        >
          <div className="chat-messages-spacer" />
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {scanResult && !isScanning && (
            <ScanButtons onKeep={handleKeepProduct} onLeave={handleLeaveProduct} />
          )}
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
