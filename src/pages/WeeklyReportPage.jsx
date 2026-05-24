import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Calendar,
  Award,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  Clock,
  BookOpen,
  GraduationCap,
  CalendarCheck,
  Trophy,
  CheckCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import GlassCard from '../components/UI/GlassCard';
import ChartCard from '../components/Cards/ChartCard';
import { useScore } from '../context/ScoreContext';
import { analyzeWeeklyProductivity, getWeeklyDateRange } from '../utils/weeklyReportAnalysis';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-700/90 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 shadow-card">
        <p className="text-xs text-gray-400 mb-2 font-medium">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            entry.value !== null && (
              <p key={index} className="text-sm font-semibold flex items-center justify-between gap-4" style={{ color: entry.color }}>
                <span>{entry.name}</span>
                <span>{entry.value}</span>
              </p>
            )
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const SectionEmptyState = ({ title, desc, actionText, onAction, icon: Icon }) => (
  <div className="flex flex-col items-center justify-center p-6 text-center h-full min-h-[160px]">
    {Icon && <Icon className="w-8 h-8 text-gray-500 mb-3" />}
    <p className="text-sm font-bold text-white mb-1">{title}</p>
    <p className="text-xs text-gray-400 max-w-[240px] mb-3 leading-relaxed">{desc}</p>
    {actionText && onAction && (
      <button
        onClick={onAction}
        className="text-xs font-semibold text-accent-purple hover:text-accent-blue transition-colors flex items-center gap-1"
      >
        {actionText} <ArrowRight className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
);

const WeeklyReportPage = () => {
  const navigate = useNavigate();
  const { logs, last7DaysTrend } = useScore();

  // Run the full analysis utility using current active logs and storage
  const report = analyzeWeeklyProductivity(logs || []);
  const range = getWeeklyDateRange();

  // Chart data: map real 7-day trend directly
  const chartData = last7DaysTrend.map((d) => ({
    day: d.day,
    score: d.hasData ? d.score : null,
    study: d.hasData ? d.study : null,
    sleep: d.hasData ? d.sleep : null,
  }));

  const overallStudy = report.totalStudyHours;
  const avgSleep = report.avgSleep;
  const avgStress = report.avgStress;
  const sessionsCount = report.focus.sessionsCount;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-accent-purple" />
            Weekly Productivity Report
          </h1>
          <p className="text-sm text-gray-400 mt-1 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-accent-blue" />
            Performance Review: {range.formatted}
          </p>
        </div>
        <button
          onClick={() => navigate('/daily-log')}
          className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5 self-start md:self-auto"
        >
          <CalendarCheck className="w-4 h-4" />
          Log Today's Check-in
        </button>
      </div>

      {/* Top 4 Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Study Hours',
            value: report.hasLogs ? `${overallStudy.toFixed(1)}h` : '— hrs',
            sub: report.hasLogs ? 'Logged study time' : 'No logs this week',
            color: 'text-accent-purple bg-accent-purple/5 border border-accent-purple/10',
            icon: BookOpen,
          },
          {
            label: 'Average Sleep',
            value: report.hasLogs ? `${avgSleep.toFixed(1)}h` : '— hrs',
            sub: report.hasLogs ? (avgSleep >= 7 ? 'Optimal sleep range' : 'Below recommended') : 'No sleep data',
            color: avgSleep >= 7 ? 'text-emerald-400 bg-emerald-500/5 border border-emerald-500/10' : 'text-amber-400 bg-amber-500/5 border border-amber-500/10',
            icon: Clock,
          },
          {
            label: 'Average Stress',
            value: report.hasLogs ? `${avgStress}/10` : '—/10',
            sub: report.hasLogs ? (avgStress <= 5 ? 'Stress well-managed' : 'Elevated stress levels') : 'No stress logged',
            color: avgStress <= 5 ? 'text-emerald-400 bg-emerald-500/5 border border-emerald-500/10' : 'text-red-400 bg-red-500/5 border border-red-500/10',
            icon: AlertTriangle,
          },
          {
            label: 'Focus Sessions',
            value: `${sessionsCount} session${sessionsCount === 1 ? '' : 's'}`,
            sub: report.focus.hasData ? `${report.focus.minutesCount} mins focused` : '0 mins focused',
            color: report.focus.hasData ? 'text-accent-blue bg-accent-blue/5 border border-accent-blue/10' : 'text-gray-400 bg-white/5 border border-white/5',
            icon: Trophy,
          },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className={`glass-card p-4 flex flex-col justify-between ${item.color}`}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-gray-400 font-medium">{item.label}</span>
                <Icon className="w-4 h-4 opacity-60" />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{item.value}</p>
                <p className="text-[10px] text-gray-500 mt-1 font-semibold">{item.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Core Breakdown: Trend Chart & Personalized Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend Chart (2 cols on wide) */}
        <div className="lg:col-span-2">
          <ChartCard title="Weekly Factor Breakdown" icon={BarChart3}>
            <div className="flex items-center justify-end gap-4 mb-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-accent-purple" />
                <span className="text-[10px] font-medium text-gray-400">Gravity Score</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-accent-blue" />
                <span className="text-[10px] font-medium text-gray-400">Study (h)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-accent-cyan" />
                <span className="text-[10px] font-medium text-gray-400">Sleep (h)</span>
              </div>
            </div>

            {!report.hasLogs ? (
              <div className="h-[300px] flex items-center justify-center bg-dark-800/20 border border-white/5 rounded-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-dark-900/50 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
                  <AlertCircle className="w-10 h-10 text-gray-500 mb-3" />
                  <h4 className="text-sm font-bold text-white mb-1">No Daily Log Data</h4>
                  <p className="text-xs text-gray-400 max-w-sm mb-4">
                    Complete daily check-ins to unlock your Gravity score, study, and sleep trend charts.
                  </p>
                  <button onClick={() => navigate('/daily-log')} className="btn-secondary text-xs px-4 py-2">
                    Start Checking In
                  </button>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} barGap={4} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="score" name="Gravity Score" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={16} />
                  <Bar dataKey="study" name="Study Hours"   fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={16} />
                  <Bar dataKey="sleep" name="Sleep Hours"   fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Personalized Suggestions (1 col on wide) */}
        <div className="flex flex-col justify-between">
          <GlassCard className="h-full border-accent-purple/20 flex flex-col p-5">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-accent-purple" />
              <h3 className="text-base font-bold text-white">Improvement Suggestions</h3>
            </div>
            
            <div className="flex-1 space-y-4">
              {report.suggestions.map((sug, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 hover:border-white/10 transition-all duration-300">
                  <h4 className="text-xs font-bold text-accent-purple flex items-center gap-1.5 mb-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {sug.title}
                  </h4>
                  <p className="text-[11px] text-gray-300 leading-relaxed font-medium">
                    {sug.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-white/5 pt-4 flex items-center justify-between">
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Weekly Gamification</span>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                ⭐ {report.achievements.unlockedCount} Badges Unlocked
              </span>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Grid of Subject Study Analysis & Feature Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Subjects Study Breakdown */}
        <GlassCard className="p-5 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
              <BookOpen className="w-4.5 h-4.5 text-accent-purple" />
              <h4 className="text-sm font-bold text-white">Subject Study Analysis</h4>
            </div>

            {!report.hasLogs ? (
              <SectionEmptyState
                title="No Study logs"
                desc="Log studied subjects in daily check-in to analyze subject focus."
                actionText="Log Today"
                onAction={() => navigate('/daily-log')}
                icon={BookOpen}
              />
            ) : (
              <div className="space-y-4 py-2">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-semibold">Most Studied Subject</p>
                  {report.mostStudiedSubject ? (
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-3 py-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{report.mostStudiedSubject}</span>
                      <span className="text-xs font-black text-emerald-400">{report.mostStudiedHours.toFixed(1)} hrs</span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No specific subject studied this week.</p>
                  )}
                </div>

                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 font-semibold">Neglected Subjects</p>
                  {report.ignoredSubjects.length > 0 ? (
                    <div className="space-y-2">
                      <div className="bg-red-500/5 border border-red-500/10 rounded-xl px-3 py-2.5 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-red-300">Ignored: {report.ignoredSubjects[0]}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Prioritize a small review block for this subject next week.</p>
                        </div>
                      </div>
                      {report.ignoredSubjects.length > 1 && (
                        <p className="text-[10px] text-gray-500 italic pl-1">
                          + {report.ignoredSubjects.length - 1} other subject{report.ignoredSubjects.length > 2 ? 's' : ''} not studied.
                        </p>
                      )}
                    </div>
                  ) : report.weakSubject ? (
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl px-3 py-2 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-amber-300">Neglected: {report.weakSubject}</span>
                      </div>
                      <span className="text-xs font-black text-amber-400">{report.weakSubjectHours.toFixed(1)}h</span>
                    </div>
                  ) : (
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-3 py-2 text-center text-xs text-emerald-400">
                      👍 All your subjects got study focus!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        {/* 2. Assignment Tracker Summary */}
        <GlassCard className="p-5 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
              <CheckCircle className="w-4.5 h-4.5 text-accent-blue" />
              <h4 className="text-sm font-bold text-white">Assignment Progress</h4>
            </div>

            {!report.assignments.hasData ? (
              <SectionEmptyState
                title="No Assignments Added"
                desc="Create custom assignment deadlines to review upcoming deliverables."
                actionText="Go to Assignments"
                onAction={() => navigate('/assignments')}
                icon={CheckCircle}
              />
            ) : (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/5 rounded-xl p-2.5 text-center">
                    <p className="text-lg font-bold text-white">{report.assignments.completed}</p>
                    <p className="text-[9px] text-gray-400 uppercase font-bold">Done</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2.5 text-center">
                    <p className="text-lg font-bold text-white">{report.assignments.pending}</p>
                    <p className="text-[9px] text-gray-400 uppercase font-bold">Pending</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/10 rounded-xl p-2.5 text-center animate-pulse">
                    <p className="text-lg font-bold text-red-400">{report.assignments.overdue}</p>
                    <p className="text-[9px] text-red-400 uppercase font-bold">Overdue</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-gray-500 font-semibold uppercase">Completion Rate</span>
                    <span className="text-xs font-bold text-white">
                      {report.assignments.total > 0 ? Math.round((report.assignments.completed / report.assignments.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-dark-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent-blue to-accent-cyan rounded-full transition-all duration-700"
                      style={{ width: `${report.assignments.total > 0 ? (report.assignments.completed / report.assignments.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          {report.assignments.hasData && (
            <button
              onClick={() => navigate('/assignments')}
              className="text-xs text-accent-blue hover:underline text-left mt-3 flex items-center gap-1 font-semibold"
            >
              Manage Assignments <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </GlassCard>

        {/* 3. Upcoming Exam Summary */}
        <GlassCard className="p-5 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
              <GraduationCap className="w-4.5 h-4.5 text-accent-cyan" />
              <h4 className="text-sm font-bold text-white">Exams Countdown</h4>
            </div>

            {!report.exams.hasData ? (
              <SectionEmptyState
                title="No Upcoming Exams"
                desc="Add upcoming exams to monitor calendars and syllabus readiness."
                actionText="Go to Exams"
                onAction={() => navigate('/exams')}
                icon={GraduationCap}
              />
            ) : (
              <div className="space-y-4 py-2">
                <div className="bg-accent-cyan/5 border border-accent-cyan/10 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-semibold">Active Upcoming Exams</span>
                  <span className="text-base font-black text-accent-cyan">{report.exams.upcomingCount}</span>
                </div>

                {report.exams.nearest && (
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-semibold">Nearest Exam</p>
                    <div className="bg-white/5 rounded-xl px-3 py-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate max-w-[140px]" title={report.exams.nearest.subject}>
                        {report.exams.nearest.subject}
                      </span>
                      <span className="text-[11px] font-bold text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded-md">
                        {report.exams.nearest.examDate}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {report.exams.hasData && (
            <button
              onClick={() => navigate('/exams')}
              className="text-xs text-accent-cyan hover:underline text-left mt-3 flex items-center gap-1 font-semibold"
            >
              Check Exam Countdown <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </GlassCard>

        {/* 4. Attendance Safety Alert */}
        <GlassCard className="p-5 flex flex-col justify-between h-full md:col-span-2 lg:col-span-3">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
              <CalendarCheck className="w-4.5 h-4.5 text-accent-purple" />
              <h4 className="text-sm font-bold text-white">Attendance Alerts</h4>
            </div>

            {!report.attendance.hasData ? (
              <SectionEmptyState
                title="No Attendance Logs"
                desc="Configure custom subjects in Attendance Tracker to ensure you keep above the 75% limit."
                actionText="Track Attendance"
                onAction={() => navigate('/attendance')}
                icon={CalendarCheck}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-2">
                <div className="md:col-span-1 bg-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                  <p className="text-sm text-gray-400 uppercase tracking-wider mb-1 font-semibold">Overall Attendance</p>
                  <p className={`text-4xl font-black ${report.attendance.overallPercent >= 75 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {report.attendance.overallPercent}%
                  </p>
                  <p className="text-[10px] text-gray-500 mt-2 font-semibold">Safety threshold is 75%</p>
                </div>

                <div className="md:col-span-2 space-y-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Subject Safety Logs</p>
                  {report.attendance.shortages.length > 0 ? (
                    <div className="space-y-2">
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-red-300">Attendance Shortage Alert</p>
                          <p className="text-[11px] text-gray-300 mt-1">
                            You are falling below 75% attendance in:
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {report.attendance.shortages.map((sh, idx) => (
                              <span key={idx} className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {sh.name} ({sh.pct}%)
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-400">All Subjects Safe</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Every tracked custom subject is currently above or equal to the 75% limit.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {report.attendance.hasData && (
            <button
              onClick={() => navigate('/attendance')}
              className="text-xs text-accent-purple hover:underline text-left mt-3 flex items-center gap-1 font-semibold"
            >
              View Attendance Details <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default WeeklyReportPage;
