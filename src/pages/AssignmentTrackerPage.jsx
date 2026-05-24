import { useState, useCallback } from 'react';
import {
  Plus,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  Pencil,
  X,
  Calendar,
  BookMarked,
  ChevronDown,
  Filter,
  Save,
  AlarmClock,
} from 'lucide-react';
import GlassCard from '../components/UI/GlassCard';
import {
  getAssignments,
  saveAssignment,
  updateAssignment,
  deleteAssignment,
  markCompleted,
  isOverdue,
  isDueSoon,
  getTodayStr,
} from '../utils/assignmentStorage';

// ── Constants ──────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  Low: {
    label: 'Low',
    badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    dot: 'bg-emerald-400',
    ring: 'ring-emerald-500/30',
  },
  Medium: {
    label: 'Medium',
    badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    dot: 'bg-amber-400',
    ring: 'ring-amber-500/30',
  },
  High: {
    label: 'High',
    badge: 'bg-red-500/15 text-red-400 border border-red-500/20',
    dot: 'bg-red-400',
    ring: 'ring-red-500/30',
  },
};

const STATUS_CONFIG = {
  'Not Started': {
    label: 'Not Started',
    badge: 'bg-gray-500/15 text-gray-400 border border-gray-500/20',
    icon: Clock,
  },
  'In Progress': {
    label: 'In Progress',
    badge: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    icon: AlarmClock,
  },
  Completed: {
    label: 'Completed',
    badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    icon: CheckCircle2,
  },
};

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
  'Other',
];

const TABS = [
  { id: 'upcoming', label: 'Upcoming', icon: Clock },
  { id: 'overdue', label: 'Overdue', icon: AlertTriangle },
  { id: 'completed', label: 'Completed', icon: CheckCircle2 },
  { id: 'all', label: 'All', icon: ClipboardCheck },
];

// ── Empty State ────────────────────────────────────────────────────────────────

const EmptyState = ({ tab, onAdd }) => {
  const messages = {
    upcoming: {
      icon: '🎉',
      title: 'No Upcoming Assignments',
      sub: 'You\'re all caught up! Add a new assignment to start tracking.',
    },
    overdue: {
      icon: '✅',
      title: 'No Overdue Assignments',
      sub: 'Great job staying on top of your work!',
    },
    completed: {
      icon: '📚',
      title: 'No Completed Assignments Yet',
      sub: 'Mark your assignments as completed as you finish them.',
    },
    all: {
      icon: '📋',
      title: 'No Assignments Yet',
      sub: 'Add your first assignment to start tracking your workload.',
    },
  };

  const { icon, title, sub } = messages[tab] || messages.all;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm max-w-xs mb-6">{sub}</p>
      {(tab === 'upcoming' || tab === 'all') && (
        <button
          id="empty-state-add-btn"
          onClick={onAdd}
          className="btn-primary flex items-center gap-2 text-sm py-2.5 px-5"
        >
          <Plus className="w-4 h-4" />
          Add Assignment
        </button>
      )}
    </div>
  );
};

// ── Deadline Warning Banner ────────────────────────────────────────────────────

const DeadlineWarnings = ({ assignments }) => {
  const dueToday = assignments.filter(
    (a) => a.status !== 'Completed' && a.dueDate === getTodayStr()
  );
  const dueSoon = assignments.filter(
    (a) => a.status !== 'Completed' && isDueSoon(a.dueDate, a.status, 3) && a.dueDate !== getTodayStr()
  );
  const overdue = assignments.filter((a) => isOverdue(a.dueDate, a.status));

  if (!dueToday.length && !dueSoon.length && !overdue.length) return null;

  return (
    <div className="space-y-2 mb-6">
      {overdue.length > 0 && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-300">
            <span className="font-semibold">{overdue.length} assignment{overdue.length > 1 ? 's' : ''} overdue!</span>
            {' '}Check the Overdue tab and catch up.
          </p>
        </div>
      )}
      {dueToday.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 animate-fade-in">
          <AlarmClock className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-300">
            <span className="font-semibold">{dueToday.length} assignment{dueToday.length > 1 ? 's' : ''} due today:</span>
            {' '}{dueToday.map((a) => a.title).join(', ')}.
          </p>
        </div>
      )}
      {dueSoon.length > 0 && (
        <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 animate-fade-in">
          <Clock className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-300">
            <span className="font-semibold">{dueSoon.length} assignment{dueSoon.length > 1 ? 's' : ''} due in the next 3 days.</span>
            {' '}Plan ahead!
          </p>
        </div>
      )}
    </div>
  );
};

// ── Assignment Form Modal ──────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: '',
  subject: 'Mathematics',
  dueDate: getTodayStr(),
  priority: 'Medium',
  status: 'Not Started',
};

