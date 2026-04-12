// src/components/DailyCard.jsx
// The card visual — generative SVG art with 3-layer glow
// Receives: { category, tag, insight, day, seed }

import { useMemo } from "react";

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ─── Category art generators ───

function CrystalArt({ seed, color }) {
  const rand = seededRandom(seed);
  const els = [];

  for (let i = 0; i < 18; i++) {
    const cx = rand() * 1080;
    const cy = rand() * 1500 + 150;
    const size = rand() * 230 + 100;
    const pts = Array.from({ length: 4 + Math.floor(rand() * 4) }, () => {
      const a = rand() * Math.PI * 2;
      const r = size * (0.3 + rand() * 0.7);
      return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
    }).join(" ");
    els.push(
      <polygon key={`s${i}`} points={pts}
        fill={`${color}${i < 7 ? "14" : "08"}`}
        stroke={color} strokeWidth={0.8 + rand() * 1.8}
        opacity={0.25 + rand() * 0.2} />
    );
  }

  for (let i = 0; i < 28; i++) {
    let x = rand() * 1080, y = rand() * 1700 + 50;
    const segs = [`M${x},${y}`];
    for (let j = 0; j < 5 + Math.floor(rand() * 12); j++) {
      x += (rand() - 0.5) * 200; y += rand() * 70 - 20;
      segs.push(`L${x},${y}`);
    }
    els.push(
      <path key={`c${i}`} d={segs.join(" ")} fill="none" stroke={color}
        strokeWidth={0.5 + rand() * 1.5} opacity={0.2 + rand() * 0.25} strokeLinecap="round" />
    );
  }

  for (let i = 0; i < 45; i++) {
    const x1 = rand() * 1080, y1 = rand() * 1920;
    const angle = rand() * Math.PI * 2, len = 15 + rand() * 90;
    els.push(
      <line key={`a${i}`} x1={x1} y1={y1}
        x2={x1 + Math.cos(angle) * len} y2={y1 + Math.sin(angle) * len}
        stroke={color} strokeWidth={0.5 + rand() * 1.2}
        opacity={0.25 + rand() * 0.25} strokeLinecap="round" />
    );
  }

  for (let i = 0; i < 22; i++) {
    els.push(
      <circle key={`n${i}`} cx={rand() * 1080} cy={rand() * 1920}
        r={1.5 + rand() * 5} fill={color} opacity={0.2 + rand() * 0.3} />
    );
  }

  return <>{els}</>;
}

function WaveArt({ seed, color }) {
  const rand = seededRandom(seed);
  const els = [];

  for (let i = 0; i < 28; i++) {
    const yBase = 30 + i * 68 + (rand() - 0.5) * 20;
    const amp = 30 + rand() * 80;
    const freq = 0.004 + rand() * 0.007;
    const phase = rand() * Math.PI * 2;
    const pts = [];
    for (let x = -40; x <= 1120; x += 5) {
      const y = yBase
        + Math.sin(x * freq + phase) * amp
        + Math.sin(x * freq * 2.7 + phase * 1.4) * amp * 0.5
        + Math.cos(x * freq * 0.5 + phase * 3) * amp * 0.3;
      pts.push(`${x},${y}`);
    }
    els.push(
      <polyline key={`w${i}`} points={pts.join(" ")} fill="none" stroke={color}
        strokeWidth={0.7 + rand() * 2} opacity={0.18 + rand() * 0.22} />
    );
  }

  for (let i = 0; i < 9; i++) {
    const cx = rand() * 1080, cy = rand() * 1600 + 200;
    for (let r = 0; r < 6; r++) {
      els.push(
        <circle key={`r${i}-${r}`} cx={cx} cy={cy}
          r={12 + r * (14 + rand() * 16)} fill="none" stroke={color}
          strokeWidth={0.5 + rand() * 1} opacity={0.15 + rand() * 0.22} />
      );
    }
  }

  for (let i = 0; i < 60; i++) {
    els.push(
      <circle key={`p${i}`} cx={rand() * 1080} cy={rand() * 1920}
        r={0.8 + rand() * 4} fill={color} opacity={0.18 + rand() * 0.3} />
    );
  }

  return <>{els}</>;
}

