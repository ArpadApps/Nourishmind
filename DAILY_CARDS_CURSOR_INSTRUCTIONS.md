# Daily Cards — Cursor Integration Instructions

## Files to add

Copy these files into the project at `C:\Users\Arpad\Desktop\nourishmind`:

```
src/data/onboardingCards.js    ← 14 pre-written cards
src/utils/cardEngine.js        ← Day tracking, card selection, Day 15+ generation
src/components/DailyCard.jsx   ← The visual card component (glow SVG art)
src/components/DailyCardScreen.jsx  ← Full-screen card viewer with swipe deck
```

## Step 1: Add model string to config.js

In `src/config.js` (create if it doesn't exist), add:

```js
// Card generation model — used for Day 15+ personalised cards
export const MODEL_CARD_GENERATION = "claude-opus-4-20250514";
```

This is the centralised config file. All model strings and limits go here.
cardEngine.js imports MODEL_CARD_GENERATION from this file.

## Step 2: Wire the card icon into the chat header

In `ChatScreen.jsx`, the journal icon in the header should be replaced with a card icon that opens the DailyCardScreen.

Add the import at the top:

```js
import DailyCardScreen from "./DailyCardScreen";
```

Add state for showing the card screen:

```js
const [showDailyCard, setShowDailyCard] = useState(false);
```

Replace the journal icon button's onClick to:

```js
onClick={() => setShowDailyCard(true)}
```

Render the screen when active (place this just before the closing tag of the main container):

```js
{showDailyCard && (
  <DailyCardScreen onClose={() => setShowDailyCard(false)} />
)}
```

## Step 3: Verify localStorage keys

The card system uses two localStorage keys:
- `noor-install-date` — tracks when the user first opened the app
- `noor-daily-cards` — stores all generated/delivered cards

These do not conflict with existing keys (`noor-product-shelf`, conversation memory, etc.).

## Step 4: Test

1. Open the app — it should be Day 1
2. Tap the card icon — Day 1 card ("On refined sugar") appears with copper crystal art
3. Close and reopen — same card, same art (deterministic seed)
4. To test multiple days: in browser console, run:
   ```js
   localStorage.setItem("noor-install-date", "2026-04-01");
   ```
   Then refresh — the app will think it's Day 10 and show all cards up to Day 10

## What's wired

- [x] Days 1–14: pre-written cards, zero API cost
- [x] Day 15+: Opus API generation with tone-locked system prompt
- [x] Deterministic art per day (same seed = same visual always)
- [x] Card deck with swipe navigation
- [x] Fallback if API fails (cycles onboarding cards)
- [x] Day counter based on install date

## What's left (next session)

- [ ] Save to camera roll (html2canvas or dom-to-image)
- [ ] Share with NourishMind watermark (isShared=true flag)
- [ ] Personalisation: inject user memory into Day 15+ generation prompt
- [ ] Notification or badge to signal "new card available"
- [ ] Migrate card storage from localStorage to Supabase
- [ ] Card animation on open (fade/scale entrance)
