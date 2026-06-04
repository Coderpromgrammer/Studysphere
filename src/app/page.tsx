'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth, useUser, SignInButton, UserButton } from '@clerk/nextjs';
import {
  Home, MessageCircle, User, Plus, Send,
  Sparkles, Trash2, Brain, Volume2, Bell,
  CheckCircle, XCircle, ArrowRight, X, Wand2,
  Trophy, RotateCcw, ChevronRight
} from 'lucide-react';

/* ─── Types ─── */
type MoodType = 'calm' | 'happy' | 'okay' | 'low' | 'energized';
type TabType = 'dashboard' | 'quiz' | 'chat' | 'profile';

interface MoodLog { id: string; mood: string; note: string; createdAt: string; }
interface ChatMsg { id: string; role: string; content: string; createdAt: string; }
interface DbUser { id: string; clerkId: string; email: string; name: string | null; avatar: string | null; }

interface QuizQuestionData {
  id?: string;
  question: string;
  options: string[];
  correctIdx: number;
}

interface QuizData {
  id: string;
  title: string;
  topic: string;
  difficulty: string;
  score: number | null;
  totalQuestions: number;
  completedAt: string | null;
  createdAt: string;
  questions: { id: string; question: string; options: string; correctIdx: number }[];
}

const MOOD_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  calm: { emoji: '😴', label: 'Calm', color: 'bg-softly-lavender/30 text-violet-600' },
  happy: { emoji: '🌸', label: 'Happy', color: 'bg-softly-coral/20 text-softly-coral' },
  okay: { emoji: '☁️', label: 'Okay', color: 'bg-softly-stone-100 text-softly-muted' },
  low: { emoji: '🌧', label: 'Low', color: 'bg-blue-50 text-blue-600' },
  energized: { emoji: '⚡', label: 'Energized', color: 'bg-softly-peach text-rose-600' },
};

const DIFFICULTY_CONFIG = {
  easy: { label: 'Easy', emoji: '🌱', color: 'bg-softly-sage text-green-700' },
  medium: { label: 'Medium', emoji: '🌿', color: 'bg-softly-peach text-rose-600' },
  hard: { label: 'Hard', emoji: '🔥', color: 'bg-softly-coral/20 text-softly-coral' },
};

const QUOTES = [
  { text: 'The secret of getting ahead is getting ', highlight: 'started', author: 'Mark Twain' },
  { text: 'Education is the most powerful weapon which you can use to change the ', highlight: 'world', author: 'Nelson Mandela' },
  { text: 'The beautiful thing about learning is that no one can take it away from ', highlight: 'you', author: 'B.B. King' },
  { text: 'Success is not final, failure is not fatal: it is the courage to continue that ', highlight: 'counts', author: 'Winston Churchill' },
];

/* ─── Sidebar ─── */
function Sidebar({ active, onChange }: { active: TabType; onChange: (t: TabType) => void }) {
  const items: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { key: 'quiz', label: 'Quiz Maker', icon: <Brain className="w-5 h-5" /> },
    { key: 'chat', label: 'AI Chat', icon: <MessageCircle className="w-5 h-5" /> },
    { key: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <aside className="hidden md:flex flex-col w-56 glass-strong border-r border-softly-stone-200/60 shrink-0">
      <div className="flex items-center gap-3 px-5 h-16 border-b border-softly-stone-200/60">
        <div className="w-9 h-9 rounded-full bg-softly-coral/20 flex items-center justify-center">
          <span className="font-accent text-xl text-softly-coral">i</span>
        </div>
        <span className="text-lg font-bold text-softly-dark">iStud</span>
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
      <div className="p-3 border-t border-softly-stone-200/60">
        <div className="flex items-center gap-2 px-2">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </aside>
  );
}

