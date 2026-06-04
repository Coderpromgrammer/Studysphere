'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Home, BookOpen, Timer, MessageCircle, User, Plus, Send,
  Play, Pause, RotateCcw, LogOut, Sparkles, Trash2,
  Heart, Brain, Moon, Volume2, Bell, Save, ArrowRight, X
} from 'lucide-react';

/* ─── Types ─── */
type MoodType = 'calm' | 'happy' | 'okay' | 'low' | 'energized';
type TabType = 'dashboard' | 'journal' | 'focus' | 'chat' | 'profile';

interface JournalEntry { id: string; title: string; content: string; mood: string; tags: string; createdAt: string; }
interface MoodLog { id: string; mood: string; note: string; createdAt: string; }
interface FocusSession { id: string; duration: number; completedAt: string; }
interface ChatMsg { id: string; role: string; content: string; createdAt: string; }
interface User { id: string; email: string; name: string; }

const MOOD_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  calm: { emoji: '😴', label: 'Calm', color: 'bg-softly-lavender/30 text-violet-600' },
  happy: { emoji: '🌸', label: 'Happy', color: 'bg-softly-coral/20 text-softly-coral' },
  okay: { emoji: '☁️', label: 'Okay', color: 'bg-softly-stone-100 text-softly-muted' },
  low: { emoji: '🌧', label: 'Low', color: 'bg-blue-50 text-blue-600' },
  energized: { emoji: '⚡', label: 'Energized', color: 'bg-softly-peach text-rose-600' },
};

