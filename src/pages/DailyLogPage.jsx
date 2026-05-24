import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Moon,
  Gauge,
  ClipboardList,
  Smile,
  Smartphone,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  X,
} from 'lucide-react';
import { moodOptions } from '../data/mockData';
import GlassCard from '../components/UI/GlassCard';
import { useScore } from '../context/ScoreContext';
import { calculateGravityScore } from '../utils/gravityLogic';
import { getTodayStr } from '../utils/storage';

const stressMapping = {
  1: { emoji: '😄', label: 'Very Happy' },
  2: { emoji: '😊', label: 'Happy' },
  3: { emoji: '🙂', label: 'Calm' },
  4: { emoji: '😌', label: 'Relaxed' },
  5: { emoji: '😐', label: 'Normal' },
  6: { emoji: '😕', label: 'Slightly Stressed' },
  7: { emoji: '😟', label: 'Stressed' },
  8: { emoji: '😣', label: 'Very Stressed' },
  9: { emoji: '😫', label: 'Exhausted' },
  10: { emoji: '😭', label: 'Burnout' },
};

const STANDARD_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Computer Science',
  'English',
  'Tamil',
  'Biology',
];

const SliderField = ({ icon: Icon, label, value, onChange, min = 0, max = 10, step = 0.5, unit = '', customValueDisplay }) => (
  <div className="bg-dark-800/50 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-purple/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-accent-purple" />
        </div>
        <span className="text-sm font-semibold text-gray-200">{label}</span>
      </div>
      <span className="text-base font-bold text-accent-purple">
        {customValueDisplay ? customValueDisplay : `${value}${unit}`}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-dark-600 rounded-full appearance-none cursor-pointer
                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5
                 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full
                 [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-accent-purple
                 [&::-webkit-slider-thumb]:to-accent-blue [&::-webkit-slider-thumb]:shadow-glow-purple
                 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all
                 [&::-webkit-slider-thumb]:hover:scale-125"
    />
    <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
      <span>{min === 1 && label === "Stress Level" ? "😄 Very Happy" : `${min}${unit}`}</span>
      <span>{max === 10 && label === "Stress Level" ? "😭 Burnout" : `${max}${unit}`}</span>
    </div>
  </div>
);

const DailyLogPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isFromDashboard = location.state?.fromDashboard;
  const { logs, addLog } = useScore();

  // Helper: normalise old subjectStudied string → array
  const toSubjectsArray = (existing) => {
    if (!existing) return [];
    if (existing.subjectsStudied && Array.isArray(existing.subjectsStudied) && existing.subjectsStudied.length > 0) {
      return existing.subjectsStudied;
    }
    if (existing.subjectStudied && existing.subjectStudied.trim()) {
      return [existing.subjectStudied.trim()];
    }
    return [];
  };

  const todayStr = getTodayStr();
  const existing = logs.find(l => l.date === todayStr);

  const [subjectsSelected, setSubjectsSelected] = useState(() => {
    return toSubjectsArray(existing);
  });

  const [log, setLog] = useState(() => {
    if (existing) {
      return {
        studyHours: existing.studyHours !== undefined ? existing.studyHours : 0,
        sleepHours: existing.sleepHours !== undefined ? existing.sleepHours : 0,
        stressLevel: existing.stressLevel !== undefined ? existing.stressLevel : 5,
        pendingAssignments: existing.pendingAssignments !== undefined ? existing.pendingAssignments : 0,
        subjectsStudied: toSubjectsArray(existing),
        mood: existing.mood || '',
        socialMediaUsage: existing.socialMediaUsage !== undefined ? existing.socialMediaUsage : 0,
      };
    }
    return {
      studyHours: 0,
      sleepHours: 0,
      stressLevel: 5,
      pendingAssignments: 0,
      subjectsStudied: [],
      mood: '',
      socialMediaUsage: 0,
    };
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [customSubjectInput, setCustomSubjectInput] = useState('');

  // Add a predefined subject chip
  const addPredefinedSubject = (subj) => {
    if (!subj || subjectsSelected.includes(subj)) return;
    const updated = [...subjectsSelected, subj];
    setSubjectsSelected(updated);
    setLog(prev => ({ ...prev, subjectsStudied: updated }));
  };

  // Add a custom typed subject chip
  const addCustomSubject = () => {
    const trimmed = customSubjectInput.trim();
    if (!trimmed || subjectsSelected.includes(trimmed)) {
      setCustomSubjectInput('');
      return;
    }
    const updated = [...subjectsSelected, trimmed];
    setSubjectsSelected(updated);
    setLog(prev => ({ ...prev, subjectsStudied: updated }));
    setCustomSubjectInput('');
  };

  // Remove a subject chip
  const removeSubject = (subj) => {
    const updated = subjectsSelected.filter(s => s !== subj);
    setSubjectsSelected(updated);
    setLog(prev => ({ ...prev, subjectsStudied: updated }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check if today's log already exists
    const todayStr = getTodayStr();
    const exists = logs.some(l => l.date === todayStr);
    
    if (exists) {
      setShowConfirmModal(true);
    } else {
      saveAndNavigate();
    }
  };

  const saveAndNavigate = () => {
    const score = calculateGravityScore(log);
    const stressObj = stressMapping[log.stressLevel] || { emoji: '😐', label: 'Normal' };
    const logToSave = {
      ...log,
      stressLabel: `${stressObj.emoji} ${stressObj.label}`,
      stressScore: log.stressLevel,
      subjectsStudied: subjectsSelected,
      // Keep legacy field populated for backward compat
      subjectStudied: subjectsSelected[0] || ''
    };
    addLog(logToSave, score);
    navigate('/gravity-score');
  };



  return (
    <div className={isFromDashboard ? '' : 'min-h-screen bg-dark-900 flex items-center justify-center p-4'}>
      <div className={`w-full ${isFromDashboard ? '' : 'max-w-2xl'} relative z-10`}>
        {/* Background effects (only on standalone page) */}
        {!isFromDashboard && (
          <>
            <div className="absolute top-1/4 -left-32 w-80 h-80 bg-accent-purple/8 rounded-full blur-3xl fixed" />
            <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-accent-blue/8 rounded-full blur-3xl fixed" />
          </>
        )}

        {/* Header */}
        {!isFromDashboard && (
          <div className="text-center mb-8 animate-slide-up">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-blue mb-4 shadow-glow-purple">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Daily Mental Load Log</h1>
            <p className="text-gray-400 text-sm">Track your daily metrics to calculate your Gravity Score</p>
          </div>
        )}

        {isFromDashboard && (
          <div className="mb-6 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center shadow-glow-purple">
               <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Log Today's Metrics</h2>
              <p className="text-gray-400 text-sm mt-1">Track your daily mental load factors</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <GlassCard className="p-6 md:p-8 space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SliderField
                icon={BookOpen}
                label="Study Hours"
                value={log.studyHours}
                onChange={(v) => setLog({ ...log, studyHours: v })}
                min={0}
                max={16}
                step={0.5}
                unit="h"
              />

              <SliderField
                icon={Moon}
                label="Sleep Hours"
                value={log.sleepHours}
                onChange={(v) => setLog({ ...log, sleepHours: v })}
                min={0}
                max={12}
                step={0.5}
                unit="h"
              />

              <SliderField
                icon={Gauge}
                label="Stress Level"
                value={log.stressLevel}
                onChange={(v) => setLog({ ...log, stressLevel: v })}
                min={1}
                max={10}
                step={1}
                unit=""
                customValueDisplay={
                  stressMapping[log.stressLevel]
                    ? `${stressMapping[log.stressLevel].emoji} ${stressMapping[log.stressLevel].label}`
                    : `${log.stressLevel}`
                }
              />

              <SliderField
                icon={ClipboardList}
                label="Pending Assignments"
                value={log.pendingAssignments}
                onChange={(v) => setLog({ ...log, pendingAssignments: v })}
                min={0}
                max={15}
                step={1}
                unit=""
              />
            </div>

            <SliderField
              icon={Smartphone}
              label="Social Media Usage"
              value={log.socialMediaUsage}
              onChange={(v) => setLog({ ...log, socialMediaUsage: v })}
              min={0}
              max={12}
              step={0.5}
              unit="h"
            />

            {/* Mood Selection */}
            <div className="bg-dark-800/50 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-accent-purple/10 flex items-center justify-center">
                  <Smile className="w-5 h-5 text-accent-purple" />
                </div>
                <span className="text-sm font-semibold text-gray-200">Current Mood</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {moodOptions.map((mood) => (
                  <button
                    key={mood.label}
                    type="button"
                    onClick={() => setLog({ ...log, mood: mood.label })}
                    className={`py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 border flex flex-col items-center gap-2 hover:-translate-y-1 ${
                      log.mood === mood.label
                        ? 'bg-accent-purple/20 border-accent-purple/50 text-white shadow-glow-purple/20'
                        : 'bg-dark-900 border-white/5 text-gray-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span className="text-2xl">{mood.emoji}</span>
                    <span>{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Selection — Multi-select with chips */}
            <div className="bg-dark-800/50 p-4 rounded-2xl border border-white/5 mt-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-accent-purple/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-accent-purple" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-200">Subjects Studied Today</span>
                  <p className="text-xs text-gray-500 mt-0.5">Select multiple subjects or add custom ones</p>
                </div>
              </div>

              {/* Selected Subject Chips */}
              {subjectsSelected.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {subjectsSelected.map(subj => (
                    <span
                      key={subj}
                      className="flex items-center gap-1.5 bg-accent-purple/15 border border-accent-purple/30 text-accent-purple text-xs font-semibold px-3 py-1.5 rounded-full animate-fade-in"
                    >
                      {subj}
                      <button
                        type="button"
                        onClick={() => removeSubject(subj)}
                        className="w-3.5 h-3.5 rounded-full hover:bg-accent-purple/30 flex items-center justify-center transition-colors"
                        aria-label={`Remove ${subj}`}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Predefined Subject Pills */}
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Predefined Subjects</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {STANDARD_SUBJECTS.map(subj => (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => addPredefinedSubject(subj)}
                    disabled={subjectsSelected.includes(subj)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                      subjectsSelected.includes(subj)
                        ? 'bg-accent-purple/20 border-accent-purple/40 text-accent-purple/50 cursor-not-allowed'
                        : 'bg-dark-700 border-white/10 text-gray-300 hover:border-accent-purple/50 hover:text-white hover:bg-accent-purple/10'
                    }`}
                  >
                    {subjectsSelected.includes(subj) ? `✓ ${subj}` : `+ ${subj}`}
                  </button>
                ))}
              </div>

              {/* Custom Subject Manual Entry */}
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Add Custom Subject</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. DBMS, Machine Learning, Operating Systems..."
                  className="flex-1 bg-dark-700 text-white text-sm p-3 rounded-xl border border-white/5 focus:border-accent-purple/50 focus:outline-none transition-all placeholder:text-gray-500"
                  value={customSubjectInput}
                  onChange={e => setCustomSubjectInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomSubject(); } }}
                />
                <button
                  type="button"
                  onClick={addCustomSubject}
                  disabled={!customSubjectInput.trim()}
                  className="px-4 py-2 rounded-xl bg-accent-purple/20 border border-accent-purple/30 text-accent-purple text-sm font-semibold hover:bg-accent-purple/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </div>


          {/* Submit */}
          <button
            type="submit"
            className="btn-primary w-full mt-6 py-4 flex items-center justify-center gap-2 group text-base shadow-glow-purple"
          >
            Calculate Gravity Score
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
                  </GlassCard>
          </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4" 
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowConfirmModal(false); }}
        >
          <div className="w-full max-w-md bg-dark-800 border border-white/10 rounded-2xl shadow-[0_25px_60px_-10px_rgba(0,0,0,0.6)] overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-dark-900/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="text-base font-bold text-white">Check-in Completed</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-300 leading-relaxed font-semibold">
                You already completed today’s check-in.
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Would you like to overwrite your existing metrics for today? This will recalculate your gravity score, burnout forecast, weekly stats, and achievements.
              </p>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false);
                    saveAndNavigate();
                  }}
                  className="btn-primary flex-1 py-3 text-sm font-semibold shadow-glow-purple"
                >
                  Update Today's Log
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="btn-secondary px-6 py-3 text-sm font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyLogPage;
