'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth, useUser, SignInButton, UserButton } from '@clerk/nextjs';
import {
  Home, MessageCircle, User, Send, Sparkles, Trash2, Brain,
  Bell, CheckCircle, XCircle, Wand2, Trophy, RotateCcw,
  ChevronRight, Sun, Zap,
  FileText, Target, BookOpen, Leaf, Flame,
  Cpu, Copy, ThumbsUp, RefreshCw, Quote, Clock,
  BarChart3, GraduationCap, Settings, Keyboard, Volume2,
  Pencil, ExternalLink, Shield, LogOut
} from 'lucide-react';

/* ─── Types ─── */
type TabType = 'dashboard' | 'quiz' | 'chat' | 'profile';

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

const TAB_COLORS: Record<TabType, string> = {
  dashboard: 'softly-teal',
  quiz: 'softly-violet',
  chat: 'softly-sky',
  profile: 'softly-rose',
};

const DIFFICULTY_CONFIG = {
  easy: { label: 'Easy', icon: <Leaf className="w-5 h-5" />, color: 'bg-softly-sage text-green-700' },
  medium: { label: 'Medium', icon: <Flame className="w-5 h-5" />, color: 'bg-softly-amber text-amber-700' },
  hard: { label: 'Hard', icon: <Zap className="w-5 h-5" />, color: 'bg-softly-rose text-rose-600' },
};

const QUOTES = [
  { text: 'The secret of getting ahead is getting ', highlight: 'started', author: 'Mark Twain' },
  { text: 'Education is the most powerful weapon which you can use to change the ', highlight: 'world', author: 'Nelson Mandela' },
  { text: 'The beautiful thing about learning is that no one can take it away from ', highlight: 'you', author: 'B.B. King' },
  { text: 'Success is not final, failure is not fatal: it is the courage to continue that ', highlight: 'counts', author: 'Winston Churchill' },
];

const CHAT_SUGGESTIONS = [
  { label: 'Study tips', message: 'Give me some effective study tips for CBSE board exams', color: 'softly-teal' },
  { label: 'Motivation', message: 'I need some motivation to keep studying', color: 'softly-amber' },
  { label: 'Explain a topic', message: 'Can you help me understand photosynthesis in simple terms?', color: 'softly-violet' },
  { label: 'Solve a doubt', message: 'Solve this step by step: Find the area of a triangle with base 8cm and height 5cm', color: 'softly-sky' },
  { label: 'Time management', message: 'How can I manage my study time better for Class 10 boards?', color: 'softly-sage' },
  { label: 'Essay help', message: 'Help me write an outline for an essay on climate change', color: 'softly-rose' },
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
        <div className={`w-9 h-9 rounded-full bg-softly-teal/20 flex items-center justify-center`}>
          <span className="font-accent text-xl text-softly-teal">i</span>
        </div>
        <span className="text-lg font-bold text-softly-dark">iStud</span>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {items.map(item => (
          <button key={item.key} onClick={() => onChange(item.key)}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all relative ${
              active === item.key ? `bg-${TAB_COLORS[active]}/15 text-softly-dark` : 'text-softly-muted hover:bg-softly-stone-100 hover:text-softly-dark'
            }`}>
            {active === item.key && (
              <motion.div layoutId="sidebar-active" className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-${TAB_COLORS[active]} rounded-r-full`}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
            )}
            <span className={active === item.key ? `text-${TAB_COLORS[item.key]}` : ''}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-softly-stone-200/60">
        <div className="flex items-center gap-2 px-2">
          <UserButton />
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
              active === item.key ? `text-${TAB_COLORS[active]}` : 'text-softly-muted'
            }`}>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
              active === item.key ? `bg-${TAB_COLORS[active]}/20` : ''
            }`}>{item.icon}</div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

