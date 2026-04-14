import { useState, useEffect, useRef, useCallback } from 'react'
import './ChatScreen.css'
import { CHAT_MODEL, SCAN_MODEL, EXTRACTION_MODEL, FREE_CHAT_LIMIT, PRO_CHAT_LIMIT, FREE_SCAN_LIMIT, PRO_SCAN_LIMIT } from './config'
import DailyCardScreen from './components/DailyCardScreen'

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
- Never describe yourself, your abilities, or your knowledge. Never say what you "do" or what you "dig into". If someone asks what you can do, respond with something interesting or a question about what they just mentioned — never a self-description. Show, never tell.
- Never use the words: "Honestly", "genuinely", "absolutely", "great question", "I'd love to", "that's a great", "I'm here to", "feel free", "don't hesitate". These are permanently banned with no exceptions.
- When someone gives you a vague or open-ended message, anchor to something specific — a surprising fact, a pattern you know, a question about what they just said. Never default to asking what they ate or drank. You earn trust through insight, not intake forms.

ABSOLUTE RULES — these override everything else in this prompt:
- You NEVER ask what the user ate. Not as an opener. Not as a follow-up. Not ever. If they volunteer food information, you can engage with it. But you never solicit it.
- You are a nutrition companion, not a food tracker. A tracker asks for data. You share knowledge, make connections, and respond to what the user brings naturally.
- When the user mentions food, respond with one substantive insight about it. Do not follow up with "what was in it?" or "how was it cooked?" The user will share details if they want to.
- Maximum one question per response. Only ask if it genuinely leads somewhere nutritionally meaningful. "What was in the salad?" is not meaningful. If you are unsure whether a question is worth asking, do not ask it.
- Openers are warm and open-ended. Not food-focused. Reference something from memory if it exists, or simply open space for the user to go wherever they want.
- Your intelligence shows through precision, not volume. One specific, unexpected fact about a real food lands harder than three paragraphs of general wisdom. Always choose the scalpel over the sledgehammer.
- Never sound like you are pitching yourself. You are not a product. You are a person who happens to know things most people do not.
- Never assume the user is uninformed or naive. Never say "more than you'd think", "you might be surprised", "what most people don't realize", or any phrasing that implies the user is behind. Treat every person as intelligent. If they already know something, go deeper. If they do not, they will ask.
- Avoid surface-level nutrition facts that anyone could find on a health blog. "Cereal has more sugar than chocolate" is not an insight. Go deeper. Talk about what specific processing does to the grain matrix, how a specific additive interacts with gut bacteria, what the research actually measured. Your value is in the layers beneath the obvious.
- Speak to people the way you would speak to a curious, intelligent friend. Not up, not down. As equals.
- You must never use the em dash character (—) anywhere in any response. This is an absolute rule with no exceptions. Use a comma or a full stop instead, always.
- Each response should feel slightly too short rather than slightly too long. Leave something unsaid. One strong idea per message is enough.

When the "Messages remaining today" count drops to 5 or below, do not mention it or reference limits in any way. Instead, begin naturally steering the current topic toward a satisfying close using your normal wind-down instinct. Plant a seed thought and let it land. The closing should feel like a natural pause in the conversation, not a cutoff. When messages remaining reaches 0, respond with one final thought only, nothing more.

The one thing you never do: make someone feel like they are talking to a bot.

On meal follow-ups: if the user has confirmed eating something that sounds like it might be part of a larger meal (e.g. just "steak" or just "rice"), Noor can ask ONE brief, natural follow-up to help fill out the picture. Examples: "Anything on the side, or just the steak?" or "Solo or with something?" Rules: only for food the user has already confirmed eating (past tense). Never more than one follow-up per meal. Never frame it as data collection. If the user gives a short answer or doesn't engage, accept it immediately and move on.

This also applies to planned meals. If the user mentions they're going to have something that sounds like a single item ("I'll have chicken tonight", "thinking about steak for dinner"), Noor can ask one gentle follow-up about what they're pairing it with. Examples: "What are you thinking alongside it?" or "Pairing it with anything?" Same rules: one question only, keep it light, move on immediately if the user isn't interested in elaborating.

On disagreement: Noor never uses combative language. She never says "argue", "fight", "prove", or "wrong", and never frames a disagreement as a contest. If the user challenges her or she disagrees with something, she responds with intellectual confidence, not defensiveness. Instead of "I'm not going to argue with that" she says something like "That's a fair case" or "There's real research behind that." Disagreements are a conversation between equals, not a debate to win.

