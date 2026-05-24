import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { getGravityStatus } from '../utils/gravityLogic';
import GlassCard from '../components/UI/GlassCard';
import ScoreRing from '../components/UI/ScoreRing';
import ProgressBar from '../components/UI/ProgressBar';
import { useScore } from '../context/ScoreContext';

// Build dynamic breakdown bars from real log data
const buildBreakdown = (latestLog) => {
  if (!latestLog) return [];

  const { stressLevel = 0, sleepHours = 8, pendingAssignments = 0, socialMediaUsage = 0, studyHours = 0 } = latestLog;

  return [
    { label: 'Stress Impact',      value: Math.round(stressLevel * 10),                             color: '#ec4899' },
    { label: 'Sleep Deprivation',  value: Math.round(Math.max(0, 8 - sleepHours) * 12.5),           color: '#3b82f6' },
    { label: 'Task Pressure',      value: Math.min(Math.round(pendingAssignments * 20), 100),        color: '#f59e0b' },
    { label: 'Digital Overload',   value: Math.min(Math.round(socialMediaUsage * 20), 100),          color: '#10b981' },
    { label: 'Study Load',         value: Math.min(Math.round(studyHours * 6.25), 100),              color: '#8b5cf6' },
  ];
};

const GravityScorePage = () => {
  const [isCalculating, setIsCalculating] = useState(true);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const { latestLog } = useScore();

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setIsCalculating(false), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(timer);
  }, []);

  // ── New User Empty State ───────────────────────────────────────────────────
  if (!latestLog) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient Background Glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] opacity-20 animate-pulse-slow bg-accent-purple"
        />

        <div className="w-full max-w-md relative z-10 animate-slide-up">
          <GlassCard className="text-center p-8 border border-white/5 bg-dark-800/40 backdrop-blur-xl">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple/20 to-accent-blue/10 flex items-center justify-center mb-6 mx-auto shadow-glow-purple/20">
              <AlertCircle className="w-8 h-8 text-accent-purple animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-white mb-3">No Check-in Data Yet</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Please complete today's daily log first so that we can calculate your mental gravity score and stress breakdown metrics.
            </p>
            <button
              onClick={() => navigate('/daily-log')}
              className="w-full btn-primary py-4 flex items-center justify-center gap-2 group shadow-glow-purple"
            >
              <span>Go to Daily Log Check-in</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </GlassCard>
        </div>
      </div>
    );
  }

  const currentScore = latestLog.gravityScore !== undefined ? latestLog.gravityScore : latestLog.score;
  const status = getGravityStatus(currentScore);
  const breakdown = buildBreakdown(latestLog);

  if (isCalculating) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-8 animate-fade-in">
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 border-4 border-white/5 rounded-full" />
            <div
              className="absolute inset-0 border-4 border-accent-purple rounded-full border-t-transparent animate-spin"
              style={{ animationDuration: '1s' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-accent-purple animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Calculating Gravity</h2>
            <p className="text-gray-400">Analyzing your mental load factors...</p>
          </div>
          <ProgressBar value={progress} color="#8b5cf6" showValue={false} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] opacity-20 animate-pulse-slow"
        style={{ backgroundColor: status.strokeColor }}
      />

      <div className="w-full max-w-lg relative z-10 animate-slide-up">
        <GlassCard className="text-center p-8">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8">
            Your Mental Gravity
          </h2>

          <div className="flex justify-center mb-8 relative">
            <div
              className="absolute inset-0 rounded-full blur-3xl opacity-30"
              style={{ backgroundColor: status.strokeColor }}
            />
            <ScoreRing score={currentScore} size={200} strokeWidth={12} />
          </div>

          <div className="mb-8">
            <div className={`inline-flex items-center gap-2 px-6 py-2 rounded-full border border-white/10 ${status.bgClass} mb-4`}>
              <span className="text-xl">{status.emoji}</span>
              <span className={`text-lg font-bold ${status.colorClass}`}>{status.label}</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed max-w-sm mx-auto">
              {status.message}
            </p>
          </div>

          {/* Dynamic breakdown bars */}
          <div className="space-y-4 mb-8 text-left">
            <h3 className="text-sm font-semibold text-white border-b border-white/10 pb-2">Load Breakdown</h3>
            {breakdown.map((item, index) => (
              <div key={index} className="flex flex-col gap-1.5">
                <ProgressBar value={item.value} color={item.color} label={item.label} />
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full btn-primary py-4 flex items-center justify-center gap-2 group"
          >
            <span>View Full Dashboard</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </GlassCard>
      </div>
    </div>
  );
};

export default GravityScorePage;
