import { useState } from 'react';
import {
  Plus,
  CalendarCheck,
  CheckCircle,
  XCircle,
  Pencil,
  Trash2,
  AlertTriangle,
  X,
  Save,
  Check,
} from 'lucide-react';
import GlassCard from '../components/UI/GlassCard';
import {
  getAttendanceRecords,
  saveAttendanceRecord,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  markAttendance,
  getAttendancePercentage,
  classesNeededFor75,
  getCustomSubjects,
} from '../utils/attendanceStorage';

// ── Helpers ───────────────────────────────────────────────────────────────────

const EmptyState = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="text-5xl mb-4">📅</div>
    <h3 className="text-lg font-semibold text-white mb-2">No Attendance Tracked</h3>
    <p className="text-gray-400 text-sm max-w-sm mb-6">
      Add your first subject to start tracking attendance.
    </p>
    <button
      id="empty-state-add-subject-btn"
      onClick={onAdd}
      className="btn-primary flex items-center gap-2 text-sm py-2.5 px-5"
    >
      <Plus className="w-4 h-4" />
      Add Subject
    </button>
  </div>
);

// ── Subject Card ─────────────────────────────────────────────────────────────

const SubjectCard = ({ record, onMark, onEdit, onDelete }) => {
  const { id, subjectName, totalClasses, attendedClasses } = record;
  const percentage = getAttendancePercentage(record);
  const isSafe = percentage >= 75;
  const needed = classesNeededFor75(record);

  // Styling based on status
  const cardBorder = isSafe
    ? 'hover:border-emerald-500/30'
    : 'border-red-500/20 hover:border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.05)]';

  const badgeColor = isSafe
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : 'bg-red-500/10 text-red-400 border-red-500/20';

  const progressColor = isSafe
    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
    : 'bg-gradient-to-r from-red-500 to-amber-500';

  return (
    <div
      className={`
        glass-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card
        ${cardBorder}
      `}
    >
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-white leading-tight truncate max-w-[200px]" title={subjectName}>
            {subjectName}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeColor}`}>
              {isSafe ? (
                <>
                  <Check className="w-3 h-3" /> Safe
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3 animate-pulse" /> Shortage Warning
                </>
              )}
            </span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            id={`edit-subject-${id}`}
            title="Edit Totals"
            onClick={() => onEdit(record)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            id={`delete-subject-${id}`}
            title="Delete"
            onClick={() => onDelete(id)}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main stats layout */}
      <div className="flex items-end justify-between mb-3">
        <div className="space-y-0.5">
          <p className="text-2xl font-black text-white">{percentage}%</p>
          <p className="text-xs text-gray-400">
            Attended <span className="font-semibold text-gray-200">{attendedClasses}</span> / <span className="font-semibold text-gray-200">{totalClasses}</span> classes
          </p>
        </div>

        {/* Circular indicator style preview */}
        <div className="w-10 h-10 rounded-full border-2 border-white/5 flex items-center justify-center relative overflow-hidden bg-dark-800">
          <div
            className={`absolute bottom-0 left-0 w-full transition-all duration-500 ${isSafe ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}
            style={{ height: `${percentage}%` }}
          />
          <CalendarCheck className={`w-4 h-4 ${isSafe ? 'text-emerald-400' : 'text-red-400'} z-10`} />
        </div>
      </div>

      {/* Custom progress bar */}
      <div className="w-full h-2 bg-dark-800 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${progressColor}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>

      {/* Recovery advice if below 75% */}
      {!isSafe && needed > 0 && (
        <div className="mb-4 bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2 flex items-center gap-2 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <p className="text-[11px] text-red-300">
            Attend <span className="font-bold text-white">{needed}</span> more consecutive classes to reach 75%.
          </p>
        </div>
      )}

      {/* Quick Mark Daily Attendance */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
        <button
          id={`mark-present-${id}`}
          onClick={() => onMark(id, 'present')}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Present
        </button>
        <button
          id={`mark-absent-${id}`}
          onClick={() => onMark(id, 'absent')}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <XCircle className="w-3.5 h-3.5" />
          Absent
        </button>
      </div>
    </div>
  );
};

