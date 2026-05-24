import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Moon,
  Activity,
  CheckCircle,
  TrendingUp,
  Flame,
  AlertCircle,
  ArrowRight,
  Timer,
  Play,
  Trophy,
  GraduationCap,
  CalendarCheck,
  Check,
  BarChart3,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import GlassCard from '../components/UI/GlassCard';
import ScoreCard from '../components/Cards/ScoreCard';
import InsightCard from '../components/Cards/InsightCard';
import StatCard from '../components/Cards/StatCard';
import ChartCard from '../components/Cards/ChartCard';
import { useScore } from '../context/ScoreContext';
import { generateBasicInsight } from '../utils/gravityLogic';
import { getTodayStats, getPomodoroStats } from '../utils/pomodoroStorage';
import { getLatestAchievement } from '../utils/achievements';
import { getNearestExam, countdownText, daysUntil, isExamSoon } from '../utils/examStorage';
import { getAttendanceSummary } from '../utils/attendanceStorage';
import { analyzeWeeklyProductivity } from '../utils/weeklyReportAnalysis';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-700/90 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 shadow-card">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        {payload[0].value !== null ? (
          <p className="text-lg font-bold text-white">{payload[0].value}</p>
        ) : (
          <p className="text-sm text-gray-500 italic">No log</p>
        )}
      </div>
    );
  }
  return null;
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { logs, latestLog, calculatedScore, streak, last7DaysTrend } = useScore();

  // ── Empty State ─────────────────────────────────────────────────────────────
  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <GlassCard className="max-w-md p-8 flex flex-col items-center border border-white/5 bg-dark-800/40 backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple/20 to-accent-blue/10 flex items-center justify-center mb-6 shadow-glow-purple/20">
            <AlertCircle className="w-8 h-8 text-accent-purple" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">No Daily Logs Yet</h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            No daily logs yet. Complete today’s check-in to see your insights.
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

  // ── Score & Insight ──────────────────────────────────────────────────────────
  const currentScore = latestLog ? (latestLog.gravityScore !== undefined ? latestLog.gravityScore : latestLog.score) : calculatedScore;
  const currentInsight = latestLog
    ? (latestLog.insight || generateBasicInsight(latestLog, currentScore))
    : '';

  // ── Quick Stats from latest log (no fallback to mock since logs exist) ────────
  const quickStats = [
    {
      label: 'Study Hours',
      value: `${latestLog.studyHours}h`,
      icon: BookOpen,
      trend: null,
      isPositiveGood: true,
    },
    {
      label: 'Sleep Hours',
      value: `${latestLog.sleepHours}h`,
      icon: Moon,
      trend: null,
      isPositiveGood: true,
    },
    {
      label: 'Stress Level',
      value: `${latestLog.stressLevel}/10`,
      icon: Activity,
      trend: null,
      isPositiveGood: false,
    },
    {
      label: 'Pending Tasks',
      value: `${latestLog.pendingAssignments}`,
      icon: CheckCircle,
      trend: null,
      isPositiveGood: false,
    },
  ];

  // ── 7-Day Trend chart data ────────────────────────────────────────────────────
  const trendData = last7DaysTrend.map((d) => ({
    day: d.day,
    score: d.hasData ? d.score : null,
  }));

  // ── Streak ────────────────────────────────────────────────────────────────────
  const currentStreak = streak;

  // Build this-week dot array (Mon–Sun) based on real log dates
  const weekDots = (() => {
    const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    // Map JS day (0=Sun) to Mon-first index
    return labels.map((label, i) => {
      const mondayFirst = (i + 1) % 7; // 1=Mon…0=Sun in JS
      const d = new Date();
      const dayOfWeek = d.getDay(); // 0=Sun
      const diff = mondayFirst - dayOfWeek;
      const targetDate = new Date(d);
      targetDate.setDate(d.getDate() + diff);
      const targetStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
      const hasLog = last7DaysTrend.find((t) => t.date === targetStr)?.hasData ?? false;
      return { label, hasLog };
    });
  })();

  const loggedThisWeek = weekDots.filter((d) => d.hasLog).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Section: Score & Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ScoreCard score={currentScore} className="lg:col-span-1" />

        <div className="lg:col-span-2 flex flex-col justify-center">
          <InsightCard
            insightText={currentInsight}
            tags={[
              { label: 'Pomodoro', colorClass: 'text-accent-purple bg-accent-purple/10 border-accent-purple/20' },
              { label: '3h Block', colorClass: 'text-accent-blue bg-accent-blue/10 border-accent-blue/20' },
            ]}
            className="h-full"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.label}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            isPositiveGood={stat.isPositiveGood}
          />
        ))}
      </div>

      {/* Bottom Section: Charts & Streaks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard
          title="Mental Gravity Trend"
          icon={TrendingUp}
          subtitle="Last 7 Days"
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#8b5cf6"
                strokeWidth={3}
                fill="url(#scoreGradient)"
                connectNulls={false}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4, stroke: '#1e1e32' }}
                activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Streak Card */}
        <GlassCard className="flex flex-col items-center justify-center text-center group transition-transform duration-300 hover:-translate-y-1 hover:border-amber-500/30 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <Flame className="w-8 h-8 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
          </div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-semibold">Current Logging Streak</p>
          <p className="text-5xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent mb-1 drop-shadow-md">
            {currentStreak}
          </p>
          <p className="text-sm text-gray-500">days in a row</p>

          <div className="mt-6 w-full">
            <div className="flex justify-between px-2 mb-2">
              <span className="text-xs text-gray-500 font-medium">This week</span>
              <span className="text-xs text-amber-400 font-bold">{loggedThisWeek}/7</span>
            </div>
            <div className="flex gap-1 justify-between w-full bg-dark-800 p-2 rounded-xl border border-white/5">
              {weekDots.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-gray-500">{d.label}</span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full ${
                      d.hasLog
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                        : 'bg-dark-600'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Interactive Quick Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Focus Session Widget */}
        {(() => {
          const pomStats = getTodayStats();
          const isDanger = currentScore > 80;
          return (
            <GlassCard
              hover
              onClick={() => !isDanger && navigate('/pomodoro')}
              className={`group transition-all duration-300 h-full ${
                isDanger ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-accent-purple/30'
              }`}
            >
              <div className="flex items-center justify-between h-full">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-purple/20 to-accent-blue/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Timer className="w-7 h-7 text-accent-purple" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Quick Focus Session</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {isDanger
                        ? 'Recovery recommended — mental load is too high'
                        : `${pomStats.completedSessions} sessions completed today · ${pomStats.totalMinutes} min focused`}
                    </p>
                  </div>
                </div>
                {!isDanger && (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-accent-purple to-accent-blue flex items-center justify-center group-hover:shadow-glow-purple transition-all duration-300 flex-shrink-0">
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  </div>
                )}
              </div>
            </GlassCard>
          );
        })()}

        {/* Latest Achievement Widget */}
        {(() => {
          const pomStats = getPomodoroStats();
          const latest = getLatestAchievement(logs, pomStats);
          return (
            <GlassCard
              hover
              onClick={() => navigate('/achievements')}
              className="group transition-all duration-300 cursor-pointer hover:border-amber-500/30 h-full"
            >
              <div className="flex items-center justify-between h-full">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    {latest ? (
                      <span className="text-2xl">{latest.icon}</span>
                    ) : (
                      <Trophy className="w-7 h-7 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Latest Achievement</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {latest
                        ? `Unlocked: ${latest.title} (${latest.category})`
                        : 'No achievements unlocked yet. View all badges.'}
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all duration-300 flex-shrink-0">
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
              </div>
            </GlassCard>
          );
        })()}

        {/* Upcoming Exam Widget */}
        {(() => {
          const nearestExam = getNearestExam();
          if (!nearestExam) return null;
          const days = daysUntil(nearestExam.examDate);
          const soon = isExamSoon(nearestExam.examDate, 3);
          const isToday = days === 0;
          const accentColor = isToday
            ? 'from-red-500/20 to-red-700/10'
            : soon
            ? 'from-amber-500/20 to-orange-500/10'
            : 'from-accent-blue/20 to-accent-cyan/10';
          const iconColor = isToday ? 'text-red-400' : soon ? 'text-amber-400' : 'text-accent-blue';
          const borderHover = isToday
            ? 'hover:border-red-500/30'
            : soon
            ? 'hover:border-amber-500/30'
            : 'hover:border-accent-blue/30';
          return (
            <GlassCard
              hover
              onClick={() => navigate('/exams')}
              className={`group transition-all duration-300 cursor-pointer ${borderHover} h-full`}
            >
              <div className="flex items-center justify-between h-full">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${accentColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                    <GraduationCap className={`w-7 h-7 ${iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white">Upcoming Exam</h3>
                    <p className={`text-xs font-semibold mt-0.5 ${iconColor}`}>
                      {nearestExam.subject} exam {countdownText(nearestExam.examDate)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      Prep: {nearestExam.prepStatus}
                    </p>
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${
                  isToday ? 'from-red-500 to-red-600' : soon ? 'from-amber-500 to-orange-500' : 'from-accent-blue to-accent-cyan'
                } flex items-center justify-center transition-all duration-300 flex-shrink-0`}>
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
              </div>
            </GlassCard>
          );
        })()}

        {/* Attendance Summary Widget */}
        {(() => {
          const summary = getAttendanceSummary();
          
          if (!summary.hasData) {
            // Empty state dashboard widget
            return (
              <GlassCard
                hover
                onClick={() => navigate('/attendance')}
                className="group transition-all duration-300 cursor-pointer hover:border-accent-purple/30 h-full"
              >
                <div className="flex items-center justify-between h-full">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-purple/20 to-accent-blue/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      <CalendarCheck className="w-7 h-7 text-accent-purple" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Attendance Summary</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        No attendance tracked yet. Click to add your first subject!
                      </p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-accent-purple to-accent-blue flex items-center justify-center group-hover:shadow-glow-purple transition-all duration-300 flex-shrink-0">
                    <ArrowRight className="w-5 h-5 text-white" />
                  </div>
                </div>
              </GlassCard>
            );
          }

          const isSafe = summary.overallPercent >= 75;
          const accentColor = isSafe
            ? 'from-emerald-500/20 to-emerald-700/10'
            : 'from-red-500/20 to-red-700/10';
          const iconColor = isSafe ? 'text-emerald-400' : 'text-red-400';
          const borderHover = isSafe ? 'hover:border-emerald-500/30' : 'hover:border-red-500/30';

          return (
            <GlassCard
              hover
              onClick={() => navigate('/attendance')}
              className={`group transition-all duration-300 cursor-pointer ${borderHover} h-full`}
            >
              <div className="flex items-center justify-between h-full">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${accentColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                    <CalendarCheck className={`w-7 h-7 ${iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white">Attendance Summary</h3>
                    <p className={`text-xs font-semibold mt-0.5 ${iconColor}`}>
                      Overall: {summary.overallPercent}% · {isSafe ? 'Safe' : 'Shortage Warning'}
                    </p>
                    {summary.lowestSubjectPercent < 75 ? (
                      <p className="text-xs text-red-400 mt-0.5 truncate font-medium">
                        ⚠️ Shortage warning: {summary.lowestSubjectName} ({summary.lowestSubjectPercent}%)
                      </p>
                    ) : (
                      <p className="text-xs text-emerald-400 mt-0.5 truncate font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> All subjects are safe
                      </p>
                    )}
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${
                  isSafe ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'
                } flex items-center justify-center transition-all duration-300 flex-shrink-0`}>
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
              </div>
            </GlassCard>
          );
        })()}

        {/* Weekly Productivity Snapshot Widget */}
        {(() => {
          const report = analyzeWeeklyProductivity(logs || []);
          
          if (!report.hasLogs) {
            // Insufficient weekly logs state
            return (
              <GlassCard
                hover
                onClick={() => navigate('/weekly-report')}
                className="group transition-all duration-300 cursor-pointer hover:border-accent-blue/30 h-full"
              >
                <div className="flex items-center justify-between h-full">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-blue/20 to-accent-cyan/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      <BarChart3 className="w-7 h-7 text-accent-blue" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Weekly Productivity Snapshot</h3>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed pr-4">
                        Complete more activity this week to generate your productivity snapshot.
                      </p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-accent-blue to-accent-cyan flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all duration-300 flex-shrink-0">
                    <ArrowRight className="w-5 h-5 text-white" />
                  </div>
                </div>
              </GlassCard>
            );
          }

          const hasOptimalScore = report.avgGravity <= 60;
          const statusText = hasOptimalScore ? 'Balanced' : 'Elevated Load';
          const iconColor = hasOptimalScore ? 'text-accent-purple' : 'text-amber-400';
          const borderHover = hasOptimalScore ? 'hover:border-accent-purple/30' : 'hover:border-amber-500/30';
          const accentColor = hasOptimalScore
            ? 'from-accent-purple/20 to-accent-blue/10'
            : 'from-amber-500/20 to-orange-500/10';

          return (
            <GlassCard
              hover
              onClick={() => navigate('/weekly-report')}
              className={`group transition-all duration-300 cursor-pointer ${borderHover} h-full`}
            >
              <div className="flex items-center justify-between h-full">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${accentColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                    <BarChart3 className={`w-7 h-7 ${iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white">Weekly Snapshot</h3>
                    <p className={`text-xs font-semibold mt-0.5 ${iconColor}`}>
                      Status: {statusText} (Gravity: {report.avgGravity})
                    </p>
                    <p className="text-xs text-gray-400 mt-1 font-medium">
                      Study: <span className="text-white font-bold">{report.totalStudyHours.toFixed(1)}h</span> · Sleep: <span className="text-white font-bold">{report.avgSleep.toFixed(1)}h</span> · Stress: <span className="text-white font-bold">{report.avgStress}/10</span>
                    </p>
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${
                  hasOptimalScore ? 'from-accent-purple to-accent-blue' : 'from-amber-500 to-orange-500'
                } flex items-center justify-center transition-all duration-300 flex-shrink-0`}>
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
              </div>
            </GlassCard>
          );
        })()}
      </div>
    </div>
  );
};

export default DashboardPage;
