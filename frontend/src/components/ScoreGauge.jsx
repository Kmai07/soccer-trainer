import './ScoreGauge.css'

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function getScoreColor(score) {
  if (score <= 40) return '#ef4444'
  if (score <= 70) return '#eab308'
  return '#22c55e'
}

export default function ScoreGauge({ score = 0 }) {
  const clampedScore = Math.min(100, Math.max(0, score))
  const offset = CIRCUMFERENCE - (clampedScore / 100) * CIRCUMFERENCE
  const color = getScoreColor(clampedScore)

  return (
    <div className="score-gauge">
      <svg className="score-gauge__svg" viewBox="0 0 140 140" aria-hidden="true">
        <circle
          className="score-gauge__track"
          cx="70"
          cy="70"
          r={RADIUS}
          fill="none"
          strokeWidth="10"
        />
        <circle
          className="score-gauge__fill"
          cx="70"
          cy="70"
          r={RADIUS}
          fill="none"
          strokeWidth="10"
          stroke={color}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
        />
      </svg>
      <div className="score-gauge__label">
        <span className="score-gauge__value" style={{ color }}>{clampedScore}</span>
        <span className="score-gauge__unit">/ 100</span>
      </div>
    </div>
  )
}