const AssignmentFormModal = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.dueDate) e.dueDate = 'Due date is required';
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
            {initial ? 'Edit Assignment' : 'Add Assignment'}
          </h2>
          <button
            id="modal-close-btn"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {field(
            'Assignment Title *',
            <input
              id="assignment-title-input"
              className={`input-field ${errors.title ? 'border-red-500/50' : ''}`}
              placeholder="e.g. Chapter 5 Problems"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />,
            errors.title
          )}

          {field(
            'Subject',
            <select
              id="assignment-subject-select"
              className="input-field"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s} className="bg-dark-800 text-white">
                  {s}
                </option>
              ))}
            </select>
          )}

          <div className="grid grid-cols-2 gap-4">
            {field(
              'Due Date *',
              <input
                id="assignment-due-date-input"
                type="date"
                className={`input-field ${errors.dueDate ? 'border-red-500/50' : ''}`}
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />,
              errors.dueDate
            )}

            {field(
              'Priority',
              <select
                id="assignment-priority-select"
                className="input-field"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                {Object.keys(PRIORITY_CONFIG).map((p) => (
                  <option key={p} value={p} className="bg-dark-800 text-white">
                    {p}
                  </option>
                ))}
              </select>
            )}
          </div>

          {field(
            'Status',
            <select
              id="assignment-status-select"
              className="input-field"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {Object.keys(STATUS_CONFIG).map((s) => (
                <option key={s} value={s} className="bg-dark-800 text-white">
                  {s}
                </option>
              ))}
            </select>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              id="modal-cancel-btn"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="modal-save-btn"
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {initial ? 'Save Changes' : 'Add Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Assignment Card ────────────────────────────────────────────────────────────

const formatDueDate = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

  const fmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const base = fmt.format(due);

  if (diff === 0) return `Today · ${base}`;
  if (diff === 1) return `Tomorrow · ${base}`;
  if (diff === -1) return `Yesterday · ${base}`;
  if (diff < 0) return `${Math.abs(diff)}d overdue · ${base}`;
  if (diff <= 7) return `In ${diff} days · ${base}`;
  return base;
};

const AssignmentCard = ({ assignment, onEdit, onDelete, onMarkComplete }) => {
  const { id, title, subject, dueDate, priority, status } = assignment;
  const pCfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.Medium;
  const sCfg = STATUS_CONFIG[status] || STATUS_CONFIG['Not Started'];
  const StatusIcon = sCfg.icon;
  const overdue = isOverdue(dueDate, status);
  const soon = isDueSoon(dueDate, status, 3);
  const isCompleted = status === 'Completed';

  return (
    <div
      className={`
        glass-card p-4 md:p-5 transition-all duration-300 hover:-translate-y-0.5
        hover:border-white/10 hover:shadow-card
        ${overdue ? 'border-red-500/20 hover:border-red-500/30' : ''}
        ${soon && !overdue ? 'border-amber-500/15 hover:border-amber-500/25' : ''}
        ${isCompleted ? 'opacity-60' : ''}
      `}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        {/* Left — title + badges */}
        <div className="flex items-start gap-3 min-w-0">
          {/* Priority dot */}
          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${pCfg.dot}`} />
          <div className="min-w-0">
            <p className={`font-semibold text-sm leading-snug ${isCompleted ? 'line-through text-gray-500' : 'text-white'}`}>
              {title}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* Subject */}
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <BookMarked className="w-3 h-3" />
                {subject}
              </span>
              {/* Due date */}
              <span
                className={`flex items-center gap-1 text-xs ${
                  overdue ? 'text-red-400' : soon ? 'text-amber-400' : 'text-gray-400'
                }`}
              >
                <Calendar className="w-3 h-3" />
                {formatDueDate(dueDate)}
              </span>
            </div>
            {/* Status + Priority badges */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${sCfg.badge}`}>
                <StatusIcon className="w-3 h-3" />
                {sCfg.label}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pCfg.badge}`}>
                {pCfg.label}
              </span>
              {overdue && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                  <AlertTriangle className="w-3 h-3" />
                  Overdue
                </span>
              )}
              {soon && !overdue && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                  <AlarmClock className="w-3 h-3" />
                  Due Soon
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto sm:ml-0">
          {!isCompleted && (
            <button
              id={`mark-complete-${id}`}
              title="Mark as completed"
              onClick={() => onMarkComplete(id)}
              className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition-all duration-200"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Complete</span>
            </button>
          )}
          <button
            id={`edit-assignment-${id}`}
            title="Edit"
            onClick={() => onEdit(assignment)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            id={`delete-assignment-${id}`}
            title="Delete"
            onClick={() => onDelete(id)}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </button>
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
      <h3 className="text-base font-bold text-white mb-2">Delete Assignment?</h3>
      <p className="text-sm text-gray-400 mb-6">This action cannot be undone.</p>
      <div className="flex gap-3">
        <button id="delete-cancel-btn" onClick={onCancel} className="btn-secondary flex-1">
          Cancel
        </button>
        <button
          id="delete-confirm-btn"
          onClick={onConfirm}
          className="flex-1 bg-red-500/80 hover:bg-red-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ── Stats Bar ─────────────────────────────────────────────────────────────────

const StatsBar = ({ assignments }) => {
  const total = assignments.length;
  const completed = assignments.filter((a) => a.status === 'Completed').length;
  const overdue = assignments.filter((a) => isOverdue(a.dueDate, a.status)).length;
  const inProgress = assignments.filter((a) => a.status === 'In Progress').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {[
        { label: 'Total', value: total, color: 'text-white', bg: 'bg-white/5' },
        { label: 'Completed', value: completed, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'In Progress', value: inProgress, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Overdue', value: overdue, color: 'text-red-400', bg: 'bg-red-500/10' },
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

const AssignmentTrackerPage = () => {
  const [assignments, setAssignments] = useState(() => getAssignments());
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);   // assignment being edited
  const [deleteTarget, setDeleteTarget] = useState(null); // id to delete
  const [filterSubject, setFilterSubject] = useState('All');
  const [showFilter, setShowFilter] = useState(false);

  const reload = useCallback(() => setAssignments(getAssignments()), []);

  // ── Derived lists ────────────────────────────────────────────────────────────
  const filtered = assignments.filter(
    (a) => filterSubject === 'All' || a.subject === filterSubject
  );

  const tabData = {
    upcoming: filtered.filter(
      (a) => a.status !== 'Completed' && !isOverdue(a.dueDate, a.status)
    ).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),
    overdue: filtered.filter((a) => isOverdue(a.dueDate, a.status))
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),
    completed: filtered.filter((a) => a.status === 'Completed')
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    all: [...filtered].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),
  };

  const displayList = tabData[activeTab] || [];

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleAdd = () => {
    setEditTarget(null);
    setShowForm(true);
  };

  const handleEdit = (assignment) => {
    setEditTarget(assignment);
    setShowForm(true);
  };

  const handleSave = (formData) => {
    if (editTarget) {
      updateAssignment(editTarget.id, formData);
    } else {
      saveAssignment(formData);
    }
    setShowForm(false);
    setEditTarget(null);
    reload();
  };

  const handleDeleteClick = (id) => setDeleteTarget(id);

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteAssignment(deleteTarget);
      setDeleteTarget(null);
      reload();
    }
  };

  const handleMarkComplete = (id) => {
    markCompleted(id);
    reload();
  };

  const allSubjects = ['All', ...new Set(assignments.map((a) => a.subject))];

  const tabBadge = (tab) => {
    const count = tabData[tab]?.length ?? 0;
    return count > 0 ? count : null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-accent-purple" />
            Assignment Tracker
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Track your assignments subject-wise and never miss a deadline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Subject filter */}
          <div className="relative">
            <button
              id="filter-subject-btn"
              onClick={() => setShowFilter(!showFilter)}
              className="btn-secondary flex items-center gap-2 text-sm py-2.5 px-4"
            >
              <Filter className="w-4 h-4" />
              {filterSubject === 'All' ? 'Filter' : filterSubject}
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showFilter ? 'rotate-180' : ''}`} />
            </button>
            {showFilter && (
              <div className="absolute right-0 top-full mt-2 z-20 w-44 bg-dark-700 border border-white/10 rounded-xl shadow-card overflow-hidden animate-scale-in">
                {allSubjects.map((s) => (
                  <button
                    key={s}
                    id={`filter-${s}`}
                    onClick={() => { setFilterSubject(s); setShowFilter(false); }}
                    className={`w-full text-left text-sm px-4 py-2.5 transition-colors duration-150 ${
                      filterSubject === s
                        ? 'bg-accent-purple/20 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            id="add-assignment-btn"
            onClick={handleAdd}
            className="btn-primary flex items-center gap-2 text-sm py-2.5 px-5"
          >
            <Plus className="w-4 h-4" />
            Add Assignment
          </button>
        </div>
      </div>

      {/* Deadline Warnings */}
      <DeadlineWarnings assignments={assignments} />

      {/* Stats Bar */}
      <StatsBar assignments={assignments} />

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-dark-800/60 rounded-xl p-1 border border-white/5 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => {
          const badge = tabBadge(id);
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              id={`tab-${id}`}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 flex-1 justify-center ${
                isActive
                  ? 'bg-gradient-to-r from-accent-purple/20 to-accent-blue/10 text-white border border-accent-purple/20 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {badge != null && (
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded-full ml-0.5 ${
                    id === 'overdue'
                      ? 'bg-red-500/20 text-red-400'
                      : isActive
                      ? 'bg-white/10 text-white'
                      : 'bg-white/5 text-gray-400'
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Assignment List */}
      <div className="space-y-3">
        {displayList.length === 0 ? (
          <GlassCard className="p-0">
            <EmptyState tab={activeTab} onAdd={handleAdd} />
          </GlassCard>
        ) : (
          displayList.map((a) => (
            <AssignmentCard
              key={a.id}
              assignment={a}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onMarkComplete={handleMarkComplete}
            />
          ))
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <AssignmentFormModal
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

      {/* Close filter dropdown on outside click */}
      {showFilter && (
        <div className="fixed inset-0 z-10" onClick={() => setShowFilter(false)} />
      )}
    </div>
  );
};

export default AssignmentTrackerPage;
