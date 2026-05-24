import { useNavigate } from 'react-router-dom';
import { 
  Brain, Sparkles, Shield, AlertTriangle, Flame, Zap, 
  ArrowRight, Play, Moon, BookOpen, Heart, Activity 
} from 'lucide-react';
import GlassCard from '../UI/GlassCard';
import { useScore } from '../../context/ScoreContext';

// ── Mental Condition Config ──────────────────────────────────────────────────
const getMentalCondition = (score) => {
  if (score <= 30) {
    return {
      label: 'Stable',
      emoji: '🟢',
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/15 border-emerald-500/20',
      glowClass: 'shadow-[0_0_25px_rgba(16,185,129,0.15)] border-emerald-500/20 hover:border-emerald-500/40',
      icon: Shield,
      iconColor: 'text-emerald-400',
      bgIcon: 'bg-emerald-500/10'
    };
  }
  if (score <= 60) {
    return {
      label: 'Slight Overload',
      emoji: '🟡',
      colorClass: 'text-yellow-400',
      bgClass: 'bg-yellow-500/15 border-yellow-500/20',
      glowClass: 'shadow-[0_0_25px_rgba(234,179,8,0.15)] border-yellow-500/20 hover:border-yellow-500/40',
      icon: Activity,
      iconColor: 'text-yellow-400',
      bgIcon: 'bg-yellow-500/10'
    };
  }
  if (score <= 80) {
    return {
      label: 'High Pressure',
      emoji: '🟠',
      colorClass: 'text-orange-400',
      bgClass: 'bg-orange-500/15 border-orange-500/20',
      glowClass: 'shadow-[0_0_25px_rgba(249,115,22,0.15)] border-orange-500/20 hover:border-orange-500/40',
      icon: AlertTriangle,
      iconColor: 'text-orange-400',
      bgIcon: 'bg-orange-500/10'
    };
  }
  return {
    label: 'Burnout Risk',
    emoji: '🔴',
    colorClass: 'text-red-400',
    bgClass: 'bg-red-500/15 border-red-500/20',
    glowClass: 'shadow-[0_0_25px_rgba(239,68,68,0.15)] border-red-500/20 hover:border-red-500/40',
    icon: Flame,
    iconColor: 'text-red-400',
    bgIcon: 'bg-red-500/10'
  };
};

