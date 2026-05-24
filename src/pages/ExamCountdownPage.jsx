import { useState, useCallback } from 'react';
import {
  Plus,
  GraduationCap,
  Calendar,
  Clock,
  Trash2,
  Pencil,
  X,
  Save,
  BookOpenCheck,
  AlertTriangle,
  CheckCircle2,
  ListChecks,
} from 'lucide-react';
import GlassCard from '../components/UI/GlassCard';
import {
  getExams,
  saveExam,
  updateExam,
  deleteExam,
  daysUntil,
  isExamSoon,
  countdownText,
} from '../utils/examStorage';

// ── Constants ──────────────────────────────────────────────────────────────────

const PREP_CONFIG = {
  'Not Started': {
    badge: 'bg-gray-500/15 text-gray-400 border border-gray-500/20',
    bar: 'bg-gray-500',
    percent: 0,
    icon: Clock,
    tip: 'Start reviewing your syllabus soon!',
  },
  Revising: {
    badge: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    bar: 'bg-blue-500',
    percent: 40,
    icon: BookOpenCheck,
    tip: 'Keep revising — you\'re making progress.',
  },
  'Almost Ready': {
    badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    bar: 'bg-amber-400',
    percent: 75,
    icon: ListChecks,
    tip: 'Almost there! Review your weak topics.',
  },
  Ready: {
    badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    bar: 'bg-emerald-400',
    percent: 100,
    icon: CheckCircle2,
    tip: 'Great prep! Get a good rest before the exam.',
  },
};

const PREP_STATUSES = Object.keys(PREP_CONFIG);

const SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'English',
  'History',
  'Geography',
  'Economics',
  'Data Structures',
  'DBMS',
  'Operating Systems',
  'Networks',
  'Other',
];

const TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past Exams' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatExamDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
};

// ── Empty State ────────────────────────────────────────────────────────────────

const EmptyState = ({ tab, onAdd }) => {
  const config = {
    upcoming: {
      emoji: '🎓',
      title: 'No Upcoming Exams',
      sub: 'Add your exams to start tracking countdowns and prep status.',
    },
    past: {
      emoji: '📜',
      title: 'No Past Exams',
      sub: 'Past exams will appear here after their date passes.',
    },
  };
  const { emoji, title, sub } = config[tab] || config.upcoming;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{emoji}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm max-w-xs mb-6">{sub}</p>
      {tab === 'upcoming' && (
        <button
          id="empty-state-add-exam-btn"
          onClick={onAdd}
          className="btn-primary flex items-center gap-2 text-sm py-2.5 px-5"
        >
          <Plus className="w-4 h-4" />
          Add Exam
        </button>
      )}
    </div>
  );
};

// ── Countdown Ring ─────────────────────────────────────────────────────────────

const CountdownRing = ({ days }) => {
  const isToday = days === 0;
  const isCritical = days <= 3 && days >= 0;
  const color = isToday
    ? 'text-red-400'
    : isCritical
    ? 'text-amber-400'
    : 'text-accent-purple';
  const bg = isToday
    ? 'bg-red-500/10 border-red-500/20'
    : isCritical
    ? 'bg-amber-500/10 border-amber-500/20'
    : 'bg-accent-purple/10 border-accent-purple/20';

  return (
    <div
      className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl border ${bg} flex-shrink-0`}
    >
      <span className={`text-2xl font-bold ${color}`}>
        {isToday ? '!' : Math.abs(days)}
      </span>
      <span className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
        {isToday ? 'Today' : days === 1 ? 'day' : 'days'}
      </span>
    </div>
  );
};

// ── Revision Reminder Banner ───────────────────────────────────────────────────

const RevisionReminders = ({ exams }) => {
  const criticals = exams.filter(
    (e) => isExamSoon(e.examDate, 3) && e.prepStatus !== 'Ready'
  );
  if (!criticals.length) return null;

  return (
    <div className="space-y-2 mb-6">
      {criticals.map((e) => {
        const days = daysUntil(e.examDate);
        const isToday = days === 0;
        const cfg = PREP_CONFIG[e.prepStatus];
        return (
          <div
            key={e.id}
            className={`flex items-start gap-3 rounded-xl px-4 py-3 animate-fade-in ${
              isToday
                ? 'bg-red-500/10 border border-red-500/20'
                : 'bg-amber-500/10 border border-amber-500/20'
            }`}
          >
            <AlertTriangle
              className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                isToday ? 'text-red-400' : 'text-amber-400'
              }`}
            />
            <p
              className={`text-sm ${isToday ? 'text-red-300' : 'text-amber-300'}`}
            >
              <span className="font-semibold">
                {e.subject} exam {isToday ? 'is today!' : `in ${days} day${days > 1 ? 's' : ''}!`}
              </span>{' '}
              {cfg.tip}
            </p>
          </div>
        );
      })}
    </div>
  );
};