/* ─── Auth Screen ─── */
function AuthScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        onLogin(data.user);
        localStorage.setItem('ss_user', JSON.stringify(data.user));
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } catch {
      toast.error('Connection error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-softly-bg relative overflow-hidden px-4">
      <div className="absolute top-10 left-[5%] w-72 h-72 bg-softly-coral/15 blob-shape blur-3xl animate-softly-float" />
      <div className="absolute top-40 right-[10%] w-56 h-56 bg-softly-lavender/25 blob-shape blur-3xl animate-softly-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-20 left-[30%] w-64 h-64 bg-softly-sage/25 blob-shape blur-3xl animate-softly-float" style={{ animationDelay: '4s' }} />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 glass-strong rounded-3xl p-8 md:p-10 w-full max-w-md">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-softly-coral/20 blob-shape blur-2xl animate-softly-float" />
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-softly-lavender/30 blob-shape blur-2xl animate-softly-float" style={{ animationDelay: '1s' }} />

        <div className="relative z-10">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-softly-coral/20 flex items-center justify-center mx-auto mb-4">
              <span className="font-accent text-3xl text-softly-coral">S</span>
            </div>
            <h1 className="text-3xl font-bold text-softly-dark">Study<span className="text-softly-coral">Sphere</span></h1>
            <p className="font-accent text-2xl text-softly-coral mt-1">your mindful study companion</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="text-sm font-medium text-softly-dark mb-1.5 block">Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                  className="w-full h-11 px-4 rounded-xl border border-softly-stone-200 bg-white/60 text-sm text-softly-dark placeholder:text-softly-muted focus:outline-none focus:border-softly-coral focus:ring-2 focus:ring-softly-coral/20 transition-all" />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-softly-dark mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                className="w-full h-11 px-4 rounded-xl border border-softly-stone-200 bg-white/60 text-sm text-softly-dark placeholder:text-softly-muted focus:outline-none focus:border-softly-coral focus:ring-2 focus:ring-softly-coral/20 transition-all" />
            </div>
            <button type="submit" disabled={loading || !email.trim()}
              className="w-full h-11 rounded-full bg-softly-coral text-softly-dark font-medium text-sm shadow-[0_4px_16px_rgba(255,183,178,0.4)] hover:bg-softly-coral-light hover:shadow-[0_8px_24px_rgba(255,183,178,0.55)] hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-45 disabled:pointer-events-none flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-softly-dark/30 border-t-softly-dark rounded-full animate-spin" /> : (isSignUp ? 'Create Account' : 'Sign In')}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="text-center text-sm text-softly-muted mt-6">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-softly-coral font-medium hover:underline">
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Sidebar ─── */
function Sidebar({ active, onChange }: { active: TabType; onChange: (t: TabType) => void }) {
  const items: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { key: 'journal', label: 'Journal', icon: <BookOpen className="w-5 h-5" /> },
    { key: 'focus', label: 'Focus', icon: <Timer className="w-5 h-5" /> },
    { key: 'chat', label: 'AI Chat', icon: <MessageCircle className="w-5 h-5" /> },
    { key: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <aside className="hidden md:flex flex-col w-56 glass-strong border-r border-softly-stone-200/60 shrink-0">
      <div className="flex items-center gap-3 px-5 h-16 border-b border-softly-stone-200/60">
        <div className="w-9 h-9 rounded-full bg-softly-coral/20 flex items-center justify-center">
          <span className="font-accent text-xl text-softly-coral">S</span>
        </div>
        <span className="text-lg font-bold text-softly-dark">StudySphere</span>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {items.map(item => (
          <button key={item.key} onClick={() => onChange(item.key)}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all relative ${
              active === item.key ? 'bg-softly-coral/15 text-softly-dark' : 'text-softly-muted hover:bg-softly-stone-100 hover:text-softly-dark'
            }`}>
            {active === item.key && (
              <motion.div layoutId="sidebar-active" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-softly-coral rounded-r-full"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
            )}
            <span className={active === item.key ? 'text-softly-coral' : ''}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

/* ─── Bottom Nav (Mobile) ─── */
function BottomNav({ active, onChange }: { active: TabType; onChange: (t: TabType) => void }) {
  const items: { key: TabType; icon: React.ReactNode; label: string }[] = [
    { key: 'dashboard', icon: <Home className="w-5 h-5" />, label: 'Home' },
    { key: 'journal', icon: <BookOpen className="w-5 h-5" />, label: 'Journal' },
    { key: 'focus', icon: <Timer className="w-5 h-5" />, label: 'Focus' },
    { key: 'chat', icon: <MessageCircle className="w-5 h-5" />, label: 'Chat' },
    { key: 'profile', icon: <User className="w-5 h-5" />, label: 'Profile' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-softly-stone-200/60">
      <div className="flex items-center justify-around py-2 px-2">
        {items.map(item => (
          <button key={item.key} onClick={() => onChange(item.key)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors ${
              active === item.key ? 'text-softly-coral' : 'text-softly-muted'
            }`}>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
              active === item.key ? 'bg-softly-coral/20' : ''
            }`}>{item.icon}</div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

/* ─── Dashboard Panel ─── */
function DashboardPanel({ user, entries, moods, focusData, onRefreshMoods }: { user: User; entries: JournalEntry[]; moods: MoodLog[]; focusData: { totalMinutes: number; streak: number }; onRefreshMoods: () => void }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const todayMood = moods.find(m => new Date(m.createdAt).toDateString() === new Date().toDateString());

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-softly-dark">{greeting}, <span className="text-softly-coral">{user.name}</span></h1>
        <p className="text-softly-muted mt-1">{today}</p>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Journal Entries', value: entries.length, emoji: '📓' },
          { label: 'Study Streak', value: `${focusData.streak}d`, emoji: '🔥' },
          { label: 'Focus Time', value: `${Math.round(focusData.totalMinutes / 60)}h`, emoji: '⏱' },
          { label: 'Today\'s Mood', value: todayMood ? MOOD_CONFIG[todayMood.mood]?.emoji || '—' : '—', emoji: '💭' },
        ].map(stat => (
          <div key={stat.label} className="glass rounded-2xl p-5 hover:-translate-y-1 transition-transform cursor-default">
            <div className="text-xs text-softly-muted font-medium uppercase tracking-wider">{stat.label}</div>
            <div className="text-2xl font-semibold text-softly-dark mt-2">{stat.emoji} {stat.value}</div>
          </div>
        ))}
      </motion.div>

      {/* Mood Check-in */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-softly-dark mb-4">
          {todayMood ? `Today you're feeling ${MOOD_CONFIG[todayMood.mood]?.label || todayMood.mood}` : 'How are you feeling today?'}
        </h2>
        {!todayMood && <MoodSelector userId={user.id} onLogged={onRefreshMoods} />}
      </motion.div>

      {/* Recent Entries */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h2 className="text-lg font-semibold text-softly-dark mb-4">Recent Journal Entries</h2>
        {entries.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entries.slice(0, 3).map((entry, i) => {
              const mc = MOOD_CONFIG[entry.mood] || MOOD_CONFIG.okay;
              return (
                <div key={entry.id} className="bg-white rounded-2xl p-5 shadow-sm hover:-translate-y-1 transition-transform"
                  style={{ transform: `rotate(${i % 2 === 0 ? -0.5 : 0.5}deg)` }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-softly-muted">{new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${mc.color}`}>{mc.emoji} {mc.label}</span>
                  </div>
                  <h3 className="font-medium text-softly-dark mb-1">{entry.title}</h3>
                  <p className="text-sm text-softly-muted line-clamp-2">{entry.content}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass rounded-2xl p-8 text-center">
            <Sparkles className="w-8 h-8 text-softly-coral mx-auto mb-3" />
            <p className="text-softly-muted">No journal entries yet. Start writing!</p>
          </div>
        )}
      </motion.div>

      {/* Quote */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -top-4 -left-2 font-accent text-7xl text-softly-coral/20 select-none">&ldquo;</div>
        <p className="text-lg leading-relaxed text-softly-dark relative z-10 mt-4">
          The secret of getting ahead is getting <span className="font-accent text-2xl text-softly-coral">started</span>.
        </p>
        <p className="text-sm text-softly-muted mt-3 relative z-10">— Mark Twain</p>
        <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-softly-coral/10 blob-shape" />
      </motion.div>
    </div>
  );
}

/* ─── Mood Selector ─── */
function MoodSelector({ userId, onLogged }: { userId: string; onLogged: () => void }) {
  const [selected, setSelected] = useState<MoodType | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (mood: MoodType) => {
    setSelected(mood);
    setLoading(true);
    try {
      const res = await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, mood }),
      });
      if (res.ok) {
        toast.success(`Mood logged: ${MOOD_CONFIG[mood].emoji} ${MOOD_CONFIG[mood].label}`);
        onLogged();
      }
    } catch { toast.error('Failed to log mood'); }
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {(Object.entries(MOOD_CONFIG) as [MoodType, typeof MOOD_CONFIG.calm][]).map(([key, cfg]) => (
        <button key={key} onClick={() => handleSelect(key)} disabled={loading}
          className={`flex flex-col items-center gap-1 rounded-full border-2 px-3 py-2 transition-all hover:scale-105 active:scale-95 ${
            selected === key ? cfg.color + ' border-current' : 'border-transparent bg-softly-stone-100/50'
          }`} style={{ minWidth: 52 }}>
          <span className="text-lg">{cfg.emoji}</span>
          <span className="text-[9px] font-medium text-softly-muted leading-none">{cfg.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ─── Journal Panel ─── */
function JournalPanel({ user, entries, onRefresh }: { user: User; entries: JournalEntry[]; onRefresh: () => void }) {
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<MoodType | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  const handleSave = async () => {
    if (!title.trim() || !content.trim() || !mood) return;
    setSaving(true);
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, title: title.trim(), content: content.trim(), mood, tags: '' }),
      });
      if (res.ok) {
        toast.success('Entry saved!');
        setTitle(''); setContent(''); setMood(null); setShowNew(false);
        onRefresh();
      } else { toast.error('Failed to save entry'); }
    } catch { toast.error('Connection error'); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/journal?id=${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Entry deleted'); onRefresh(); }
    } catch { toast.error('Failed to delete'); }
  };

  const filtered = filter === 'all' ? entries : entries.filter(e => e.mood === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-softly-dark">My Journal</h1>
          <p className="text-softly-muted mt-1">Your thoughts, feelings, and reflections</p>
        </div>
        <button onClick={() => setShowNew(!showNew)}
          className="h-11 px-6 rounded-full bg-softly-coral text-softly-dark font-medium text-sm shadow-[0_4px_16px_rgba(255,183,178,0.4)] hover:bg-softly-coral-light hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Entry
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="glass rounded-full p-1 inline-flex">
        {[{ key: 'all', label: 'All' }, ...Object.entries(MOOD_CONFIG).map(([k, v]) => ({ key: k, label: `${v.emoji} ${v.label}` }))]
          .map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className={`relative z-10 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                filter === tab.key ? 'text-softly-dark' : 'text-softly-muted'
              }`}>
              {filter === tab.key && (
                <motion.div layoutId="journal-tab" className="absolute inset-0 bg-softly-coral rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
      </div>

      {/* New Entry Form */}
      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass-strong rounded-2xl p-6 space-y-4 relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-softly-coral/15 blob-shape blur-2xl animate-softly-float" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-softly-dark">New Entry</h3>
                <button onClick={() => setShowNew(false)} className="text-softly-muted hover:text-softly-dark transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div>
                <label className="text-sm font-medium text-softly-dark mb-2 block">Mood</label>
                <div className="flex items-center gap-3 flex-wrap">
                  {(Object.entries(MOOD_CONFIG) as [MoodType, typeof MOOD_CONFIG.calm][]).map(([key, cfg]) => (
                    <button key={key} onClick={() => setMood(key)}
                      className={`flex flex-col items-center gap-1 rounded-full border-2 px-3 py-2 transition-all ${
                        mood === key ? cfg.color + ' border-current' : 'border-transparent bg-softly-stone-100/50'
                      }`} style={{ minWidth: 52 }}>
                      <span className="text-lg">{cfg.emoji}</span>
                      <span className="text-[9px] font-medium text-softly-muted">{cfg.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-softly-dark mb-1.5 block">Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Give your entry a title..."
                  className="w-full h-11 px-4 rounded-xl border border-softly-stone-200 bg-white/60 text-sm text-softly-dark placeholder:text-softly-muted focus:outline-none focus:border-softly-coral focus:ring-2 focus:ring-softly-coral/20 transition-all" />
              </div>
              <div>
                <label className="text-sm font-medium text-softly-dark mb-1.5 block">Your thoughts</label>
                <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="What's on your mind today..." rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-softly-stone-200 bg-white/60 text-sm text-softly-dark placeholder:text-softly-muted focus:outline-none focus:border-softly-coral focus:ring-2 focus:ring-softly-coral/20 transition-all resize-none ruled-lines" />
              </div>
              <button onClick={handleSave} disabled={saving || !title.trim() || !content.trim() || !mood}
                className="h-11 px-6 rounded-full bg-softly-coral text-softly-dark font-medium text-sm shadow-[0_4px_16px_rgba(255,183,178,0.4)] hover:bg-softly-coral-light hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-45 disabled:pointer-events-none flex items-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-softly-dark/30 border-t-softly-dark rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Save Entry
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entries Grid */}
      {filtered.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((entry, i) => {
            const mc = MOOD_CONFIG[entry.mood] || MOOD_CONFIG.okay;
            return (
              <motion.div key={entry.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl p-5 shadow-sm hover:-translate-y-1 transition-transform group relative"
                style={{ transform: `rotate(${i % 3 === 0 ? -0.5 : i % 3 === 1 ? 0.5 : 0}deg)` }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-softly-muted">{new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${mc.color}`}>{mc.emoji} {mc.label}</span>
                </div>
                <h3 className="font-medium text-softly-dark mb-1">{entry.title}</h3>
                <p className="text-sm text-softly-muted line-clamp-3">{entry.content}</p>
                <button onClick={() => handleDelete(entry.id)}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-transparent hover:bg-softly-error/10 text-softly-muted hover:text-softly-error flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="glass rounded-2xl p-8 text-center">
          <Sparkles className="w-8 h-8 text-softly-coral mx-auto mb-3" />
          <p className="text-softly-muted mb-1">No journal entries yet</p>
          <p className="font-accent text-xl text-softly-coral">write your first entry</p>
        </div>
      )}
    </div>
  );
}

/* ─── Focus Panel ─── */
function FocusPanel({ user, focusData, onRefresh }: { user: User; focusData: { totalMinutes: number; streak: number }; onRefresh: () => void }) {
  const presets = [{ value: '25', label: 'Focus 25m', mins: 25 }, { value: '15', label: 'Short 15m', mins: 15 }, { value: '5', label: 'Break 5m', mins: 5 }];
  const [preset, setPreset] = useState('25');
  const [totalSec, setTotalSec] = useState(25 * 60);
  const [secsLeft, setSecsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const pct = totalSec > 0 ? ((totalSec - secsLeft) / totalSec) * 100 : 0;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const changePreset = (val: string) => {
    const p = presets.find(x => x.value === val);
    if (p) { setPreset(val); setTotalSec(p.mins * 60); setSecsLeft(p.mins * 60); setRunning(false); if (intervalRef.current) clearInterval(intervalRef.current); }
  };

  const toggle = () => { if (!running && secsLeft === 0) setSecsLeft(totalSec); setRunning(!running); };
  const reset = () => { setRunning(false); setSecsLeft(totalSec); if (intervalRef.current) clearInterval(intervalRef.current); };

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecsLeft(prev => {
          if (prev <= 1) {
            setRunning(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            const mins = Math.round(totalSec / 60);
            fetch('/api/focus', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, duration: mins }) }).catch(() => {});
            setSessions(s => s + 1);
            onRefresh();
            toast.success(`Focus session complete! ${mins} minutes done 🎉`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, totalSec, user.id, onRefresh]);

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold text-softly-dark">Focus Timer</h1><p className="text-softly-muted mt-1">Stay in the zone with mindful focus sessions</p></div>

      <div className="flex flex-col items-center">
        <div className="glass-strong rounded-3xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-softly-coral/15 blob-shape blur-3xl animate-softly-float" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-softly-sage/20 blob-shape blur-3xl animate-softly-float" style={{ animationDelay: '3s' }} />

          <div className="relative z-10 flex flex-col items-center">
            <div className="relative">
              <svg width={220} height={220} className="-rotate-90">
                <defs>
                  <linearGradient id="coral-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFB7B2" />
                    <stop offset="100%" stopColor="#FFE4E1" />
                  </linearGradient>
                </defs>
                <circle cx={110} cy={110} r={radius} fill="none" stroke="#E7E5E4" strokeWidth={8} />
                <circle cx={110} cy={110} r={radius} fill="none" stroke="url(#coral-grad)" strokeWidth={8}
                  strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
                  className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-softly-dark tabular-nums">{fmt(secsLeft)}</span>
                <span className="text-xs text-softly-muted mt-1">{running ? 'focusing...' : 'ready'}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-8">
              <button onClick={reset} className="w-11 h-11 rounded-full glass flex items-center justify-center text-softly-muted hover:text-softly-dark transition-colors">
                <RotateCcw className="w-5 h-5" />
              </button>
              <button onClick={toggle}
                className="h-12 px-8 rounded-full bg-softly-coral text-softly-dark font-medium text-sm shadow-[0_4px_16px_rgba(255,183,178,0.4)] hover:bg-softly-coral-light hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center gap-2">
                {running ? <><Pause className="w-5 h-5" /> Pause</> : <><Play className="w-5 h-5" /> {secsLeft === 0 ? 'Restart' : 'Start'}</>}
              </button>
              <div className="w-11" />
            </div>
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="glass rounded-full p-1 inline-flex mx-auto">
        {presets.map(p => (
          <button key={p.value} onClick={() => changePreset(p.value)}
            className={`relative z-10 px-4 py-2 text-sm font-medium rounded-full transition-colors ${preset === p.value ? 'text-softly-dark' : 'text-softly-muted'}`}>
            {preset === p.value && (
              <motion.div layoutId="focus-tab" className="absolute inset-0 bg-softly-coral rounded-full"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
            )}
            <span className="relative z-10">{p.label}</span>
          </button>
        ))}
      </div>

      {/* Session Stats */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-softly-dark mb-2">Sessions Today</h3>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-softly-coral">{sessions}</div>
            <div className="text-sm text-softly-muted">{sessions === 0 ? 'Start your first session!' : `${sessions * 25} minutes of focus.`}</div>
          </div>
        </div>
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-softly-dark mb-2">Total Focus Time</h3>
          <div className="text-4xl font-bold text-softly-coral">{Math.round(focusData.totalMinutes / 60)}h</div>
          <div className="text-sm text-softly-muted">{focusData.streak} day streak 🔥</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Chat Panel ─── */
function ChatPanel({ user }: { user: User }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/chat?userId=${user.id}`).then(r => r.json()).then(d => setMessages(d.messages || [])).catch(() => {});
  }, [user.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    const userMsg: ChatMsg = { id: Date.now().toString(), role: 'user', content: msg, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, message: msg }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.response, createdAt: new Date().toISOString() }]);
      }
    } catch { toast.error('Failed to get response'); }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <div className="w-10 h-10 rounded-full bg-softly-lavender/30 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-softly-dark">AI Study Buddy</h1>
          <p className="text-sm text-softly-muted">Ask me anything about studying</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto softly-scrollbar space-y-4 pr-2 min-h-0">
        {messages.length === 0 && (
          <div className="glass rounded-2xl p-4 max-w-[75%]">
            <p className="text-sm text-softly-dark">Hey there! 👋 I&apos;m your StudySphere AI buddy. I can help with study tips, motivation, and questions. What would you like to talk about?</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-softly-lavender/30 flex items-center justify-center shrink-0 mt-1">
                <Sparkles className="w-4 h-4 text-violet-600" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-softly-coral/20 text-softly-dark' : 'glass text-softly-dark'}`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              <span className="text-[10px] text-softly-muted mt-1 block">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-softly-lavender/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-violet-600 animate-spin" />
            </div>
            <div className="glass rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-softly-coral rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-softly-coral rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-softly-coral rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 mt-4">
        <div className="glass-strong rounded-2xl p-3 flex items-center gap-3">
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask your study buddy..." disabled={loading}
            className="flex-1 bg-transparent text-sm text-softly-dark placeholder:text-softly-muted focus:outline-none px-2" />
          <button onClick={handleSend} disabled={!input.trim() || loading}
            className="h-9 px-4 rounded-full bg-softly-coral text-softly-dark font-medium text-sm shadow-[0_4px_16px_rgba(255,183,178,0.4)] hover:bg-softly-coral-light active:scale-[0.98] transition-all disabled:opacity-45 disabled:pointer-events-none flex items-center gap-1.5">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Profile Panel ─── */
function ProfilePanel({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [notifs, setNotifs] = useState(true);
  const [sounds, setSounds] = useState(false);
  const [studyMode, setStudyMode] = useState('balanced');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div><h1 className="text-3xl font-bold text-softly-dark">Profile</h1><p className="text-softly-muted mt-1">Manage your account and preferences</p></div>

      <div className="glass-strong rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-softly-coral/15 blob-shape blur-2xl animate-softly-float" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-softly-coral/20 flex items-center justify-center ring-2 ring-softly-coral/30">
            <span className="text-2xl font-bold text-softly-coral">{user.name?.[0]?.toUpperCase() || 'U'}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-softly-dark">{user.name}</h2>
            <p className="text-sm text-softly-muted">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-softly-coral/20 text-softly-coral">Active</span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-softly-sage text-green-700">Free Plan</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        <h3 className="text-lg font-semibold text-softly-dark flex items-center gap-2"><Brain className="w-5 h-5 text-softly-coral" /> Preferences</h3>
        {[
          { label: 'Notifications', desc: 'Get reminders and updates', icon: <Bell className="w-4 h-4" />, val: notifs, set: setNotifs },
          { label: 'Sound Effects', desc: 'Play sounds for actions', icon: <Volume2 className="w-4 h-4" />, val: sounds, set: setSounds },
        ].map(pref => (
          <div key={pref.label} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-softly-muted">{pref.icon}</span>
              <div><p className="text-sm font-medium text-softly-dark">{pref.label}</p><p className="text-xs text-softly-muted">{pref.desc}</p></div>
            </div>
            <button onClick={() => pref.set(!pref.val)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${pref.val ? 'bg-softly-coral' : 'bg-softly-stone-200'}`}>
              <span className={`block h-5 w-5 rounded-full bg-white shadow-sm mt-0.5 transition-transform duration-200 ${pref.val ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-softly-dark mb-4">Study Style</h3>
        <div className="space-y-2">
          {[
            { value: 'intensive', label: 'Intensive', desc: 'Longer sessions, fewer breaks' },
            { value: 'balanced', label: 'Balanced', desc: 'Moderate sessions with regular breaks' },
            { value: 'relaxed', label: 'Relaxed', desc: 'Shorter sessions, frequent breaks' },
          ].map(opt => (
            <button key={opt.value} onClick={() => setStudyMode(opt.value)}
              className={`w-full flex items-center gap-3 rounded-xl p-4 text-left transition-all ${studyMode === opt.value ? 'glass border-softly-coral/50' : 'hover:bg-softly-stone-100'}`}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${studyMode === opt.value ? 'border-softly-coral' : 'border-softly-stone-200'}`}>
                {studyMode === opt.value && <div className="w-2.5 h-2.5 rounded-full bg-softly-coral" />}
              </div>
              <div><p className="text-sm font-medium text-softly-dark">{opt.label}</p><p className="text-xs text-softly-muted">{opt.desc}</p></div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <button onClick={onLogout}
          className="w-full h-11 rounded-full glass border-[1.5px] border-softly-stone-200 text-sm font-medium text-softly-dark hover:border-softly-coral transition-colors flex items-center justify-center gap-2">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN APP
   ════════════════════════════════════════════ */
export default function StudySphereApp() {
  // Initialize from localStorage - using lazy initializer pattern
  const getInitialUser = (): User | null => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('ss_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  };

  const [user, setUser] = useState<User | null>(getInitialUser);
  const [tab, setTab] = useState<TabType>('dashboard');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [moods, setMoods] = useState<MoodLog[]>([]);
  const [focusData, setFocusData] = useState({ totalMinutes: 0, streak: 0 });

  // Fetch data when user changes
  const refreshData = useCallback(() => {
    if (!user) return;
    fetch(`/api/journal?userId=${user.id}`).then(r => r.json()).then(d => setEntries(d.entries || [])).catch(() => {});
    fetch(`/api/mood?userId=${user.id}`).then(r => r.json()).then(d => setMoods(d.moods || [])).catch(() => {});
    fetch(`/api/focus?userId=${user.id}`).then(r => r.json()).then(d => setFocusData({ totalMinutes: d.totalMinutes || 0, streak: d.streak || 0 })).catch(() => {});
  }, [user]);

  useEffect(() => { refreshData(); }, [refreshData]);

  const handleLogin = (u: User) => { setUser(u); };
  const handleLogout = () => { setUser(null); localStorage.removeItem('ss_user'); toast.success('Signed out'); };

  if (!user) return <AuthScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-softly-bg flex">
      <Sidebar active={tab} onChange={setTab} />

      <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-8 overflow-y-auto max-h-screen softly-scrollbar">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {tab === 'dashboard' && <DashboardPanel user={user} entries={entries} moods={moods} focusData={focusData} onRefreshMoods={refreshData} />}
              {tab === 'journal' && <JournalPanel user={user} entries={entries} onRefresh={refreshData} />}
              {tab === 'focus' && <FocusPanel user={user} focusData={focusData} onRefresh={refreshData} />}
              {tab === 'chat' && <ChatPanel user={user} />}
              {tab === 'profile' && <ProfilePanel user={user} onLogout={handleLogout} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
