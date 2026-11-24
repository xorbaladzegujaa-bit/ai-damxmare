import React, { useEffect, useState } from 'react';
import {
  Calculator,
  CheckCircle2,
  Clock,
  FileText,
  Flame,
  ListTodo,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  Trash2,
  Wrench,
} from 'lucide-react';
import { ToolsState } from '../../types/app';
import { getTodayDateStr } from '../../services/storage';
import { playReminderChime } from '../../services/speechAndSound';

interface ToolsModuleProps {
  tools: ToolsState;
  soundEnabled: boolean;
  onUpdateTools: (next: ToolsState, addedMinutes?: number) => void;
}

type ToolTab = 'planner' | 'goals_habits' | 'timers' | 'calculator' | 'notes_reflect';

const MOTIVATION_CARDS = [
  {
    title: 'პატარა ნაბიჯების ძალა',
    body: 'ყოველდღე 15 წუთი სწავლა წელიწადში 90 საათზე მეტ ცოდნას გაძლევს. მთავარია უწყვეტობა და არა იდეალური დღე.',
  },
  {
    title: 'შეცდომა სწავლის ნაწილია',
    body: 'თითოეული შეცდომა გიჩვენებს ზუსტად რა თემას სჭირდება კიდევ ერთი გამეორება. ნუ შეგეშინდება ცდის.',
  },
  {
    title: 'აქტიური გახსენება',
    body: 'სავარჯიშოების ამოხსნა და სიტყვების ხმამაღლა გამეორება ბევრად სწრაფად ამყარებს მეხსიერებას, ვიდრე უბრალო კითხვა.',
  },
];

