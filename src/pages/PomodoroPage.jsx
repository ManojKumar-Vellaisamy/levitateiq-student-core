import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Brain,
  Zap,
  Timer,
  Volume2,
  VolumeX,
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  Target,
  Sparkles,
  Settings,
  Info,
} from 'lucide-react';
import GlassCard from '../components/UI/GlassCard';
import { useScore } from '../context/ScoreContext';
import { getGravityStatus } from '../utils/gravityLogic';
import { getTodayStats, recordCompletedSession } from '../utils/pomodoroStorage';

// ── Timer Modes ─────────────────────────────────────────────────────────────
const MODES = {
  focus: { label: 'Focus Session', defaultMinutes: 25, icon: Brain, color: '#8b5cf6', bgClass: 'from-accent-purple to-accent-blue' },
  shortBreak: { label: 'Short Break', defaultMinutes: 5, icon: Coffee, color: '#10b981', bgClass: 'from-emerald-500 to-teal-500' },
  longBreak: { label: 'Long Break', defaultMinutes: 15, icon: Zap, color: '#3b82f6', bgClass: 'from-blue-500 to-cyan-500' },
};

// ── Smart Duration mapping based on Gravity Score ────────────────────────────
const getRecommendation = (score) => {
  if (score === null || score === undefined) {
    return {
      focus: 25,
      break: 5,
      longBreak: 15,
      label: 'Balanced State',
      text: 'Suggest 25 min focus + 5 min break',
      icon: '⚖️',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    };
  }
  if (score <= 30) {
    return {
      focus: 50,
      break: 10,
      longBreak: 15,
      label: 'Zero Gravity',
      text: 'Suggest 50 min deep focus + 10 min break',
      icon: '🚀',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    };
  }
  if (score <= 60) {
    return {
      focus: 25,
      break: 5,
      longBreak: 15,
      label: 'Medium Gravity',
      text: 'Suggest 25 min focus + 5 min break',
      icon: '⚖️',
      color: 'text-accent-blue',
      bg: 'bg-accent-blue/10',
      border: 'border-accent-blue/20',
    };
  }
  if (score <= 80) {
    return {
      focus: 20,
      break: 10,
      longBreak: 15,
      label: 'High Gravity',
      text: 'Suggest 20 min focus + 10 min break',
      icon: '🏋️',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    };
  }
  return {
    focus: 10,
    break: 15,
    longBreak: 20,
    label: 'Danger Zone',
    text: 'Suggest 10 min light review + 15 min recovery break',
    icon: '🚨',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  };
};

// ── Web Audio Synth Generator (Lightweight & Self-contained) ────────────────
const playNotificationSound = (type, enabled) => {
  if (!enabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    if (type === 'focus') {
      // Focus Completed: Uplifting chime notes
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);

      // Delayed high second beep
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6 note
        osc2.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.2);

        gain2.gain.setValueAtTime(0.15, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.4);
      }, 150);
    } else {
      // Break Completed: Soothing bell chord
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4 note
      osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    }
  } catch (error) {
    console.warn('Audio synthesis failed:', error);
  }
};

