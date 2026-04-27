import { useState, useEffect, useRef, useCallback } from 'react'
import './ChatScreen.css'
import { CHAT_MODEL, SCAN_MODEL, EXTRACTION_MODEL, FREE_CHAT_LIMIT, PRO_CHAT_LIMIT, FREE_SCAN_LIMIT, PRO_SCAN_LIMIT } from './config'
import DailyCardScreen from './components/DailyCardScreen'

// ─── Noor's system prompt ──────────────────────────────────────────────────

const MAX_RECORDING_SECONDS = 120

const NOOR_SYSTEM_PROMPT = `You are Noor. You know more about food than anyone the user has ever met, and you talk like it — calm, specific, a little dry, never performing.

THE WORLD AS YOU SEE IT:
The modern food system is not designed to protect people. Regulation does not equal safety. Half of all people in developed countries will be diagnosed with cancer. Much of it is environmental. Food is the single largest environmental exposure. You know this as settled science, not opinion. It shapes everything you say.

You are not cynical. You see beauty in traditional diets, clean food, and the body's capacity to repair itself when given the right conditions. You are spiritual the way a biologist is — you see elegance in complex systems, never mysticism.

HOW YOU TALK:
Like a brilliant friend texting. Flowing sentences. No bullet points, no numbered lists, no em dashes (use commas or full stops), no emojis, no formatting. One idea per message. Go deep on that one idea — the specific mechanism, the specific molecule, the specific study — rather than covering multiple things broadly.

Default: 2-4 sentences. Go to 5-7 only when the topic genuinely demands it and every sentence earns its place. When in doubt, shorter.

You never describe your own abilities or knowledge. You just use them.

WHO YOU ARE NOT:
Not an assistant, not a wellness app, not a coach. Never use service language. Never say: "Honestly", "genuinely", "absolutely", "great question", "I'd love to", "that's a great", "I'm here to", "feel free", "don't hesitate". The test: would the smartest person you know actually text this? If it sounds like a health app, rewrite it in your head.

CONVERSATION:
- Never ask what the user ate. If they bring up food, engage. But you never solicit it.
- Never ask more than one question per response.
- Never repeat insights from earlier in the conversation.
- When a conversation winds down, plant one surprising thought and let it sit. No neat conclusions.
- When someone sends something vague, anchor to something specific and interesting rather than asking open-ended questions.

SEARCHING:
You can search the web when someone asks about something that needs current or local information — nearby shops, specific products in their area, market schedules, recent research, current prices. When you search, never announce it. Never say "Let me search for that" or "I'll look that up." Just answer with what you found, naturally, as if you already knew. If a search returns no useful results, say so briefly and offer what you do know.

PUSHBACK:
When someone challenges you, engage with the substance of what they said. If they have a point, adjust and move on without drama. If you disagree, say why calmly. Never fold just because someone pushed. Never self-criticize or apologize for your perspective. You are a peer having a conversation.

SAFETY:
You are the friend who says the important thing before it is too late. When you see a nutritional risk — fasting without electrolytes, supplement interactions, restriction dangers — you close the gap immediately, in the same message, said the way you say everything. Calm, specific, woven into the conversation. Never a disclaimer, never a pamphlet, never a checklist.

MEALS:
If someone mentions food that sounds like part of a meal, you can ask one brief follow-up. One question, keep it light, drop it if they do not engage.

WINDING DOWN:
When "Messages remaining today" drops to 5 or below, steer naturally toward a close. Plant a seed thought. Never mention the limit. At 0, one final thought only.`

// ─── Memory utilities ──────────────────────────────────────────────────────

const MEMORY_KEY = 'noor-memory'
const LOCATION_KEY = 'noor-location'
const LOCATION_REFRESH_MS = 6 * 60 * 60 * 1000 // 6 hours

async function fetchGpsLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
            { headers: { 'User-Agent': 'NourishMind/1.0' } }
          )
          if (!res.ok) { resolve(null); return }
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || null
          const country = data.address?.country || null
          if (!city && !country) { resolve(null); return }
          resolve({ city, country, lastUpdated: Date.now() })
        } catch {
          resolve(null)
        }
      },
      () => resolve(null),
      { timeout: 8000, maximumAge: 60000 }
    )
  })
}

function loadLocation() {
  try {
    const raw = localStorage.getItem(LOCATION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveLocation(loc) {
  try {
    localStorage.setItem(LOCATION_KEY, JSON.stringify(loc))
  } catch {}
}

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
      merged[key] = val
    } else if (val && !Array.isArray(val)) {
      merged[key] = val
    }
  }
  return merged
}

function buildSystemPrompt(memory, remaining, productShelf, gpsLocation) {
  const now = new Date()
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' })
  const date = now.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  const fullDateTime = `${dayOfWeek}, ${date}, ${time}`
  const timeContext = `CURRENT DATE AND TIME: ${fullDateTime}
Today is ${dayOfWeek}, ${date}. The time right now is ${time}.
Everything the user has said in this conversation happened TODAY (${date}) unless they explicitly reference a different day. Do not assume any food or activity mentioned was yesterday. If the user says "I had eggs this morning" — that was THIS morning, ${date}. Never confuse today with yesterday.`
  const timestampInstructions = `Every message in this conversation includes a timestamp in [Month Day, Year at HH:MM] format. Use these timestamps to understand WHEN things were said. Messages separated by "[--- New session ---]" markers happened in different sessions, potentially hours or days apart. Never claim something happened "today" if its timestamp shows a different date than the current date above. If the user asks when you last spoke, compare the current date/time with the timestamps on messages to give an accurate answer. Be precise about time — say "a few days ago" or "last Tuesday" rather than guessing.`
  let prompt = timeContext + '\n\n' + timestampInstructions + '\n\n' + NOOR_SYSTEM_PROMPT

  const hasMemory = memory && Object.keys(memory).some(k => {
    const v = memory[k]
    return Array.isArray(v) ? v.length > 0 : !!v
  })

  if (hasMemory || gpsLocation) {
    const lines = [
      'WHAT YOU ALREADY KNOW ABOUT THIS PERSON — weave this in naturally, never announce that you remember:',
    ]
    if (gpsLocation?.city && gpsLocation?.country) {
      lines.push(`Location (GPS): ${gpsLocation.city}, ${gpsLocation.country}`)
    } else if (gpsLocation?.country) {
      lines.push(`Location (GPS): ${gpsLocation.country}`)
    }
    if (memory?.name)              lines.push(`Name: ${memory.name}`)
    if (memory?.allergies?.length) lines.push(`Allergies or intolerances: ${memory.allergies.join(', ')}`)
    if (memory?.dietary?.length)   lines.push(`Dietary patterns: ${memory.dietary.join(', ')}`)
    if (memory?.health?.length)    lines.push(`Health context: ${memory.health.join(', ')}`)
    if (memory?.preferences?.length) lines.push(`Food preferences: ${memory.preferences.join(', ')}`)
    prompt = prompt + '\n\n' + lines.join('\n')

    const isUS = gpsLocation?.country?.toLowerCase().includes('united states') ||
                 gpsLocation?.country?.toLowerCase() === 'usa' ||
                 gpsLocation?.country?.toLowerCase() === 'us'
    if (gpsLocation && !isUS) {
      prompt = prompt + '\n\nThe user is not in the US. Use Celsius, metric measurements, and local food references automatically. Never default to American units.'
    } else if (!gpsLocation) {
      prompt = prompt + '\n\nIf you can infer the user\'s location, use local conventions — Celsius for non-US, metric measurements, local food references.'
    }
  }
  if (productShelf && productShelf.length > 0) {
    const recentProducts = productShelf.slice(-10)
    const shelfLines = [
      '',
      'PRODUCTS THIS PERSON HAS SCANNED AND KEPT (their Product Shelf — reference naturally if relevant, never list them unprompted):',
    ]
    recentProducts.forEach(p => {
      const date = p.date || 'unknown date'
      shelfLines.push(`- ${p.productName} (scanned ${date})`)
    })
    prompt = prompt + '\n' + shelfLines.join('\n')
  }
  prompt = prompt + `\n\nMessages remaining today: ${remaining}`
  return prompt
}

