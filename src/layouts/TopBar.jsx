import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Menu, Bell, Search, CheckCircle2, User, Settings, LogOut, X, Edit3,
  Mail, Calendar, GraduationCap, Sparkles, BellOff,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockUser } from '../data/mockData';
import { useScore } from '../context/ScoreContext';
import { generateAllNotifications } from '../utils/notificationEngine';

// ─── helpers ─────────────────────────────────────────────────────────────────
const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

const loadProfile = () => {
  try {
    const raw = localStorage.getItem('levitateiq_user_profile');
    if (raw) {
      const p = JSON.parse(raw);
      return {
        name: p.name || mockUser.name,
        education: p.education || mockUser.education,
        classOrSemester: p.currentClass || p.semester || mockUser.semester,
        email: p.email || mockUser.email,
        joinDate: p.joinDate || 'May 2026',
        avatar: getInitials(p.name || mockUser.name),
      };
    }
  } catch (err) {
    console.warn('Failed to load profile from localStorage:', err);
  }
  return {
    name: mockUser.name,
    education: mockUser.education,
    classOrSemester: mockUser.semester,
    email: mockUser.email,
    joinDate: 'May 2026',
    avatar: mockUser.avatar,
  };
};

// ─── Severity config for notification items ───────────────────────────────────
const severityStyle = {
  danger:  { bg: 'bg-red-500/10',     dot: 'bg-red-400',     text: 'text-red-400',     icon: 'bg-red-500/20'     },
  warning: { bg: 'bg-amber-500/8',    dot: 'bg-amber-400',   text: 'text-amber-400',   icon: 'bg-amber-500/20'   },
  info:    { bg: 'bg-blue-500/5',     dot: 'bg-blue-400',    text: 'text-blue-400',    icon: 'bg-blue-500/20'    },
  good:    { bg: 'bg-emerald-500/8',  dot: 'bg-emerald-400', text: 'text-emerald-400', icon: 'bg-emerald-500/20' },
};

// ─── Modal backdrop ──────────────────────────────────────────────────────────
const Backdrop = ({ onClose, children }) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
    onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
  >
    {children}
  </div>
);