const PomodoroPage = () => {
  const navigate = useNavigate();
  const { logs, latestLog, calculatedScore } = useScore();

  // ── Score & Recommendation Context ────────────────────────────────────────
  const hasLogs = logs && logs.length > 0;
  const score = hasLogs && latestLog
    ? (latestLog.gravityScore !== undefined ? latestLog.gravityScore : latestLog.score)
    : calculatedScore;
  const status = hasLogs ? getGravityStatus(score) : null;
  const recommendation = useMemo(() => getRecommendation(score), [score]);

  // ── Custom Settings Initializer ───────────────────────────────────────────
  const initialCustomSettings = useMemo(() => {
    try {
      const saved = localStorage.getItem('levitateiq_custom_pomodoro');
      return saved ? JSON.parse(saved) : { focus: 30, shortBreak: 5, longBreak: 15 };
    } catch {
      return { focus: 30, shortBreak: 5, longBreak: 15 };
    }
  }, []);

  // ── States ────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState('focus');
  const [timerProfile, setTimerProfile] = useState('default'); // 'default' | 'custom' | 'recommended'
  const [customSettings, setCustomSettings] = useState(initialCustomSettings);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [todayStats, setTodayStats] = useState(getTodayStats());
  const [toastMessage, setToastMessage] = useState('');
  const [isPulsing, setIsPulsing] = useState(false);
  const [audioAutoplayBlocked, setAudioAutoplayBlocked] = useState(false);

  // Form Inputs
  const [focusInput, setFocusInput] = useState(initialCustomSettings.focus);
  const [shortBreakInput, setShortBreakInput] = useState(initialCustomSettings.shortBreak);
  const [longBreakInput, setLongBreakInput] = useState(initialCustomSettings.longBreak);
  const [validationErrors, setValidationErrors] = useState({});

  // Timer Countdown State
  const [timeLeft, setTimeLeft] = useState(MODES.focus.defaultMinutes * 60);

  const intervalRef = useRef(null);

  // ── Autoplay Blocking Detection & Fallback Logic ──────────────────────────
  useEffect(() => {
    const checkAutoplay = () => {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') {
          setAudioAutoplayBlocked(true);
        }
        ctx.close();
      }
    };
    checkAutoplay();

    const resumeContext = () => {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') {
          ctx.resume().then(() => {
            setAudioAutoplayBlocked(false);
          });
        } else {
          setAudioAutoplayBlocked(false);
        }
        ctx.close();
      }
      window.removeEventListener('click', resumeContext);
      window.removeEventListener('keydown', resumeContext);
    };

    window.addEventListener('click', resumeContext);
    window.addEventListener('keydown', resumeContext);

    return () => {
      window.removeEventListener('click', resumeContext);
      window.removeEventListener('keydown', resumeContext);
    };
  }, []);

  // Get active duration dynamically for the current profile & mode
  const getActiveDuration = useCallback((profile, activeMode) => {
    if (profile === 'custom') {
      if (activeMode === 'focus') return customSettings.focus;
      if (activeMode === 'shortBreak') return customSettings.shortBreak;
      return customSettings.longBreak;
    }
    if (profile === 'recommended') {
      if (activeMode === 'focus') return recommendation.focus;
      if (activeMode === 'shortBreak') return recommendation.break;
      return recommendation.longBreak;
    }
    // default
    if (activeMode === 'focus') return MODES.focus.defaultMinutes;
    if (activeMode === 'shortBreak') return MODES.shortBreak.defaultMinutes;
    return MODES.longBreak.defaultMinutes;
  }, [customSettings, recommendation]);

  // Sync timer countdown when profile, mode or settings change
  // ── Mode Switch ───────────────────────────────────────────────────────────
  const switchMode = useCallback((newMode) => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setMode(newMode);
    const mins = getActiveDuration(timerProfile, newMode);
    setTimeLeft(mins * 60);
  }, [timerProfile, getActiveDuration]);

  // ── Timer Logic Loop ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);

            // Play Synth audio and trigger visual pulse
            playNotificationSound(mode, soundEnabled);
            setIsPulsing(true);
            setTimeout(() => setIsPulsing(false), 5000);

            // Record completed sessions & completion message toasts
            if (mode === 'focus') {
              const duration = getActiveDuration(timerProfile, 'focus');
              recordCompletedSession(duration);
              setTodayStats(getTodayStats());
              setSessionsCompleted((prev) => prev + 1);
              setToastMessage('Focus session completed! Great job!');
            } else {
              setToastMessage('Break finished! Time to focus.');
            }

            // Auto-switch sessions logic
            setTimeout(() => {
              setToastMessage('');
              if (mode === 'focus') {
                const nextSessions = sessionsCompleted + 1;
                if (nextSessions % 4 === 0) {
                  switchMode('longBreak');
                } else {
                  switchMode('shortBreak');
                }
              } else {
                switchMode('focus');
              }
            }, 2500);

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, mode, soundEnabled, sessionsCompleted, timerProfile, getActiveDuration, switchMode]);

  // ── Controls ──────────────────────────────────────────────────────────────
  const handleStartPause = () => setIsRunning(!isRunning);

  const handleReset = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setTimeLeft(getActiveDuration(timerProfile, mode) * 60);
  };

  // ── Apply Recommendation Action ──────────────────────────────────────────
  const applyRecommendedTimer = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setTimerProfile('recommended');
    setMode('focus');
    setTimeLeft(recommendation.focus * 60);
    setToastMessage('Recommended timer applied');
    setTimeout(() => setToastMessage(''), 3000);
  };

  // ── Apply Custom Timer Settings Action ────────────────────────────────────
  const applyCustomSettings = (e) => {
    e.preventDefault();
    const errors = {};

    const focusVal = parseInt(focusInput, 10);
    const shortVal = parseInt(shortBreakInput, 10);
    const longVal = parseInt(longBreakInput, 10);

    if (isNaN(focusVal) || focusVal < 5 || focusVal > 90) {
      errors.focus = 'Focus must be between 5 and 90 minutes';
    }
    if (isNaN(shortVal) || shortVal < 3 || shortVal > 30) {
      errors.shortBreak = 'Short break must be between 3 and 30 minutes';
    }
    if (isNaN(longVal) || longVal < 3 || longVal > 30) {
      errors.longBreak = 'Long break must be between 3 and 30 minutes';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    const newSettings = { focus: focusVal, shortBreak: shortVal, longBreak: longVal };
    setCustomSettings(newSettings);
    localStorage.setItem('levitateiq_custom_pomodoro', JSON.stringify(newSettings));

    setIsRunning(false);
    clearInterval(intervalRef.current);
    setTimerProfile('custom');
    setMode('focus');
    setTimeLeft(focusVal * 60);
    setToastMessage('Custom timer applied');
    setTimeout(() => setToastMessage(''), 3000);
  };

  // ── Reset to Default ──────────────────────────────────────────────────────
  const restoreDefaultTimer = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setTimerProfile('default');
    setMode('focus');
    setTimeLeft(MODES.focus.defaultMinutes * 60);
    setToastMessage('Default timer restored');
    setTimeout(() => setToastMessage(''), 3000);
  };

  // ── Format Time (MM:SS) ───────────────────────────────────────────────────
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // ── Progress Ring Calculation ─────────────────────────────────────────────
  const totalSeconds = getActiveDuration(timerProfile, mode) * 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;
  const ringSize = 280;
  const strokeWidth = 8;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const currentMode = MODES[mode];

  // ── Label values for rendering
  const activeFocusMinutes = getActiveDuration(timerProfile, 'focus');

  const profileLabel = timerProfile === 'custom' ? 'Custom' : timerProfile === 'recommended' ? 'Recommended' : 'Default';
  const modeLabel = mode === 'focus' ? 'Focus' : mode === 'shortBreak' ? 'Short Break' : 'Long Break';
  const currentActiveMinutes = getActiveDuration(timerProfile, mode);

  // ── Empty State Render ────────────────────────────────────────────────────
  if (!hasLogs) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <GlassCard className="max-w-md p-8 flex flex-col items-center border border-white/5 bg-dark-800/40 backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple/20 to-accent-blue/10 flex items-center justify-center mb-6 shadow-glow-purple/20">
            <AlertCircle className="w-8 h-8 text-accent-purple" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">No Daily Logs Yet</h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Complete today's check-in to get personalized focus session recommendations.
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
    <div className="space-y-8 animate-fade-in relative">
      {/* Toast Notification Message */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up bg-gradient-to-r from-accent-purple to-accent-blue text-white font-semibold text-xs px-4 py-3 rounded-xl shadow-glow-purple flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-white animate-pulse" />
          {toastMessage}
        </div>
      )}

      {/* Autoplay blocked notification banner */}
      {audioAutoplayBlocked && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
          <Info className="w-5 h-5 flex-shrink-0 animate-bounce" />
          <p className="text-xs font-semibold">
            Browser has disabled autoplay audio. **Click anywhere once to enable timer sounds.**
          </p>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center shadow-glow-purple/20">
          <Timer className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Pomodoro Timer</h2>
          <p className="text-xs text-gray-500">Self-contained browser-calibrated synthesizer alerts</p>
        </div>
      </div>

      {/* Main Timer Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Timer Card */}
          <GlassCard
            className={`flex flex-col items-center justify-center py-10 px-6 relative overflow-hidden transition-all duration-500 ${
              isPulsing
                ? 'scale-105 shadow-[0_0_60px_rgba(139,92,246,0.65)] border-accent-purple/60'
                : 'border-white/5'
            }`}
          >
            {/* Background glow */}
            <div
              className={`absolute inset-0 opacity-10 blur-3xl transition-all duration-1000 ${
                isPulsing ? 'scale-150 opacity-25' : ''
              }`}
              style={{
                background: `radial-gradient(circle at center, ${currentMode.color}, transparent 70%)`,
              }}
            />

            {/* Profile & Mode Status Banner */}
            <div className="mb-4 text-xs font-bold text-gray-400 bg-dark-800/80 px-4 py-2 rounded-full border border-white/5 flex items-center gap-2 relative z-10">
              <span className={`w-2 h-2 rounded-full bg-accent-purple ${isRunning ? 'animate-ping' : ''}`} />
              <span>Active Timer: {profileLabel} {modeLabel} — {currentActiveMinutes} minutes</span>
            </div>

            {/* Mode Selector Tabs */}
            <div className="flex gap-2 mb-8 bg-dark-800/60 p-1.5 rounded-2xl border border-white/5 relative z-10">
              {Object.entries(MODES).map(([key, m]) => {
                const Icon = m.icon;
                const activeMins = getActiveDuration(timerProfile, key);

                return (
                  <button
                    key={key}
                    onClick={() => switchMode(key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                      mode === key
                        ? `bg-gradient-to-r ${m.bgClass} text-white shadow-lg`
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{m.label} ({activeMins}m)</span>
                  </button>
                );
              })}
            </div>

            {/* Countdown Ring */}
            <div className="relative inline-flex items-center justify-center mb-8">
              <svg width={ringSize} height={ringSize} className="-rotate-90">
                {/* Background ring */}
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                {/* Progress ring */}
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  stroke={currentMode.color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-linear"
                  style={{ filter: `drop-shadow(0 0 8px ${currentMode.color}40)` }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className={`text-6xl font-bold text-white tracking-tight font-mono transition-transform duration-500 ${isPulsing ? 'scale-110 text-accent-purple' : ''}`}>
                  {formatTime(timeLeft)}
                </span>
                <span className="text-xs text-gray-500 mt-2 uppercase tracking-widest font-semibold">
                  {currentMode.label}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 relative z-10">
              {/* Reset */}
              <button
                onClick={handleReset}
                className="w-12 h-12 rounded-xl bg-dark-800 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 transition-all duration-200"
                title="Reset"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* Start / Pause */}
              <button
                onClick={handleStartPause}
                className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${currentMode.bgClass} flex items-center justify-center text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300`}
              >
                {isRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
              </button>

              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-12 h-12 rounded-xl bg-dark-800 border border-white/10 flex items-center justify-center transition-all duration-200 ${
                  soundEnabled ? 'text-accent-purple hover:border-accent-purple/30 border-accent-purple/40 bg-accent-purple/5 shadow-glow-purple/10' : 'text-gray-500 hover:text-gray-400'
                }`}
                title={soundEnabled ? 'Sound On' : 'Sound Off'}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>

            {/* Session Dots */}
            <div className="flex items-center gap-2 mt-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    i <= (sessionsCompleted % 4)
                      ? 'bg-accent-purple shadow-[0_0_8px_rgba(139,92,246,0.5)]'
                      : 'bg-dark-600'
                  }`}
                />
              ))}
              <span className="text-xs text-gray-500 ml-2">
                {sessionsCompleted % 4}/4 until long break
              </span>
            </div>
          </GlassCard>

          {/* Profile Choice Section */}
          <div className="flex gap-4">
            <button
              onClick={restoreDefaultTimer}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold border transition-all ${
                timerProfile === 'default'
                  ? 'bg-white/10 border-white/20 text-white shadow-md'
                  : 'bg-dark-800 border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              Default Timer
            </button>
            <button
              onClick={() => {
                setIsRunning(false);
                clearInterval(intervalRef.current);
                setTimerProfile('custom');
                setMode('focus');
                setTimeLeft(customSettings.focus * 60);
                setToastMessage('Custom timer activated');
                setTimeout(() => setToastMessage(''), 3000);
              }}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold border transition-all ${
                timerProfile === 'custom'
                  ? 'bg-accent-purple/20 border-accent-purple/40 text-white shadow-glow-purple/20'
                  : 'bg-dark-800 border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              Custom Timer
            </button>
            <button
              onClick={applyRecommendedTimer}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold border transition-all ${
                timerProfile === 'recommended'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-white shadow-md'
                  : 'bg-dark-800 border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              Recommended Timer
            </button>
          </div>

          {/* Custom Timer Settings Form */}
          <GlassCard className="p-6 border border-white/5">
            <div className="flex items-center gap-2.5 mb-5 border-b border-white/5 pb-3">
              <Settings className="w-5 h-5 text-accent-purple animate-spin-slow" />
              <h4 className="text-sm font-bold text-white">Custom Timer Settings</h4>
            </div>

            <form onSubmit={applyCustomSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Focus Minutes */}
                <div>
                  <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Focus (5 - 90 min)</label>
                  <input
                    type="number"
                    min="5"
                    max="90"
                    value={focusInput}
                    onChange={(e) => setFocusInput(e.target.value)}
                    className="input-field py-2.5 px-3 text-sm"
                  />
                  {validationErrors.focus && (
                    <p className="text-[10px] text-red-400 mt-1 font-medium">{validationErrors.focus}</p>
                  )}
                </div>

                {/* Short Break Minutes */}
                <div>
                  <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Short Break (3 - 30 min)</label>
                  <input
                    type="number"
                    min="3"
                    max="30"
                    value={shortBreakInput}
                    onChange={(e) => setShortBreakInput(e.target.value)}
                    className="input-field py-2.5 px-3 text-sm"
                  />
                  {validationErrors.shortBreak && (
                    <p className="text-[10px] text-red-400 mt-1 font-medium">{validationErrors.shortBreak}</p>
                  )}
                </div>

                {/* Long Break Minutes */}
                <div>
                  <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Long Break (3 - 30 min)</label>
                  <input
                    type="number"
                    min="3"
                    max="30"
                    value={longBreakInput}
                    onChange={(e) => setLongBreakInput(e.target.value)}
                    className="input-field py-2.5 px-3 text-sm"
                  />
                  {validationErrors.longBreak && (
                    <p className="text-[10px] text-red-400 mt-1 font-medium">{validationErrors.longBreak}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={restoreDefaultTimer}
                  className="btn-secondary py-2.5 px-4 text-xs font-bold"
                >
                  Reset to Default
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2.5 px-5 text-xs font-bold shadow-glow-purple"
                >
                  Use Custom Timer
                </button>
              </div>
            </form>
          </GlassCard>

          {/* Smart Recommendation Card */}
          <GlassCard className="p-6 relative overflow-hidden border border-white/5">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-15 rounded-full blur-3xl bg-accent-purple" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl ${recommendation.bg} border ${recommendation.border} flex items-center justify-center text-3xl flex-shrink-0`}>
                  {recommendation.icon}
                </div>
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    Smart Recommendation
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${recommendation.bg} ${recommendation.color}`}>
                      {recommendation.label} (Score: {score})
                    </span>
                  </h4>
                  <p className="text-sm text-gray-300 mt-1">
                    {recommendation.text}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Suggested profile is fully optimized based on your cognitive recovery.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                <button
                  onClick={applyRecommendedTimer}
                  className={`btn-primary px-5 py-3 flex items-center justify-center gap-2 text-xs font-bold w-full sm:w-auto ${
                    timerProfile === 'recommended' ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-white animate-pulse" />
                  <span>{timerProfile === 'recommended' ? 'Recommended Applied' : 'Apply Recommended Timer'}</span>
                </button>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Panel: Stats & Info */}
        <div className="space-y-4">
          {/* Current Gravity Status */}
          <GlassCard className="p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Current Mental State</h4>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${status.bgClass} flex items-center justify-center text-2xl`}>
                {status.emoji}
              </div>
              <div>
                <p className={`text-sm font-bold ${status.colorClass}`}>{status.label}</p>
                <p className="text-xs text-gray-500">Score: {score}</p>
              </div>
            </div>
            <div className="mt-3 p-2.5 bg-dark-800/60 rounded-xl border border-white/5">
              <p className="text-xs text-gray-400">
                {profileLabel} Focus Session currently set to {activeFocusMinutes} minutes.
              </p>
            </div>
          </GlassCard>

          {/* Today's Stats */}
          <GlassCard className="p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Today's Focus Stats</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center">
                    <Target className="w-4 h-4 text-accent-purple" />
                  </div>
                  <span className="text-xs text-gray-400 font-medium">Sessions</span>
                </div>
                <span className="text-sm font-bold text-white">{todayStats.completedSessions}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-accent-blue" />
                  </div>
                  <span className="text-xs text-gray-400 font-medium">Focus Time</span>
                </div>
                <span className="text-sm font-bold text-white">{todayStats.totalMinutes} min</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-xs text-gray-400 font-medium">Completed</span>
                </div>
                <span className="text-sm font-bold text-white">{todayStats.completedSessions}</span>
              </div>
            </div>
          </GlassCard>

          {/* Tips */}
          <GlassCard className="p-5 border-accent-purple/20 bg-accent-purple/5">
            <h4 className="text-xs font-bold text-accent-purple uppercase tracking-wider mb-2">Focus Tips</h4>
            <ul className="space-y-2">
              <li className="text-xs text-gray-300 flex items-start gap-2">
                <span className="text-accent-purple font-bold mt-0.5">•</span>
                <span>Close all non-essential tabs before starting</span>
              </li>
              <li className="text-xs text-gray-300 flex items-start gap-2">
                <span className="text-accent-purple font-bold mt-0.5">•</span>
                <span>Keep water nearby to stay hydrated</span>
              </li>
              <li className="text-xs text-gray-300 flex items-start gap-2">
                <span className="text-accent-purple font-bold mt-0.5">•</span>
                <span>During breaks, stand up and stretch</span>
              </li>
              <li className="text-xs text-gray-300 flex items-start gap-2">
                <span className="text-accent-purple font-bold mt-0.5">•</span>
                <span>Every 4 sessions, take a longer 15-min break</span>
              </li>
            </ul>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default PomodoroPage;
