import GlassCard from '../UI/GlassCard';
import ScoreRing from '../UI/ScoreRing';
import { getGravityStatus } from '../../utils/gravityLogic';

const ScoreCard = ({ score, title = "Today's Gravity Score", className = '' }) => {
  const status = getGravityStatus(score);

  return (
    <GlassCard className={`flex flex-col items-center justify-center text-center ${className}`}>
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-4 font-semibold">{title}</p>
      
      <div className="relative group cursor-pointer transition-transform duration-300 hover:scale-105">
        {/* Glow effect behind the ring */}
        <div 
          className="absolute inset-0 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300"
          style={{ backgroundColor: status.strokeColor }}
        />
        <ScoreRing score={score} size={150} strokeWidth={10} />
      </div>

      <div className="mt-6 flex flex-col items-center gap-2">
        <span className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 ${status.colorClass} ${status.bgClass} border border-current/20`}>
          <span>{status.emoji}</span>
          {status.label}
        </span>
      </div>
    </GlassCard>
  );
};

export default ScoreCard;
