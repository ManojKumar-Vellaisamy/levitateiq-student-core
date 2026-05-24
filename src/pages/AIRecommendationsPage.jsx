import { useNavigate } from 'react-router-dom';
import {
  Target,
  Brain,
  Code,
  Sparkles,
  Zap,
  ArrowRight,
  Shield,
  AlertCircle,
  BookOpen,
  Moon,
  Smartphone,
  Activity,
  Heart,
  ListTodo,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Minus,
  Bell,
  Lightbulb,
} from 'lucide-react';
import { getAssignments, isOverdue, isDueSoon } from '../utils/assignmentStorage';
import { getUpcomingExams, daysUntil } from '../utils/examStorage';
import GlassCard from '../components/UI/GlassCard';
import { useScore } from '../context/ScoreContext';
import { generateBasicInsight, getGravityStatus } from '../utils/gravityLogic';
import { generateRecoveryPlan } from '../utils/recoveryPlan';
import { generateTaskPriority } from '../utils/taskPriority';
import { generateAllNotifications } from '../utils/notificationEngine';
import { generateSubjectStressAnalysis } from '../utils/subjectStressAnalysis';
import { generateBurnoutPrediction } from '../utils/burnoutPrediction';
import { generatePersonalizedInsights } from '../utils/personalizedInsights';

const priorityColors = {
  High: 'badge-red',
  Medium: 'badge-yellow',
  Low: 'badge-green',
};

const iconMap = {
  Target,
  Brain,
  Code,
};

// ── Severity config for insight cards ─────────────────────────
const severityConfig = {
  good: {
    border: 'border-emerald-500/25',
    gradientFrom: 'from-emerald-500/8',
    badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
    actionBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    dot: 'bg-emerald-400',
  },
  warning: {
    border: 'border-amber-500/25',
    gradientFrom: 'from-amber-500/8',
    badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
    actionBg: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
    dot: 'bg-amber-400',
  },
  danger: {
    border: 'border-red-500/30',
    gradientFrom: 'from-red-500/10',
    badge: 'bg-red-500/15 text-red-400 border border-red-500/25',
    actionBg: 'bg-red-500/10 border-red-500/20 text-red-300',
    dot: 'bg-red-400',
  },
  info: {
    border: 'border-blue-500/20',
    gradientFrom: 'from-blue-500/8',
    badge: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    actionBg: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
    dot: 'bg-blue-400',
  },
};

// ── Notification severity config ──────────────────────────────
const notifConfig = {
  danger: 'border-red-500/20 bg-red-500/5',
  warning: 'border-amber-500/20 bg-amber-500/5',
  info: 'border-blue-500/15 bg-blue-500/5',
  good: 'border-emerald-500/20 bg-emerald-500/5',
};

// ── InsightCard Component ─────────────────────────────────────
const InsightCard = ({ insight }) => {
  const cfg = severityConfig[insight.severity] || severityConfig.info;

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border ${cfg.border}
        bg-dark-700/60 backdrop-blur-xl
        flex flex-col gap-4 p-5
        transition-all duration-300
        hover:scale-[1.015] hover:shadow-lg hover:shadow-black/30
        group
      `}
    >
      {/* Soft gradient glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${cfg.gradientFrom} to-transparent opacity-70 pointer-events-none rounded-2xl`}
      />

      {/* Header row */}
      <div className="relative flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-2xl leading-none select-none">{insight.emoji}</span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.badge}`}>
            {insight.category}
          </span>
        </div>
        <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${cfg.dot} shadow-lg`} />
      </div>

      {/* Title */}
      <h4 className="relative text-base font-bold text-white leading-snug">
        {insight.title}
      </h4>

      {/* Message */}
      <p className="relative text-sm text-gray-300 leading-relaxed flex-1">
        {insight.message}
      </p>

      {/* Action suggestion */}
      <div
        className={`relative flex items-start gap-2.5 p-3 rounded-xl border ${cfg.actionBg}`}
      >
        <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-80" />
        <p className="text-sm font-medium leading-relaxed">{insight.action}</p>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────
