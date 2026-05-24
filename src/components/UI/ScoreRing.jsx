import { getGravityStatus } from '../../utils/gravityLogic';

const ScoreRing = ({ score, size = 160, strokeWidth = 10, label = 'Score' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // Offset formula for SVG circle
  const offset = circumference - (score / 100) * circumference;

  const status = getGravityStatus(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90 drop-shadow-lg">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#scoreGradient-${score})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 8px ${status.strokeColor}80)` }}
        />
        <defs>
          <linearGradient id={`scoreGradient-${score}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={status.strokeColor} />
            <stop offset="100%" stopColor={status.strokeColor} stopOpacity={0.6} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-5xl font-black tracking-tighter ${status.colorClass} drop-shadow-md`}>{score}</span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{label}</span>
      </div>
    </div>
  );
};

export default ScoreRing;