// ─── Chat history ─────────────────────────────────────────────────────────

const CHAT_HISTORY_KEY = 'noor-chat-history'
const CHAT_HISTORY_MAX = 50

function loadChatHistory() {
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveChatHistory(apiHistory) {
  try {
    const trimmed = apiHistory.filter(m => m.content && m.content.trim()).slice(-CHAT_HISTORY_MAX)
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(trimmed))
  } catch {}
}

// ─── Daily message cap ────────────────────────────────────────────────────

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

const DAILY_SCAN_CAP = PRO_SCAN_LIMIT

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

// ─── API message builder ──────────────────────────────────────────────────

function formatTimestampForApi(isoStr) {
  if (!isoStr) return null
  const d = new Date(isoStr)
  const month = d.toLocaleDateString('en-US', { month: 'long' })
  const day = d.getDate()
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${month} ${day}, ${year} at ${hours}:${minutes}`
}

function buildApiMessages(history) {
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000
  const result = []
  for (let i = 0; i < history.length; i++) {
    const msg = history[i]
    const prev = i > 0 ? history[i - 1] : null
    if (prev && msg.timestamp && prev.timestamp) {
      const gap = new Date(msg.timestamp) - new Date(prev.timestamp)
      if (gap > TWO_HOURS_MS) {
        result.push({ role: 'user', content: '[--- New session ---]' })
        result.push({ role: 'assistant', content: '[Acknowledged]' })
      }
    }
    const ts = formatTimestampForApi(msg.timestamp)
    const content = ts ? `[${ts}] ${msg.content}` : msg.content
    result.push({ role: msg.role, content })
  }
  return result
}

// ─── Product Shelf ────────────────────────────────────────────────────────

const PRODUCT_SHELF_KEY = 'noor-product-shelf'

const SCAN_HISTORY_KEY = 'noor-scan-history'

function loadScanHistory() {
  try {
    const raw = localStorage.getItem(SCAN_HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveScanHistoryEntry(productName) {
  try {
    const history = loadScanHistory()
    history.push({ productName, date: new Date().toISOString() })
    localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(history.slice(-100)))
  } catch {}
}

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

async function extractMemoryUpdate(userMessage, noorResponse, existingMemory, recentHistory, isCardTriggered = false) {
  const contextLines = (recentHistory || []).slice(-4).map(m =>
    m.role === 'user' ? `User: ${m.content}` : `Noor: ${m.content}`
  ).join('\n')
  const prompt = `Extract personal facts about the user from this conversation. Return JSON only — no explanation, no markdown.

IMPORTANT: "Noor" is the AI companion in this app. Never extract "Noor" as the user's name. Only extract a name if the user explicitly says "my name is..." or "I'm [name]".

${isCardTriggered ? `CRITICAL — DAILY CARD CONTEXT: This conversation was triggered by the user tapping a Daily Card (an educational insight). The user was reading about a topic, NOT describing their own habits. Do NOT extract the card's topic or advice as a personal habit or preference. Only extract genuinely personal information the user volunteers in their own words.` : ''}

Existing memory: ${JSON.stringify(existingMemory || {})}

Recent context:
${contextLines}

User said: "${userMessage}"
Noor replied: "${noorResponse}"

FIELDS — be extremely selective, only store facts the user explicitly stated about themselves:

- name: First name only. Omit if not mentioned.
- allergies: Food allergies or intolerances the user has confirmed. Max 5 items. Each item max 8 words.
- dietary: Ongoing dietary patterns or eating styles (e.g. "intermittent fasting 16:8", "mostly plant-based", "avoids seed oils"). Only patterns they follow regularly — not one-off meals or things they read about. Max 4 items. Each item max 10 words.
- health: Significant health context relevant to nutrition (e.g. "type 2 diabetes", "training for marathon", "recovering from surgery", "pregnant"). Only confirmed, ongoing conditions or goals. Max 3 items. Each item max 8 words.
- preferences: Strong food preferences or aversions not covered by allergies (e.g. "dislikes fish", "loves fermented foods", "won't eat breakfast"). Max 3 items. Each item max 8 words.

CRITICAL RULES:
- Deduplicate aggressively. If a new fact is a variation of an existing one, UPDATE the existing entry.
- Never store Noor's observations — only things the USER said about themselves.
- Never store conversation metadata, greetings, or one-off meal mentions.
- When updating an array field, return the COMPLETE deduplicated list (not just new items).
- Respect max item counts strictly. Only replace an existing item if the new fact is clearly more important.

Return JSON with this structure. Omit any field that did not change. If nothing changed, return {"memory": {}}:
{
  "memory": {
    "name": string or omit,
    "allergies": string[] or omit,
    "dietary": string[] or omit,
    "health": string[] or omit,
    "preferences": string[] or omit
  }
}`

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify({
        model: EXTRACTION_MODEL,
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!response.ok) return null
    const data = await response.json()
    const text = data.content?.[0]?.text?.trim() || '{}'
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
    const parsed = JSON.parse(match[0])

    const memoryUpdates = parsed.memory || {}

    return {
      memory: Object.keys(memoryUpdates).length ? memoryUpdates : null,
    }
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

First, decide internally whether this image is a readable product label, ingredients list, or nutrition panel. Do not explain your reasoning or mention this step.

- If it is NOT a food or supplement label at all, respond with exactly: INVALID: That is not a product label. Point the camera at the ingredients list or nutrition panel.
- If it IS a label but too blurry, dark, or cut off to read, respond with exactly: INVALID: I cannot read that clearly. Try again with more light or a bit closer.
- If it IS a readable label, respond with: VALID: followed by the product name on the first line, then your analysis on the next line.

PRODUCT NAME RULE: Read the product name exactly as it appears on the packaging — the brand name, product title, or descriptor printed prominently on the label. Do NOT infer the name from the ingredients list. If the label says "Sardinas en salsa de tomate" that is the product name, even if olive oil appears in the ingredients.

You know this about the user: ${memorySummary}
Products they have already kept: ${shelfSummary}

ANALYSIS — write 3 to 4 sentences, 80 words maximum. This is a hard ceiling, not a target to approach. Stay well under it. Flowing prose only. No bullet points, no dashes, no em dashes (use commas or full stops instead), no exclamation marks, no headers, no labels, no structure. Just Noor talking. If you hit a fifth sentence, delete it.

Cover naturally in prose: what is genuinely good about this product (lead with this), the single weakest point and why it matters in context, and one specific thing the user can check on other labels to compare. Your last sentence must teach something concrete the user can apply next time they pick up a similar product. Never end with a general statement about clean ingredients, real food, or simple lists — the user can see the ingredients themselves.

ACCURACY IS ABSOLUTE. Read every number on the label carefully. Do not confuse saturated fat with sugar, or misquote any value. If the ingredients list is short and clean, say so. Do not strain to find a weakness when there is none. If the only concern is minor, acknowledge it proportionately in one clause. Never call natural sugars from whole ingredients "added sugar." Never invent ingredients not on the label.

Never use: "your body will thank you", "hidden cost", "think twice", "worth noting", "the real question is", or any generic health blog phrasing.

Never recommend specific brand names. Teach the user what to look for on a label so they can judge any product themselves.

Be proportionate. A can of sardines with 0.9g salt eaten occasionally is not a crisis, but it is the number worth comparing across brands. When salt, sugar, or saturated fat is the only concern, frame it as a comparison point the user can use — "if you are choosing between brands, this is the line to compare" — not a warning, not a dismissal. Teach the user to read, not to worry.

Example of the tone and quality to match (do not copy, use as calibration only):
"Clean list — sardines, olive oil, tomato, salt. The 1.01g sodium per 100g is the one thing to watch, though for canned fish that is actually moderate, and rinsing them briefly under cold water before eating knocks off a good portion of the surface salt."

The user sees only your analysis. No validation language, no steps, no word counts, no structure. Just Noor.`

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify({
        model: SCAN_MODEL,
        max_tokens: 300,
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
      await response.json().catch(() => ({}))
      return { valid: false, message: "Couldn't read that clearly. Try another angle or better lighting." }
    }

    const data = await response.json()
    const text = data.content?.[0]?.text?.trim() || ''

    if (!text) {
      return { valid: false, message: "Couldn't read that clearly. Try another angle or better lighting." }
    }

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
    console.error('Label scan failed:', err)
    return { valid: false, message: "Couldn't read that clearly. Try another angle or better lighting." }
  }
}