// ── Add/Edit Subject Modal ────────────────────────────────────────────────────

const SubjectFormModal = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState({
    subjectName: initial?.subjectName || '',
    totalClasses: initial?.totalClasses !== undefined ? initial.totalClasses : 0,
    attendedClasses: initial?.attendedClasses !== undefined ? initial.attendedClasses : 0,
  });

  const [errors, setErrors] = useState({});
  const [suggestions] = useState(() => {
    const list = getCustomSubjects();
    // Exclude currently entered name if editing
    const currentName = initial?.subjectName?.toLowerCase() || '';
    return list.filter(name => name.toLowerCase() !== currentName);
  });
  const [showSuggestions, setShowSuggestions] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.subjectName.trim()) {
      e.subjectName = 'Subject name is required.';
    }
    if (form.totalClasses < 0) {
      e.totalClasses = 'Classes cannot be negative.';
    }
    if (form.attendedClasses < 0) {
      e.attendedClasses = 'Classes cannot be negative.';
    }
    if (parseInt(form.attendedClasses) > parseInt(form.totalClasses)) {
      e.attendedClasses = 'Attended classes cannot exceed total classes.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      onSave(form);
    } catch (err) {
      setErrors({ subjectName: err.message });
    }
  };

  const selectSuggestion = (name) => {
    setForm(prev => ({ ...prev, subjectName: name }));
    setShowSuggestions(false);
  };

  const hasSuggestionsToShow = showSuggestions && suggestions.filter(s =>
    s.toLowerCase().includes(form.subjectName.toLowerCase())
  ).length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-dark-800 border border-white/10 rounded-2xl shadow-card animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-base font-bold text-white">
            {initial ? 'Edit Subject Attendance' : 'Add Subject'}
          </h2>
          <button
            id="subject-modal-close-btn"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="relative">
            <label className="label-text">Subject Name *</label>
            <input
              id="subject-name-input"
              type="text"
              className={`input-field ${errors.subjectName ? 'border-red-500/50' : ''}`}
              placeholder="e.g. Mathematics, Operating Systems"
              value={form.subjectName}
              onChange={(e) => {
                setForm({ ...form, subjectName: e.target.value });
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              autoComplete="off"
            />
            {errors.subjectName && <p className="text-xs text-red-400 mt-1">{errors.subjectName}</p>}

            {/* Reusable Subject Suggestions Dropdown */}
            {hasSuggestionsToShow && (
              <div className="absolute left-0 right-0 z-50 bg-dark-700 border border-white/10 rounded-xl mt-1 shadow-card max-h-36 overflow-y-auto">
                {suggestions
                  .filter(s => s.toLowerCase().includes(form.subjectName.toLowerCase()))
                  .map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => selectSuggestion(s)}
                      className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5 last:border-b-0"
                    >
                      {s}
                    </button>
                  ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">Total Classes</label>
              <input
                id="subject-total-input"
                type="number"
                min="0"
                className={`input-field ${errors.totalClasses ? 'border-red-500/50' : ''}`}
                value={form.totalClasses}
                onChange={(e) => setForm({ ...form, totalClasses: parseInt(e.target.value) || 0 })}
              />
              {errors.totalClasses && <p className="text-xs text-red-400 mt-1">{errors.totalClasses}</p>}
            </div>
            <div>
              <label className="label-text">Attended Classes</label>
              <input
                id="subject-attended-input"
                type="number"
                min="0"
                className={`input-field ${errors.attendedClasses ? 'border-red-500/50' : ''}`}
                value={form.attendedClasses}
                onChange={(e) => setForm({ ...form, attendedClasses: parseInt(e.target.value) || 0 })}
              />
              {errors.attendedClasses && <p className="text-xs text-red-400 mt-1">{errors.attendedClasses}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              id="subject-modal-cancel-btn"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="subject-modal-save-btn"
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {initial ? 'Save Changes' : 'Add Subject'}
            </button>
          </div>
        </form>
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
      <h3 className="text-base font-bold text-white mb-2">Delete Subject?</h3>
      <p className="text-sm text-gray-400 mb-6">All attendance data for this subject will be removed.</p>
      <div className="flex gap-3">
        <button id="subject-delete-cancel-btn" onClick={onCancel} className="btn-secondary flex-1">
          Cancel
        </button>
        <button
          id="subject-delete-confirm-btn"
          onClick={onConfirm}
          className="flex-1 bg-red-500/80 hover:bg-red-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ── Stats Summary Bar ─────────────────────────────────────────────────────────

const SummaryBar = ({ records }) => {
  if (records.length === 0) return null;

  let grandTotal = 0;
  let grandAttended = 0;
  let shortages = 0;
  let safeCount = 0;

  records.forEach(r => {
    grandTotal += r.totalClasses;
    grandAttended += r.attendedClasses;
    const pct = getAttendancePercentage(r);
    if (pct >= 75) {
      safeCount++;
    } else {
      shortages++;
    }
  });

  const overall = grandTotal > 0 ? Math.round((grandAttended / grandTotal) * 100) : 0;
  const isOverallSafe = overall >= 75;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {[
        {
          label: 'Overall Attendance',
          value: `${overall}%`,
          color: isOverallSafe ? 'text-emerald-400' : 'text-red-400',
          bg: isOverallSafe ? 'bg-emerald-500/10' : 'bg-red-500/10',
        },
        {
          label: 'Total Tracked',
          value: records.length,
          color: 'text-white',
          bg: 'bg-white/5',
        },
        {
          label: 'Safe Subjects',
          value: safeCount,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border border-emerald-500/5',
        },
        {
          label: 'Shortage Warnings',
          value: shortages,
          color: shortages > 0 ? 'text-red-400 animate-pulse' : 'text-gray-400',
          bg: shortages > 0 ? 'bg-red-500/10 border border-red-500/5' : 'bg-white/5',
        },
      ].map(({ label, value, color, bg }) => (
        <div key={label} className={`glass-card p-4 ${bg}`}>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          <p className="text-xs text-gray-400 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
};

// ── Main Page Component ──────────────────────────────────────────────────────

const AttendanceTrackerPage = () => {
  const [records, setRecords] = useState(() => getAttendanceRecords());
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const reload = () => {
    setRecords(getAttendanceRecords());
  };

  // Handlers
  const handleAdd = () => {
    setEditTarget(null);
    setShowForm(true);
  };

  const handleEdit = (record) => {
    setEditTarget(record);
    setShowForm(true);
  };

  const handleSave = (formData) => {
    if (editTarget) {
      updateAttendanceRecord(editTarget.id, formData);
    } else {
      saveAttendanceRecord(formData);
    }
    setShowForm(false);
    setEditTarget(null);
    reload();
  };

  const handleMark = (id, status) => {
    markAttendance(id, status);
    reload();
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteAttendanceRecord(deleteTarget);
      setDeleteTarget(null);
      reload();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-accent-purple" />
            Attendance Tracker
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Track subject-wise classes, log daily attendance, and stay above the 75% safety threshold.
          </p>
        </div>
        <button
          id="add-subject-btn"
          onClick={handleAdd}
          className="btn-primary flex items-center gap-2 text-sm py-2.5 px-5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </button>
      </div>

      {/* Summary Cards */}
      <SummaryBar records={records} />

      {/* Main Grid List */}
      {records.length === 0 ? (
        <GlassCard className="p-0">
          <EmptyState onAdd={handleAdd} />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map(record => (
            <SubjectCard
              key={record.id}
              record={record}
              onMark={handleMark}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteTarget(id)}
            />
          ))}
        </div>
      )}

      {/* Forms and Confirms */}
      {showForm && (
        <SubjectFormModal
          initial={editTarget}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditTarget(null);
          }}
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

export default AttendanceTrackerPage;