// ─── View Profile Modal ──────────────────────────────────────────────────────
const ViewProfileModal = ({ profile, onClose, onEdit }) => (
  <Backdrop onClose={onClose}>
    <div className="w-full max-w-sm bg-dark-800 border border-white/10 rounded-2xl shadow-[0_25px_60px_-10px_rgba(0,0,0,0.6)] animate-fade-in overflow-hidden">
      <div className="relative h-20 bg-gradient-to-r from-accent-purple/40 to-accent-blue/30">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="absolute -bottom-6 left-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center text-white text-lg font-bold border-2 border-dark-800 shadow-glow-purple">
          {profile.avatar}
        </div>
      </div>

      <div className="pt-10 px-6 pb-6">
        <h2 className="text-xl font-bold text-white">{profile.name}</h2>
        <p className="text-xs text-accent-purple mt-0.5 mb-5">Student · LevitateIQ</p>

        <div className="space-y-3">
          {[
            { icon: Mail,           label: 'Email',            value: profile.email },
            { icon: GraduationCap,  label: 'Education Level',  value: profile.education },
            { icon: Sparkles,       label: 'Class / Semester', value: profile.classOrSemester },
            { icon: Calendar,       label: 'Member Since',     value: profile.joinDate },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 bg-dark-700/50 rounded-xl px-4 py-3">
              <div className="w-7 h-7 rounded-lg bg-accent-purple/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-accent-purple" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
                <p className="text-sm text-white font-medium">{value || '—'}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onEdit}
            className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5 text-sm"
          >
            <Edit3 className="w-4 h-4" /> Edit Profile
          </button>
          <button onClick={onClose} className="btn-secondary px-4 py-2.5 text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  </Backdrop>
);

// ─── Edit Profile Modal ──────────────────────────────────────────────────────
const EditProfileModal = ({ profile, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: profile.name,
    education: profile.education,
    classOrSemester: profile.classOrSemester,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    let stored = {};
    try {
      const raw = localStorage.getItem('levitateiq_user_profile');
      if (raw) stored = JSON.parse(raw);
    } catch (err) {
      console.warn('Failed to load stored profile:', err);
    }

    const updated = {
      ...stored,
      name: form.name,
      education: form.education,
      ...(form.education === 'High School'
        ? { currentClass: form.classOrSemester, semester: '' }
        : { semester: form.classOrSemester, currentClass: '' }),
    };
    localStorage.setItem('levitateiq_user_profile', JSON.stringify(updated));
    onSave({
      name: form.name,
      education: form.education,
      classOrSemester: form.classOrSemester,
      avatar: getInitials(form.name),
    });
    setSaved(true);
    setTimeout(onClose, 900);
  };

  const classOptions =
    form.education === 'High School'
      ? ['9th', '10th', '11th', '12th']
      : ['Semester 1','Semester 2','Semester 3','Semester 4','Semester 5','Semester 6','Semester 7','Semester 8'];

  return (
    <Backdrop onClose={onClose}>
      <div className="w-full max-w-sm bg-dark-800 border border-white/10 rounded-2xl shadow-[0_25px_60px_-10px_rgba(0,0,0,0.6)] animate-fade-in overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-dark-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent-purple/15 flex items-center justify-center">
              <Edit3 className="w-4 h-4 text-accent-purple" />
            </div>
            <h3 className="text-base font-bold text-white">Edit Profile</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="label-text">Full Name</label>
            <input
              className="input-field"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="label-text">Education Level</label>
            <select
              className="input-field appearance-none"
              value={form.education}
              onChange={e => setForm({ ...form, education: e.target.value, classOrSemester: '' })}
            >
              <option value="">Select level</option>
              <option value="High School">High School</option>
              <option value="College">College</option>
            </select>
          </div>

          {form.education && (
            <div className="animate-fade-in">
              <label className="label-text">
                {form.education === 'High School' ? 'Current Class' : 'Current Semester'}
              </label>
              <select
                className="input-field appearance-none"
                value={form.classOrSemester}
                onChange={e => setForm({ ...form, classOrSemester: e.target.value })}
              >
                <option value="">Select {form.education === 'High School' ? 'class' : 'semester'}</option>
                {classOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          )}

          {saved && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4" /> Profile saved!
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={!form.name.trim() || saved}
              className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-50"
            >
              Save Changes
            </button>
            <button onClick={onClose} className="btn-secondary px-4 py-2.5 text-sm">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Backdrop>
  );
};

// ─── Settings Modal ──────────────────────────────────────────────────────────
const SettingsModal = ({ onClose }) => (
  <Backdrop onClose={onClose}>
    <div className="w-full max-w-sm bg-dark-800 border border-white/10 rounded-2xl shadow-[0_25px_60px_-10px_rgba(0,0,0,0.6)] animate-fade-in overflow-hidden">
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-dark-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-accent-purple/15 flex items-center justify-center">
            <Settings className="w-4 h-4 text-accent-purple" />
          </div>
          <h3 className="text-base font-bold text-white">Settings</h3>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple/20 to-accent-blue/10 flex items-center justify-center mb-4">
          <Settings className="w-8 h-8 text-accent-purple/60" />
        </div>
        <h4 className="text-white font-bold mb-2">Coming Soon</h4>
        <p className="text-sm text-gray-400 leading-relaxed">
          Settings and preferences will be available soon.<br />
          Stay tuned for theme, notification, and accessibility controls.
        </p>
        <button onClick={onClose} className="btn-secondary mt-6 px-6 py-2.5 text-sm">
          Got it
        </button>
      </div>
    </div>
  </Backdrop>
);

// ─── NotificationItem ────────────────────────────────────────────────────────
const NotificationItem = ({ notif, onMarkRead }) => {
  const cfg = severityStyle[notif.severity] || severityStyle.info;
  return (
    <div
      onClick={() => onMarkRead(notif.id)}
      className={`
        px-4 py-3.5 border-b border-white/5 cursor-pointer
        transition-all duration-150 hover:bg-white/5
        ${!notif.read ? cfg.bg : ''}
      `}
    >
      <div className="flex gap-3 items-start">
        {/* Emoji icon */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.icon}`}>
          <span className="text-lg leading-none">{notif.emoji}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Category + timestamp row */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className={`text-[11px] font-bold uppercase tracking-wide ${cfg.text}`}>
              {notif.category}
            </span>
            <span className="text-[10px] text-gray-500 whitespace-nowrap flex-shrink-0">
              {notif.timestamp}
            </span>
          </div>

          {/* Title */}
          <p className={`text-sm font-semibold leading-snug mb-1 ${!notif.read ? 'text-white' : 'text-gray-300'}`}>
            {notif.title}
          </p>

          {/* Message */}
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
            {notif.message}
          </p>
        </div>

        {/* Unread dot */}
        {!notif.read && (
          <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${cfg.dot}`} />
        )}
      </div>
    </div>
  );
};