/* ─── Bottom Nav (Mobile) ─── */
function BottomNav({ active, onChange }: { active: TabType; onChange: (t: TabType) => void }) {
  const items: { key: TabType; icon: React.ReactNode; label: string }[] = [
    { key: 'dashboard', icon: <Home className="w-5 h-5" />, label: 'Home' },
    { key: 'quiz', icon: <Brain className="w-5 h-5" />, label: 'Quiz' },
    { key: 'chat', icon: <MessageCircle className="w-5 h-5" />, label: 'Chat' },
    { key: 'profile', icon: <User className="w-5 h-5" />, label: 'Profile' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-softly-stone-200/60 safe-area-bottom">
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

/* ─── Dashboard Panel ─── */
function DashboardPanel({ dbUser, moods, quizzes, onRefreshMoods }: {
  dbUser: DbUser; moods: MoodLog[]; quizzes: QuizData[]; onRefreshMoods: () => void;
}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const todayMood = moods.find(m => new Date(m.createdAt).toDateString() === new Date().toDateString());
  const completedQuizzes = quizzes.filter(q => q.score !== null);
  const avgScore = completedQuizzes.length > 0
    ? Math.round(completedQuizzes.reduce((sum, q) => sum + (q.score || 0), 0) / completedQuizzes.length)
    : 0;
  const quote = QUOTES[Math.floor(Date.now() / 86400000) % QUOTES.length];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-softly-dark">{greeting}, <span className="text-softly-coral">{dbUser.name || 'there'}</span></h1>
        <p className="text-softly-muted mt-1">{today}</p>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Quizzes Taken', value: completedQuizzes.length, emoji: '📝' },
          { label: 'Avg Score', value: `${avgScore}%`, emoji: '🎯' },
          { label: 'Total Quizzes', value: quizzes.length, emoji: '📚' },
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
        {!todayMood && <MoodSelector userId={dbUser.id} onLogged={onRefreshMoods} />}
      </motion.div>

      {/* Recent Quizzes */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h2 className="text-lg font-semibold text-softly-dark mb-4">Recent Quizzes</h2>
        {completedQuizzes.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedQuizzes.slice(0, 3).map((quiz, i) => {
              const diff = DIFFICULTY_CONFIG[quiz.difficulty as keyof typeof DIFFICULTY_CONFIG] || DIFFICULTY_CONFIG.medium;
              return (
                <div key={quiz.id} className="bg-white rounded-2xl p-5 shadow-sm hover:-translate-y-1 transition-transform"
                  style={{ transform: `rotate(${i % 2 === 0 ? -0.5 : 0.5}deg)` }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${diff.color}`}>{diff.emoji} {diff.label}</span>
                    <span className="text-xs text-softly-muted">{new Date(quiz.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <h3 className="font-medium text-softly-dark mb-1">{quiz.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Trophy className="w-4 h-4 text-softly-coral" />
                    <span className="text-sm font-semibold text-softly-dark">{quiz.score}/{quiz.totalQuestions}</span>
                    <span className="text-xs text-softly-muted">({Math.round(((quiz.score || 0) / quiz.totalQuestions) * 100)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass rounded-2xl p-8 text-center">
            <Brain className="w-8 h-8 text-softly-coral mx-auto mb-3" />
            <p className="text-softly-muted mb-1">No quizzes yet</p>
            <p className="font-accent text-xl text-softly-coral">take your first quiz!</p>
          </div>
        )}
      </motion.div>

      {/* Quote */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -top-4 -left-2 font-accent text-7xl text-softly-coral/20 select-none">&ldquo;</div>
        <p className="text-lg leading-relaxed text-softly-dark relative z-10 mt-4">
          {quote.text}<span className="font-accent text-2xl text-softly-coral">{quote.highlight}</span>.
        </p>
        <p className="text-sm text-softly-muted mt-3 relative z-10">— {quote.author}</p>
        <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-softly-coral/10 blob-shape" />
      </motion.div>
    </div>
  );
}

/* ─── Quiz Maker Panel ─── */
function QuizMakerPanel({ dbUser, onQuizzesChange }: { dbUser: DbUser; onQuizzesChange: () => void }) {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionData[] | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [quizHistory, setQuizHistory] = useState<QuizData[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchQuizHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/quiz?userId=${dbUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setQuizHistory(data.quizzes || []);
      }
    } catch { /* ignore */ }
  }, [dbUser.id]);

  // Load history
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/quiz?userId=${dbUser.id}`);
        if (res.ok && active) {
          const data = await res.json();
          setQuizHistory(data.quizzes || []);
        }
      } catch { /* ignore */ }
    };
    load();
    return () => { active = false; };
  }, [dbUser.id]);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }
    setGenerating(true);
    setQuizQuestions(null);
    setCurrentQ(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setScore(0);
    setQuizComplete(false);

    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), difficulty, numQuestions }),
      });

      if (res.ok) {
        const data = await res.json();
        setQuizQuestions(data.questions);
        toast.success('Quiz generated! Good luck! 🎯');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to generate quiz');
      }
    } catch {
      toast.error('Failed to generate quiz. Please try again.');
    }
    setGenerating(false);
  };

  const handleAnswer = (idx: number) => {
    if (answered || !quizQuestions) return;
    setSelectedAnswer(idx);
    setAnswered(true);
    const isCorrect = idx === quizQuestions[currentQ].correctIdx;
    if (isCorrect) {
      setScore(s => s + 1);
      toast.success('Correct! 🎉');
    } else {
      toast.error('Not quite! The correct answer is highlighted.');
    }
  };

  const handleNext = () => {
    if (!quizQuestions) return;
    if (currentQ < quizQuestions.length - 1) {
      setCurrentQ(c => c + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    } else {
      setQuizComplete(true);
      saveQuiz();
    }
  };

  const saveQuiz = async () => {
    if (!quizQuestions) return;
    setSaving(true);
    try {
      const finalScore = score;
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: dbUser.id,
          title: `${topic} - ${DIFFICULTY_CONFIG[difficulty].label}`,
          topic: topic.trim(),
          difficulty,
          totalQuestions: quizQuestions.length,
          score: finalScore,
          completedAt: new Date().toISOString(),
          questions: quizQuestions,
        }),
      });
      if (res.ok) {
        fetchQuizHistory();
        onQuizzesChange();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const resetQuiz = () => {
    setQuizQuestions(null);
    setCurrentQ(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setScore(0);
    setQuizComplete(false);
  };

  const handleDeleteQuiz = async (id: string) => {
    try {
      const res = await fetch(`/api/quiz?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Quiz deleted');
        fetchQuizHistory();
        onQuizzesChange();
      }
    } catch { toast.error('Failed to delete quiz'); }
  };

  const getOptionStyle = (idx: number) => {
    if (!answered || !quizQuestions) return 'border-softly-stone-200 hover:border-softly-coral hover:bg-softly-coral/5';
    if (idx === quizQuestions[currentQ].correctIdx) return 'border-softly-success bg-softly-sage';
    if (idx === selectedAnswer && idx !== quizQuestions[currentQ].correctIdx) return 'border-softly-error bg-red-50';
    return 'border-softly-stone-200 opacity-50';
  };

  const getOptionIcon = (idx: number) => {
    if (!answered || !quizQuestions) return null;
    if (idx === quizQuestions[currentQ].correctIdx) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (idx === selectedAnswer && idx !== quizQuestions[currentQ].correctIdx) return <XCircle className="w-5 h-5 text-red-500" />;
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-softly-dark">Quiz Maker</h1>
          <p className="text-softly-muted mt-1">Generate AI-powered quizzes on any topic</p>
        </div>
        <button onClick={() => setShowHistory(!showHistory)}
          className="h-11 px-5 rounded-full glass text-softly-dark font-medium text-sm hover:bg-softly-coral/10 transition-all flex items-center gap-2">
          <RotateCcw className="w-4 h-4" /> {showHistory ? 'Back to Quiz' : 'History'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {showHistory ? (
          /* ─── Quiz History ─── */
          <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {quizHistory.length > 0 ? (
              <div className="space-y-4">
                {quizHistory.map((quiz, i) => {
                  const diff = DIFFICULTY_CONFIG[quiz.difficulty as keyof typeof DIFFICULTY_CONFIG] || DIFFICULTY_CONFIG.medium;
                  const pct = quiz.score !== null ? Math.round((quiz.score / quiz.totalQuestions) * 100) : null;
                  return (
                    <motion.div key={quiz.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-2xl p-5 shadow-sm hover:-translate-y-0.5 transition-transform group relative">
                      <button onClick={() => handleDeleteQuiz(quiz.id)}
                        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-transparent hover:bg-softly-error/10 text-softly-muted hover:text-softly-error flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${diff.color}`}>{diff.emoji} {diff.label}</span>
                        <span className="text-xs text-softly-muted">{new Date(quiz.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <h3 className="font-medium text-softly-dark mb-1">{quiz.title}</h3>
                      <p className="text-sm text-softly-muted">{quiz.questions.length} questions</p>
                      {pct !== null && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-softly-dark">{quiz.score}/{quiz.totalQuestions}</span>
                            <span className="text-sm font-semibold text-softly-coral">{pct}%</span>
                          </div>
                          <div className="w-full h-2 bg-softly-stone-200 rounded-full overflow-hidden">
                            <div className="h-full bg-softly-coral rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="glass rounded-2xl p-8 text-center">
                <Brain className="w-8 h-8 text-softly-coral mx-auto mb-3" />
                <p className="text-softly-muted mb-1">No quiz history yet</p>
                <p className="font-accent text-xl text-softly-coral">generate your first quiz!</p>
              </div>
            )}
          </motion.div>
        ) : quizComplete && quizQuestions ? (
          /* ─── Quiz Results ─── */
          <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
            <div className="glass-strong rounded-3xl p-8 md:p-12 relative overflow-hidden text-center">
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-softly-coral/15 blob-shape blur-3xl animate-softly-float" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-softly-sage/20 blob-shape blur-3xl animate-softly-float" style={{ animationDelay: '3s' }} />
              <div className="relative z-10">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}>
                  <Trophy className="w-16 h-16 text-softly-coral mx-auto mb-4" />
                </motion.div>
                <h2 className="text-3xl font-bold text-softly-dark mb-2">Quiz Complete!</h2>
                <p className="text-softly-muted mb-6">{topic}</p>
                <div className="inline-flex items-center gap-3 glass rounded-full px-6 py-3 mb-6">
                  <span className="text-4xl font-bold text-softly-coral">{score}</span>
                  <span className="text-softly-muted">out of</span>
                  <span className="text-4xl font-bold text-softly-dark">{quizQuestions.length}</span>
                </div>
                <div className="text-2xl font-semibold text-softly-dark mb-6">
                  {Math.round((score / quizQuestions.length) * 100)}% {score === quizQuestions.length ? '🎉 Perfect!' : score >= quizQuestions.length * 0.7 ? '🌟 Great job!' : score >= quizQuestions.length * 0.5 ? '👍 Good effort!' : '💪 Keep studying!'}
                </div>
                <button onClick={resetQuiz}
                  className="h-12 px-8 rounded-full bg-softly-coral text-softly-dark font-medium text-sm shadow-[0_4px_16px_rgba(255,183,178,0.4)] hover:bg-softly-coral-light hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center gap-2 mx-auto">
                  <Wand2 className="w-5 h-5" /> Generate Another Quiz
                </button>
              </div>
            </div>
          </motion.div>
        ) : quizQuestions ? (
          /* ─── Taking Quiz ─── */
          <motion.div key="quiz-taking" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="glass-strong rounded-3xl p-6 md:p-8 relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-softly-coral/15 blob-shape blur-2xl animate-softly-float" />
              <div className="relative z-10">
                {/* Progress bar */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-softly-muted">Question {currentQ + 1} of {quizQuestions.length}</span>
                  <span className="text-sm font-medium text-softly-coral">Score: {score}</span>
                </div>
                <div className="w-full h-2 bg-softly-stone-200 rounded-full mb-6 overflow-hidden">
                  <div className="h-full bg-softly-coral rounded-full transition-all duration-500"
                    style={{ width: `${((currentQ + (answered ? 1 : 0)) / quizQuestions.length) * 100}%` }} />
                </div>

                {/* Question */}
                <h2 className="text-xl font-semibold text-softly-dark mb-6">{quizQuestions[currentQ].question}</h2>

                {/* Options */}
                <div className="space-y-3">
                  {quizQuestions[currentQ].options.map((opt, idx) => (
                    <button key={idx} onClick={() => handleAnswer(idx)}
                      disabled={answered}
                      className={`w-full flex items-center gap-3 rounded-xl p-4 text-left border-2 transition-all ${getOptionStyle(idx)}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-medium ${
                        selectedAnswer === idx && !answered ? 'bg-softly-coral text-softly-dark' :
                        answered && idx === quizQuestions[currentQ].correctIdx ? 'bg-green-100 text-green-700' :
                        answered && idx === selectedAnswer ? 'bg-red-100 text-red-700' :
                        'bg-softly-stone-100 text-softly-muted'
                      }`}>
                        {getOptionIcon(idx) || String.fromCharCode(65 + idx)}
                      </div>
                      <span className="text-sm text-softly-dark">{opt}</span>
                    </button>
                  ))}
                </div>

                {/* Next button */}
                {answered && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex justify-end">
                    <button onClick={handleNext}
                      className="h-11 px-6 rounded-full bg-softly-coral text-softly-dark font-medium text-sm shadow-[0_4px_16px_rgba(255,183,178,0.4)] hover:bg-softly-coral-light hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center gap-2">
                      {currentQ < quizQuestions.length - 1 ? 'Next Question' : 'See Results'}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          /* ─── Quiz Generator Form ─── */
          <motion.div key="generator" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="glass-strong rounded-3xl p-6 md:p-8 relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-softly-coral/15 blob-shape blur-2xl animate-softly-float" />
              <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-softly-lavender/20 blob-shape blur-2xl animate-softly-float" style={{ animationDelay: '2s' }} />

              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-softly-coral/20 flex items-center justify-center">
                    <Wand2 className="w-5 h-5 text-softly-coral" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-softly-dark">Create a Quiz</h2>
                    <p className="text-sm text-softly-muted">AI generates questions on any topic</p>
                  </div>
                </div>

                {/* Topic */}
                <div>
                  <label className="text-sm font-medium text-softly-dark mb-2 block">Topic</label>
                  <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
                    placeholder="e.g., World War II, Python Programming, Cell Biology..."
                    className="w-full h-12 px-4 rounded-xl border border-softly-stone-200 bg-white/60 text-sm text-softly-dark placeholder:text-softly-muted focus:outline-none focus:border-softly-coral focus:ring-2 focus:ring-softly-coral/20 transition-all" />
                </div>

                {/* Difficulty */}
                <div>
                  <label className="text-sm font-medium text-softly-dark mb-2 block">Difficulty</label>
                  <div className="flex gap-3">
                    {(Object.entries(DIFFICULTY_CONFIG) as [keyof typeof DIFFICULTY_CONFIG, typeof DIFFICULTY_CONFIG.easy][]).map(([key, cfg]) => (
                      <button key={key} onClick={() => setDifficulty(key)}
                        className={`flex-1 flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all ${
                          difficulty === key ? cfg.color + ' border-current' : 'border-softly-stone-200 hover:border-softly-coral'
                        }`}>
                        <span className="text-lg">{cfg.emoji}</span>
                        <span className="text-sm font-medium">{cfg.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Number of questions */}
                <div>
                  <label className="text-sm font-medium text-softly-dark mb-2 block">Number of Questions</label>
                  <div className="flex gap-3">
                    {[5, 10, 15].map(n => (
                      <button key={n} onClick={() => setNumQuestions(n)}
                        className={`flex-1 h-11 rounded-xl border-2 text-sm font-medium transition-all ${
                          numQuestions === n ? 'bg-softly-coral/15 border-softly-coral text-softly-dark' : 'border-softly-stone-200 text-softly-muted hover:border-softly-coral'
                        }`}>
                        {n} Questions
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate button */}
                <button onClick={handleGenerate} disabled={generating || !topic.trim()}
                  className="w-full h-12 rounded-full bg-softly-coral text-softly-dark font-medium text-sm shadow-[0_4px_16px_rgba(255,183,178,0.4)] hover:bg-softly-coral-light hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-45 disabled:pointer-events-none flex items-center justify-center gap-2">
                  {generating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-softly-dark/30 border-t-softly-dark rounded-full animate-spin" />
                      Generating Quiz...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" /> Generate Quiz
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick topic suggestions */}
            <div className="mt-6">
              <p className="text-sm text-softly-muted mb-3">Popular topics:</p>
              <div className="flex flex-wrap gap-2">
                {['JavaScript', 'Biology', 'History', 'Mathematics', 'Physics', 'Geography', 'Chemistry', 'Literature'].map(t => (
                  <button key={t} onClick={() => setTopic(t)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-softly-stone-100 text-softly-muted hover:bg-softly-coral/15 hover:text-softly-dark transition-all">
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Chat Panel ─── */
function ChatPanel({ dbUser }: { dbUser: DbUser }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/chat?userId=${dbUser.id}`).then(r => r.json()).then(d => setMessages(d.messages || [])).catch(() => {});
  }, [dbUser.id]);

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
        body: JSON.stringify({ userId: dbUser.id, message: msg }),
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
            <p className="text-sm text-softly-dark">Hey there! 👋 I&apos;m your iStud AI buddy. I can help with study tips, motivation, and questions. What would you like to talk about?</p>
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
function ProfilePanel({ dbUser, quizCount }: { dbUser: DbUser; quizCount: number }) {
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
            <span className="text-2xl font-bold text-softly-coral">{dbUser.name?.[0]?.toUpperCase() || 'U'}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-softly-dark">{dbUser.name || 'Student'}</h2>
            <p className="text-sm text-softly-muted">{dbUser.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-softly-coral/20 text-softly-coral">Active</span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-softly-sage text-green-700">Free Plan</span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-softly-lavender/40 text-violet-600">{quizCount} Quizzes</span>
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
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${studyMode === opt.value ? 'border-softly-coral' : 'border-softly-stone-300'}`}>
                {studyMode === opt.value && <div className="w-2.5 h-2.5 rounded-full bg-softly-coral" />}
              </div>
              <div>
                <p className="text-sm font-medium text-softly-dark">{opt.label}</p>
                <p className="text-xs text-softly-muted">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-softly-dark mb-4">Account</h3>
        <p className="text-sm text-softly-muted mb-4">Manage your account settings, security, and sign-out through Clerk.</p>
        <div className="flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />
          <span className="text-sm text-softly-muted">Click to manage account</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Landing Page (when not signed in) ─── */
function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-softly-bg relative overflow-hidden px-4">
      <div className="absolute top-10 left-[5%] w-72 h-72 bg-softly-coral/15 blob-shape blur-3xl animate-softly-float" />
      <div className="absolute top-40 right-[10%] w-56 h-56 bg-softly-lavender/25 blob-shape blur-3xl animate-softly-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-20 left-[30%] w-64 h-64 bg-softly-sage/25 blob-shape blur-3xl animate-softly-float" style={{ animationDelay: '4s' }} />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 glass-strong rounded-3xl p-8 md:p-10 w-full max-w-md text-center">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-softly-coral/20 blob-shape blur-2xl animate-softly-float" />
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-softly-lavender/30 blob-shape blur-2xl animate-softly-float" style={{ animationDelay: '1s' }} />

        <div className="relative z-10">
          <div className="w-14 h-14 rounded-full bg-softly-coral/20 flex items-center justify-center mx-auto mb-4">
            <span className="font-accent text-3xl text-softly-coral">S</span>
          </div>
          <h1 className="text-3xl font-bold text-softly-dark mb-2">Study<span className="text-softly-coral">Sphere</span></h1>
          <p className="font-accent text-2xl text-softly-coral mb-4">your mindful study companion</p>
          <p className="text-sm text-softly-muted mb-8">AI-powered quizzes, study chat, and mood tracking to help you learn better.</p>

          <div className="flex flex-col gap-3">
            <SignInButton mode="redirect">
              <button className="w-full h-11 rounded-full bg-softly-coral text-softly-dark font-medium text-sm shadow-[0_4px_16px_rgba(255,183,178,0.4)] hover:bg-softly-coral-light hover:shadow-[0_8px_24px_rgba(255,183,178,0.55)] hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                Sign In <ArrowRight className="w-4 h-4" />
              </button>
            </SignInButton>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-softly-coral/15 flex items-center justify-center mx-auto mb-2">
                <Brain className="w-5 h-5 text-softly-coral" />
              </div>
              <span className="text-xs text-softly-muted">AI Quizzes</span>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-softly-lavender/30 flex items-center justify-center mx-auto mb-2">
                <MessageCircle className="w-5 h-5 text-violet-600" />
              </div>
              <span className="text-xs text-softly-muted">AI Chat</span>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-softly-sage/50 flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs text-softly-muted">Mood Track</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main App ─── */
export default function IStudApp() {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const { user: clerkUser } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [moods, setMoods] = useState<MoodLog[]>([]);
  const [quizzes, setQuizzes] = useState<QuizData[]>([]);

  // Sync Clerk user to DB and fetch data
  useEffect(() => {
    if (!isSignedIn || !clerkUser || !userId) return;

    let cancelled = false;

    const syncAndFetch = async () => {
      try {
        const res = await fetch('/api/user/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clerkId: userId,
            email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
            name: clerkUser.fullName || clerkUser.firstName || '',
            avatar: clerkUser.imageUrl || null,
          }),
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setDbUser(data.user);

          // Fetch moods and quizzes with the synced user id
          const [moodsRes, quizzesRes] = await Promise.all([
            fetch(`/api/mood?userId=${data.user.id}`),
            fetch(`/api/quiz?userId=${data.user.id}`),
          ]);
          if (moodsRes.ok && !cancelled) {
            const moodsData = await moodsRes.json();
            setMoods(moodsData.moods || []);
          }
          if (quizzesRes.ok && !cancelled) {
            const quizzesData = await quizzesRes.json();
            setQuizzes(quizzesData.quizzes || []);
          }
        }
      } catch (err) {
        console.error('Failed to sync user:', err);
      }
    };

    syncAndFetch();

    return () => { cancelled = true; };
  }, [isSignedIn, clerkUser, userId]);

  const fetchMoods = useCallback(async () => {
    if (!dbUser) return;
    try {
      const res = await fetch(`/api/mood?userId=${dbUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setMoods(data.moods || []);
      }
    } catch { /* ignore */ }
  }, [dbUser]);

  const fetchQuizzes = useCallback(async () => {
    if (!dbUser) return;
    try {
      const res = await fetch(`/api/quiz?userId=${dbUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data.quizzes || []);
      }
    } catch { /* ignore */ }
  }, [dbUser]);

  // Show loading or landing page for unauthenticated users
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-softly-bg">
        <div className="w-8 h-8 border-3 border-softly-coral/30 border-t-softly-coral rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <LandingPage />;
  }

  if (!dbUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-softly-bg">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-softly-coral/30 border-t-softly-coral rounded-full animate-spin mx-auto mb-4" />
          <p className="text-softly-muted text-sm">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar active={activeTab} onChange={setActiveTab} />
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <DashboardPanel dbUser={dbUser} moods={moods} quizzes={quizzes} onRefreshMoods={fetchMoods} />
            </motion.div>
          )}
          {activeTab === 'quiz' && (
            <motion.div key="quiz" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <QuizMakerPanel dbUser={dbUser} onQuizzesChange={fetchQuizzes} />
            </motion.div>
          )}
          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <ChatPanel dbUser={dbUser} />
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <ProfilePanel dbUser={dbUser} quizCount={quizzes.length} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