export const ToolsModule: React.FC<ToolsModuleProps> = ({
  tools,
  soundEnabled,
  onUpdateTools,
}) => {
  const today = getTodayDateStr();
  const [tab, setTab] = useState<ToolTab>('planner');

  // Planner & Task List
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState(today);
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'overdue' | 'done'>('all');
  const [taskError, setTaskError] = useState('');

  // Goals & Habits
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState(10);
  const [goalUnit, setGoalUnit] = useState('გაკვეთილი');
  const [goalDeadline, setGoalDeadline] = useState(today);
  const [habitTitle, setHabitTitle] = useState('');

  // Study / Pomodoro Timer
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'study'>('pomodoro');
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [studyElapsedSec, setStudyElapsedSec] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  // Calculator
  const [calcExpr, setCalcExpr] = useState('');
  const [calcResult, setCalcResult] = useState('0');

  // Notes & Reflections
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [wentWell, setWentWell] = useState('');
  const [improveTomorrow, setImproveTomorrow] = useState('');

  // Timer tick
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      if (timerMode === 'pomodoro') {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            playReminderChime(soundEnabled);
            onUpdateTools(
              { ...tools, totalStudySeconds: tools.totalStudySeconds + pomodoroMinutes * 60 },
              pomodoroMinutes
            );
            return pomodoroMinutes * 60;
          }
          return prev - 1;
        });
      } else {
        setStudyElapsedSec((s) => s + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerMode, pomodoroMinutes]);

  const handleSaveStudySession = () => {
    if (studyElapsedSec < 10) return;
    setTimerRunning(false);
    const mins = Math.max(1, Math.round(studyElapsedSec / 60));
    onUpdateTools(
      { ...tools, totalStudySeconds: tools.totalStudySeconds + studyElapsedSec },
      mins
    );
    setStudyElapsedSec(0);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    setTaskError('');
    if (taskTitle.trim().length < 2) {
      setTaskError('შეიყვანე დავალების სათაური.');
      return;
    }
    const newTask = {
      id: `task_${Date.now()}`,
      title: taskTitle.trim(),
      dueDate: taskDue || today,
      completed: false,
      priority: taskPriority,
      createdAt: new Date().toISOString(),
    };
    onUpdateTools({ ...tools, tasks: [newTask, ...tools.tasks] });
    setTaskTitle('');
  };

  const overdueTasks = tools.tasks.filter((t) => !t.completed && t.dueDate < today);
  const filteredTasks = tools.tasks.filter((t) => {
    if (taskFilter === 'active') return !t.completed;
    if (taskFilter === 'overdue') return !t.completed && t.dueDate < today;
    if (taskFilter === 'done') return t.completed;
    return true;
  });

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (goalTitle.trim().length < 2) return;
    onUpdateTools({
      ...tools,
      goals: [
        ...tools.goals,
        {
          id: `goal_${Date.now()}`,
          title: goalTitle.trim(),
          targetValue: Math.max(1, goalTarget),
          currentValue: 0,
          unit: goalUnit.trim() || 'ერთეული',
          deadline: goalDeadline || today,
        },
      ],
    });
    setGoalTitle('');
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (habitTitle.trim().length < 2) return;
    onUpdateTools({
      ...tools,
      habits: [
        ...tools.habits,
        { id: `hab_${Date.now()}`, title: habitTitle.trim(), completedDates: [] },
      ],
    });
    setHabitTitle('');
  };

  const computeCalc = (expr: string) => {
    const cleaned = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/\s+/g, '');
    if (!/^[0-9+\-*/.]+$/.test(cleaned)) {
      setCalcResult('შეცდომა');
      return;
    }
    try {
      // Simple left-to-right / precedence arithmetic tokenizer
      const tokens = cleaned.match(/(\d+(?:\.\d+)?|[+\-*/])/g);
      if (!tokens || tokens.length === 0) return;
      const values: number[] = [];
      const ops: string[] = [];
      const prec = (op: string) => (op === '*' || op === '/' ? 2 : 1);
      const applyOp = () => {
        const b = values.pop()!;
        const a = values.pop()!;
        const op = ops.pop()!;
        if (op === '+') values.push(a + b);
        else if (op === '-') values.push(a - b);
        else if (op === '*') values.push(a * b);
        else if (op === '/') values.push(b === 0 ? NaN : a / b);
      };
      for (const tok of tokens) {
        if (/^[+\-*/]$/.test(tok)) {
          while (ops.length > 0 && prec(ops[ops.length - 1]) >= prec(tok)) {
            applyOp();
          }
          ops.push(tok);
        } else {
          values.push(Number(tok));
        }
      }
      while (ops.length > 0) applyOp();
      const res = values[0];
      setCalcResult(Number.isFinite(res) ? String(Math.round(res * 10000) / 10000) : 'შეცდომა');
    } catch {
      setCalcResult('შეცდომა');
    }
  };

  const formatTimer = (secs: number) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-fluid-title font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <Wrench className="w-6 h-6 text-purple-500 shrink-0" />
          <span>პირადი განვითარების ხელსაწყოები</span>
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          დღის გეგმა, მიზნები, ჩვევები, პომოდორო ტაიმერი, კალკულატორი და ჩანაწერები.
        </p>
      </div>

      {/* Tool Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ['planner', 'დღის გეგმა და ამოცანები', <ListTodo className="w-4 h-4 shrink-0" />],
            ['goals_habits', 'მიზნები და ჩვევები', <Target className="w-4 h-4 shrink-0" />],
            ['timers', 'პომოდორო და ტაიმერი', <Clock className="w-4 h-4 shrink-0" />],
            ['calculator', 'კალკულატორი', <Calculator className="w-4 h-4 shrink-0" />],
            ['notes_reflect', 'ჩანაწერები და რეფლექსია', <FileText className="w-4 h-4 shrink-0" />],
          ] as [ToolTab, string, React.ReactNode][]
        ).map(([id, label, icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 whitespace-nowrap ${
              tab === id
                ? 'bg-purple-600 border-purple-500 text-white'
                : 'bg-white dark:bg-[#0E1730] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* 1. PLANNER & TASK LIST */}
      {tab === 'planner' && (
        <div className="rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">დღის გეგმა და ამოცანები</h2>
            {overdueTasks.length > 0 && (
              <span className="text-xs font-semibold text-red-500">
                ვადაგადაცილებული: {overdueTasks.length}
              </span>
            )}
          </div>

          <form onSubmit={handleAddTask} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="ახალი ამოცანა (მაგ: 10 სიტყვის სწავლა)"
              className="sm:col-span-2 min-h-[44px] rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700 px-3.5 text-base sm:text-sm"
            />
            <input
              type="date"
              value={taskDue}
              onChange={(e) => setTaskDue(e.target.value)}
              className="min-h-[44px] rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700 px-3 text-base sm:text-sm font-mono-num"
            />
            <div className="flex flex-col min-[380px]:flex-row gap-2">
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="flex-1 min-h-[44px] rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700 px-2.5 text-xs"
              >
                <option value="low">დაბალი</option>
                <option value="medium">საშუალო</option>
                <option value="high">მაღალი</option>
              </select>
              <button
                type="submit"
                className="min-h-[44px] px-4 rounded-xl bg-blue-600 text-white text-xs font-semibold flex items-center justify-center gap-1 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>დამატება</span>
              </button>
            </div>
          </form>
          {taskError && <div className="text-xs text-red-500">{taskError}</div>}

          <div className="flex flex-wrap gap-2">
            {(
              [
                ['all', 'ყველა'],
                ['active', 'მიმდინარე'],
                ['overdue', `ვადაგადაცილებული (${overdueTasks.length})`],
                ['done', 'შესრულებული'],
              ] as const
            ).map(([fId, fLbl]) => (
              <button
                key={fId}
                type="button"
                onClick={() => setTaskFilter(fId)}
                className={`min-h-[36px] px-3 py-1 rounded-xl border text-xs font-medium ${
                  taskFilter === fId
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-50 dark:bg-[#070D1F] border-slate-200 dark:border-slate-800'
                }`}
              >
                {fLbl}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {filteredTasks.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">ამ კატეგორიაში ამოცანები არ არის.</p>
            ) : (
              filteredTasks.map((t) => {
                const isOverdue = !t.completed && t.dueDate < today;
                return (
                  <div
                    key={t.id}
                    className="rounded-2xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 p-3.5 flex items-center justify-between gap-3"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateTools({
                          ...tools,
                          tasks: tools.tasks.map((item) =>
                            item.id === t.id ? { ...item, completed: !item.completed } : item
                          ),
                        })
                      }
                      className="flex items-center gap-3 text-left min-w-0 flex-1"
                    >
                      <CheckCircle2
                        className={`w-5 h-5 shrink-0 ${
                          t.completed ? 'text-emerald-500' : 'text-slate-400'
                        }`}
                      />
                      <div className="min-w-0">
                        <div
                          className={`text-sm font-medium truncate ${
                            t.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {t.title}
                        </div>
                        <div className={`text-xs font-mono-num ${isOverdue ? 'text-red-500' : 'text-slate-500'}`}>
                          ვადა: {t.dueDate} {isOverdue ? '· ვადაგადაცილებული' : ''}
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateTools({
                          ...tools,
                          tasks: tools.tasks.filter((item) => item.id !== t.id),
                        })
                      }
                      aria-label="წაშლა"
                      className="min-w-[40px] min-h-[40px] rounded-xl text-red-500 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 2. GOALS & HABITS */}
      {tab === 'goals_habits' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-5 space-y-4">
            <h2 className="font-bold text-base text-slate-900 dark:text-white">პირადი მიზნები</h2>
            <form onSubmit={handleAddGoal} className="space-y-2.5">
              <input
                type="text"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="მაგ: 50 ინგლისური სიტყვის სწავლა"
                className="w-full min-h-[44px] rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700 px-3 text-base sm:text-sm"
              />
              <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-2">
                <input
                  type="number"
                  min={1}
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(Number(e.target.value) || 1)}
                  className="min-h-[44px] rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700 px-3 text-base sm:text-sm font-mono-num"
                />
                <input
                  type="text"
                  value={goalUnit}
                  onChange={(e) => setGoalUnit(e.target.value)}
                  placeholder="ერთეული"
                  className="min-h-[44px] rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700 px-3 text-base sm:text-sm"
                />
                <input
                  type="date"
                  value={goalDeadline}
                  onChange={(e) => setGoalDeadline(e.target.value)}
                  className="min-h-[44px] rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700 px-2 text-xs font-mono-num"
                />
              </div>
              <button
                type="submit"
                className="min-h-[44px] w-full min-[380px]:w-auto px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
              >
                მიზნის დამატება
              </button>
            </form>

            <div className="space-y-2.5">
              {tools.goals.map((g) => {
                const pct = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
                return (
                  <div
                    key={g.id}
                    className="rounded-2xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-900 dark:text-white">{g.title}</span>
                      <span className="font-mono-num text-cyan-500">
                        {g.currentValue} / {g.targetValue} {g.unit} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-cyan-500" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateTools({
                            ...tools,
                            goals: tools.goals.map((item) =>
                              item.id === g.id
                                ? { ...item, currentValue: Math.min(item.targetValue, item.currentValue + 1) }
                                : item
                            ),
                          })
                        }
                        className="min-h-[36px] px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                      >
                        +1 პროგრესი
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateTools({ ...tools, goals: tools.goals.filter((x) => x.id !== g.id) })
                        }
                        className="text-xs text-red-500"
                      >
                        წაშლა
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-5 space-y-4">
            <h2 className="font-bold text-base text-slate-900 dark:text-white">ჩვევების ტრეკერი</h2>
            <form onSubmit={handleAddHabit} className="flex flex-col min-[380px]:flex-row gap-2">
              <input
                type="text"
                value={habitTitle}
                onChange={(e) => setHabitTitle(e.target.value)}
                placeholder="მაგ: 15 წუთი კითხვა, დილის წყალი..."
                className="flex-1 min-w-0 min-h-[44px] rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700 px-3 text-base sm:text-sm"
              />
              <button
                type="submit"
                className="min-h-[44px] px-4 rounded-xl bg-emerald-600 text-white text-xs font-semibold shrink-0"
              >
                დამატება
              </button>
            </form>

            <div className="space-y-2.5">
              {tools.habits.map((h) => {
                const doneToday = h.completedDates.includes(today);
                return (
                  <div
                    key={h.id}
                    className="rounded-2xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 p-3.5 flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-slate-900 dark:text-white break-words">
                        {h.title}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>შესრულებული დღეები: {h.completedDates.length}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateTools({
                            ...tools,
                            habits: tools.habits.map((item) =>
                              item.id === h.id
                                ? {
                                    ...item,
                                    completedDates: doneToday
                                      ? item.completedDates.filter((d) => d !== today)
                                      : [...item.completedDates, today],
                                  }
                                : item
                            ),
                          })
                        }
                        className={`min-h-[44px] flex-1 min-[420px]:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-semibold ${
                          doneToday
                            ? 'bg-emerald-600 text-white'
                            : 'border border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {doneToday ? 'დღეს შესრულდა ✓' : 'მონიშნე დღეს'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateTools({ ...tools, habits: tools.habits.filter((x) => x.id !== h.id) })
                        }
                        aria-label="წაშლა"
                        className="min-w-[44px] min-h-[44px] text-red-500 flex items-center justify-center rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. POMODORO & STUDY TIMER */}
      {tab === 'timers' && (
        <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 min-[360px]:p-6 space-y-6 text-center max-w-xl mx-auto">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setTimerRunning(false);
                setTimerMode('pomodoro');
                setSecondsLeft(pomodoroMinutes * 60);
              }}
              className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs font-semibold ${
                timerMode === 'pomodoro'
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            >
              პომოდორო ტაიმერი
            </button>
            <button
              type="button"
              onClick={() => {
                setTimerRunning(false);
                setTimerMode('study');
              }}
              className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs font-semibold ${
                timerMode === 'study'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            >
              თავისუფალი სწავლის წამზომი
            </button>
          </div>

          {timerMode === 'pomodoro' && (
            <div className="flex flex-wrap justify-center gap-2">
              {[15, 25, 5].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  disabled={timerRunning}
                  onClick={() => {
                    setPomodoroMinutes(mins);
                    setSecondsLeft(mins * 60);
                  }}
                  className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-mono-num ${
                    pomodoroMinutes === mins
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-500'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {mins === 5 ? '5 წთ შესვენება' : `${mins} წთ ფოკუსი`}
                </button>
              ))}
            </div>
          )}

          <div className="text-5xl sm:text-6xl font-bold font-mono-num text-slate-900 dark:text-white py-3 sm:py-4">
            {timerMode === 'pomodoro' ? formatTimer(secondsLeft) : formatTimer(studyElapsedSec)}
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => setTimerRunning((r) => !r)}
              className="min-h-[48px] px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold flex items-center gap-2"
            >
              {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{timerRunning ? 'პაუზა' : 'დაწყება'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTimerRunning(false);
                if (timerMode === 'pomodoro') setSecondsLeft(pomodoroMinutes * 60);
                else setStudyElapsedSec(0);
              }}
              className="min-h-[48px] px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>განულება</span>
            </button>
            {timerMode === 'study' && studyElapsedSec >= 10 && (
              <button
                type="button"
                onClick={handleSaveStudySession}
                className="min-h-[48px] px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold"
              >
                სწავლის დროის შენახვა
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            დაგროვილი სესიების დრო: {Math.round(tools.totalStudySeconds / 60)} წუთი
          </div>
        </div>
      )}

      {/* 4. SIMPLE CALCULATOR */}
      {tab === 'calculator' && (
        <div className="rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-5 max-w-sm mx-auto space-y-4">
          <div className="rounded-2xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 p-4 text-right">
            <div className="text-xs font-mono-num text-slate-500 min-h-[18px]">{calcExpr || ' '}</div>
            <div className="text-3xl font-bold font-mono-num text-slate-900 dark:text-white mt-1">
              {calcResult}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', '0', '.', '=', '+'].map((btn) => (
              <button
                key={btn}
                type="button"
                onClick={() => {
                  if (btn === '=') {
                    computeCalc(calcExpr);
                  } else {
                    const next = calcExpr + btn;
                    setCalcExpr(next);
                  }
                }}
                className={`min-h-[52px] rounded-xl border font-bold text-lg ${
                  btn === '='
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-50 dark:bg-[#070D1F] border-slate-200 dark:border-slate-700'
                }`}
              >
                {btn}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setCalcExpr('');
              setCalcResult('0');
            }}
            className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
          >
            გასუფთავება (C)
          </button>
        </div>
      )}

      {/* 5. NOTES, REFLECTION & MOTIVATION */}
      {tab === 'notes_reflect' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Notes */}
            <div className="rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-5 space-y-3">
              <h2 className="font-bold text-base text-slate-900 dark:text-white">სასწავლო ჩანაწერები</h2>
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="ჩანაწერის სათაური"
                className="w-full min-h-[44px] rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700 px-3 text-sm"
              />
              <textarea
                rows={3}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="ჩაინიშნე ახალი წესი, სიტყვა ან იდეა..."
                className="w-full rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700 p-3 text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  if (noteContent.trim().length < 2) return;
                  onUpdateTools({
                    ...tools,
                    notes: [
                      {
                        id: `note_${Date.now()}`,
                        title: noteTitle.trim() || 'ჩანაწერი',
                        content: noteContent.trim(),
                        updatedAt: new Date().toISOString(),
                      },
                      ...tools.notes,
                    ],
                  });
                  setNoteTitle('');
                  setNoteContent('');
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
              >
                შენახვა
              </button>

              <div className="space-y-2 pt-2">
                {tools.notes.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 p-3 flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">{n.title}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{n.content}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateTools({ ...tools, notes: tools.notes.filter((x) => x.id !== n.id) })
                      }
                      className="text-red-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Reflection */}
            <div className="rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-5 space-y-3">
              <h2 className="font-bold text-base text-slate-900 dark:text-white">დღის რეფლექსია</h2>
              <input
                type="text"
                value={wentWell}
                onChange={(e) => setWentWell(e.target.value)}
                placeholder="რა გამოვიდა დღეს კარგად?"
                className="w-full min-h-[44px] rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700 px-3 text-sm"
              />
              <input
                type="text"
                value={improveTomorrow}
                onChange={(e) => setImproveTomorrow(e.target.value)}
                placeholder="რას გავაუმჯობესებ ხვალ?"
                className="w-full min-h-[44px] rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700 px-3 text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  if (!wentWell.trim() && !improveTomorrow.trim()) return;
                  onUpdateTools({
                    ...tools,
                    reflections: [
                      {
                        id: `ref_${Date.now()}`,
                        date: today,
                        wentWell: wentWell.trim(),
                        improveTomorrow: improveTomorrow.trim(),
                      },
                      ...tools.reflections,
                    ],
                  });
                  setWentWell('');
                  setImproveTomorrow('');
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
              >
                რეფლექსიის შენახვა
              </button>

              {tools.reflections.slice(0, 3).map((ref) => (
                <div
                  key={ref.id}
                  className="rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 p-3 text-xs space-y-1"
                >
                  <div className="font-mono-num text-slate-400">{ref.date}</div>
                  {ref.wentWell && <div>კარგი იყო: {ref.wentWell}</div>}
                  {ref.improveTomorrow && <div>ხვალის მიზანი: {ref.improveTomorrow}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Motivation Section */}
          <div className="rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-5 space-y-3">
            <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-500" />
              <span>მოტივაცია და სასწავლო პრინციპები</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {MOTIVATION_CARDS.map((mc) => (
                <div
                  key={mc.title}
                  className="rounded-2xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 p-4 space-y-1.5"
                >
                  <div className="font-semibold text-sm text-slate-900 dark:text-white">{mc.title}</div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{mc.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
