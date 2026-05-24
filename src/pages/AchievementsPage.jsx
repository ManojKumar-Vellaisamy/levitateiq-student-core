import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Lock,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import GlassCard from '../components/UI/GlassCard';
import { useScore } from '../context/ScoreContext';
import { getPomodoroStats } from '../utils/pomodoroStorage';
import { generateAchievements, CATEGORIES } from '../utils/achievements';

// Category color mapping
const categoryColors = {
  Consistency: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', gradient: 'from-amber-500 to-orange-500' },
  Focus: { text: 'text-accent-purple', bg: 'bg-accent-purple/10', border: 'border-accent-purple/20', gradient: 'from-accent-purple to-accent-blue' },
  Sleep: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', gradient: 'from-blue-500 to-cyan-500' },
  Recovery: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', gradient: 'from-emerald-500 to-teal-500' },
  Balance: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', gradient: 'from-purple-500 to-pink-500' },
};

const AchievementsPage = () => {
  const navigate = useNavigate();
  const { logs } = useScore();
  const pomodoroStats = getPomodoroStats();

  const achievements = useMemo(
    () => generateAchievements(logs || [], pomodoroStats),
    [logs, pomodoroStats]
  );

  const totalUnlocked = achievements.filter((a) => a.unlocked).length;
  const totalBadges = achievements.length;

  // ── Empty State ───────────────────────────────────────────────────────────
  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <GlassCard className="max-w-md p-8 flex flex-col items-center border border-white/5 bg-dark-800/40 backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple/20 to-accent-blue/10 flex items-center justify-center mb-6 shadow-glow-purple/20">
            <AlertCircle className="w-8 h-8 text-accent-purple" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">No Achievements Yet</h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Complete daily check-ins to unlock achievements.
          </p>
          <button
            onClick={() => navigate('/daily-log')}
            className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 group shadow-glow-purple"
          >
            <span>Complete Today's Check-in</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Badges & Achievements</h2>
          <p className="text-xs text-gray-500">Stay consistent and earn rewards for your progress</p>
        </div>
      </div>

      {/* Stats Summary */}
      <GlassCard className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 opacity-20 rounded-full blur-3xl bg-amber-500" />
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Overall Progress Ring */}
          <div className="relative flex-shrink-0">
            <svg width={120} height={120} className="-rotate-90">
              <circle
                cx={60}
                cy={60}
                r={52}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth={8}
                fill="none"
              />
              <circle
                cx={60}
                cy={60}
                r={52}
                stroke="url(#achieveGradient)"
                strokeWidth={8}
                fill="none"
                strokeDasharray={52 * 2 * Math.PI}
                strokeDashoffset={
                  52 * 2 * Math.PI - (totalUnlocked / totalBadges) * 52 * 2 * Math.PI
                }
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="achieveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{totalUnlocked}</span>
              <span className="text-[10px] text-gray-500">of {totalBadges}</span>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-base font-bold text-white mb-1">
              {totalUnlocked === 0
                ? 'Start Your Journey!'
                : totalUnlocked === totalBadges
                  ? 'All Badges Unlocked! 🎉'
                  : `${totalUnlocked} Badge${totalUnlocked !== 1 ? 's' : ''} Unlocked`}
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              {totalUnlocked === 0
                ? 'Keep logging daily and using focus sessions to unlock your first badge.'
                : `You've unlocked ${Math.round((totalUnlocked / totalBadges) * 100)}% of all achievements. Keep going!`}
            </p>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2 mt-3">
              {CATEGORIES.map((cat) => {
                const count = achievements.filter((a) => a.category === cat && a.unlocked).length;
                const total = achievements.filter((a) => a.category === cat).length;
                const colors = categoryColors[cat];
                return (
                  <span
                    key={cat}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${colors.bg} ${colors.border} ${colors.text}`}
                  >
                    {cat} {count}/{total}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Badge Grid by Category */}
      {CATEGORIES.map((category) => {
        const categoryBadges = achievements.filter((a) => a.category === category);
        if (categoryBadges.length === 0) return null;
        const colors = categoryColors[category];

        return (
          <div key={category}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className={`w-4 h-4 ${colors.text}`} />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">{category}</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.border} border ${colors.text}`}>
                {categoryBadges.filter((b) => b.unlocked).length}/{categoryBadges.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryBadges.map((badge) => (
                <GlassCard
                  key={badge.id}
                  className={`relative overflow-hidden transition-all duration-300 ${
                    badge.unlocked
                      ? 'hover:border-white/15 hover:-translate-y-1 hover:shadow-lg'
                      : 'opacity-60 grayscale-[30%]'
                  }`}
                >
                  {/* Unlock glow */}
                  {badge.unlocked && (
                    <div
                      className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-15"
                      style={{
                        background: `linear-gradient(135deg, ${
                          category === 'Consistency' ? '#f59e0b' :
                          category === 'Focus' ? '#8b5cf6' :
                          category === 'Sleep' ? '#3b82f6' :
                          category === 'Recovery' ? '#10b981' : '#a855f7'
                        }, transparent)`,
                      }}
                    />
                  )}

                  <div className="flex items-start gap-3.5">
                    {/* Badge Icon */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border ${
                        badge.unlocked
                          ? `${colors.bg} ${colors.border}`
                          : 'bg-dark-800 border-white/5'
                      }`}
                    >
                      {badge.unlocked ? badge.icon : <Lock className="w-4 h-4 text-gray-600" />}
                    </div>

                    {/* Badge Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-bold ${badge.unlocked ? 'text-white' : 'text-gray-500'}`}>
                        {badge.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {badge.description}
                      </p>

                      {/* Progress Bar */}
                      <div className="mt-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-gray-600 font-semibold">
                            {badge.current}/{badge.maxProgress}
                          </span>
                          <span className={`text-[10px] font-bold ${badge.unlocked ? colors.text : 'text-gray-600'}`}>
                            {badge.progress}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-dark-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{
                              width: `${badge.progress}%`,
                              background: badge.unlocked
                                ? `linear-gradient(90deg, ${
                                    category === 'Consistency' ? '#f59e0b, #ea580c' :
                                    category === 'Focus' ? '#8b5cf6, #3b82f6' :
                                    category === 'Sleep' ? '#3b82f6, #06b6d4' :
                                    category === 'Recovery' ? '#10b981, #14b8a6' : '#a855f7, #ec4899'
                                  })`
                                : 'rgba(255,255,255,0.1)',
                            }}
                          />
                        </div>
                      </div>

                      {/* Unlock Date */}
                      {badge.unlocked && badge.unlockedAt && (
                        <p className="text-[10px] text-gray-600 mt-1.5 font-medium">
                          Unlocked {new Date(badge.unlockedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AchievementsPage;
