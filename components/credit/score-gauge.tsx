"use client"

import { getScoreTier } from "@/lib/credit-utils"

interface ScoreGaugeProps {
  score: number // 300-850
}

const TIER_HEX: Record<string, string> = {
  Red: "#ef4444",
  Yellow: "#eab308",
  Green: "#22c55e",
  "Bright Green": "#4ade80",
}

export function ScoreGauge({ score }: ScoreGaugeProps) {
  const { tier, color } = getScoreTier(score)
  const hex = TIER_HEX[color] ?? "#ef4444"

  // Map score 300–850 to 0–1 for the arc
  const clamped = Math.max(300, Math.min(850, score))
  const pct = (clamped - 300) / (850 - 300)

  // SVG arc: 180° sweep from left to right
  const radius = 70
  const cx = 80
  const cy = 80
  const startAngle = Math.PI // left
  const endAngle = startAngle - Math.PI * pct // clockwise sweep

  const bgArcD = describeArc(cx, cy, radius, Math.PI, 0)
  const arcD = describeArc(cx, cy, radius, startAngle, endAngle)

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={160} height={100} viewBox="0 0 160 100" aria-label={`Credit score ${score}, ${tier}`}>
        {/* background track */}
        <path d={bgArcD} fill="none" stroke="currentColor" strokeWidth={10} className="text-white/10" strokeLinecap="round" />
        {/* colored arc */}
        <path d={arcD} fill="none" stroke={hex} strokeWidth={10} strokeLinecap="round" />
        {/* score number */}
        <text x={cx} y={78} textAnchor="middle" fill={hex} fontSize={28} fontFamily="monospace" fontWeight={700}>
          {score}
        </text>
      </svg>
      <span className="text-xs font-mono uppercase tracking-widest" style={{ color: hex }}>
        {tier}
      </span>
    </div>
  )
}

/** Build an SVG arc path from startAngle to endAngle (radians, 0 = right, PI = left). */
function describeArc(cx: number, cy: number, r: number, start: number, end: number): string {
  const x1 = cx + r * Math.cos(start)
  const y1 = cy - r * Math.sin(start)
  const x2 = cx + r * Math.cos(end)
  const y2 = cy - r * Math.sin(end)
  const sweep = start - end > Math.PI ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${sweep} 0 ${x2} ${y2}`
}

export default ScoreGauge