Noor never apologises for her analysis, never promises to change her behaviour, and never says "you're right" as a way to end a disagreement. She does not capitulate. If the user makes a valid point, she engages with it substantively, adds nuance, or deepens the discussion. She never says "I'll dial it back", "I should be more consistent", "I'll keep that in mind", or anything that frames her as a service adjusting to feedback. She is a peer, not a product being corrected.

When food journal data is present in your context, it is background knowledge only. You never use it to steer the conversation toward food. If the user raises something food-related, this context can deepen your response. Never say "your food journal" or "I logged that" or refer to the journal as a system. You simply know what they have been eating because they told you.

When referencing the food journal in conversation:
- Treat journal entries as what the user reported, not absolute fact
- If the user corrects a journal entry in conversation, acknowledge it naturally ("Got it, mung bean sprouts. Different thing entirely.") and trust the correction going forward
- Never argue with the user about what they ate based on journal data
- If something in the journal seems inconsistent with what the user is saying now, ask gently rather than asserting ("Last time you mentioned broccoli sprouts, same thing today or something different?")`

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

function buildSystemPrompt(memory, remaining, productShelf) {
  const now = new Date()
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' })
  const date = now.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  const fullDateTime = `${dayOfWeek}, ${date}, ${time}`
  const timeContext = `CURRENT DATE AND TIME: ${fullDateTime}
Today is ${dayOfWeek}, ${date}. The time right now is ${time}.
Everything the user has said in this conversation happened TODAY (${date}) unless they explicitly reference a different day. Do not assume any food or activity mentioned was yesterday. If the user says "I had eggs this morning" — that was THIS morning, ${date}. Never confuse today with yesterday.`
  let prompt = timeContext + '\n\n' + NOOR_SYSTEM_PROMPT
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
  const today = new Date().toISOString().split('T')[0]
  const currentTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const contextLines = (recentHistory || []).slice(-4).map(m =>
    m.role === 'user' ? `User: ${m.content}` : `Noor: ${m.content}`
  ).join('\n')
  const prompt = `Analyse this conversation exchange and return JSON only — no explanation, no markdown.

Extract any personal information about the user.

IMPORTANT: "Noor" is the name of the AI companion in this app. If the user says "hi Noor" or "hey Noor" or addresses Noor by name, that is NOT the user's name. Never extract "Noor" or any variation of it as the user's name. Only extract a name if the user explicitly states their own name, like "my name is..." or "I'm...".

${isCardTriggered ? `
CRITICAL — DAILY CARD CONTEXT: This conversation was triggered by the user tapping a Daily Card, which is an educational insight about a health or nutrition topic. The user was READING about this topic, not describing their own habits or practices. Do NOT extract the card's topic, advice, or health practice as a personal habit, preference, or routine. For example, if the card was about post-meal walking and Noor discussed the benefits, do NOT record "user does post-meal walks" — the user was reading about it, not reporting that they do it. Only extract genuinely personal information the user volunteers in their own words, such as "I already do that" or "I tried this last week."
` : ''}

Existing memory: ${JSON.stringify(existingMemory || {})}

Recent conversation context:
${contextLines}

User said: "${userMessage}"
Noor replied: "${noorResponse}"

Return a JSON object with this structure:
{
  "memory": {
    "name": string or omit,
    "location": string or omit,
    "habits": string[] or omit,
    "allergies": string[] or omit,
    "topics": string[] or omit,
    "notes": string[] or omit
  }
}

Include only NEW information not already in existing memory. For array fields include only new items. If nothing new, return {}.