const InsightCard = ({ className = '' }) => {
  const navigate = useNavigate();
  const { logs, latestLog, calculatedScore } = useScore();

  if (!logs || logs.length === 0) return null;

  const activeLog = latestLog || logs[logs.length - 1];
  const score = activeLog ? (activeLog.gravityScore !== undefined ? activeLog.gravityScore : activeLog.score) : calculatedScore;
  const condition = getMentalCondition(score);

  // ── Dynamic Personalized Insight & Comparisons ──────────────────────────────────
  const generateAssistantInsight = () => {
    if (!activeLog) return 'Your mental load is balanced. Take short breaks to stay fresh.';

    let mainInsight;
    let comparisonStr = '';
    let supportMsg = '';

    // 1. Comparison logic with yesterday
    if (logs.length >= 2) {
      const prevLog = logs[logs.length - 2];
      
      const stressDiff = activeLog.stressLevel - prevLog.stressLevel;
      const stressPercent = Math.abs(stressDiff * 10);
      const stressComp = stressDiff > 0 
        ? `Stress increased ${stressPercent}% from yesterday. `
        : stressDiff < 0 
          ? `Stress decreased ${stressPercent}% from yesterday. `
          : '';

      const sleepDiff = activeLog.sleepHours - prevLog.sleepHours;
      const sleepComp = sleepDiff > 0
        ? `Sleep improved by ${sleepDiff}h from yesterday. `
        : sleepDiff < 0
          ? `Sleep dropped by ${Math.abs(sleepDiff)}h compared to yesterday. `
          : '';

      const studyDiff = activeLog.studyHours - prevLog.studyHours;
      const studyComp = studyDiff > 0
        ? `Study time increased by ${studyDiff}h today. `
        : studyDiff < 0
          ? `Study consistency decreased. `
          : '';

      comparisonStr = `${stressComp}${sleepComp}${studyComp}`;
    }

    // 2. Severe metrics warnings
    if (score >= 81) {
      mainInsight = 'Your mental load is extremely high. Prioritize your well-being, avoid all heavy tasks today, and focus on recovery.';
    } else if (activeLog.sleepHours < 5.5) {
      mainInsight = `Your sleep is critically low today (${activeLog.sleepHours}h). Lack of sleep impairs memory consolidation and cognitive resilience.`;
    } else if (activeLog.stressLevel >= 8) {
      mainInsight = 'Your stress level is very high. Consider pausing heavy academic work and using deep breathing or a walk to recalibrate.';
    } else if (score <= 30) {
      mainInsight = 'Excellent balance! You are in an optimal focus state with minimal mental friction. This is the perfect time to tackle complex subjects.';
    } else if (activeLog.studyHours > 7) {
      mainInsight = 'You have logged a very long study block today. Be careful of cognitive fatigue; step away from screens for a bit.';
    } else if (activeLog.socialMediaUsage > 4.5) {
      mainInsight = 'High screen time/digital footprint today. Screen-induced fatigue raises cognitive stress. Try a screen-free recovery window.';
    } else {
      mainInsight = 'Your mental gravity is perfectly balanced! Maintain your current routine and take regular short focus breaks.';
    }

    // 3. Subjects Studied dynamic addition (supports both array and legacy string)
    const subjects = (Array.isArray(activeLog.subjectsStudied) && activeLog.subjectsStudied.length > 0)
      ? activeLog.subjectsStudied
      : (activeLog.subjectStudied ? [activeLog.subjectStudied] : []);
    if (subjects.length === 1) {
      mainInsight += ` Great — you studied ${subjects[0]} today.`;
    } else if (subjects.length > 1) {
      const listed = subjects.slice(0, -1).join(', ') + ' and ' + subjects[subjects.length - 1];
      mainInsight += ` You covered ${subjects.length} subjects today: ${listed}. Excellent multi-subject effort!`;
    }

    // 4. Motivational Support for low productivity / high load
    if (activeLog.studyHours < 2) {
      supportMsg = ' Remember: Small progress is still progress. Consistency matters more than long hours.';
    } else if (score > 60) {
      supportMsg = ' Take care of yourself. Balancing academics and wellness is the real key to academic excellence.';
    }

    return {
      text: `${mainInsight} ${comparisonStr.trim()}`,
      support: supportMsg
    };
  };

  const insight = generateAssistantInsight();

  // ── Smart Action Buttons ────────────────────────────────────────────────────
  const getActionButtons = () => {
    if (score > 80) {
      return [
        {
          label: 'Take 15m Break',
          action: () => navigate('/pomodoro'),
          primary: true,
          icon: Heart
        },
        {
          label: 'Sleep Early Today',
          action: () => navigate('/daily-log'),
          primary: false,
          icon: Moon
        }
      ];
    }
    if (score > 60) {
      return [
        {
          label: 'Focus Mode',
          action: () => navigate('/pomodoro'),
          primary: true,
          icon: Play
        },
        {
          label: 'Revise Weak Subject',
          action: () => navigate('/ai-recommendations'),
          primary: false,
          icon: BookOpen
        }
      ];
    }
    if (score > 30) {
      return [
        {
          label: 'Open Study Planner',
          action: () => navigate('/ai-recommendations'),
          primary: true,
          icon: Brain
        },
        {
          label: 'Start Pomodoro',
          action: () => navigate('/pomodoro'),
          primary: false,
          icon: Play
        }
      ];
    }
    return [
      {
        label: 'Start Pomodoro',
        action: () => navigate('/pomodoro'),
        primary: true,
        icon: Play
      },
      {
        label: 'Focus Mode',
        action: () => navigate('/pomodoro'),
        primary: false,
        icon: Zap
      }
    ];
  };

  const buttons = getActionButtons();
  const IconComponent = condition.icon;

  return (
    <GlassCard className={`group transition-all duration-500 flex flex-col justify-between border ${condition.glowClass} ${className}`}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl bg-accent-purple/10 flex items-center justify-center flex-shrink-0`}>
              <Brain className="w-4 h-4 text-accent-purple" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide">AI Personal Assistant</h3>
            <Sparkles className="w-3.5 h-3.5 text-accent-purple animate-pulse" />
          </div>
          
          {/* Status Badge */}
          <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${condition.bgClass} ${condition.colorClass}`}>
            <span>{condition.emoji}</span>
            <span>{condition.label}</span>
          </span>
        </div>

        {/* Assistant Insight message */}
        <div className="flex items-start gap-4 mt-2">
          <div className={`w-10 h-10 rounded-xl ${condition.bgIcon} flex items-center justify-center flex-shrink-0 group-hover:scale-115 transition-transform duration-300`}>
            <IconComponent className={`w-5 h-5 ${condition.iconColor}`} />
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-gray-200 text-sm leading-relaxed font-medium">
              {insight.text}
            </p>
            {insight.support && (
              <p className="text-gray-400 text-xs italic leading-relaxed bg-white/5 px-3 py-2.5 rounded-xl border border-white/5 border-l-2 border-l-accent-purple/40">
                {insight.support}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Smart Actions Section */}
      <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap gap-3">
        {buttons.map((btn, idx) => {
          const BtnIcon = btn.icon;
          return (
            <button
              key={idx}
              onClick={btn.action}
              className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all duration-300 ${
                btn.primary
                  ? 'btn-primary shadow-glow-purple'
                  : 'btn-secondary text-gray-400 hover:text-white'
              }`}
            >
              <BtnIcon className="w-3.5 h-3.5" />
              <span>{btn.label}</span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
};

export default InsightCard;
