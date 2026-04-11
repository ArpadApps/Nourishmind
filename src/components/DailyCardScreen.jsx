// src/components/DailyCardScreen.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import DailyCard from "./DailyCard";
import { getTodayCard, getCardDeck, getUserDay } from "../utils/cardEngine";

export default function DailyCardScreen({ onClose, onOpenChat }) {
  const [todayCard, setTodayCard] = useState(null);
  const [deck, setDeck] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState("visible");
  const [saving, setSaving] = useState(false);
  const touchStartX = useRef(null);
  const touchMoved = useRef(false);
  const cardRef = useRef(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const card = await getTodayCard();
        const allCards = getCardDeck();
        setTodayCard(card);
        setDeck(allCards);
        setCurrentIdx(0);
      } catch (err) {
        console.error("Failed to load card:", err);
      }
      setLoading(false);
    }
    load();
  }, []);

  // ─── Animated close ───
  const handleClose = useCallback(() => {
    setPhase("exiting");
    setTimeout(() => {
      if (onClose) onClose();
    }, 850);
  }, [onClose]);

  // ─── Tap card → open chat with card context ───
  function handleCardTap() {
    if (touchMoved.current) return;
    const card = deck[currentIdx] || todayCard;
    if (!card || !onOpenChat) return;
    setPhase("exiting");
    setTimeout(() => {
      onOpenChat(card);
    }, 850);
  }

  // ─── Swipe — distinguish from tap ───
  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    touchMoved.current = false;
  }
  function onTouchMove() {
    touchMoved.current = true;
  }
  function onTouchEnd(e) {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      touchMoved.current = true;
      if (diff > 50 && currentIdx < deck.length - 1) setCurrentIdx((i) => i + 1);
      else if (diff < -50 && currentIdx > 0) setCurrentIdx((i) => i - 1);
    }
    touchStartX.current = null;
  }

  // ─── Keyboard ───
  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowLeft" && currentIdx < deck.length - 1) setCurrentIdx((i) => i + 1);
      else if (e.key === "ArrowRight" && currentIdx > 0) setCurrentIdx((i) => i - 1);
      else if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentIdx, deck.length, handleClose]);

  // ─── Save to image ───
  async function handleSave() {
    const card = deck[currentIdx] || todayCard;
    if (!cardRef.current || saving) return;
    setSaving(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0e0d0c",
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `nourishmind-day-${card.day}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Save failed:", err);
    }
    setSaving(false);
  }

  // ─── Share ───
  async function handleShare() {
    const card = deck[currentIdx] || todayCard;
    if (!cardRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0e0d0c",
        scale: 2,
        useCORS: true,
      });
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      const file = new File([blob], `nourishmind-day-${card.day}.png`, { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "NourishMind",
          text: card.tag,
        });
      } else {
        handleSave();
      }
    } catch (err) {
      if (err.name !== "AbortError") console.error("Share failed:", err);
    }
  }

  const currentCard = deck[currentIdx] || todayCard;

  if (loading || !currentCard) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>
          {loading ? "Preparing today\u2019s card\u2026" : "No card available"}
        </div>
      </div>
    );
  }

  const exiting = phase === "exiting";

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes cardDissolve {
          0%   { transform: scale(1);    filter: blur(0px)  brightness(1);   opacity: 1; }
          25%  { transform: scale(1.02); filter: blur(0px)  brightness(1.6); opacity: 1; }
          75%  { transform: scale(1.08); filter: blur(12px) brightness(1.8); opacity: 0.3; }
          100% { transform: scale(1.12); filter: blur(20px) brightness(2);   opacity: 0; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
      `}</style>

      <button
        onClick={handleClose}
        style={{
          ...styles.closeBtn,
          animation: exiting ? "fadeOut 0.3s ease forwards" : undefined,
        }}
        aria-label="Close"
      >
        ×
      </button>

      <div
        style={{
          ...styles.dayBadge,
          animation: exiting ? "fadeOut 0.3s ease forwards" : undefined,
        }}
      >
        {currentIdx === 0 ? "Today" : `Day ${currentCard.day}`}
      </div>

      <div
        style={{
          ...styles.cardWrapper,
          animation: exiting ? "cardDissolve 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards" : undefined,
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleCardTap}
      >
        <div ref={cardRef}>
          <DailyCard card={currentCard} isShared={true} />
        </div>
      </div>

      <div
        style={{
          ...styles.tapHint,
          animation: exiting ? "fadeOut 0.3s ease forwards" : undefined,
        }}
      >
        Tap card to discuss with Noor
      </div>

      {deck.length > 1 && (
        <div
          style={{
            ...styles.dotsRow,
            animation: exiting ? "fadeOut 0.3s ease forwards" : undefined,
          }}
        >
          {deck.map((_, i) => (
            <div
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrentIdx(i); }}
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

      <div
        style={{
          ...styles.actionRow,
          animation: exiting ? "fadeOut 0.3s ease forwards" : undefined,
        }}
      >
        <button onClick={(e) => { e.stopPropagation(); handleSave(); }} style={styles.actionBtn} disabled={saving}>
          {saving ? "Saving\u2026" : "Save"}
        </button>
        <button onClick={(e) => { e.stopPropagation(); handleShare(); }} style={styles.actionBtn}>
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
    cursor: "pointer",
  },
  tapHint: {
    color: "#706560",
    fontSize: 11,
    letterSpacing: "0.06em",
    fontStyle: "italic",
    marginTop: 10,
  },
  dotsRow: {
    display: "flex",
    gap: 4,
    marginTop: 12,
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
    marginTop: 16,
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