const AIRecommendationsPage = () => {
  const navigate = useNavigate();
  const { logs, latestLog, calculatedScore } = useScore();

  // Dynamic focus tasks from real deliverables
  const focusToday = (() => {
    const list = [];

    const activeAssignments = getAssignments().filter((a) => a.status !== 'Completed');
    const overdue = activeAssignments.filter((a) => isOverdue(a.dueDate, a.status));
    const soon = activeAssignments.filter((a) => isDueSoon(a.dueDate, a.status, 3));

    if (overdue.length > 0) {
      list.push({
        title: overdue[0].title,
        priority: 'High',
        reason: `Overdue! Action required. Subject: ${overdue[0].subject}. Due date was ${overdue[0].dueDate}.`,
        icon: 'Target',
      });
    } else if (soon.length > 0) {
      list.push({
        title: soon[0].title,
        priority: 'High',
        reason: `Due soon on ${soon[0].dueDate}. Start writing your draft soon.`,
        icon: 'Target',
      });
    }

    const upcomingExams = getUpcomingExams();
    if (upcomingExams.length > 0) {
      const nearest = upcomingExams[0];
      const days = daysUntil(nearest.examDate);
      list.push({
        title: `Revise ${nearest.subject}`,
        priority: days <= 3 ? 'High' : 'Medium',
        reason: `Exam in ${days === 0 ? 'today!' : days === 1 ? 'tomorrow' : `${days} days`}. Preparation is currently: ${nearest.prepStatus}.`,
        icon: 'Brain',
      });
    }

    list.push({
      title: 'Practice Coding / Review',
      priority: 'Low',
      reason: 'Kickstart a 25-minute Pomodoro study block to sustain healthy productivity habits.',
      icon: 'Code',
    });

    return list.slice(0, 3);
  })();

  // ── Empty State ────────────────────────────────────────────
  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <GlassCard className="max-w-md p-8 flex flex-col items-center border border-white/5 bg-dark-800/40 backdrop-blur-xl">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-purple/20 to-accent-blue/10 flex items-center justify-center mb-6 shadow-glow-purple/20">
            <span className="text-4xl">🧠</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-3">No Insights Yet</h3>
          <p className="text-base text-gray-400 leading-relaxed mb-6">
            No insights yet. Add today's log to generate personalized insights based on your study hours, sleep, stress, and more.
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

  const score = latestLog
    ? latestLog.gravityScore !== undefined
      ? latestLog.gravityScore
      : latestLog.score
    : calculatedScore;
  const status = getGravityStatus(score);
  const dynamicInsight = latestLog
    ? latestLog.insight || generateBasicInsight(latestLog, score)
    : '';

  const plan = generateRecoveryPlan(latestLog);
  const prioritizedTasks = generateTaskPriority(latestLog);
  const forecast = generateBurnoutPrediction(logs);
  const subjectAnalysis = generateSubjectStressAnalysis(logs);
  const notifications = generateAllNotifications(logs);
  const personalizedInsights = generatePersonalizedInsights(logs);

  const recoveryCards = [
    {
      title: 'Study Plan',
      description: plan?.study,
      icon: BookOpen,
      iconColor: 'text-accent-purple',
      iconBg: 'bg-accent-purple/10 border-accent-purple/20',
    },
    {
      title: 'Sleep Plan',
      description: plan?.sleep,
      icon: Moon,
      iconColor: 'text-accent-blue',
      iconBg: 'bg-accent-blue/10 border-accent-blue/20',
    },
    {
      title: 'Stress Plan',
      description: plan?.stress,
      icon: Activity,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Digital Plan',
      description: plan?.socialMedia,
      icon: Smartphone,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      title: "Tomorrow's Focus",
      description: plan?.tomorrowFocus,
      icon: Heart,
      iconColor: 'text-rose-400',
      iconBg: 'bg-rose-500/10 border-rose-500/20',
      fullWidth: true,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center shadow-glow-purple/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">AI-Powered Insights</h2>
          <p className="text-sm text-gray-500">
            Personalized feedback and action items based on your daily logs
          </p>
        </div>
      </div>

      {/* ── Today's AI Analysis ─────────────────────────────── */}
      <GlassCard className="relative overflow-hidden">
        <div
          className={`absolute top-0 right-0 w-40 h-40 opacity-15 rounded-full blur-3xl ${
            status.colorClass === 'text-red-400'
              ? 'bg-red-500'
              : status.colorClass === 'text-amber-400'
              ? 'bg-amber-500'
              : 'bg-accent-purple'
          }`}
        />
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-purple/20 to-accent-blue/10 flex items-center justify-center flex-shrink-0">
            <Brain className="w-7 h-7 text-accent-purple animate-float" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-semibold text-white">
                Today's Mental Gravity Analysis
              </h3>
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <Zap className="w-3.5 h-3.5" />
                99% Focus Match
              </div>
            </div>
            <p className={`text-xl font-bold mt-2 mb-2 flex items-center gap-2 ${status.colorClass}`}>
              <span>{status.emoji}</span>
              <span>{status.label} (Score: {score})</span>
            </p>
            <p className="text-sm text-gray-300 leading-relaxed">{dynamicInsight}</p>
          </div>
        </div>
      </GlassCard>

      {/* ── AI Insights — Categorized Cards ─────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-5 h-5 text-accent-purple" />
          <h3 className="text-base font-semibold text-white">AI Insights</h3>
          <span className="text-xs text-gray-500 bg-dark-700 px-2.5 py-0.5 rounded-full border border-white/5 font-medium">
            Personalized
          </span>
        </div>

        {personalizedInsights.length === 0 ? (
          <GlassCard className="p-6 border border-white/5 bg-dark-800/40 backdrop-blur-xl">
            <div className="flex flex-col items-center justify-center text-center py-4">
              <span className="text-4xl mb-3">🧠</span>
              <p className="text-base text-gray-300 font-medium">No insights yet.</p>
              <p className="text-sm text-gray-500 mt-1">
                Add today's log to generate personalized insights.
              </p>
            </div>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {personalizedInsights.map((insight, idx) => (
              <InsightCard key={idx} insight={insight} />
            ))}
          </div>
        )}
      </div>

      {/* ── Suggested Focus Tasks ────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-accent-purple" />
          <h3 className="text-base font-semibold text-white">Suggested Focus Tasks</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {focusToday.map((task, index) => {
            const Icon = iconMap[task.icon] || Target;
            return (
              <GlassCard
                key={index}
                hover
                className="flex flex-col justify-between h-full hover:border-accent-purple/30 transition-all duration-300"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-dark-700 border border-white/5 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-accent-purple" />
                    </div>
                    <span className={priorityColors[task.priority]}>{task.priority}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{task.title}</h4>
                    <p className="text-sm text-gray-400 mt-1 leading-relaxed">{task.reason}</p>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* ── Personalized Recovery Plan ───────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-accent-purple" />
          <h3 className="text-base font-semibold text-white">
            Personalized Recovery Plan:{' '}
            <span className={status.colorClass}>{plan?.planName}</span>
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recoveryCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <GlassCard
                key={index}
                className={`flex flex-col gap-3 relative overflow-hidden transition-all duration-300 hover:border-white/10 ${
                  card.fullWidth ? 'md:col-span-2' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center ${card.iconBg}`}
                  >
                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                  <h4 className="text-sm font-semibold text-white">{card.title}</h4>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed font-medium">
                  {card.description}
                </p>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* ── Today's Task Priority ────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ListTodo className="w-5 h-5 text-accent-purple" />
          <h3 className="text-base font-semibold text-white">Today's Task Priority</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prioritizedTasks.map((task) => {
            const diffColor =
              task.difficulty === 'Hard'
                ? 'badge-red'
                : task.difficulty === 'Medium'
                ? 'badge-yellow'
                : 'badge-green';

            return (
              <GlassCard
                key={task.priority}
                className="flex flex-col justify-between gap-4 relative overflow-hidden transition-all duration-300 hover:border-white/10"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-accent-purple bg-accent-purple/10 border border-accent-purple/20 px-2.5 py-1 rounded-lg">
                      Priority #{task.priority}
                    </span>
                    <span className={diffColor}>{task.difficulty}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-snug">{task.title}</h4>
                    <p className="text-sm text-gray-400 mt-2 leading-relaxed">{task.reason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 bg-dark-800 p-2.5 rounded-xl border border-white/5 w-fit">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                    Suggested Duration:
                  </span>
                  <span className="text-white">{task.duration}</span>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* ── Smart Notifications ──────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-accent-purple" />
          <h3 className="text-base font-semibold text-white">Smart Notifications</h3>
        </div>
        {notifications.length === 0 ? (
          <GlassCard className="p-6 border border-white/5 bg-dark-800/40 backdrop-blur-xl">
            <p className="text-sm text-gray-400">
              No notifications at this time. Keep logging daily to receive insights.
            </p>
          </GlassCard>
        ) : (
          <div className="flex flex-col gap-3">
            {notifications.map((note, idx) => {
              const cfg = notifConfig[note.severity] || notifConfig.info;
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3.5 p-4 rounded-2xl border ${cfg} backdrop-blur-sm transition-all duration-200 hover:brightness-110`}
                >
                  <span className="text-xl leading-none flex-shrink-0 mt-0.5 select-none">
                    {note.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                      <span>{note.title}</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">
                        · {note.category}
                      </span>
                    </p>
                    <p className="text-sm text-gray-300 leading-relaxed font-medium">
                      {note.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Burnout Forecast ─────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert className="w-5 h-5 text-accent-purple" />
          <h3 className="text-base font-semibold text-white">Burnout Forecast</h3>
        </div>

        {forecast.insufficient ? (
          <GlassCard className="p-6 border border-white/5 bg-dark-800/40 backdrop-blur-xl">
            <div className="flex flex-col items-center justify-center text-center p-4">
              <AlertCircle className="w-8 h-8 text-gray-500 mb-3" />
              <p className="text-base text-gray-300 font-medium leading-relaxed">
                More daily logs are needed to generate a burnout forecast.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Please complete at least 3 daily check-ins to unlock this analysis.
              </p>
            </div>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Level & Explanation */}
            <GlassCard className="lg:col-span-2 flex flex-col justify-between gap-5 hover:border-white/10 transition-all duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-base font-semibold text-white">Current Burnout Risk</h4>
                  <span
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${forecast.bgClass} ${forecast.colorClass}`}
                  >
                    <span>{forecast.emoji}</span>
                    <span>{forecast.level}</span>
                  </span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed font-medium">
                  {forecast.reason}
                </p>
              </div>

              {/* Prevention Tips */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Prevention Tips:
                </h5>
                <ul className="space-y-2">
                  {forecast.preventionTips.map((tip, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-gray-300 flex items-start gap-2 font-medium"
                    >
                      <span className="text-accent-purple font-bold mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </GlassCard>

            {/* Trends & Recommendations */}
            <div className="space-y-4 lg:col-span-1">
              {/* Trends Card */}
              <GlassCard className="p-4 flex flex-col gap-3 hover:border-white/10 transition-all duration-300">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  7-Day Factor Trends
                </h4>
                <div className="space-y-3">
                  {/* Gravity Score Trend */}
                  <div className="flex items-center justify-between text-sm py-1 border-b border-white/5">
                    <span className="text-gray-400 font-medium">Gravity Score</span>
                    <div className="flex items-center gap-1.5 font-bold">
                      {forecast.metrics.scoreTrend === 'up' && (
                        <TrendingUp className="w-4 h-4 text-red-400" />
                      )}
                      {forecast.metrics.scoreTrend === 'down' && (
                        <TrendingDown className="w-4 h-4 text-emerald-400" />
                      )}
                      {forecast.metrics.scoreTrend === 'stable' && (
                        <Minus className="w-4 h-4 text-gray-500" />
                      )}
                      <span
                        className={
                          forecast.metrics.scoreTrend === 'up'
                            ? 'text-red-400'
                            : forecast.metrics.scoreTrend === 'down'
                            ? 'text-emerald-400'
                            : 'text-gray-400'
                        }
                      >
                        {forecast.metrics.scoreChange > 0
                          ? `+${forecast.metrics.scoreChange}`
                          : forecast.metrics.scoreChange}
                      </span>
                    </div>
                  </div>

                  {/* Sleep Trend */}
                  <div className="flex items-center justify-between text-sm py-1 border-b border-white/5">
                    <span className="text-gray-400 font-medium">Sleep Hours</span>
                    <div className="flex items-center gap-1.5 font-bold">
                      {forecast.metrics.sleepTrend === 'up' && (
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      )}
                      {forecast.metrics.sleepTrend === 'down' && (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                      {forecast.metrics.sleepTrend === 'stable' && (
                        <Minus className="w-4 h-4 text-gray-500" />
                      )}
                      <span
                        className={
                          forecast.metrics.sleepTrend === 'up'
                            ? 'text-emerald-400'
                            : forecast.metrics.sleepTrend === 'down'
                            ? 'text-red-400'
                            : 'text-gray-400'
                        }
                      >
                        {forecast.metrics.sleepChange > 0
                          ? `+${forecast.metrics.sleepChange}h`
                          : `${forecast.metrics.sleepChange}h`}
                      </span>
                    </div>
                  </div>

                  {/* Stress Trend */}
                  <div className="flex items-center justify-between text-sm py-1">
                    <span className="text-gray-400 font-medium">Stress Level</span>
                    <div className="flex items-center gap-1.5 font-bold">
                      {forecast.metrics.stressTrend === 'up' && (
                        <TrendingUp className="w-4 h-4 text-red-400" />
                      )}
                      {forecast.metrics.stressTrend === 'down' && (
                        <TrendingDown className="w-4 h-4 text-emerald-400" />
                      )}
                      {forecast.metrics.stressTrend === 'stable' && (
                        <Minus className="w-4 h-4 text-gray-500" />
                      )}
                      <span
                        className={
                          forecast.metrics.stressTrend === 'up'
                            ? 'text-red-400'
                            : forecast.metrics.stressTrend === 'down'
                            ? 'text-emerald-400'
                            : 'text-gray-400'
                        }
                      >
                        {forecast.metrics.stressChange > 0
                          ? `+${forecast.metrics.stressChange}`
                          : forecast.metrics.stressChange}
                      </span>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Next 3 Days Action */}
              <GlassCard className="p-4 border-accent-purple/20 bg-accent-purple/5 hover:border-accent-purple/30 transition-all duration-300">
                <h4 className="text-xs font-bold text-accent-purple uppercase tracking-wider mb-2">
                  Next 3 Days Action
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed font-medium">
                  {forecast.recommendations3Days}
                </p>
              </GlassCard>
            </div>
          </div>
        )}
      </div>

      {/* ── Subject Stress Analysis ──────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-accent-purple" />
          <h3 className="text-base font-semibold text-white">Subject Stress Analysis</h3>
        </div>
        {subjectAnalysis.insufficient ? (
          <GlassCard className="p-6 border border-white/5 bg-dark-800/40 backdrop-blur-xl">
            <div className="flex flex-col items-center justify-center text-center p-4">
              <AlertCircle className="w-8 h-8 text-gray-500 mb-3" />
              <p className="text-base text-gray-300 font-medium leading-relaxed">
                Not enough subject data to generate analysis.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Please log subjects for at least 2 days.
              </p>
            </div>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="flex flex-col justify-between gap-5 hover:border-white/10 transition-all duration-300">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">
                    Highest Load Subject
                  </h4>
                  <p className="text-sm text-gray-300">
                    {subjectAnalysis.highest.subject}{' '}
                    <span className="text-gray-500">
                      (Avg Score: {subjectAnalysis.highest.avgScore})
                    </span>
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">
                    Lowest Load Subject
                  </h4>
                  <p className="text-sm text-gray-300">
                    {subjectAnalysis.lowest.subject}{' '}
                    <span className="text-gray-500">
                      (Avg Score: {subjectAnalysis.lowest.avgScore})
                    </span>
                  </p>
                </div>
              </div>
            </GlassCard>
            <GlassCard className="p-4 border-accent-purple/20 bg-accent-purple/5 hover:border-accent-purple/30 transition-all duration-300">
              <h4 className="text-xs font-bold text-accent-purple uppercase tracking-wider mb-3">
                Recommendation
              </h4>
              <p className="text-sm text-gray-300 leading-relaxed font-medium">
                {subjectAnalysis.recommendation}
              </p>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRecommendationsPage;