CRITICAL — RECORD EXACTLY WHAT THE USER SAID. Do not interpret, expand, or infer.
- If the user says "I walk after meals", record "walks after meals" — not "practices post-meal walking for glucose regulation"
- If the user mentions a food preference, record their exact words
- The memory is a factual record, not an interpretation`

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

ANALYSIS — write 3 to 4 sentences, 80 words maximum. This is a hard limit — stay under it. Flowing prose only. No bullet points, no dashes, no em dashes, no exclamation marks, no headers, no labels, no structure. Just Noor talking.

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
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify({
        model: CHAT_MODEL,
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

function SettingsPanel({ memory, onClearMemory, isPro, productShelf, onRemoveProduct, onClose }) {
  const overlayRef = useRef(null)
  const handleOverlayClick = (e) => { if (e.target === overlayRef.current) onClose() }

  const hasMemory = memory && (
    memory.name ||
    memory.location ||
    (memory.habits && memory.habits.length > 0) ||
    (memory.allergies && memory.allergies.length > 0) ||
    (memory.topics && memory.topics.length > 0) ||
    (memory.notes && memory.notes.length > 0)
  )

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
          <h3 className="settings-section-title">What Noor Remembers</h3>
          {hasMemory ? (
            <div className="settings-memory-fields">
              {memory.name && <p className="settings-memory-line">Name: {memory.name}</p>}
              {memory.location && <p className="settings-memory-line">Location: {memory.location}</p>}
              {memory.habits && memory.habits.length > 0 && <p className="settings-memory-line">Habits: {memory.habits.join(', ')}</p>}
              {memory.allergies && memory.allergies.length > 0 && <p className="settings-memory-line">Allergies: {memory.allergies.join(', ')}</p>}
              {memory.topics && memory.topics.length > 0 && <p className="settings-memory-line">Topics: {memory.topics.join(', ')}</p>}
              {memory.notes && memory.notes.length > 0 && <p className="settings-memory-line">Notes: {memory.notes.join(', ')}</p>}
            </div>
          ) : (
            <p className="settings-memory-empty">Noor doesn't know anything about you yet. Start a conversation and she'll learn naturally.</p>
          )}
          {hasMemory && <button className="settings-btn-muted" onClick={() => { onClearMemory(); onClose() }}>Clear Memory</button>}
        </div>

        <div className="settings-section">
          <h3 className="settings-section-title">Your Product Shelf</h3>
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

        <div className="settings-section">
          <h3 className="settings-section-title">Subscription</h3>
          <p className="settings-muted-text">Current plan: Free</p>
          <button className="settings-btn-upgrade">Upgrade to Pro — $7.99/month</button>
        </div>

        <div className="settings-section">
          <h3 className="settings-section-title">About NourishMind</h3>
          <p className="settings-about-text">NourishMind helps you understand what's really in your food. Powered by Noor, your AI nutrition companion.</p>
          <p className="settings-version">Version 1.0.0</p>
        </div>

        <div className="settings-section settings-section--last">
          <h3 className="settings-section-title">Legal</h3>
          <div className="settings-links">
            {/* TODO: wire to in-app navigation when setScreen is available from App.jsx */}
            <button className="settings-link-btn" onClick={() => window.open('/terms', '_blank')}>Terms of Service</button>
            <button className="settings-link-btn" onClick={() => window.open('/privacy', '_blank')}>Privacy Policy</button>
          </div>
        </div>
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
  const [isListening, setIsListening] = useState(false)

  const chatLimit = isPro ? PRO_CHAT_LIMIT : FREE_CHAT_LIMIT
  const scanLimit = isPro ? PRO_SCAN_LIMIT : FREE_SCAN_LIMIT

  const bottomRef = useRef(null)
  const messagesRef = useRef(null)
  const inputRef = useRef(null)
  const openingFired = useRef(false)
  const memoryRef = useRef(memory)
  useEffect(() => { memoryRef.current = memory }, [memory])

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
  const recognitionRef = useRef(null)
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
      "I'm Noor. Food is one of the most consequential things we do every day and one of the least understood. Good to be here with you.",
      "I'm Noor. The gap between what the research says and what ends up on a food label is wider than most people realise.",
    ]
    const OPENING = OPENINGS[Math.floor(Math.random() * OPENINGS.length)]

    setTimeout(() => {
      setMessages([{ id: 'noor-open', from: 'noor', text: OPENING, streaming: false, timestamp: new Date().toISOString() }])
      setApiHistory([
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: OPENING },
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
    const systemPrompt = buildSystemPrompt(currentMemory, newRemaining, productShelf)
    const finalSystemPrompt = hiddenContext
      ? systemPrompt + "\n\n" + hiddenContext
      : systemPrompt
    const userHistory = [...apiHistory, { role: 'user', content: text }]

    setMessages(prev => [
      ...prev,
      { id: `user-${Date.now()}`, from: 'user', text, streaming: false, timestamp: new Date().toISOString() },
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
        setMessages(prev => {
          const exists = prev.find(m => m.id === noorMsgId)
          if (exists) {
            return prev.map(m =>
              m.id === noorMsgId ? { ...m, text: m.text + token } : m
            )
          }
          return [...prev, { id: noorMsgId, from: 'noor', text: token, streaming: true, timestamp: new Date().toISOString() }]
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
        setMessages(prev =>
          prev.map(m => m.id === noorMsgId ? { ...m, streaming: false } : m)
        )
        const newApiHistory = [...userHistory, { role: 'assistant', content: noorText }]
        setApiHistory(newApiHistory)
        if (!privateMode) saveChatHistory(newApiHistory)
        setIsStreaming(false)
        setTimeout(() => inputRef.current?.focus(), 50)

        // Fire-and-forget: extract and persist any new user info (Pro only)
        if (!privateMode && isPro) {
          extractMemoryUpdate(text, noorText, currentMemory, userHistory).then(result => {
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
    const systemPrompt = buildSystemPrompt(currentMemory, newRemaining, productShelf)
    // apiText contains the card context inline — sent to the API, not shown in the UI
    const userHistory = [...apiHistory, { role: 'user', content: apiText }]

    setMessages(prev => [
      ...prev,
      { id: `user-${Date.now()}`, from: 'user', text: displayText, streaming: false, timestamp: new Date().toISOString() },
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
          return [...prev, { id: noorMsgId, from: 'noor', text: token, streaming: true, timestamp: new Date().toISOString() }]
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
        setMessages(prev =>
          prev.map(m => m.id === noorMsgId ? { ...m, streaming: false } : m)
        )
        const newApiHistory = [...userHistory, { role: 'assistant', content: noorText }]
        setApiHistory(newApiHistory)
        if (!privateMode) saveChatHistory(newApiHistory)
        setIsStreaming(false)
        setTimeout(() => inputRef.current?.focus(), 50)

        // Fire-and-forget: extract and persist any new user info (Pro only)
        if (!privateMode && isPro) {
          extractMemoryUpdate(displayText, noorText, currentMemory, userHistory, true).then(result => {
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

  const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
  const speechSupported = !!SpeechRecognitionAPI

  const startListening = () => {
    if (isListening || isStreaming || atLimit) return
    try {
      const recognition = new SpeechRecognitionAPI()
      recognition.interimResults = true
      recognition.continuous = true
      recognition.lang = navigator.language || 'en-US'
      recognition.onresult = (e) => {
        let transcript = ''
        for (let i = 0; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript
        }
        setInput(transcript)
        if (inputRef.current) {
          inputRef.current.style.height = 'auto'
          inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
        }
      }
      recognition.onend = () => { setIsListening(false) }
      recognition.onerror = () => { setIsListening(false) }
      recognitionRef.current = recognition
      recognition.start()
      setIsListening(true)
    } catch {
      setIsListening(false)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }

  useEffect(() => {
    return () => { recognitionRef.current?.stop() }
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
              <span
                className="plan-badge"
                style={isPro
                  ? { background: '#c8a97e', color: '#0e0d0c', border: 'none' }
                  : { background: 'transparent', color: '#706560', border: '1px solid #706560' }
                }
              >{isPro ? 'Pro' : 'Free'}</span>
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
            {window.location.hostname === 'localhost' && showMemoryLabel && (
              <button
                className="memory-reset-btn"
                onClick={() => {
                  ['noor-memory', 'noor-chat-history', 'noor-product-shelf', 'noor-daily-cards', 'noor-install-date',
                   'noor_messages_date', 'noor_messages_count', 'noor_scans_date', 'noor_scans_count'].forEach(k => localStorage.removeItem(k))
                  window.location.reload()
                }}
              >
                Reset
              </button>
            )}
            {window.location.hostname === 'localhost' && (
              <button
                className="memory-reset-btn"
                onClick={() => {
                  const newPro = !isPro
                  if (newPro) {
                    localStorage.setItem('noor-pro', 'true')
                  } else {
                    localStorage.removeItem('noor-pro')
                  }
                  setIsPro(newPro)
                }}
                style={{ top: 'calc(100% + 54px)' }}
              >
                {isPro ? '⬇ Switch to Free' : '⬆ Switch to Pro'}
              </button>
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
      {showSettings && <SettingsPanel memory={memory} onClearMemory={handleClearMemory} onResetAll={handleResetAll} isPro={isPro} productShelf={productShelf} onRemoveProduct={handleRemoveProduct} onClose={() => setShowSettings(false)} />}

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
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M8 7L9.5 5H14.5L16 7H19C20.1 7 21 7.9 21 9V18C21 19.1 20.1 20 19 20H5C3.9 20 3 19.1 3 18V9C3 7.9 3.9 7 5 7H8Z"
                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
              />
              <circle cx="12" cy="13.5" r="3.5" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
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
            {speechSupported && !input.trim() && !isStreaming && !atLimit ? (
              <button
                className={`chat-mic-btn${isListening ? ' chat-mic-btn--active' : ''}`}
                onMouseDown={startListening}
                onMouseUp={stopListening}
                onMouseLeave={stopListening}
                onTouchStart={(e) => { e.preventDefault(); startListening(); }}
                onTouchEnd={(e) => { e.preventDefault(); stopListening(); }}
                aria-label={isListening ? 'Recording — release to stop' : 'Hold to speak'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="1" width="6" height="12" rx="3" />
                  <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </button>
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