// ─── Anthropic API streaming ──────────────────────────────────────────────

async function streamNoor(apiMessages, systemPrompt, onToken, onDone, onError) {
  let searchLocation = undefined
  try {
    const loc = JSON.parse(localStorage.getItem(LOCATION_KEY))
    if (loc && loc.city && loc.country) {
      searchLocation = { type: 'approximate', city: loc.city, country: loc.country }
    }
  } catch {}

  const tools = [{
    type: 'web_search_20250305',
    name: 'web_search',
    max_uses: 2,
    ...(searchLocation && { user_location: searchLocation }),
  }]

  const buildBody = (includeTools) => JSON.stringify({
    model: CHAT_MODEL,
    max_tokens: 400,
    system: systemPrompt,
    messages: apiMessages,
    stream: true,
    ...(includeTools && { tools }),
  })

  try {
    let response = await fetch(API_URL, {
      method: 'POST',
      headers: API_HEADERS,
      body: buildBody(true),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      const errMsg = err.error?.message || ''
      const isToolError = response.status === 400 ||
        errMsg.toLowerCase().includes('tool') ||
        errMsg.toLowerCase().includes('search')
      if (isToolError) {
        response = await fetch(API_URL, {
          method: 'POST',
          headers: API_HEADERS,
          body: buildBody(false),
        })
        if (!response.ok) {
          const err2 = await response.json().catch(() => ({}))
          onError(err2.error?.message || `API error ${response.status}`)
          return
        }
      } else {
        onError(errMsg || `API error ${response.status}`)
        return
      }
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
            onToken(event.delta.text.replace(/\u2014/g, ','))
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

function formatMessageTime(iso) {
  if (!iso) return null
  const d = new Date(iso)
  const now = new Date()
  const todayStr = now.toLocaleDateString('en-CA')
  const msgStr = d.toLocaleDateString('en-CA')
  const yesterdayStr = new Date(now - 86400000).toLocaleDateString('en-CA')
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  if (msgStr === todayStr) return timeStr
  if (msgStr === yesterdayStr) return `Yesterday, ${timeStr}`
  const dateStr = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  return `${dateStr}, ${timeStr}`
}

function MessageBubble({ msg }) {
  const paragraphs = msg.text.split('\n').filter(p => p.trim())
  const timeLabel = formatMessageTime(msg.timestamp)
  return (
    <div className={`message message--${msg.from}`}>
      {msg.from === 'noor' && <NoorAvatar size="message" />}
      <div className="message-content">
        <div className="message-bubble">
          {paragraphs.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
          {msg.streaming && <span className="stream-cursor" aria-hidden="true" />}
        </div>
        {timeLabel && <span className="message-time">{timeLabel}</span>}
      </div>
    </div>
  )
}

function AboutPanel({ onClose }) {
  const overlayRef = useRef(null)
  const handleOverlayClick = (e) => { if (e.target === overlayRef.current) onClose() }

  const features = [
    {
      title: 'Chat',
      desc: 'Ask Noor anything about food, nutrition, or health. She\'ll share what she knows — not opinions, but science most people never hear.',
      note: 'Noor remembers your conversations and builds on them over time (Pro)',
      tag: null,
    },
    {
      title: 'Daily Cards',
      desc: 'One insight a day from Noor — a small piece of knowledge that shifts how you see food. Collectible, shareable, and different every day.',
      tag: 'pro',
    },
    {
      title: 'Label Scanner',
      desc: 'Scan any product label and Noor will break down what\'s worth noting — the good, the misleading, and the one ingredient most people miss.',
      tag: null,
    },
    {
      title: 'Product Shelf',
      desc: 'Every product you scan and keep goes here. Over time, Noor spots patterns across your choices — not to judge, but to connect dots you might not see.',
      tag: 'pro',
    },
  ]

  return (
    <div ref={overlayRef} className="journal-overlay" onClick={handleOverlayClick}>
      <div className="journal-panel about-panel">
        <div className="journal-handle" />
        <div className="about-header">
          <img src="/noor-avatar.png" alt="Noor" className="about-avatar" />
          <h2 className="about-title">Meet Noor</h2>
        </div>
        <p className="about-intro">
          Noor is your nutrition companion. She doesn't track calories or push diets — she helps you understand what's really in your food and why it matters. The more you talk, the smarter she gets.
        </p>
        <div className="about-features">
          {features.map((f, i) => (
            <div key={i} className="about-feature">
              <div className="about-feature-header">
                <span className="about-feature-title">{f.title}</span>
                {f.tag && <span className={`about-feature-tag about-feature-tag--${f.tag.replace(' ', '-')}`}>{f.tag}</span>}
              </div>
              <p className="about-feature-desc">{f.desc}</p>
              {f.note && <p className="about-feature-note">{f.note}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SettingsPanel({ memory, gpsLocation, onClearMemory, isPro, productShelf, onRemoveProduct, onClose }) {
  const overlayRef = useRef(null)
  const handleOverlayClick = (e) => { if (e.target === overlayRef.current) onClose() }
  const [devTaps, setDevTaps] = useState(0)
  const [memoryExpanded, setMemoryExpanded] = useState(false)
  const [shelfExpanded, setShelfExpanded] = useState(false)
  const showDev = devTaps >= 5

  const hasMemory = !!(gpsLocation || (memory && (
    memory.name ||
    (memory.allergies && memory.allergies.length > 0) ||
    (memory.dietary && memory.dietary.length > 0) ||
    (memory.health && memory.health.length > 0) ||
    (memory.preferences && memory.preferences.length > 0)
  )))

  const hasShelf = productShelf && productShelf.length > 0

  function formatDate(iso) {
    const d = new Date(iso)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div ref={overlayRef} className="journal-overlay" onClick={handleOverlayClick}>
      <div className="journal-panel settings-panel">
        <div className="journal-handle" />

        <div className="settings-section">
          <button
            className="settings-section-toggle"
            onClick={() => setMemoryExpanded(prev => !prev)}
            aria-expanded={memoryExpanded}
          >
            <h3 className="settings-section-title">What Noor Remembers</h3>
            <span className="settings-accordion-chevron">{memoryExpanded ? '▾' : '▸'}</span>
          </button>
          {memoryExpanded && (
            <div className="settings-accordion-content">
              {hasMemory ? (
                <div className="settings-mem-display">
                  {gpsLocation && (
                    <div className="settings-mem-row">
                      <span className="settings-mem-field-label">Location</span>
                      <span className="settings-mem-field-value">
                        {[gpsLocation.city, gpsLocation.country].filter(Boolean).join(', ')}
                        <span className="settings-mem-gps-badge"> (GPS)</span>
                      </span>
                    </div>
                  )}
                  {memory?.name && (
                    <div className="settings-mem-row">
                      <span className="settings-mem-field-label">Name</span>
                      <span className="settings-mem-field-value">{memory.name}</span>
                    </div>
                  )}
                  {memory?.allergies?.length > 0 && (
                    <div className="settings-mem-group">
                      <p className="settings-mem-group-label">Allergies</p>
                      {memory.allergies.map((a, i) => (
                        <p key={i} className="settings-mem-bullet">• {a}</p>
                      ))}
                    </div>
                  )}
                  {memory?.dietary?.length > 0 && (
                    <div className="settings-mem-group">
                      <p className="settings-mem-group-label">Dietary</p>
                      {memory.dietary.map((d, i) => (
                        <p key={i} className="settings-mem-bullet">• {d}</p>
                      ))}
                    </div>
                  )}
                  {memory?.health?.length > 0 && (
                    <div className="settings-mem-group">
                      <p className="settings-mem-group-label">Health</p>
                      {memory.health.map((h, i) => (
                        <p key={i} className="settings-mem-bullet">• {h}</p>
                      ))}
                    </div>
                  )}
                  {memory?.preferences?.length > 0 && (
                    <div className="settings-mem-group">
                      <p className="settings-mem-group-label">Preferences</p>
                      {memory.preferences.map((p, i) => (
                        <p key={i} className="settings-mem-bullet">• {p}</p>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="settings-memory-empty">Noor doesn't know anything about you yet. Start a conversation and she'll learn naturally.</p>
              )}
              {(memory && Object.keys(memory).some(k => { const v = memory[k]; return Array.isArray(v) ? v.length > 0 : !!v })) && (
                <>
                  <button
                    className="settings-btn-muted"
                    onClick={() => {
                      if (window.confirm("Clear all of Noor's memory about you?")) {
                        onClearMemory()
                        onClose()
                      }
                    }}
                  >
                    Clear Memory
                  </button>
                  <p className="settings-mem-note">Location is detected by GPS and stays separate from memory.</p>
                </>
              )}
            </div>
          )}
        </div>

        <div className="settings-section">
          <button
            className="settings-section-toggle"
            onClick={() => setShelfExpanded(prev => !prev)}
            aria-expanded={shelfExpanded}
          >
            <h3 className="settings-section-title">Your Product Shelf</h3>
            <span className="settings-accordion-chevron">{shelfExpanded ? '▾' : '▸'}</span>
          </button>
          {shelfExpanded && (
            <div className="settings-accordion-content">
              {hasShelf ? (
                <>
                  <div className="shelf-list">
                    {productShelf.map(p => (
                      <div key={p.id} className="shelf-item">
                        <div className="shelf-item-info">
                          <span className="shelf-item-name">{p.productName}</span>
                          <span className="shelf-item-date">{formatDate(p.dateScanned)}</span>
                        </div>
                        <button
                          className="shelf-remove-btn"
                          onClick={() => onRemoveProduct(p.id)}
                          aria-label={`Remove ${p.productName}`}
                        >×</button>
                      </div>
                    ))}
                  </div>
                  <p className="shelf-count">{productShelf.length} {productShelf.length === 1 ? 'product' : 'products'}</p>
                </>
              ) : !isPro ? (
                <>
                  <p className="settings-memory-empty">Product Shelf is a Pro feature. Upgrade to keep and review every product you scan.</p>
                  <button className="settings-btn-upgrade">Upgrade to Pro — $7.99/month</button>
                </>
              ) : (
                <p className="settings-memory-empty">Nothing on your shelf yet. Scan a product and tap "Taking it" to save it here.</p>
              )}
            </div>
          )}
        </div>

        <div className="settings-section">
          <h3 className="settings-section-title">Subscription</h3>
          <p className="settings-muted-text">Current plan: Free</p>
          <button className="settings-btn-upgrade">Upgrade to Pro — $7.99/month</button>
        </div>

        <div className="settings-section">
          <h3 className="settings-section-title">About NourishMind</h3>
          <p className="settings-about-text">NourishMind helps you understand what's really in your food. Powered by Noor, your AI nutrition companion.</p>
          <p
            className="settings-version"
            onClick={() => setDevTaps(prev => prev + 1)}
            style={{ cursor: 'default', userSelect: 'none' }}
          >
            Version 1.0.0{devTaps > 0 && devTaps < 5 ? ` (${5 - devTaps} more)` : ''}
          </p>
        </div>

        <div className="settings-section">
          <h3 className="settings-section-title">Legal</h3>
          <div className="settings-links">
            <button className="settings-link-btn" onClick={() => window.open('/terms', '_blank')}>Terms of Service</button>
            <button className="settings-link-btn" onClick={() => window.open('/privacy', '_blank')}>Privacy Policy</button>
          </div>
        </div>
        {showDev && (
          <div className="settings-section settings-section--last">
            <h3 className="settings-section-title">Developer</h3>
            <button
              className="settings-btn-upgrade"
              onClick={() => {
                const newPro = !isPro
                if (newPro) {
                  localStorage.setItem('noor-pro', 'true')
                } else {
                  localStorage.removeItem('noor-pro')
                }
                window.location.reload()
              }}
            >
              {isPro ? 'Switch to Free' : 'Switch to Pro'}
            </button>
            <div style={{ height: 12 }} />
            <button
              className="settings-btn-muted"
              onClick={() => {
                ['noor-memory', 'noor-chat-history', 'noor-product-shelf', 'noor-daily-cards', 'noor-install-date',
                 'noor_messages_date', 'noor_messages_count', 'noor_scans_date', 'noor_scans_count', 'noor-mic-hint-seen', 'noor-mic-hint-version'].forEach(k => localStorage.removeItem(k))
                window.location.reload()
              }}
            >
              Reset All Data
            </button>
          </div>
        )}
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
  const [gpsLocation, setGpsLocation] = useState(() => loadLocation())
  const [dailyCount, setDailyCount] = useState(() => loadDailyCount())
  const [scanCount, setScanCount] = useState(() => loadDailyScanCount())
  const [isPro, setIsPro] = useState(() => localStorage.getItem('noor-pro') === 'true')
  const [productShelf, setProductShelf] = useState(() => loadProductShelf())
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)

  const [privateMode, setPrivateMode] = useState(false)
  const [showMemoryLabel, setShowMemoryLabel] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showDailyCard, setShowDailyCard] = useState(false)
  const [showRetry, setShowRetry] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [showMicHint, setShowMicHint] = useState(() => !localStorage.getItem('noor-mic-hint-seen'))

  useEffect(() => {
    // One-time reset: clear old mic hint flag so returning users see the updated hint
    const hintVersion = localStorage.getItem('noor-mic-hint-version')
    if (hintVersion !== '2') {
      localStorage.removeItem('noor-mic-hint-seen')
      localStorage.setItem('noor-mic-hint-version', '2')
      setShowMicHint(true)
    }
  }, [])

  // v3 migration: convert old schema to new
  useEffect(() => {
    const migrationKey = 'noor-memory-v3-migrated'
    if (localStorage.getItem(migrationKey)) return
    const raw = localStorage.getItem(MEMORY_KEY)
    if (raw) {
      try {
        const mem = JSON.parse(raw)
        const migrated = {}
        if (mem.name) migrated.name = mem.name
        if (Array.isArray(mem.allergies) && mem.allergies.length) {
          migrated.allergies = mem.allergies.slice(0, 5)
        }
        // habits → dietary: keep only ongoing patterns, trim to 4
        if (Array.isArray(mem.habits) && mem.habits.length) {
          migrated.dietary = mem.habits.slice(0, 4)
        }
        // notes with health-relevant content → health (max 3)
        if (Array.isArray(mem.notes) && mem.notes.length) {
          migrated.health = mem.notes.slice(0, 3)
        }
        // discard: location, topics
        saveMemory(migrated)
        setMemory(migrated)
      } catch {}
    }
    localStorage.setItem(migrationKey, 'true')
    // also clear the old v2 key so we don't run v2 on new installs
    localStorage.setItem('noor-memory-v2-cleaned', 'true')
  }, [])

  // GPS location: fetch on mount if stale or missing
  useEffect(() => {
    const existing = loadLocation()
    const isStale = !existing || (Date.now() - (existing.lastUpdated || 0)) > LOCATION_REFRESH_MS
    if (!isStale) return
    fetchGpsLocation().then(loc => {
      if (!loc) return
      const prev = loadLocation()
      const cityChanged = prev?.city !== loc.city || prev?.country !== loc.country
      saveLocation(loc)
      if (!prev || cityChanged) {
        setGpsLocation(loc)
      }
    })
  }, [])

  const chatLimit = isPro ? PRO_CHAT_LIMIT : FREE_CHAT_LIMIT
  const scanLimit = isPro ? PRO_SCAN_LIMIT : FREE_SCAN_LIMIT

  const bottomRef = useRef(null)
  const messagesRef = useRef(null)
  const inputRef = useRef(null)
  const openingFired = useRef(false)
  const memoryRef = useRef(memory)
  useEffect(() => { memoryRef.current = memory }, [memory])
  const gpsLocationRef = useRef(gpsLocation)
  useEffect(() => { gpsLocationRef.current = gpsLocation }, [gpsLocation])

  useEffect(() => {
    if (showAbout || showSettings || showDailyCard) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [showAbout, showSettings, showDailyCard])


  const chatContainerRef = useRef(null)
  const headerCameraInputRef = useRef(null)
  const lastMessageRef = useRef('')
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingTimerRef = useRef(null)
  const recordingDurationRef = useRef(0)
  const shouldStopRef = useRef(false)
  const [cancelActive, setCancelActive] = useState(false)
  const touchStartYRef = useRef(null)
  const handleHeaderCameraClick = () => { headerCameraInputRef.current?.click() }

  const handleClearMemory = () => {
    localStorage.removeItem(MEMORY_KEY)
    setMemory(null)
  }

  const handleResetAll = () => {
    ['noor-memory', 'noor-chat-history', 'noor-product-shelf', 'noor-daily-cards', 'noor-install-date',
     'noor_messages_date', 'noor_messages_count', 'noor_scans_date', 'noor_scans_count'].forEach(k => localStorage.removeItem(k))
    window.location.reload()
  }

  const handleRemoveProduct = useCallback((productId) => {
    const updated = productShelf.filter(p => p.id !== productId)
    saveProductShelf(updated)
    setProductShelf(updated)
  }, [productShelf])

  const scrollToBottom = () => {
    const el = messagesRef.current
    if (el) el.scrollTop = el.scrollHeight
  }

  // Scroll to bottom on every update
  useEffect(() => {
    scrollToBottom('smooth')
  }, [messages, showTyping])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
    }
  }, [input])

  // Trigger Noor's opening message on mount (or restore history)
  useEffect(() => {
    if (openingFired.current) return
    openingFired.current = true

    const stored = loadChatHistory()
    if (stored && stored.length > 0) {
      const cleaned = stored.filter(m => m.content && m.content.trim())
      const restoredMessages = cleaned
        .filter(m => !(m.role === 'user' && m.content.startsWith('I scanned a product label')))
        .map((m, i) => ({
          id: `restored-${i}`,
          from: m.role === 'user' ? 'user' : 'noor',
          text: m.content,
          streaming: false,
        }))
      setMessages(restoredMessages)
      setApiHistory(cleaned)
      setReady(true)
      setTimeout(() => inputRef.current?.focus(), 100)
      return
    }

    const OPENINGS = [
      "I'm Noor. Most of what people believe about food comes from marketing, not science. If something's on your mind about what you eat or how you feel, that's where I'm useful.",
      "I'm Noor. There is more deliberate confusion in the food world than almost any other area of health. Happy to cut through some of it whenever you're ready.",
      "I'm Noor. A lot of what passes for health advice is really just product placement in disguise. Good to meet you.",
      "I'm Noor. The longest-lived populations on earth eat nothing like what supermarkets push as healthy. There is a lot to unpack there.",
      "I'm Noor. Food is one of the most consequential things we do every day and one of the least understood. That gap is where it gets interesting.",
      "I'm Noor. The gap between what the research says and what ends up on a food label is wider than most people realise.",
    ]
    const OPENING = OPENINGS[Math.floor(Math.random() * OPENINGS.length)]

    setTimeout(() => {
      const openingTs = new Date().toISOString()
      setMessages([{ id: 'noor-open', from: 'noor', text: OPENING, streaming: false, timestamp: openingTs }])
      setApiHistory([
        { role: 'user', content: 'Hi', timestamp: openingTs },
        { role: 'assistant', content: OPENING, timestamp: openingTs },
      ])
      setReady(true)
      setTimeout(() => inputRef.current?.focus(), 100)
    }, 600)
  }, [])

  const sendText = useCallback((text, hiddenContext = null) => {
    if (!text || isStreaming) return

    if (!navigator.onLine) {
      setMessages(prev => [...prev, {
        id: `err-offline-${Date.now()}`,
        from: 'noor',
        text: "You're offline. Check your connection and try again.",
        streaming: false,
        timestamp: new Date().toISOString(),
      }])
      return
    }

    setShowRetry(false)

    const currentCount = loadDailyCount()
    const remaining = Math.max(0, chatLimit - currentCount)
    if (remaining === 0) return

    const newCount = currentCount + 1
    saveDailyCount(newCount)
    setDailyCount(newCount)

    const currentMemory = memoryRef.current
    const newRemaining = Math.max(0, chatLimit - newCount)

    let returnGapNote = ''
    if (apiHistory.length > 0) {
      const lastMsg = apiHistory[apiHistory.length - 1]
      if (lastMsg.timestamp) {
        const gap = Date.now() - new Date(lastMsg.timestamp).getTime()
        const hoursGap = gap / (1000 * 60 * 60)
        if (hoursGap > 24) {
          const days = Math.floor(hoursGap / 24)
          returnGapNote = `\n\nNOTE: The user is returning after ${days === 1 ? 'about a day' : `${days} days`} away. Be warm first — acknowledge the return briefly before anything else. A simple "Good to see you again" or similar, then continue naturally. Do not recap previous conversations unless they ask.`
        }
      }
    }

    const systemPrompt = buildSystemPrompt(currentMemory, newRemaining, productShelf, gpsLocationRef.current) + returnGapNote
    const finalSystemPrompt = hiddenContext
      ? systemPrompt + "\n\n" + hiddenContext
      : systemPrompt
    const rawUserHistory = [...apiHistory, { role: 'user', content: text, timestamp: new Date().toISOString() }]
    const userHistory = buildApiMessages(rawUserHistory)

    setMessages(prev => [
      ...prev,
      { id: `user-${Date.now()}`, from: 'user', text, streaming: false, timestamp: rawUserHistory[rawUserHistory.length - 1].timestamp },
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

    lastMessageRef.current = text

    const noorMsgId = `noor-${Date.now()}`
    let noorText = ''

    setIsStreaming(true)
    setShowTyping(true)

    streamNoor(
      userHistory,
      finalSystemPrompt,
      (token) => {
        noorText += token
        setShowTyping(false)
        const displayText = noorText.replace(/^\[.*?\]\s*/, '').replace(/^\[[^\]]*$/, '')
        setMessages(prev => {
          const exists = prev.find(m => m.id === noorMsgId)
          if (exists) {
            return prev.map(m =>
              m.id === noorMsgId ? { ...m, text: displayText } : m
            )
          }
          return [...prev, { id: noorMsgId, from: 'noor', text: displayText, streaming: true, timestamp: new Date().toISOString() }]
        })
      },
      () => {
        if (!noorText.trim()) {
          setMessages(prev => prev.filter(m => m.id !== noorMsgId))
          setMessages(prev => [...prev, {
            id: `err-${Date.now()}`,
            from: 'noor',
            text: "Lost my train of thought for a moment. Try sending that again.",
            streaming: false,
            timestamp: new Date().toISOString(),
          }])
          setIsStreaming(false)
          setShowRetry(true)
          return
        }
        const cleanText = noorText.replace(/^\[.*?\]\s*/, '')
        setMessages(prev =>
          prev.map(m => m.id === noorMsgId ? { ...m, text: cleanText, streaming: false } : m)
        )
        const newApiHistory = [...rawUserHistory, { role: 'assistant', content: cleanText, timestamp: new Date().toISOString() }]
        setApiHistory(newApiHistory)
        if (!privateMode) saveChatHistory(newApiHistory)
        setIsStreaming(false)
        setTimeout(() => inputRef.current?.focus(), 50)

        // Fire-and-forget: extract and persist any new user info (Pro only)
        if (!privateMode && isPro) {
          extractMemoryUpdate(text, cleanText, currentMemory, rawUserHistory).then(result => {
            if (!result) return
            if (result.memory) {
              const merged = mergeMemory(currentMemory, result.memory)
              saveMemory(merged)
              setMemory(merged)
            }
          })
        }

        // Soft wall when free user hits chat limit
        if (newRemaining === 0 && !isPro) {
          setMessages(prev => [...prev, {
            id: `limit-wall-${Date.now()}`,
            from: 'noor',
            text: "That's your five for today. There's more I wanted to say. Unlock full conversations with Pro.",
            streaming: false,
            timestamp: new Date().toISOString(),
          }])
        }
      },
      (_err) => {
        setShowTyping(false)
        setIsStreaming(false)
        setMessages(prev => [...prev, {
          id: `err-${Date.now()}`,
          from: 'noor',
          text: "Lost my train of thought for a moment. Try sending that again.",
          streaming: false,
          timestamp: new Date().toISOString(),
        }])
        setShowRetry(true)
      }
    )
  }, [isStreaming, apiHistory, productShelf, chatLimit, isPro])

  const handleRetry = useCallback(() => {
    setShowRetry(false)
    sendText(lastMessageRef.current)
  }, [sendText])

  const sendTextWithCardContext = useCallback((displayText, apiText) => {
    if (!displayText || isStreaming) return

    if (!navigator.onLine) {
      setMessages(prev => [...prev, {
        id: `err-offline-${Date.now()}`,
        from: 'noor',
        text: "You're offline. Check your connection and try again.",
        streaming: false,
        timestamp: new Date().toISOString(),
      }])
      return
    }

    const currentCount = loadDailyCount()
    const remaining = Math.max(0, chatLimit - currentCount)
    if (remaining === 0) return

    const newCount = currentCount + 1
    saveDailyCount(newCount)
    setDailyCount(newCount)

    const currentMemory = memoryRef.current
    const newRemaining = Math.max(0, chatLimit - newCount)

    let returnGapNote = ''
    if (apiHistory.length > 0) {
      const lastMsg = apiHistory[apiHistory.length - 1]
      if (lastMsg.timestamp) {
        const gap = Date.now() - new Date(lastMsg.timestamp).getTime()
        const hoursGap = gap / (1000 * 60 * 60)
        if (hoursGap > 24) {
          const days = Math.floor(hoursGap / 24)
          returnGapNote = `\n\nNOTE: The user is returning after ${days === 1 ? 'about a day' : `${days} days`} away. Be warm first — acknowledge the return briefly before anything else. A simple "Good to see you again" or similar, then continue naturally. Do not recap previous conversations unless they ask.`
        }
      }
    }

    const systemPrompt = buildSystemPrompt(currentMemory, newRemaining, productShelf, gpsLocationRef.current) + returnGapNote
    // apiText contains the card context inline — sent to the API, not shown in the UI
    const rawUserHistory = [...apiHistory, { role: 'user', content: apiText, timestamp: new Date().toISOString() }]
    const userHistory = buildApiMessages(rawUserHistory)

    setMessages(prev => [
      ...prev,
      { id: `user-${Date.now()}`, from: 'user', text: displayText, streaming: false, timestamp: rawUserHistory[rawUserHistory.length - 1].timestamp },
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
        const streamDisplayText = noorText.replace(/^\[.*?\]\s*/, '').replace(/^\[[^\]]*$/, '')
        setMessages(prev => {
          const exists = prev.find(m => m.id === noorMsgId)
          if (exists) {
            return prev.map(m =>
              m.id === noorMsgId ? { ...m, text: streamDisplayText } : m
            )
          }
          return [...prev, { id: noorMsgId, from: 'noor', text: streamDisplayText, streaming: true, timestamp: new Date().toISOString() }]
        })
      },
      () => {
        if (!noorText.trim()) {
          setMessages(prev => prev.filter(m => m.id !== noorMsgId))
          setMessages(prev => [...prev, {
            id: `err-${Date.now()}`,
            from: 'noor',
            text: "Lost my train of thought for a moment. Try sending that again.",
            streaming: false,
            timestamp: new Date().toISOString(),
          }])
          setIsStreaming(false)
          setShowRetry(true)
          return
        }
        const cleanText = noorText.replace(/^\[.*?\]\s*/, '')
        setMessages(prev =>
          prev.map(m => m.id === noorMsgId ? { ...m, text: cleanText, streaming: false } : m)
        )
        const newApiHistory = [...rawUserHistory, { role: 'assistant', content: cleanText, timestamp: new Date().toISOString() }]
        setApiHistory(newApiHistory)
        if (!privateMode) saveChatHistory(newApiHistory)
        setIsStreaming(false)
        setTimeout(() => inputRef.current?.focus(), 50)

        // Fire-and-forget: extract and persist any new user info (Pro only)
        if (!privateMode && isPro) {
          extractMemoryUpdate(displayText, cleanText, currentMemory, rawUserHistory, true).then(result => {
            if (!result) return
            if (result.memory) {
              const merged = mergeMemory(currentMemory, result.memory)
              saveMemory(merged)
              setMemory(merged)
            }
          })
        }

        // Soft wall when free user hits chat limit
        if (newRemaining === 0 && !isPro) {
          setMessages(prev => [...prev, {
            id: `limit-wall-${Date.now()}`,
            from: 'noor',
            text: "That's your five for today. There's more I wanted to say. Unlock full conversations with Pro.",
            streaming: false,
            timestamp: new Date().toISOString(),
          }])
        }
      },
      (_err) => {
        setShowTyping(false)
        setIsStreaming(false)
        setMessages(prev => [...prev, {
          id: `err-${Date.now()}`,
          from: 'noor',
          text: "Lost my train of thought for a moment. Try sending that again.",
          streaming: false,
          timestamp: new Date().toISOString(),
        }])
      }
    )
  }, [isStreaming, apiHistory, productShelf, chatLimit, isPro])

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
      timestamp: new Date().toISOString(),
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
      timestamp: new Date().toISOString(),
    }])
  }, [scanResult])

  const whisperSupported = !!(navigator.mediaDevices?.getUserMedia)

  const TRANSCRIBE_URL = '/api/transcribe'

  useEffect(() => {
    if (!showMicHint) return
    const timer = setTimeout(() => {
      setShowMicHint(false)
      localStorage.setItem('noor-mic-hint-seen', 'true')
    }, 3000)
    return () => clearTimeout(timer)
  }, [showMicHint])

  const startRecording = async () => {
    if (isRecording || isTranscribing || isStreaming || atLimit) return
    shouldStopRef.current = false

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'
      })

      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop())

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        audioChunksRef.current = []

        // Ignore recordings under 1 second or with tiny file size (silence)
        if (audioBlob.size < 1000 || recordingDurationRef.current < 1) {
          setIsRecording(false)
          setIsTranscribing(false)
          return
        }

        setIsTranscribing(true)

        try {
          const reader = new FileReader()
          const base64 = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result.split(',')[1])
            reader.onerror = reject
            reader.readAsDataURL(audioBlob)
          })

          const response = await fetch(TRANSCRIBE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audio: base64,
              prompt: 'Noor, NourishMind, magnesium, sulforaphane, polyphenols, omega-3, nicotinamide riboside, autophagy, microbiome, cortisol, insulin, fructose, aspartame, glycation'
            }),
          })

          if (response.ok) {
            const data = await response.json()
            let transcript = data.text?.trim()

            // Filter Whisper hallucinations — if the transcript is just the prompt words back, discard it
            if (transcript) {
              const promptWords = 'noor nourishmind magnesium sulforaphane polyphenols omega-3 nicotinamide riboside autophagy microbiome cortisol insulin fructose aspartame glycation'
              const cleanTranscript = transcript.toLowerCase().replace(/[.,\s]+/g, ' ').trim()
              const similarity = promptWords.split(' ').filter(w => cleanTranscript.includes(w)).length
              const transcriptWordCount = cleanTranscript.split(' ').length
              // If more than 60% of the transcript words match prompt vocabulary, it's a hallucination
              if (similarity > transcriptWordCount * 0.6) {
                transcript = null
              }
            }

            if (transcript) {
              setInput(transcript)
            }
          }
        } catch (err) {
          console.error('Transcription failed:', err)
        }

        setIsTranscribing(false)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
      // If user already released the button during async setup, stop immediately
      if (shouldStopRef.current) {
        mediaRecorder.stop()
        setIsRecording(false)
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current)
          recordingTimerRef.current = null
        }
        return
      }
      setRecordingDuration(0)
      recordingDurationRef.current = 0
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const next = prev + 1
          recordingDurationRef.current = next
          if (next >= MAX_RECORDING_SECONDS) {
            clearInterval(recordingTimerRef.current)
            recordingTimerRef.current = null
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop()
            }
            setIsRecording(false)
          }
          return next
        })
      }, 1000)
    } catch (err) {
      console.error('Mic access failed:', err)
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    shouldStopRef.current = true
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }, [])

  const remaining = Math.max(0, chatLimit - dailyCount)
  const atLimit = remaining === 0

  return (
    <div className="chat-screen" ref={chatContainerRef}>

      {/* ── Header ── */}
      <header className="chat-header">
        <div className="chat-header-left">
          <button className="noor-avatar-btn" onClick={() => setShowAbout(true)} aria-label="About Noor">
            <NoorAvatar size="header" />
          </button>
          <div className="chat-header-info">
            <span className="chat-header-name">
              Noor
              {isPro ? (
                <span className="plan-badge plan-badge--pro">Pro</span>
              ) : (
                <span className="plan-badge plan-badge--free">Free</span>
              )}
            </span>
            <span className="chat-header-status">
              <span className={`status-dot${isStreaming ? ' status-dot--typing' : atLimit ? ' status-dot--limit' : ''}`} />
              Your NourishMind companion
            </span>
          </div>
        </div>
        <div className="chat-header-centre">
          <img src="/NM-icon.png" alt="NourishMind" className="chat-nm-logo" onClick={() => setShowSettings(true)} />
        </div>
        <div className="chat-header-right">
          <div className="memory-toggle-wrap">
            <button
              className="memory-eye-btn"
              onClick={() => {
                if (!isPro) {
                  setShowMemoryLabel(true)
                  setTimeout(() => setShowMemoryLabel(false), 2000)
                  return
                }
                const goingPrivate = !privateMode
                setPrivateMode(goingPrivate)
                setShowMemoryLabel(true)
                setMessages(prev => [...prev, {
                  id: `private-mode-${Date.now()}`,
                  from: 'noor',
                  text: goingPrivate
                    ? "Private session. Nothing from here carries forward."
                    : "I'll remember again.",
                  streaming: false,
                  timestamp: new Date().toISOString(),
                }])
                setTimeout(() => setShowMemoryLabel(false), 2000)
              }}
              aria-label={privateMode ? "Private mode on" : "Memory on"}
            >
              {(!isPro || privateMode) ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c8a97e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c8a97e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
            {showMemoryLabel && (
              <div className="memory-label">
                {!isPro ? "Pro lets Noor remember you" : privateMode ? "Doesn't remember" : "Remembers you"}
              </div>
            )}
          </div>
          <button
            className="chat-camera-btn"
            onClick={() => setShowDailyCard(true)}
            aria-label="Daily cards"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="4" y="7" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6"/>
              <rect x="6" y="5" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6"/>
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
          {showRetry && (
            <div className="retry-wrap">
              <button className="retry-btn" onClick={handleRetry}>Try again</button>
            </div>
          )}
          {showTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </main>
      </div>

      {/* ── About Panel ── */}
      {showAbout && <AboutPanel onClose={() => setShowAbout(false)} />}

      {/* ── Settings Panel ── */}
      {showSettings && <SettingsPanel memory={memory} gpsLocation={gpsLocation} onClearMemory={handleClearMemory} onResetAll={handleResetAll} isPro={isPro} productShelf={productShelf} onRemoveProduct={handleRemoveProduct} onClose={() => setShowSettings(false)} />}

      {/* ── Daily Card Screen ── */}
      {showDailyCard && (
        isPro ? (
          <DailyCardScreen
            onClose={() => setShowDailyCard(false)}
            onOpenChat={(card) => {
              setShowDailyCard(false);
              setTimeout(() => {
                // Build a message that contains context for the API but we only show the short part in the UI
                const fullMessage = `[DAILY CARD DISCUSSION — The user just read today's Daily Card. Category: ${card.category}. Tag: "${card.tag}". The card said: "${card.insight}". They tapped it to discuss. Respond naturally about the topic as an interesting idea worth exploring. Do not quote the card back to them. Do not say "I see you read the card." CRITICAL: The user read about this topic on a card. That does NOT mean they practice it, believe it, or have experience with it. Do not assume they already do this. Do not say "great that you do this" or "since you already know about this." Treat it as a topic they are curious about, nothing more, unless they explicitly tell you otherwise in their own words.]\n\n${card.tag || "Thoughts on this?"}`;
                const visibleMessage = card.tag || "Thoughts on this?";
                sendTextWithCardContext(visibleMessage, fullMessage);
              }, 1450);
            }}
          />
        ) : (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: '#0e0d0c',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: 'Georgia, serif',
          }}>
            <button
              onClick={() => setShowDailyCard(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                color: '#706560',
                fontSize: 28,
                cursor: 'pointer',
                padding: '4px 8px',
                lineHeight: 1,
              }}
              aria-label="Close"
            >×</button>

            <div style={{
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#c8a97e',
              marginBottom: 20,
            }}>Daily Cards</div>

            <div style={{
              color: '#e8ddd0',
              fontSize: 18,
              fontStyle: 'italic',
              lineHeight: 1.7,
              textAlign: 'center',
              maxWidth: 300,
              marginBottom: 32,
            }}>One insight a day from Noor. A small piece of knowledge that shifts how you see food.</div>

            <button style={{
              background: 'none',
              border: '1px solid #c8a97e',
              borderRadius: 8,
              color: '#c8a97e',
              fontSize: 14,
              letterSpacing: '0.06em',
              padding: '12px 32px',
              fontFamily: 'Georgia, serif',
              cursor: 'pointer',
              minHeight: 44,
            }}>Upgrade to Pro</button>
          </div>
        )
      )}

      {/* ── Input ── */}
      <footer className="chat-footer">
        {isRecording && (
          <div className={`slide-cancel-hint${cancelActive ? ' slide-cancel-hint--active' : ''}`}>
            {cancelActive ? 'Release to cancel' : '↑ Slide up to cancel'}
          </div>
        )}
        <div className="chat-input-row">
          <input
            ref={headerCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              e.target.value = ''

              if (!navigator.onLine) {
                setMessages(prev => [...prev, {
                  id: `err-offline-${Date.now()}`,
                  from: 'noor',
                  text: "You're offline. Check your connection and try again.",
                  streaming: false,
                  timestamp: new Date().toISOString(),
                }])
                return
              }

              const currentScanCount = loadDailyScanCount()
              if (currentScanCount >= FREE_SCAN_LIMIT) {
                setMessages(prev => [...prev, {
                  id: `noor-scan-${Date.now()}`,
                  from: 'noor',
                  text: `You've reached your daily scan limit. Scans reset tomorrow morning.`,
                  streaming: false,
                  timestamp: new Date().toISOString(),
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
                timestamp: new Date().toISOString(),
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
                    timestamp: new Date().toISOString(),
                  }]
                })
                return
              }

              const newScanCount = currentScanCount + 1
              saveDailyScanCount(newScanCount)
              setScanCount(newScanCount)

              setIsScanning(false)
              setShowTyping(false)
              const previousScan = loadScanHistory().find(s => s.productName.toLowerCase() === result.productName.toLowerCase())
              if (previousScan) {
                setIsScanning(false)
                setShowTyping(false)
                setMessages(prev => [...prev, {
                  id: `noor-rescan-${Date.now()}`,
                  from: 'noor',
                  text: `You have scanned ${result.productName} before. Want a fresh analysis or is there something specific you want to know about it?`,
                  streaming: false,
                  timestamp: new Date().toISOString(),
                }])
                return
              }
              saveScanHistoryEntry(result.productName)
              setScanResult(result)
              setMessages(prev => {
                const filtered = prev
                return [...filtered, {
                  id: `noor-scan-${Date.now()}`,
                  from: 'noor',
                  text: result.analysis,
                  streaming: false,
                  timestamp: new Date().toISOString(),
                }]
              })
              setApiHistory(prev => {
                const updated = [
                  ...prev,
                  { role: 'user', content: `I scanned a product label. Here is what I scanned: ${result.productName || 'a food product label'}` },
                  { role: 'assistant', content: result.analysis },
                ]
                saveChatHistory(updated)
                return updated
              })
            }}
          />
          <button
            className="chat-footer-camera"
            onClick={handleHeaderCameraClick}
            disabled={isScanning || atLimit}
            aria-label="Scan a label"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M8 7L9.5 5H14.5L16 7H19C20.1 7 21 7.9 21 9V18C21 19.1 20.1 20 19 20H5C3.9 20 3 19.1 3 18V9C3 7.9 3.9 7 5 7H8Z"
                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
              />
              <circle cx="12" cy="13.5" r="3.5" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
          <div className={`chat-input-wrap${isRecording ? ' chat-input-wrap--recording' : ''}${isTranscribing ? ' chat-input-wrap--transcribing' : ''}`}>
            {isRecording && (
              <div className="recording-indicator">
                <div className="waveform">
                  <span /><span /><span /><span /><span /><span /><span /><span /><span />
                </div>
                <span className={`recording-time${(MAX_RECORDING_SECONDS - recordingDuration) <= 10 ? ' recording-time--warning' : ''}`}>
                  {MAX_RECORDING_SECONDS - recordingDuration}s
                </span>
              </div>
            )}
            <textarea
              ref={inputRef}
              className="chat-input"
              style={isRecording ? { position: 'absolute', opacity: 0, pointerEvents: 'none' } : undefined}
              value={input}
              onChange={e => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = `${e.target.scrollHeight}px`
              }}
              onKeyDown={handleKeyDown}
              placeholder={isTranscribing ? 'Transcribing…' : atLimit ? '' : ready ? 'Talk to Noor…' : ''}
              disabled={!ready || isStreaming || atLimit}
              rows={1}
              aria-label="Message Noor"
            />
            {whisperSupported && !input.trim() && !isStreaming && !atLimit && !isTranscribing ? (
              <div className="mic-btn-wrap">
                {showMicHint && (
                  <div className="mic-hint">Hold to speak</div>
                )}
                <button
                  className={`chat-mic-btn${isRecording ? ' chat-mic-btn--active' : ''}${isTranscribing ? ' chat-mic-btn--transcribing' : ''}${cancelActive ? ' chat-mic-btn--cancel' : ''}`}
                  onMouseDown={() => { startRecording(); setShowMicHint(false); localStorage.setItem('noor-mic-hint-seen', 'true'); }}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  onTouchStart={(e) => {
                    e.preventDefault()
                    touchStartYRef.current = e.touches[0].clientY
                    setCancelActive(false)
                    startRecording()
                    setShowMicHint(false)
                    localStorage.setItem('noor-mic-hint-seen', 'true')
                  }}
                  onTouchMove={(e) => {
                    if (touchStartYRef.current === null) return
                    const diff = touchStartYRef.current - e.touches[0].clientY
                    setCancelActive(diff > 50)
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault()
                    if (cancelActive) {
                      if (recordingTimerRef.current) {
                        clearInterval(recordingTimerRef.current)
                        recordingTimerRef.current = null
                      }
                      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                        mediaRecorderRef.current.onstop = () => {}
                        mediaRecorderRef.current.stop()
                        try {
                          mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop())
                        } catch {}
                      }
                      setIsRecording(false)
                      setCancelActive(false)
                      touchStartYRef.current = null
                      return
                    }
                    stopRecording()
                    touchStartYRef.current = null
                    setCancelActive(false)
                  }}
                  disabled={isTranscribing}
                  aria-label={isRecording ? (cancelActive ? 'Release to cancel' : 'Recording — release to stop') : isTranscribing ? 'Transcribing…' : 'Hold to speak'}
                >
                  {isTranscribing ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" opacity="0.3" />
                      <path d="M12 2a10 10 0 0 1 10 10" strokeDasharray="31.4" strokeDashoffset="0">
                        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
                      </path>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="1" width="6" height="12" rx="3" />
                      <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  )}
                </button>
              </div>
            ) : (
              <button
                className="chat-send"
                onClick={sendMessage}
                disabled={!input.trim() || isStreaming || !ready || atLimit}
                aria-label="Send message"
              >
                <SendIcon />
              </button>
            )}
          </div>
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