function MyceliumArt({ seed, color }) {
  const rand = seededRandom(seed);
  const els = [];
  let k = 0;

  function branch(x, y, angle, depth, maxDepth) {
    if (depth > maxDepth) return;
    const len = 45 + rand() * 110 - depth * 10;
    const nx = x + Math.cos(angle) * len;
    const ny = y + Math.sin(angle) * len;
    const sw = Math.max(0.4, 3 - depth * 0.42);
    const op = 0.2 + (1 - depth / maxDepth) * 0.3;
    els.push(
      <line key={`b${k++}`} x1={x} y1={y} x2={nx} y2={ny}
        stroke={color} strokeWidth={sw} opacity={op} strokeLinecap="round" />
    );
    if (depth > 0 && rand() > 0.25) {
      els.push(
        <circle key={`n${k++}`} cx={nx} cy={ny}
          r={1.5 + rand() * 6} fill={color} opacity={0.12 + rand() * 0.25} />
      );
    }
    const children = depth < 2 ? 2 + Math.floor(rand() * 2) : 1 + Math.floor(rand() * 2);
    for (let c = 0; c < children; c++) {
      branch(nx, ny, angle + (rand() - 0.5) * 1.2, depth + 1, maxDepth);
    }
  }

  for (let i = 0; i < 6; i++) {
    branch(rand() * 1080, rand() * 1200 + 200, -Math.PI / 2 + (rand() - 0.5) * 1.6, 0, 6);
  }

  for (let i = 0; i < 22; i++) {
    els.push(
      <circle key={`g${k++}`} cx={rand() * 1080} cy={rand() * 1600 + 200}
        r={12 + rand() * 40} fill={color} opacity={0.05 + rand() * 0.1} />
    );
  }

  return <>{els}</>;
}

// ─── Category config ───

const CATEGORY_CONFIG = {
  harmful_ingredient: { color: "#b5544a", Art: CrystalArt },
  harmful_habit: { color: "#c8a97e", Art: WaveArt },
  protective: { color: "#7a9a7e", Art: MyceliumArt },
};

// ─── Main component ───

export default function DailyCard({ card, isShared = false, style: containerStyle = {} }) {
  const { category, tag, insight, day, seed } = card;
  const cat = CATEGORY_CONFIG[category];
  const Art = cat.Art;
  const filterId = `glow-${seed}`;

  const art = useMemo(() => <Art seed={seed} color={cat.color} />, [seed, category]);

  return (
    <div
      className="daily-card"
      style={{
        width: "100%",
        maxWidth: 400,
        aspectRatio: "9 / 14",
        background: "#0e0d0c",
        borderRadius: 16,
        position: "relative",
        overflow: "hidden",
        fontFamily: "Georgia, 'Times New Roman', serif",
        boxShadow: "0 8px 48px rgba(0,0,0,0.7)",
        ...containerStyle,
      }}
    >
      {/* SVG art with glow layers */}
      <svg
        viewBox="0 0 1080 1920"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      >
        <defs>
          <filter id={`${filterId}-soft`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="16" />
          </filter>
          <filter id={`${filterId}-bloom`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="40" />
          </filter>
        </defs>
        <g filter={`url(#${filterId}-bloom)`} opacity="0.55">{art}</g>
        <g filter={`url(#${filterId}-soft)`} opacity="0.45">{art}</g>
        <g>{art}</g>
      </svg>

      {/* Colour atmosphere */}
      <div style={{
        position: "absolute", top: "12%", left: "50%", transform: "translate(-50%, -50%)",
        width: "65%", paddingBottom: "65%", borderRadius: "50%",
        background: `radial-gradient(circle, ${cat.color}22 0%, transparent 58%)`,
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-5%", left: "30%",
        width: "45%", paddingBottom: "45%", borderRadius: "50%",
        background: `radial-gradient(circle, ${cat.color}18 0%, transparent 55%)`,
        pointerEvents: "none",
      }} />

      {/* Text layer */}
      <div style={{
        position: "relative", zIndex: 1, height: "100%",
        display: "flex", flexDirection: "column",
        padding: "10% 7% 6%",
      }}>
        {/* Tag */}
        <div style={{
          fontSize: "clamp(9px, 2.5vw, 11px)",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: cat.color,
          textShadow: `0 0 12px ${cat.color}60`,
        }}>
          {tag}
        </div>
        <div style={{
          width: 24, height: 1.5, background: cat.color, opacity: 0.6,
          marginTop: "2.5%",
          boxShadow: `0 0 8px ${cat.color}40`,
        }} />

        <div style={{ flex: 1 }} />

        {/* Insight */}
        <div style={{
          color: "#e8ddd0",
          fontSize: "clamp(15px, 4.2vw, 20px)",
          lineHeight: 1.7,
          fontStyle: "italic",
          maxWidth: "85%",
          textShadow: "0 2px 24px rgba(14,13,12,1), 0 0 60px rgba(14,13,12,1), 0 0 100px rgba(14,13,12,0.9)",
        }}>
          {insight}
        </div>

        <div style={{ flex: 1.4 }} />

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{
            color: "#706560",
            fontSize: "clamp(9px, 2.5vw, 11px)",
            letterSpacing: "0.08em",
          }}>
            Noor · Day {day}
          </div>
          {isShared && (
            <div style={{
              color: "#706560",
              fontSize: "clamp(7px, 2vw, 9px)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              opacity: 0.45,
            }}>
              NourishMind
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
