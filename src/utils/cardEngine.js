// src/utils/cardEngine.js
// Handles: day calculation, card storage, card retrieval, Day 15+ generation
import { MODEL_CARD_GENERATION } from "../config";
import ONBOARDING_CARDS from "../data/onboardingCards";

const STORAGE_KEY = "noor-daily-cards";
const INSTALL_KEY = "noor-install-date";

// ─── Day calculation ───
function getInstallDate() {
  let date = localStorage.getItem(INSTALL_KEY);
  if (!date) {
    date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    localStorage.setItem(INSTALL_KEY, date);
  }
  return date;
}

export function getUserDay() {
  const install = new Date(getInstallDate());
  const now = new Date();
  // Reset at midnight local time
  const installDay = new Date(install.getFullYear(), install.getMonth(), install.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = today - installDay;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1; // Day 1 on install date
}

// ─── Card storage ───
function getSavedCards() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCard(card) {
  const cards = getSavedCards();
  // Don't duplicate
  if (cards.find((c) => c.day === card.day)) return;
  cards.push(card);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

// ─── Seed generation (deterministic art per day) ───
function dayToSeed(day) {
  // Spread seeds across range for visual variety
  return 1000 + ((day * 2654435761) % 8999);
}

// ─── Get today's card ───
export async function getTodayCard() {
  const day = getUserDay();

  // Check if already generated today
  const saved = getSavedCards();
  const existing = saved.find((c) => c.day === day);
  if (existing) return existing;

  let card;

  if (day <= 14) {
    // Pre-written onboarding card
    const onboarding = ONBOARDING_CARDS[day - 1];
    card = {
      ...onboarding,
      seed: dayToSeed(day),
    };
  } else {
    // Day 15+: generate via API
    card = await generateCard(day, saved);
  }

  saveCard(card);
  return card;
}

// ─── Get full card deck (all past cards) ───
export function getCardDeck() {
  return getSavedCards().sort((a, b) => b.day - a.day); // newest first
}

// ─── Day 15+ generation ───
const CARD_SYSTEM_PROMPT = `You are Noor, the intelligence behind NourishMind. You are writing a single Daily Card — a short piece of nutritional knowledge the user will read in ten seconds and carry with them all day.

## Voice — non-negotiable:
- Write like a smart friend who read the research, not like a textbook or a health influencer.
- State what is true. Let the fact land on its own.
- Never preach. Never use "you should." Never lecture.
- Never be dramatic or theatrical. No alarming language, no "shocking truth" energy.
- Never use clickbait phrasing in the tag or the insight.
- Prefer plain language. If a 20-year-old would need to Google a phrase, rewrite it.
- Scientific terms are fine when they're the only precise word (insulin, cortisol, autophagy) — but always explain what they do in the same sentence.
- One surprising connection or reframe per card. Not two.
- End on a thought that sits quietly. Not a punchline, not a command.

## Tag format:
Tags begin with "On" followed by the topic in plain language.
Good: "On magnesium", "On eating speed", "On canola oil"
Bad: "The hidden truth about...", "Why X is killing you", "The X trap"

## Insight rules:
- 40-50 words. Hard limit.
- Two to four sentences.
- At least one specific detail (a number, a compound, a mechanism, a timeframe).
- Never use exclamation marks.
- Never use "you should", "try to", "make sure to", "consider".
- Never start with "Did you know" or any question.
- Vary your opening. Do not start every card the same way.
- Read the card back as if you're a busy person glancing at their phone. If any sentence requires re-reading, simplify it.

## Rotation rules:
- Rotate across all three categories over any 7-day window.
- Never repeat the same category three days in a row.
- Never repeat a topic already covered.

## Reject list — never write cards about:
- Generic wellness advice ("drink more water", "eat your vegetables")
- Anything that sounds like a fitness Instagram caption
- Anything with a dramatic closer ("and nothing is the same", "everything changes")
- Anything that talks down to the reader

Respond ONLY with a valid JSON object, no markdown, no preamble:
{"category": "harmful_ingredient|harmful_habit|protective", "tag": "On [topic]", "insight": "..."}`;

async function generateCard(day, previousCards) {
  // Build context of recent cards to avoid repetition
  const recent = previousCards
    .slice(-7)
    .map((c) => `Day ${c.day}: [${c.category}] ${c.tag}`)
    .join("\n");

  const recentCategories = previousCards.slice(-2).map((c) => c.category);

  // TODO: When memory/conversation history is available, inject it here
  // const userMemory = await getUserMemory();

  const userPrompt = `Generate today's Daily Card (Day ${day}).

Recent cards (do not repeat topics or use the same category as the last two):
${recent || "None yet."}

Last two categories used: ${recentCategories.join(", ") || "none"}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL_CARD_GENERATION,
        max_tokens: 300,
        system: CARD_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return {
      day,
      category: parsed.category,
      tag: parsed.tag,
      insight: parsed.insight,
      seed: dayToSeed(day),
      generated: true,
    };
  } catch (err) {
    console.error("Card generation failed:", err);
    // Fallback: cycle through onboarding cards with offset
    const fallbackIdx = (day - 1) % 14;
    return {
      ...ONBOARDING_CARDS[fallbackIdx],
      day,
      seed: dayToSeed(day),
      fallback: true,
    };
  }
}