// ─── TopBar ──────────────────────────────────────────────────────────────────
const TopBar = ({ onMenuClick, title }) => {
  const navigate = useNavigate();
  const { logs } = useScore();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu,   setShowProfileMenu]   = useState(false);
  const [activeModal,       setActiveModal]       = useState(null);
  const [userProfile,       setUserProfile]       = useState(loadProfile);

  // Generate notifications from all real data sources
  const [readIds, setReadIds] = useState(() => {
    try {
      const raw = localStorage.getItem('levitateiq_read_notif_ids');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (err) {
      console.warn('Failed to load read notification IDs:', err);
      return new Set();
    }
  });

  // Memoize so we don't recompute on every render
  const baseNotifications = useMemo(
    () => generateAllNotifications(logs),
    [logs]
  );

  // Merge read state
  const notifications = useMemo(
    () => baseNotifications.map(n => ({ ...n, read: readIds.has(n.id) })),
    [baseNotifications, readIds]
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const persistReadIds = useCallback((ids) => {
    try {
      localStorage.setItem('levitateiq_read_notif_ids', JSON.stringify([...ids]));
    } catch (err) {
      console.warn('Failed to save read notification IDs:', err);
    }
  }, []);

  const dropdownRef = useRef(null);
  const profileRef  = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowNotifications(false);
      if (profileRef.current  && !profileRef.current.contains(e.target))  setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = e => {
      if (e.key === 'Escape') {
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const openModal  = modal => { setShowProfileMenu(false); setActiveModal(modal); };
  const closeModal = () => setActiveModal(null);

  const handleOpenNotifications = () => {
    const willOpen = !showNotifications;
    setShowNotifications(willOpen);
    setShowProfileMenu(false);
    // Mark all as read when opening
    if (willOpen && unreadCount > 0) {
      const newIds = new Set([...readIds, ...baseNotifications.map(n => n.id)]);
      setReadIds(newIds);
      persistReadIds(newIds);
    }
  };

  const handleMarkRead = useCallback((id) => {
    setReadIds(prev => {
      const next = new Set([...prev, id]);
      persistReadIds(next);
      return next;
    });
  }, [persistReadIds]);

  const handleMarkAllRead = () => {
    const newIds = new Set(baseNotifications.map(n => n.id));
    setReadIds(newIds);
    persistReadIds(newIds);
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    navigate('/');
  };

  const handleProfileSaved = updated => {
    setUserProfile(prev => ({ ...prev, ...updated }));
  };

  return (
    <>
      {/* ── Modals ── */}
      {activeModal === 'view'     && <ViewProfileModal profile={userProfile} onClose={closeModal} onEdit={() => { closeModal(); setTimeout(() => openModal('edit'), 50); }} />}
      {activeModal === 'edit'     && <EditProfileModal profile={userProfile} onClose={closeModal} onSave={handleProfileSaved} />}
      {activeModal === 'settings' && <SettingsModal onClose={closeModal} />}

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-dark-900/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between px-4 md:px-8 py-4">

          {/* Left */}
          <div className="flex items-center gap-4">
            <button onClick={onMenuClick} className="lg:hidden text-gray-400 hover:text-white transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-white">{title}</h2>
              <p className="text-xs text-gray-500">Welcome back, {userProfile.name.split(' ')[0]}</p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Search */}
            <button className="hidden md:flex items-center gap-2 bg-dark-700 px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white border border-white/5 hover:border-accent-purple/30 transition-all">
              <Search className="w-4 h-4" /><span>Search...</span>
            </button>

            {/* ── Notification Bell ── */}
            <div className="relative" ref={dropdownRef}>
              <button
                id="notification-bell"
                onClick={handleOpenNotifications}
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                className={`
                  relative p-2 rounded-xl border transition-all duration-200
                  ${showNotifications
                    ? 'bg-accent-purple/10 border-accent-purple/30 text-white'
                    : 'bg-dark-700 text-gray-400 border-white/5 hover:text-white hover:border-accent-purple/30'
                  }
                `}
              >
                <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-[wiggle_0.6s_ease-in-out]' : ''}`} />

                {/* Badge */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white shadow-lg px-1 leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* ── Notification Dropdown ── */}
              {showNotifications && (
                <div
                  className={`
                    absolute right-0 mt-3
                    w-[calc(100vw-2rem)] sm:w-96
                    max-w-sm sm:max-w-none
                    bg-dark-800/95 backdrop-blur-xl border border-white/10
                    rounded-2xl shadow-[0_16px_48px_-8px_rgba(0,0,0,0.6)]
                    overflow-hidden animate-fade-in z-50
                  `}
                >
                  {/* Header */}
                  <div className="px-4 py-3.5 border-b border-white/5 bg-dark-900/60 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-accent-purple" />
                      <h3 className="text-sm font-bold text-white">Notifications</h3>
                      {notifications.length > 0 && (
                        <span className="text-[10px] font-bold text-accent-purple bg-accent-purple/15 px-2 py-0.5 rounded-full border border-accent-purple/20">
                          {notifications.length}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-gray-400 hover:text-accent-purple transition-colors font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Notification list */}
                  <div className="max-h-[min(420px,70vh)] overflow-y-auto overscroll-contain">
                    {notifications.length === 0 ? (
                      <div className="p-10 text-center flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-dark-700 border border-white/5 flex items-center justify-center">
                          <BellOff className="w-6 h-6 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-300">No notifications yet</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Log your daily check-in to receive personalized alerts.
                          </p>
                        </div>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <NotificationItem
                          key={notif.id}
                          notif={notif}
                          onMarkRead={handleMarkRead}
                        />
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-3 border-t border-white/5 bg-dark-900/60">
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/ai-recommendations');
                        }}
                        className="w-full text-sm text-center text-accent-purple hover:text-white font-semibold
                                   py-2 rounded-xl hover:bg-accent-purple/10 border border-transparent
                                   hover:border-accent-purple/20 transition-all duration-200"
                      >
                        View all notifications →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Avatar / Profile Dropdown ── */}
            <div className="relative" ref={profileRef}>
              <div
                onClick={() => { setShowProfileMenu(v => !v); setShowNotifications(false); }}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:shadow-glow-purple transition-all"
              >
                {userProfile.avatar}
              </div>

              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-64 bg-dark-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-in z-50">
                  {/* Identity */}
                  <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-dark-900/50">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {userProfile.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{userProfile.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{userProfile.education} · {userProfile.classOrSemester}</p>
                    </div>
                  </div>

                  {/* Menu */}
                  <div className="p-2 flex flex-col">
                    <button onClick={() => openModal('view')} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                      <User className="w-4 h-4" /> View Profile
                    </button>
                    <button onClick={() => openModal('edit')} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                      <Edit3 className="w-4 h-4" /> Edit Profile
                    </button>
                    <button onClick={() => openModal('settings')} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                      <Settings className="w-4 h-4" /> Settings
                    </button>
                  </div>

                  <div className="p-2 border-t border-white/5 bg-dark-900/50">
                    <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all w-full">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default TopBar;