/* ─── Dashboard Panel ─── */
function DashboardPanel({ dbUser, quizzes, onNavigate }: {
  dbUser: DbUser; quizzes: QuizData[]; onNavigate: (tab: TabType) => void;
}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const completedQuizzes = quizzes.filter(q => q.score !== null);
  const avgScore = completedQuizzes.length > 0
    ? Math.round(completedQuizzes.reduce((sum, q) => sum + (q.score || 0), 0) / completedQuizzes.length)
    : 0;
  const quote = QUOTES[Math.floor(Date.now() / 86400000) % QUOTES.length];
  const studyStreak = Math.min(completedQuizzes.length, 7); // Simplified streak

  const stats = [
    { label: 'Quizzes Taken', value: completedQuizzes.length, icon: <FileText className="w-5 h-5 text-softly-teal" />, iconBg: 'bg-softly-teal/10', iconBgHover: 'bg-softly-teal/20' },
    { label: 'Avg Score', value: `${avgScore}%`, icon: <Target className="w-5 h-5 text-softly-amber" />, iconBg: 'bg-softly-amber/10', iconBgHover: 'bg-softly-amber/20' },
    { label: 'Total Quizzes', value: quizzes.length, icon: <BookOpen className="w-5 h-5 text-softly-violet" />, iconBg: 'bg-softly-violet/10', iconBgHover: 'bg-softly-violet/20' },
    { label: 'Study Streak', value: `${studyStreak}d`, icon: <Flame className="w-5 h-5 text-softly-coral" />, iconBg: 'bg-softly-coral/10', iconBgHover: 'bg-softly-coral/20' },
  ];

  const quickActions = [
    { label: 'Generate Quiz', desc: 'Create an AI quiz on any topic', icon: <Brain className="w-5 h-5 text-softly-violet" />, tab: 'quiz' as TabType, hoverBg: 'group-hover:bg-softly-violet/10' },
    { label: 'Ask AI Buddy', desc: 'Chat with your study companion', icon: <MessageCircle className="w-5 h-5 text-softly-sky" />, tab: 'chat' as TabType, hoverBg: 'group-hover:bg-softly-sky/10' },
    { label: 'Take a Quiz', desc: 'Browse your quiz history', icon: <Wand2 className="w-5 h-5 text-softly-amber" />, tab: 'quiz' as TabType, hoverBg: 'group-hover:bg-softly-amber/10' },
    { label: 'Edit Profile', desc: 'Update your account settings', icon: <Settings className="w-5 h-5 text-softly-rose" />, tab: 'profile' as TabType, hoverBg: 'group-hover:bg-softly-rose/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-softly-dark">{greeting}, <span className="text-softly-teal">{dbUser.name || 'there'}</span></h1>
        <p className="text-softly-muted mt-1">{today}</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
            className="glass rounded-2xl p-5 hover:-translate-y-1 transition-transform cursor-default group">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center ${stat.iconBgHover} transition-colors`}>
                {stat.icon}
              </div>
            </div>
            <div className="text-2xl font-bold text-softly-dark">{stat.value}</div>
            <div className="text-xs text-softly-muted font-medium mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h2 className="text-lg font-semibold text-softly-dark flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-softly-teal" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action, i) => (
            <motion.button key={action.label} onClick={() => onNavigate(action.tab)}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
              className="glass rounded-2xl p-4 text-left hover:-translate-y-1 transition-transform group">
              <div className={`w-10 h-10 rounded-xl bg-softly-stone-100 flex items-center justify-center ${action.hoverBg} transition-colors mb-3`}>
                {action.icon}
              </div>
              <p className="text-sm font-medium text-softly-dark">{action.label}</p>
              <p className="text-xs text-softly-muted mt-0.5">{action.desc}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Quick Overview */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-softly-sky" />
            <h2 className="text-lg font-semibold text-softly-dark">Study Overview</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-softly-muted">Avg quiz score</span>
              <span className="text-sm font-semibold text-softly-dark">{avgScore}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-softly-muted">Best topic</span>
              <span className="text-sm font-semibold text-softly-dark">{completedQuizzes[0]?.topic || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-softly-muted">Quizzes saved</span>
              <span className="text-sm font-semibold text-softly-dark">{quizzes.length} / 5</span>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-softly-sage" />
            <h2 className="text-lg font-semibold text-softly-dark">AI Model</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-softly-muted">Provider</span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-softly-sage text-green-700 flex items-center gap-1"><Cpu className="w-3 h-3" /> Ollama Cloud</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-softly-muted">Model</span>
              <span className="text-sm font-semibold text-softly-dark">Qwen 2.5 VL</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-softly-muted">Chat storage</span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-softly-sky/20 text-sky-700">Stateless</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Quizzes */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-softly-dark flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-softly-amber" />
            Recent Quizzes
          </h2>
        </div>
        {completedQuizzes.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedQuizzes.slice(0, 3).map((quiz, i) => {
              const diff = DIFFICULTY_CONFIG[quiz.difficulty as keyof typeof DIFFICULTY_CONFIG] || DIFFICULTY_CONFIG.medium;
              return (
                <motion.div key={quiz.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
                  className="bg-white rounded-2xl p-5 shadow-sm hover:-translate-y-1 transition-transform border border-softly-stone-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${diff.color}`}>{diff.icon} {diff.label}</span>
                    <span className="text-xs text-softly-muted">{new Date(quiz.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <h3 className="font-medium text-softly-dark mb-2">{quiz.title}</h3>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-softly-amber" />
                    <span className="text-sm font-semibold text-softly-dark">{quiz.score}/{quiz.totalQuestions}</span>
                    <span className="text-xs text-softly-muted">({Math.round(((quiz.score || 0) / quiz.totalQuestions) * 100)}%)</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="glass rounded-2xl p-8 text-center">
            <Brain className="w-8 h-8 text-softly-violet mx-auto mb-3" />
            <p className="text-softly-muted mb-1">No quizzes yet</p>
            <button onClick={() => onNavigate('quiz')} className="font-accent text-xl text-softly-violet hover:underline">take your first quiz!</button>
          </div>
        )}
      </motion.div>

      {/* Quote */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl p-6 relative overflow-hidden border border-softly-stone-100">
        <Quote className="absolute top-4 left-4 w-8 h-8 text-softly-amber/20" />
        <p className="text-lg leading-relaxed text-softly-dark relative z-10 mt-4 pl-6">
          {quote.text}<span className="font-accent text-2xl text-softly-amber">{quote.highlight}</span>.
        </p>
        <p className="text-sm text-softly-muted mt-3 relative z-10 pl-6">— {quote.author}</p>
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
        toast.success('Quiz generated!');
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
      toast.success('Correct!');
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
    if (!answered || !quizQuestions) return 'border-softly-stone-200 hover:border-softly-violet hover:bg-softly-violet/5';
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

  const getResultMessage = () => {
    if (!quizQuestions) return { text: '', icon: <Trophy className="w-6 h-6 text-softly-amber" /> };
    const pct = score / quizQuestions.length;
    if (pct === 1) return { text: 'Perfect score!', icon: <Trophy className="w-6 h-6 text-softly-amber" /> };
    if (pct >= 0.7) return { text: 'Great job!', icon: <ThumbsUp className="w-6 h-6 text-green-600" /> };
    if (pct >= 0.5) return { text: 'Good effort!', icon: <CheckCircle className="w-6 h-6 text-blue-600" /> };
    return { text: 'Keep studying!', icon: <BookOpen className="w-6 h-6 text-softly-violet" /> };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-softly-dark">Quiz Maker</h1>
          <p className="text-softly-muted mt-1">Generate AI-powered quizzes on any topic</p>
        </div>
        <button onClick={() => setShowHistory(!showHistory)}
          className="h-11 px-5 rounded-full glass text-softly-dark font-medium text-sm hover:bg-softly-violet/10 transition-all flex items-center gap-2">
          <RotateCcw className="w-4 h-4" /> {showHistory ? 'Back to Quiz' : 'History'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {showHistory ? (
          <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {quizHistory.length > 0 ? (
              <div className="space-y-4">
                {quizHistory.map((quiz, i) => {
                  const diff = DIFFICULTY_CONFIG[quiz.difficulty as keyof typeof DIFFICULTY_CONFIG] || DIFFICULTY_CONFIG.medium;
                  const pct = quiz.score !== null ? Math.round((quiz.score / quiz.totalQuestions) * 100) : null;
                  return (
                    <motion.div key={quiz.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-2xl p-5 shadow-sm hover:-translate-y-0.5 transition-transform group relative border border-softly-stone-100">
                      <button onClick={() => handleDeleteQuiz(quiz.id)}
                        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-transparent hover:bg-softly-error/10 text-softly-muted hover:text-softly-error flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${diff.color}`}>{diff.icon} {diff.label}</span>
                        <span className="text-xs text-softly-muted">{new Date(quiz.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <h3 className="font-medium text-softly-dark mb-1">{quiz.title}</h3>
                      <p className="text-sm text-softly-muted">{quiz.questions.length} questions</p>
                      {pct !== null && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-softly-dark">{quiz.score}/{quiz.totalQuestions}</span>
                            <span className="text-sm font-semibold text-softly-violet">{pct}%</span>
                          </div>
                          <div className="w-full h-2 bg-softly-stone-200 rounded-full overflow-hidden">
                            <div className="h-full bg-softly-violet rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="glass rounded-2xl p-8 text-center">
                <Brain className="w-8 h-8 text-softly-violet mx-auto mb-3" />
                <p className="text-softly-muted mb-1">No quiz history yet</p>
                <p className="font-accent text-xl text-softly-violet">generate your first quiz!</p>
              </div>
            )}
          </motion.div>
        ) : quizComplete && quizQuestions ? (
          <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
            <div className="glass-strong rounded-3xl p-8 md:p-12 relative overflow-hidden text-center">
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-softly-violet/15 blob-shape blur-3xl animate-softly-float" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-softly-sage/20 blob-shape blur-3xl animate-softly-float" style={{ animationDelay: '3s' }} />
              <div className="relative z-10">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}>
                  <div className="w-16 h-16 rounded-full bg-softly-violet/20 flex items-center justify-center mx-auto mb-4">
                    {getResultMessage().icon}
                  </div>
                </motion.div>
                <h2 className="text-3xl font-bold text-softly-dark mb-2">Quiz Complete!</h2>
                <p className="text-softly-muted mb-6">{topic}</p>
                <div className="inline-flex items-center gap-3 glass rounded-full px-6 py-3 mb-4">
                  <span className="text-4xl font-bold text-softly-amber">{score}</span>
                  <span className="text-softly-muted">out of</span>
                  <span className="text-4xl font-bold text-softly-dark">{quizQuestions.length}</span>
                </div>
                <div className="text-2xl font-semibold text-softly-dark mb-6">
                  {Math.round((score / quizQuestions.length) * 100)}% — {getResultMessage().text}
                </div>
                <button onClick={resetQuiz}
                  className="h-12 px-8 rounded-full bg-softly-violet text-softly-dark font-medium text-sm shadow-[0_4px_16px_rgba(184,169,232,0.4)] hover:bg-softly-violet-light hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center gap-2 mx-auto">
                  <Wand2 className="w-5 h-5" /> Generate Another Quiz
                </button>
              </div>
            </div>
          </motion.div>
        ) : quizQuestions ? (
          <motion.div key="quiz-taking" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="glass-strong rounded-3xl p-6 md:p-8 relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-softly-violet/15 blob-shape blur-2xl animate-softly-float" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-softly-muted">Question {currentQ + 1} of {quizQuestions.length}</span>
                  <span className="text-sm font-medium text-softly-violet">Score: {score}</span>
                </div>
                <div className="w-full h-2 bg-softly-stone-200 rounded-full mb-6 overflow-hidden">
                  <div className="h-full bg-softly-violet rounded-full transition-all duration-500"
                    style={{ width: `${((currentQ + (answered ? 1 : 0)) / quizQuestions.length) * 100}%` }} />
                </div>
                <h2 className="text-xl font-semibold text-softly-dark mb-6">{quizQuestions[currentQ].question}</h2>
                <div className="space-y-3">
                  {quizQuestions[currentQ].options.map((opt, idx) => (
                    <button key={idx} onClick={() => handleAnswer(idx)}
                      disabled={answered}
                      className={`w-full flex items-center gap-3 rounded-xl p-4 text-left border-2 transition-all ${getOptionStyle(idx)}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-medium ${
                        selectedAnswer === idx && !answered ? 'bg-softly-violet text-softly-dark' :
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
                {answered && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex justify-end">
                    <button onClick={handleNext}
                      className="h-11 px-6 rounded-full bg-softly-violet text-softly-dark font-medium text-sm shadow-[0_4px_16px_rgba(184,169,232,0.4)] hover:bg-softly-violet-light hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center gap-2">
                      {currentQ < quizQuestions.length - 1 ? 'Next Question' : 'See Results'}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="generator" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="glass-strong rounded-3xl p-6 md:p-8 relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-softly-violet/15 blob-shape blur-2xl animate-softly-float" />
              <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-softly-lavender/20 blob-shape blur-2xl animate-softly-float" style={{ animationDelay: '2s' }} />
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-softly-violet/20 flex items-center justify-center">
                    <Wand2 className="w-5 h-5 text-softly-violet" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-softly-dark">Create a Quiz</h2>
                    <p className="text-sm text-softly-muted">AI generates questions on any topic</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-softly-dark mb-2 block">Topic</label>
                  <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
                    placeholder="e.g., World War II, Python Programming, Cell Biology..."
                    className="w-full h-12 px-4 rounded-xl border border-softly-stone-200 bg-white/60 text-sm text-softly-dark placeholder:text-softly-muted focus:outline-none focus:border-softly-violet focus:ring-2 focus:ring-softly-violet/20 transition-all" />
                </div>
                <div>
                  <label className="text-sm font-medium text-softly-dark mb-2 block">Difficulty</label>
                  <div className="flex gap-3">
                    {(Object.entries(DIFFICULTY_CONFIG) as [keyof typeof DIFFICULTY_CONFIG, typeof DIFFICULTY_CONFIG.easy][]).map(([key, cfg]) => (
                      <button key={key} onClick={() => setDifficulty(key)}
                        className={`flex-1 flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${
                          difficulty === key ? cfg.color + ' border-current' : 'border-softly-stone-200 hover:border-softly-violet'
                        }`}>
                        {cfg.icon}
                        <span className="text-sm font-medium">{cfg.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-softly-dark mb-2 block">Number of Questions</label>
                  <div className="flex gap-3">
                    {[5, 10, 15].map(n => (
                      <button key={n} onClick={() => setNumQuestions(n)}
                        className={`flex-1 h-11 rounded-xl border-2 text-sm font-medium transition-all ${
                          numQuestions === n ? 'bg-softly-violet/15 border-softly-violet text-softly-dark' : 'border-softly-stone-200 text-softly-muted hover:border-softly-violet'
                        }`}>
                        {n} Questions
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleGenerate} disabled={generating || !topic.trim()}
                  className="w-full h-12 rounded-full bg-softly-violet text-softly-dark font-medium text-sm shadow-[0_4px_16px_rgba(184,169,232,0.4)] hover:bg-softly-violet-light hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-45 disabled:pointer-events-none flex items-center justify-center gap-2">
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
            <div className="mt-6">
              <p className="text-sm text-softly-muted mb-3">Popular topics:</p>
              <div className="flex flex-wrap gap-2">
                {['JavaScript', 'Biology', 'History', 'Mathematics', 'Physics', 'Geography', 'Chemistry', 'Literature'].map(t => (
                  <button key={t} onClick={() => setTopic(t)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-softly-stone-100 text-softly-muted hover:bg-softly-violet/15 hover:text-softly-dark transition-all">
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
  const inputRef = useRef<HTMLInputElement>(null);

  // Chat is now stateless - no DB persistence, messages live only in client state

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (msgText?: string) => {
    const msg = (msgText || input).trim();
    if (!msg || loading) return;
    setInput('');
    const userMsg: ChatMsg = { id: Date.now().toString(), role: 'user', content: msg, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: messages.slice(-10) }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.response, createdAt: new Date().toISOString() }]);
      }
    } catch { toast.error('Failed to get response'); }
    setLoading(false);
    inputRef.current?.focus();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      {/* Chat Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-softly-teal/20 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-softly-teal" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-softly-dark">AI Study Buddy</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-xs text-softly-muted">Ollama Qwen3.5</p>
            </div>
          </div>
        </div>
        <button onClick={() => { setMessages([]); toast.success('Chat cleared'); }}
          className="h-9 px-3 rounded-full glass text-softly-muted hover:text-softly-dark text-xs font-medium hover:bg-softly-teal/10 transition-all flex items-center gap-1.5">
          <Trash2 className="w-3.5 h-3.5" /> Clear
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto softly-scrollbar space-y-4 pr-2 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="w-16 h-16 rounded-2xl bg-softly-teal/20 flex items-center justify-center">
              <Cpu className="w-8 h-8 text-softly-teal" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-softly-dark mb-1">How can I help you study?</h3>
              <p className="text-sm text-softly-muted">I can help with study tips, motivation, and questions.</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {CHAT_SUGGESTIONS.map(s => (
                <button key={s.label} onClick={() => handleSend(s.message)}
                  className={`px-4 py-2 rounded-xl glass text-sm text-softly-dark hover:bg-${s.color}/10 transition-all flex items-center gap-2 border border-softly-stone-200/50`}>
                  <MessageCircle className={`w-3.5 h-3.5 text-${s.color}`} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-softly-teal/20 flex items-center justify-center shrink-0 mt-1">
                <Cpu className="w-4 h-4 text-softly-teal" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 group relative ${
              msg.role === 'user' ? 'bg-softly-teal/15 text-softly-dark' : 'bg-softly-teal/10 text-softly-dark'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap pr-6">{msg.content}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-softly-muted">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.role === 'assistant' && (
                  <button onClick={() => handleCopy(msg.content)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-softly-stone-100">
                    <Copy className="w-3 h-3 text-softly-muted" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-softly-teal/20 flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4 text-softly-teal animate-spin" />
            </div>
            <div className="bg-softly-teal/10 rounded-2xl px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-softly-teal rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-softly-teal rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-softly-teal rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Chat Input */}
      <div className="shrink-0 mt-4">
        <div className="glass-strong rounded-2xl p-2 flex items-center gap-2">
          <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask your study buddy..." disabled={loading}
            className="flex-1 bg-transparent text-sm text-softly-dark placeholder:text-softly-muted focus:outline-none px-3 py-2" />
          <button onClick={() => handleSend()} disabled={!input.trim() || loading}
            className="h-10 w-10 rounded-xl bg-softly-teal text-softly-dark font-medium text-sm shadow-[0_4px_16px_rgba(126,200,200,0.4)] hover:bg-softly-teal-light active:scale-[0.98] transition-all disabled:opacity-45 disabled:pointer-events-none flex items-center justify-center">
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-softly-muted text-center mt-2">iStud AI powered by Ollama Qwen 2.5 VL (stateless)</p>
      </div>
    </div>
  );
}

/* ─── Profile Panel ─── */
function ProfilePanel({ dbUser, quizCount }: { dbUser: DbUser; quizCount: number }) {
  const [notifs, setNotifs] = useState(true);
  const [sounds, setSounds] = useState(false);
  const [studyMode, setStudyMode] = useState('balanced');
  const { signOut, userId: clerkId } = useAuth();
  const { user: clerkUser } = useUser();

  // Load saved preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('istud-preferences');
      if (saved) {
        const prefs = JSON.parse(saved);
        if (prefs.notifs !== undefined) setNotifs(prefs.notifs);
        if (prefs.sounds !== undefined) setSounds(prefs.sounds);
        if (prefs.studyMode) setStudyMode(prefs.studyMode);
      }
      const ollamaSaved = localStorage.getItem('istud-ollama');
      // ollama config now lives in .env only, ignore localStorage
    } catch {}
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('istud-preferences', JSON.stringify({ notifs, sounds, studyMode }));
    } catch {}
  }, [notifs, sounds, studyMode]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div><h1 className="text-3xl font-bold text-softly-dark">Profile</h1><p className="text-softly-muted mt-1">Manage your account and preferences</p></div>

      {/* User Info Card with Clerk Profile Edit */}
      <div className="glass-strong rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-softly-rose/15 blob-shape blur-2xl animate-softly-float" />
        <div className="relative z-10 flex items-center gap-5">
          {clerkUser?.imageUrl ? (
            <img src={clerkUser.imageUrl} alt="Avatar" className="w-16 h-16 rounded-full ring-2 ring-softly-rose/30 object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-softly-rose/20 flex items-center justify-center ring-2 ring-softly-rose/30">
              <span className="text-2xl font-bold text-softly-rose">{dbUser.name?.[0]?.toUpperCase() || 'U'}</span>
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-softly-dark">{clerkUser?.fullName || dbUser.name || 'Student'}</h2>
            <p className="text-sm text-softly-muted">{clerkUser?.emailAddresses?.[0]?.emailAddress || dbUser.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-softly-rose/20 text-softly-rose flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Active</span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-softly-sage text-green-700">Free Plan</span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-softly-lavender/40 text-violet-600 flex items-center gap-1"><Brain className="w-3 h-3" /> {quizCount} Quizzes</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => { try { (window as any).Clerk?.openUserProfile(); } catch(e) { console.error('Clerk profile error:', e); } }}
              className="h-9 px-4 rounded-full glass text-softly-dark text-xs font-medium hover:bg-softly-rose/10 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Account Settings via Clerk */}
      <div className="glass rounded-2xl p-6 space-y-5">
        <h3 className="text-lg font-semibold text-softly-dark flex items-center gap-2"><User className="w-5 h-5 text-softly-amber" /> Account Settings</h3>
        <p className="text-sm text-softly-muted">Manage your name, email, password, and connected accounts through your secure Clerk profile.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => { try { (window as any).Clerk?.openUserProfile({ tab: 'profile' }); } catch(e) { console.error(e); } }}
            className="flex items-center gap-3 p-4 rounded-xl border border-softly-stone-200 hover:border-softly-amber hover:bg-softly-amber/5 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-softly-stone-100 flex items-center justify-center text-softly-muted"><Pencil className="w-5 h-5" /></div>
            <div>
              <p className="text-sm font-medium text-softly-dark">Edit Profile</p>
              <p className="text-xs text-softly-muted">Name, photo, username</p>
            </div>
          </button>
          <button
            onClick={() => { try { (window as any).Clerk?.openUserProfile({ tab: 'account' }); } catch(e) { console.error(e); } }}
            className="flex items-center gap-3 p-4 rounded-xl border border-softly-stone-200 hover:border-softly-amber hover:bg-softly-amber/5 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-softly-stone-100 flex items-center justify-center text-softly-muted"><Shield className="w-5 h-5" /></div>
            <div>
              <p className="text-sm font-medium text-softly-dark">Security</p>
              <p className="text-xs text-softly-muted">Email, password, 2FA</p>
            </div>
          </button>
          <button
            onClick={() => { try { (window as any).Clerk?.openUserProfile({ tab: 'connectedAccounts' }); } catch(e) { console.error(e); } }}
            className="flex items-center gap-3 p-4 rounded-xl border border-softly-stone-200 hover:border-softly-amber hover:bg-softly-amber/5 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-softly-stone-100 flex items-center justify-center text-softly-muted"><ExternalLink className="w-5 h-5" /></div>
            <div>
              <p className="text-sm font-medium text-softly-dark">Connected Accounts</p>
              <p className="text-xs text-softly-muted">Google, GitHub, etc.</p>
            </div>
          </button>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 p-4 rounded-xl border border-red-200 hover:border-red-300 hover:bg-red-50 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500"><LogOut className="w-5 h-5" /></div>
            <div>
              <p className="text-sm font-medium text-red-600">Sign Out</p>
              <p className="text-xs text-red-400">Log out of your account</p>
            </div>
          </button>
        </div>
      </div>

      {/* AI Info */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-softly-dark flex items-center gap-2"><Cpu className="w-5 h-5 text-softly-sage" /> AI Configuration</h3>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-softly-sage/20 border border-green-200">
          <Cpu className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-700">Ollama Qwen 2.5 VL</p>
            <p className="text-xs text-green-600">Cloud-hosted via ollama.com/api</p>
          </div>
        </div>
        <p className="text-xs text-softly-muted">AI model is configured via server environment variables. Chat is stateless — no data is stored in the database.</p>
      </div>

      {/* Preferences */}
      <div className="glass rounded-2xl p-6 space-y-5">
        <h3 className="text-lg font-semibold text-softly-dark flex items-center gap-2"><Settings className="w-5 h-5 text-softly-amber" /> Preferences</h3>
        {[
          { label: 'Notifications', desc: 'Get reminders and updates', icon: <Bell className="w-4 h-4" />, val: notifs, set: setNotifs },
          { label: 'Sound Effects', desc: 'Play sounds on actions', icon: <Volume2 className="w-4 h-4" />, val: sounds, set: setSounds },
        ].map(pref => (
          <div key={pref.label} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-softly-stone-100 flex items-center justify-center text-softly-muted">{pref.icon}</div>
              <div>
                <p className="text-sm font-medium text-softly-dark">{pref.label}</p>
                <p className="text-xs text-softly-muted">{pref.desc}</p>
              </div>
            </div>
            <button onClick={() => pref.set(!pref.val)}
              className={`w-11 h-6 rounded-full transition-all relative ${pref.val ? 'bg-softly-amber' : 'bg-softly-stone-200'}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${pref.val ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>
        ))}
      </div>

      {/* Study Mode */}
      <div className="glass rounded-2xl p-6 space-y-5">
        <h3 className="text-lg font-semibold text-softly-dark flex items-center gap-2"><Brain className="w-5 h-5 text-softly-amber" /> Study Mode</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'balanced', label: 'Balanced', icon: <BarChart3 className="w-5 h-5" /> },
            { key: 'intensive', label: 'Intensive', icon: <Flame className="w-5 h-5" /> },
            { key: 'casual', label: 'Casual', icon: <Leaf className="w-5 h-5" /> },
          ].map(mode => (
            <button key={mode.key} onClick={() => setStudyMode(mode.key)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                studyMode === mode.key ? 'bg-softly-amber/10 border-softly-amber text-softly-dark' : 'border-softly-stone-200 text-softly-muted hover:border-softly-amber'
              }`}>
              {mode.icon}
              <span className="text-xs font-medium">{mode.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Landing Page ─── */
function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-softly-bg p-6">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg">
        <div className="w-20 h-20 rounded-2xl bg-softly-teal/20 flex items-center justify-center mx-auto mb-6">
          <GraduationCap className="w-10 h-10 text-softly-teal" />
        </div>
        <h1 className="text-4xl font-bold text-softly-dark mb-3">Welcome to <span className="text-softly-teal">iStud</span></h1>
        <p className="text-softly-muted mb-8 text-lg">Your mindful study companion with AI-powered quizzes, chat, and personalized learning.</p>
        <SignInButton mode="modal">
          <button className="h-12 px-8 rounded-full bg-softly-teal text-softly-dark font-medium shadow-[0_4px_16px_rgba(126,200,200,0.4)] hover:bg-softly-teal-light hover:-translate-y-0.5 active:scale-[0.98] transition-all">
            Get Started
          </button>
        </SignInButton>
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

          const quizzesRes = await fetch(`/api/quiz?userId=${data.user.id}`);
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

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-softly-bg">
        <div className="w-8 h-8 border-3 border-softly-teal/30 border-t-softly-teal rounded-full animate-spin" />
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
          <div className="w-8 h-8 border-3 border-softly-teal/30 border-t-softly-teal rounded-full animate-spin mx-auto mb-4" />
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
              <DashboardPanel dbUser={dbUser} quizzes={quizzes} onNavigate={setActiveTab} />
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