// ── Exam Card ──────────────────────────────────────────────────────────────────

const ExamCard = ({ exam, onEdit, onDelete, isPast }) => {
  const { id, subject, examDate, syllabus, prepStatus } = exam;
  const days = daysUntil(examDate);
  const soon = isExamSoon(examDate, 3);
  const cfg = PREP_CONFIG[prepStatus] || PREP_CONFIG['Not Started'];
  const PrepIcon = cfg.icon;

  return (
    <div
      className={`
        glass-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card
        ${soon && !isPast ? 'border-amber-500/20 hover:border-amber-500/30' : 'hover:border-white/10'}
        ${days === 0 && !isPast ? '!border-red-500/25 hover:!border-red-500/40' : ''}
        ${isPast ? 'opacity-60' : ''}
      `}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Countdown ring (upcoming only) */}
        {!isPast && <CountdownRing days={days} />}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Subject + countdown headline */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white leading-tight">{subject}</h3>
              {!isPast && (
                <p
                  className={`text-sm font-semibold mt-0.5 ${
                    days === 0
                      ? 'text-red-400'
                      : soon
                      ? 'text-amber-400'
                      : 'text-accent-purple'
                  }`}
                >
                  {subject} exam {countdownText(examDate)}
                </p>
              )}
            </div>
            {/* Actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                id={`edit-exam-${id}`}
                title="Edit"
                onClick={() => onEdit(exam)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                id={`delete-exam-${id}`}
                title="Delete"
                onClick={() => onDelete(id)}
                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              {formatExamDate(examDate)}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}
            >
              <PrepIcon className="w-3 h-3" />
              {prepStatus}
            </span>
            {!isPast && soon && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-3 h-3" />
                Upcoming Soon
              </span>
            )}
          </div>

          {/* Prep progress bar */}
          {!isPast && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Preparation</span>
                <span className="text-xs text-gray-400 font-medium">{cfg.percent}%</span>
              </div>
              <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`}
                  style={{ width: `${cfg.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Syllabus */}
          {syllabus && (
            <div className="mt-3 bg-dark-800/60 rounded-xl px-3 py-2.5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-semibold">
                Syllabus / Topics
              </p>
              <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">{syllabus}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

const DeleteConfirmModal = ({ onConfirm, onCancel }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    onClick={(e) => e.target === e.currentTarget && onCancel()}
  >
    <div className="w-full max-w-sm bg-dark-800 border border-red-500/20 rounded-2xl shadow-card animate-scale-in p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
        <Trash2 className="w-7 h-7 text-red-400" />
      </div>
      <h3 className="text-base font-bold text-white mb-2">Delete Exam?</h3>
      <p className="text-sm text-gray-400 mb-6">This action cannot be undone.</p>
      <div className="flex gap-3">
        <button id="exam-delete-cancel-btn" onClick={onCancel} className="btn-secondary flex-1">
          Cancel
        </button>
        <button
          id="exam-delete-confirm-btn"
          onClick={onConfirm}
          className="flex-1 bg-red-500/80 hover:bg-red-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ── Exam Form Modal ────────────────────────────────────────────────────────────

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const EMPTY_FORM = {
  subject: 'Mathematics',
  examDate: todayStr(),
  syllabus: '',
  prepStatus: 'Not Started',
};

const ExamFormModal = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState(
    initial
      ? {
          subject: initial.subject,
          examDate: initial.examDate,
          syllabus: initial.syllabus || '',
          prepStatus: initial.prepStatus,
        }
      : EMPTY_FORM
  );
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.subject?.trim()) e.subject = 'Subject is required';
    if (!form.examDate) e.examDate = 'Exam date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(form);
  };

  const field = (label, children, error) => (
    <div>
      <label className="label-text">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-dark-800 border border-white/10 rounded-2xl shadow-card animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-base font-bold text-white">
            {initial ? 'Edit Exam' : 'Add Exam'}
          </h2>
          <button
            id="exam-modal-close-btn"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {field(
            'Subject *',
            <select
              id="exam-subject-select"
              className={`input-field ${errors.subject ? 'border-red-500/50' : ''}`}
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s} className="bg-dark-800 text-white">
                  {s}
                </option>
              ))}
            </select>,
            errors.subject
          )}

          {field(
            'Exam Date *',
            <input
              id="exam-date-input"
              type="date"
              className={`input-field ${errors.examDate ? 'border-red-500/50' : ''}`}
              value={form.examDate}
              onChange={(e) => setForm({ ...form, examDate: e.target.value })}
            />,
            errors.examDate
          )}

          {field(
            'Preparation Status',
            <select
              id="exam-prep-status-select"
              className="input-field"
              value={form.prepStatus}
              onChange={(e) => setForm({ ...form, prepStatus: e.target.value })}
            >
              {PREP_STATUSES.map((s) => (
                <option key={s} value={s} className="bg-dark-800 text-white">
                  {s}
                </option>
              ))}
            </select>
          )}

          {field(
            'Syllabus / Topics (optional)',
            <textarea
              id="exam-syllabus-textarea"
              className="input-field resize-none h-24"
              placeholder="e.g. Chapters 1-5, Sorting algorithms, Normalization..."
              value={form.syllabus}
              onChange={(e) => setForm({ ...form, syllabus: e.target.value })}
            />
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              id="exam-modal-cancel-btn"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="exam-modal-save-btn"
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {initial ? 'Save Changes' : 'Add Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Stats Bar ─────────────────────────────────────────────────────────────────

const StatsBar = ({ exams }) => {
  const upcoming = exams.filter((e) => daysUntil(e.examDate) >= 0);
  const ready = exams.filter((e) => e.prepStatus === 'Ready' && daysUntil(e.examDate) >= 0);
  const critical = exams.filter((e) => isExamSoon(e.examDate, 3));
  const past = exams.filter((e) => daysUntil(e.examDate) < 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {[
        { label: 'Upcoming', value: upcoming.length, color: 'text-white', bg: 'bg-white/5' },
        { label: 'Ready', value: ready.length, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'Critical (≤3d)', value: critical.length, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { label: 'Past', value: past.length, color: 'text-gray-400', bg: 'bg-gray-500/10' },
      ].map(({ label, value, color, bg }) => (
        <div key={label} className={`glass-card p-4 ${bg}`}>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          <p className="text-xs text-gray-400 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const ExamCountdownPage = () => {
  const [exams, setExams] = useState(() => getExams());
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const reload = useCallback(() => setExams(getExams()), []);

  // Derived
  const upcomingList = exams
    .filter((e) => daysUntil(e.examDate) >= 0)
    .sort((a, b) => new Date(a.examDate) - new Date(b.examDate));

  const pastList = exams
    .filter((e) => daysUntil(e.examDate) < 0)
    .sort((a, b) => new Date(b.examDate) - new Date(a.examDate));

  const displayList = activeTab === 'upcoming' ? upcomingList : pastList;

  // Handlers
  const handleAdd = () => { setEditTarget(null); setShowForm(true); };
  const handleEdit = (exam) => { setEditTarget(exam); setShowForm(true); };

  const handleSave = (formData) => {
    if (editTarget) {
      updateExam(editTarget.id, formData);
    } else {
      saveExam(formData);
    }
    setShowForm(false);
    setEditTarget(null);
    reload();
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteExam(deleteTarget);
      setDeleteTarget(null);
      reload();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-accent-purple" />
            Exam Countdown
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Track your upcoming exams, preparation status, and never get caught off-guard.
          </p>
        </div>
        <button
          id="add-exam-btn"
          onClick={handleAdd}
          className="btn-primary flex items-center gap-2 text-sm py-2.5 px-5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Exam
        </button>
      </div>

      {/* Revision reminders */}
      <RevisionReminders exams={upcomingList} />

      {/* Stats */}
      <StatsBar exams={exams} />

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-dark-800/60 rounded-xl p-1 border border-white/5">
        {TABS.map(({ id, label }) => {
          const count = id === 'upcoming' ? upcomingList.length : pastList.length;
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              id={`exam-tab-${id}`}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium flex-1 justify-center transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-accent-purple/20 to-accent-blue/10 text-white border border-accent-purple/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
              {count > 0 && (
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Exam list */}
      <div className="space-y-4">
        {displayList.length === 0 ? (
          <GlassCard className="p-0">
            <EmptyState tab={activeTab} onAdd={handleAdd} />
          </GlassCard>
        ) : (
          displayList.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              isPast={activeTab === 'past'}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteTarget(id)}
            />
          ))
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <ExamFormModal
          initial={editTarget}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default ExamCountdownPage;
