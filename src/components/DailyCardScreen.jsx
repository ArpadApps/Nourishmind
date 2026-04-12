// src/components/DailyCardScreen.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import DailyCard from "./DailyCard";
import { getTodayCard, getCardDeck, getUserDay } from "../utils/cardEngine";

const CATEGORY_COLORS = {
  harmful_ingredient: "#b5544a",
  harmful_habit: "#c8a97e",
  protective: "#7a9a7e",
};

export default function DailyCardScreen({ onClose, onOpenChat }) {
  const [todayCard, setTodayCard] = useState(null);
  const [deck, setDeck] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState("visible");
  const [containerHidden, setContainerHidden] = useState(false);
  const [saving, setSaving] = useState(false);
  const touchStartX = useRef(null);
  const touchMoved = useRef(false);
  const cardRef = useRef(null);
  const canvasRef = useRef(null);

  const currentCard = deck[currentIdx] || todayCard;

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

  // ─── Nova burst ───
  function fireNova() {
    if (!currentCard) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const color = CATEGORY_COLORS[currentCard?.category] || "#c8a97e";
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    // Nova ring state
    let novaRadius = 0;
    let novaAlpha = 1;
    let novaWidth = 4;

    // Central dot state
    let dotAlpha = 1;
    let dotRadius = 6;

    const stars = Array.from({ length: 35 }, () => ({
      x: cx + (Math.random() - 0.5) * canvas.width * 0.7,
      y: cy + (Math.random() - 0.5) * canvas.height * 0.5,
      r: 0.5 + Math.random() * 2,
      alpha: 0,
      maxAlpha: 0.3 + Math.random() * 0.7,
      fadeIn: 0.02 + Math.random() * 0.03,
      fadeOut: 0.005 + Math.random() * 0.01,
      delay: 15 + Math.floor(Math.random() * 20),
      phase: "waiting",
    }));

    let frame = 0;
    let animId;

    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      // Phase 1: Central dot flash (frames 0-15)
      if (frame < 15) {
        dotAlpha = Math.min(1, frame / 5);
        dotRadius = 3 + frame * 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${dotAlpha})`;
        ctx.fill();
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, dotRadius * 2.5);
        grd.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${dotAlpha * 0.6})`);
        grd.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.beginPath();
        ctx.arc(cx, cy, dotRadius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      // Phase 2: Nova ring expands (frames 10-50)
      if (frame >= 10 && frame < 50) {
        novaRadius += 6 + (frame - 10) * 0.5;
        novaAlpha = Math.max(0, 1 - (frame - 10) / 40);
        novaWidth = Math.max(0.5, 4 - (frame - 10) * 0.08);

        ctx.beginPath();
        ctx.arc(cx, cy, novaRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${novaAlpha * 0.8})`;
        ctx.lineWidth = novaWidth;
        ctx.stroke();

        // Soft glow behind ring
        const ringGlow = ctx.createRadialGradient(cx, cy, Math.max(0, novaRadius - 10), cx, cy, novaRadius + 20);
        ringGlow.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
        ringGlow.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${novaAlpha * 0.15})`);
        ringGlow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.beginPath();
        ctx.arc(cx, cy, novaRadius + 5, 0, Math.PI * 2);
        ctx.fillStyle = ringGlow;
        ctx.fill();
      }

      // Central dot fades after nova starts
      if (frame >= 10 && frame < 25) {
        dotAlpha = Math.max(0, 1 - (frame - 10) / 15);
        ctx.beginPath();
        ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${dotAlpha})`;
        ctx.fill();
      }

      // Phase 3: Stars twinkle (from frame 15 onward)
      let starsAlive = false;
      for (const s of stars) {
        if (s.phase === "waiting" && frame >= s.delay) s.phase = "in";
        if (s.phase === "in") {
          s.alpha = Math.min(s.maxAlpha, s.alpha + s.fadeIn);
          if (s.alpha >= s.maxAlpha) s.phase = "hold";
          starsAlive = true;
        } else if (s.phase === "hold") {
          s.holdCount = (s.holdCount || 0) + 1;
          if (s.holdCount > 30) s.phase = "out";
          starsAlive = true;
        } else if (s.phase === "out") {
          s.alpha = Math.max(0, s.alpha - s.fadeOut);
          if (s.alpha <= 0) s.phase = "done";
          else starsAlive = true;
        }
        if (s.alpha > 0) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${s.alpha})`;
          ctx.fill();
        }
      }

      if (frame < 50 || frame < 25 || starsAlive) {
        animId = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    animId = requestAnimationFrame(tick);
  }

  // ─── Animated close ───
  const handleClose = useCallback(() => {
    setPhase("exiting");
    setTimeout(() => fireNova(), 400);
    setTimeout(() => setContainerHidden(true), 1350);
    setTimeout(() => { if (onClose) onClose(); }, 1400);
  }, [onClose, currentCard]);

  // ─── Tap card → open chat with card context ───
  function handleCardTap() {
    if (touchMoved.current) return;
    const card = deck[currentIdx] || todayCard;
    if (!card) return;
    setPhase("exiting");
    setTimeout(() => fireNova(), 400);
    setTimeout(() => setContainerHidden(true), 1350);
    setTimeout(() => { if (onOpenChat) onOpenChat(card); }, 1400);
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
    <div style={{
        ...styles.container,
        opacity: containerHidden ? 0 : 1,
        transition: exiting ? "opacity 0.15s ease" : undefined,
      }}>
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1001,
          pointerEvents: "none",
        }}
      />
      <style>{`
        @keyframes cardCollapse {
          0%   { transform: scale(1);    opacity: 1;   filter: blur(0px); }
          60%  { transform: scale(0.15); opacity: 0.8; filter: blur(1px); }
          85%  { transform: scale(0.03); opacity: 0.6; filter: blur(2px); }
          100% { transform: scale(0);   opacity: 0;   filter: blur(4px); }
        }
        @keyframes fadeOutFast {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
      `}</style>

      <button
        onClick={handleClose}
        style={{
          ...styles.closeBtn,
          animation: exiting ? "fadeOutFast 0.2s ease forwards" : undefined,
        }}
        aria-label="Close"
      >
        ×
      </button>

      <div
        style={{
          ...styles.dayBadge,
          animation: exiting ? "fadeOutFast 0.2s ease forwards" : undefined,
        }}
      >
        {currentIdx === 0 ? "Today" : `Day ${currentCard.day}`}
      </div>

      <div
        style={{
          ...styles.cardWrapper,
          animation: exiting ? "cardCollapse 0.65s cubic-bezier(0.55, 0, 1, 0.45) forwards" : undefined,
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
          animation: exiting ? "fadeOutFast 0.2s ease forwards" : undefined,
        }}
      >
        Tap card to discuss with Noor
      </div>

      {deck.length > 1 && (
        <div
          style={{
            ...styles.dotsRow,
            animation: exiting ? "fadeOutFast 0.2s ease forwards" : undefined,
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
          animation: exiting ? "fadeOutFast 0.2s ease forwards" : undefined,
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
    WebkitTapHighlightColor: "transparent",
    WebkitTouchCallout: "none",
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
    WebkitTapHighlightColor: "transparent",
    WebkitTouchCallout: "none",
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
    WebkitTapHighlightColor: "transparent",
    WebkitTouchCallout: "none",
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
    WebkitTapHighlightColor: "transparent",
    WebkitTouchCallout: "none",
  },
};
