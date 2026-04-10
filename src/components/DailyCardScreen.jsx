// src/components/DailyCardScreen.jsx
// Full-screen card view: today's card, swipeable deck, save/share
import { useState, useEffect, useRef } from "react";
import DailyCard from "./DailyCard";
import { getTodayCard, getCardDeck, getUserDay } from "../utils/cardEngine";

export default function DailyCardScreen({ onClose }) {
  const [todayCard, setTodayCard] = useState(null);
  const [deck, setDeck] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const touchStartX = useRef(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const card = await getTodayCard();
        const allCards = getCardDeck(); // newest first
        setTodayCard(card);
        setDeck(allCards);
        setCurrentIdx(0); // start at newest (today)
      } catch (err) {
        console.error("Failed to load card:", err);
      }
      setLoading(false);
    }
    load();
  }, []);

  const currentCard = deck[currentIdx] || todayCard;
  const day = getUserDay();

  // ─── Swipe handling ───
  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e) {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 50;
    if (diff > threshold && currentIdx < deck.length - 1) {
      setCurrentIdx((i) => i + 1); // swipe right → older card
    } else if (diff < -threshold && currentIdx > 0) {
      setCurrentIdx((i) => i - 1); // swipe left → newer card
    }
    touchStartX.current = null;
  }

  // ─── Keyboard nav for desktop ───
  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowLeft" && currentIdx < deck.length - 1) {
        setCurrentIdx((i) => i + 1);
      } else if (e.key === "ArrowRight" && currentIdx > 0) {
        setCurrentIdx((i) => i - 1);
      } else if (e.key === "Escape" && onClose) {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentIdx, deck.length, onClose]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Preparing today's card...</div>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>No card available</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Close button */}
      {onClose && (
        <button onClick={onClose} style={styles.closeBtn} aria-label="Close">
          ×
        </button>
      )}

      {/* Day indicator */}
      <div style={styles.dayBadge}>
        {currentIdx === 0 ? "Today" : `Day ${currentCard.day}`}
      </div>

      {/* Card area — swipeable */}
      <div
        style={styles.cardWrapper}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <DailyCard card={currentCard} />
      </div>

      {/* Deck dots */}
      {deck.length > 1 && (
        <div style={styles.dotsRow}>
          {deck.map((_, i) => (
            <div
              key={i}
              onClick={() => setCurrentIdx(i)}
              style={{
                ...styles.dot,
                background: i === currentIdx ? "#c8a97e" : "#706560",
                opacity: i === currentIdx ? 1 : 0.3,
                width: i === currentIdx ? 16 : 6,
              }}
            />
          ))}
        </div>
      )}

      {/* Action row */}
      <div style={styles.actionRow}>
        <button
          onClick={() => {
            // TODO: Wire to html2canvas for save-to-camera-roll
            console.log("Save card:", currentCard.day);
          }}
          style={styles.actionBtn}
        >
          Save
        </button>
        <button
          onClick={() => {
            // TODO: Wire to share API with isShared=true watermark
            console.log("Share card:", currentCard.day);
          }}
          style={styles.actionBtn}
        >
          Share
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "#0e0d0c",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    fontFamily: "Georgia, serif",
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    background: "none",
    border: "none",
    color: "#706560",
    fontSize: 28,
    cursor: "pointer",
    zIndex: 10,
    padding: "4px 8px",
    lineHeight: 1,
  },
  dayBadge: {
    color: "#706560",
    fontSize: 11,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  cardWrapper: {
    width: "100%",
    maxWidth: 400,
    flex: "0 1 auto",
    display: "flex",
    justifyContent: "center",
    touchAction: "pan-y",
    userSelect: "none",
  },
  dotsRow: {
    display: "flex",
    gap: 4,
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 200,
    flexWrap: "wrap",
  },
  dot: {
    height: 6,
    borderRadius: 3,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  loadingText: {
    color: "#706560",
    fontSize: 13,
    fontStyle: "italic",
    letterSpacing: "0.06em",
  },
  actionRow: {
    display: "flex",
    gap: 16,
    marginTop: 20,
  },
  actionBtn: {
    background: "none",
    border: "1px solid #2a2826",
    borderRadius: 8,
    color: "#706560",
    fontSize: 12,
    letterSpacing: "0.1em",
    padding: "8px 20px",
    cursor: "pointer",
    fontFamily: "Georgia, serif",
    transition: "all 0.2s",
  },
};
