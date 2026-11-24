import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  History,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import {
  AppData,
  AssignmentQuestion,
  AssignmentStatus,
  DailyAssignmentRecord,
} from '../../types/app';
import { MATH_LEVELS } from '../../data/mathCurriculum';
import { VOCABULARY_BANK } from '../../data/englishCurriculum';
import { getTodayDateStr } from '../../services/storage';
import { playErrorChime, playSuccessChime } from '../../services/speechAndSound';

interface DailyAssignmentsModuleProps {
  data: AppData;
  onSaveAssignment: (record: DailyAssignmentRecord, correctCountDelta?: number) => void;
  onGoToNextRecommended: () => void;
}

const STATUS_LABELS: Record<AssignmentStatus, string> = {
  not_started: 'დაუწყებელია',
  in_progress: 'მიმდინარეობს',
  submitted: 'გაგზავნილია',
  completed: 'შესრულებულია',
  needs_review: 'საჭიროებს გამეორებას',
};

function buildDeterministicDailyQuestions(data: AppData): AssignmentQuestion[] {
  const questions: AssignmentQuestion[] = [];
  const focus = data.profile.subjectFocus;
  const maxMathLevel =
    data.profile.level === 'absolute_beginner'
      ? 2
      : data.profile.level === 'beginner'
      ? 4
      : 6;

  // 1. Math Questions (prioritize weak or incomplete level)
  if (focus === 'all' || focus === 'math' || focus === 'memory') {
    const mathPool = MATH_LEVELS.filter((l) => l.id <= maxMathLevel).flatMap((l) => l.lessons);
    const chosenLesson =
      mathPool.find((l) => !data.mathProgress.lessons[l.id]?.completed) || mathPool[0];
    const generated = chosenLesson.generateQuestions(2);
    generated.forEach((mq, idx) => {
      questions.push({
        id: `da_math_${idx}_${Date.now()}`,
        subject: 'math',
        topic: chosenLesson.title,
        prompt: mq.prompt,
        options: mq.options,
        correctAnswer: mq.correctAnswer,
        explanation: mq.explanation,
      });
    });
  }

  // 2. English Vocabulary / Review Questions (spaced repetition priority)
  if (focus === 'all' || focus === 'english') {
    const dueWords = VOCABULARY_BANK.filter((w) => {
      const m = data.englishProgress.vocabulary[w.id];
      return !m || m.mistakeCount > m.correctCount || !m.mastered;
    });
    const sourceWords = dueWords.length >= 2 ? dueWords : VOCABULARY_BANK;
    const pickedWords = [...sourceWords].sort(() => Math.random() - 0.5).slice(0, 2);

    pickedWords.forEach((word, idx) => {
      const distractors = VOCABULARY_BANK.filter((w) => w.id !== word.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((w) => w.georgian);
      const opts = [word.georgian, ...distractors].sort(() => Math.random() - 0.5);
      questions.push({
        id: `da_eng_${idx}_${Date.now()}`,
        subject: 'english',
        topic: 'ინგლისური ლექსიკა',
        prompt: `რას ნიშნავს ინგლისური სიტყვა „${word.english}“ [${word.pronunciationKa}]?`,
        options: opts,
        correctAnswer: word.georgian,
        explanation: `${word.english} ნიშნავს „${word.georgian}“. მაგალითი: ${word.exampleEn} (${word.exampleKa})`,
      });
    });
  }

  // 3. Memory / Logic Quick Activity
  const baseSeq = Math.floor(Math.random() * 5) + 2;
  const step = Math.floor(Math.random() * 3) + 2;
  const ansSeq = baseSeq + step * 3;
  questions.push({
    id: `da_mem_${Date.now()}`,
    subject: 'memory',
    topic: 'ლოგიკური მიმდევრობა',
    prompt: `იპოვე კანონზომიერება და გამოტოვებული რიცხვი: ${baseSeq}, ${baseSeq + step}, ${
      baseSeq + step * 2
    }, ?`,
    options: [
      String(ansSeq),
      String(ansSeq + 1),
      String(ansSeq - 1),
      String(ansSeq + step),
    ].sort(() => Math.random() - 0.5),
    correctAnswer: String(ansSeq),
    explanation: `თითოეული რიცხვი იზრდება ${step}-ით, ამიტომ ${baseSeq + step * 2} + ${step} = ${ansSeq}.`,
  });

  // 4. Short Review Question
  if (data.profile.dailyGoalMinutes >= 15) {
    questions.push({
      id: `da_rev_${Date.now()}`,
      subject: 'review',
      topic: 'გამეორება',
      prompt: 'როგორ ითქმის ინგლისურად „მე მინდა წყალი“?',
      options: ['I want water.', 'I am water.', 'This is water.', 'He has water.'],
      correctAnswer: 'I want water.',
      explanation: '„I want“ ნიშნავს „მე მინდა“, ხოლო „water“ — წყალს.',
    });
  }

  return questions;
}

export const DailyAssignmentsModule: React.FC<DailyAssignmentsModuleProps> = ({
  data,
  onSaveAssignment,
  onGoToNextRecommended,
}) => {
  const today = getTodayDateStr();
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeMode, setActiveMode] = useState<'overview' | 'solving' | 'retry'>('overview');
  const [retryIds, setRetryIds] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatusNote, setAiStatusNote] = useState<string | null>(null);

  const todayRecord = data.assignments[today];

  // Auto-ensure today's assignment exists
  useEffect(() => {
    if (!todayRecord) {
      const initial: DailyAssignmentRecord = {
        date: today,
        status: 'not_started',
        questions: buildDeterministicDailyQuestions(data),
        answers: {},
        currentIndex: 0,
        score: null,
        mistakes: [],
      };
      onSaveAssignment(initial);
    }
  }, [today, todayRecord]);

  const currentRecord = data.assignments[selectedDate] || todayRecord;

  const startOrResume = () => {
    if (!currentRecord) return;
    if (currentRecord.status === 'not_started') {
      onSaveAssignment({
        ...currentRecord,
        status: 'in_progress',
        startedAt: new Date().toISOString(),
      });
    }
    setActiveMode('solving');
  };

  const pauseAndSave = () => {
    if (!currentRecord) return;
    onSaveAssignment({
      ...currentRecord,
      status: 'in_progress',
    });
    setActiveMode('overview');
  };

  const handleSelectAnswer = (qId: string, option: string) => {
    if (!currentRecord) return;
    onSaveAssignment({
      ...currentRecord,
      status: 'in_progress',
      answers: { ...currentRecord.answers, [qId]: option },
    });
  };

  const handleSubmit = () => {
    if (!currentRecord) return;
    let correct = 0;
    const mistakes: string[] = [];
    for (const q of currentRecord.questions) {
      if (currentRecord.answers[q.id] === q.correctAnswer) {
        correct++;
      } else {
        mistakes.push(q.id);
      }
    }
    const score = Math.round((correct / currentRecord.questions.length) * 100);
    const status: AssignmentStatus = score >= 70 ? 'completed' : 'needs_review';
    if (score >= 70) playSuccessChime(data.profile.soundEnabled);
    else playErrorChime(data.profile.soundEnabled);

    onSaveAssignment(
      {
        ...currentRecord,
        status,
        score,
        mistakes,
        submittedAt: new Date().toISOString(),
      },
      correct
    );
    setActiveMode('overview');
  };

  const handleStartRetryMistakes = () => {
    if (!currentRecord || currentRecord.mistakes.length === 0) return;
    const clearedAnswers = { ...currentRecord.answers };
    currentRecord.mistakes.forEach((id) => {
      delete clearedAnswers[id];
    });
    onSaveAssignment({
      ...currentRecord,
      status: 'in_progress',
      answers: clearedAnswers,
    });
    setRetryIds(currentRecord.mistakes);
    setActiveMode('retry');
  };

  const handleEnhanceWithAI = async () => {
    if (!currentRecord) return;
    setAiLoading(true);
    setAiStatusNote(null);
    try {
      const res = await fetch('/api/ai/assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: data.profile.level,
          weakTopics: [
            ...data.mathProgress.weakTopics,
            ...data.englishProgress.weakTopics,
          ].slice(0, 5),
          subjects: [data.profile.subjectFocus],
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setAiStatusNote(
          err.error || 'AI დამატება დროებით მიუწვდომელია — გამოიყენება შემოწმებული ოფლაინ დავალებები.'
        );
        return;
      }
      const payload = await res.json();
      if (Array.isArray(payload.questions) && payload.questions.length > 0) {
        const extra: AssignmentQuestion[] = payload.questions.map(
          (q: {
            subject?: string;
            prompt: string;
            options: string[];
            correctAnswer: string;
            explanation: string;
          }, idx: number) => ({
            id: `ai_q_${Date.now()}_${idx}`,
            subject: q.subject === 'math' ? 'math' : 'english',
            topic: 'AI პერსონალური სავარჯიშო',
            prompt: q.prompt,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
          })
        );
        onSaveAssignment({
          ...currentRecord,
          questions: [...currentRecord.questions, ...extra],
        });
        setAiStatusNote(`დაემატა ${extra.length} პერსონალური AI კითხვა!`);
      }
    } catch {
      setAiStatusNote('ინტერნეტთან კავშირი ვერ მოხერხდა — გააგრძელე ოფლაინ დავალებით.');
    } finally {
      setAiLoading(false);
    }
  };

  const historyDates = Object.keys(data.assignments).sort().reverse();

  if (!currentRecord) {
    return (
      <div className="rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800 p-8 text-center">
        იტვირთება დღის დავალება...
      </div>
    );
  }

  const visibleQuestions =
    activeMode === 'retry'
      ? currentRecord.questions.filter((q) => retryIds.includes(q.id))
      : currentRecord.questions;

  const allAnswered = visibleQuestions.every((q) => Boolean(currentRecord.answers[q.id]));

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-fluid-title font-bold text-slate-900 dark:text-white">დღის დავალების სისტემა</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 break-words">
            თარიღი: {currentRecord.date} · სტატუსი: <strong>{STATUS_LABELS[currentRecord.status]}</strong>
          </p>
        </div>

        {selectedDate === today && activeMode === 'overview' && currentRecord.status !== 'completed' && (
          <button
            type="button"
            disabled={aiLoading}
            onClick={handleEnhanceWithAI}
            className="min-h-[44px] w-full sm:w-auto px-4 py-2 rounded-xl border border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-300 text-xs font-semibold flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{aiLoading ? 'AI ამზადებს...' : 'AI დამატებითი კითხვები'}</span>
          </button>
        )}
      </div>

      {aiStatusNote && (
        <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 px-4 py-2.5 text-xs text-blue-700 dark:text-cyan-300">
          {aiStatusNote}
        </div>
      )}

      {/* Solving / Retry Interactive Mode */}
      {(activeMode === 'solving' || activeMode === 'retry') && (
        <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 min-[360px]:p-5 sm:p-7 space-y-5 sm:space-y-6">
          <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-2.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {activeMode === 'retry' ? 'შეცდომების გამოსწორება' : 'დღევანდელი კითხვები'}
            </h2>
            <button
              type="button"
              onClick={pauseAndSave}
              className="min-h-[44px] w-full min-[420px]:w-auto px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>შენახვა და პაუზა</span>
            </button>
          </div>

          <div className="space-y-5 sm:space-y-6">
            {visibleQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="rounded-2xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 p-3.5 sm:p-5 space-y-3"
              >
                <div className="text-xs font-medium text-cyan-600 dark:text-cyan-400">
                  {idx + 1}. {q.topic}
                </div>
                <div className="text-base font-semibold text-slate-900 dark:text-white break-words">
                  {q.prompt}
                </div>
                <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2.5">
                  {q.options.map((opt) => {
                    const selected = currentRecord.answers[q.id] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectAnswer(q.id, opt)}
                        className={`min-h-[48px] text-left rounded-xl border px-3.5 sm:px-4 py-2.5 text-sm font-medium transition-colors break-words ${
                          selected
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-white dark:bg-[#0E1730] border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-400'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              პასუხგაცემულია: {visibleQuestions.filter((q) => currentRecord.answers[q.id]).length} /{' '}
              {visibleQuestions.length}
            </span>
            <button
              type="button"
              disabled={!allAnswered}
              onClick={handleSubmit}
              className="min-h-[48px] w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 disabled:opacity-40 text-white font-semibold text-sm"
            >
              დავალების გაგზავნა და შეფასება
            </button>
          </div>
        </div>
      )}

      {/* Overview & Review Mode */}
      {activeMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 min-[360px]:p-5 sm:p-6 space-y-5 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 text-cyan-500 flex items-center justify-center shrink-0">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white break-words">
                    დავალება ({currentRecord.date})
                  </h2>
                  <div className="text-xs text-slate-500 dark:text-slate-400 break-words">
                    სულ {currentRecord.questions.length} სავარჯიშო · სტატუსი: {STATUS_LABELS[currentRecord.status]}
                  </div>
                </div>
              </div>

              {currentRecord.score !== null && (
                <div className="text-2xl font-bold tabular-nums text-emerald-500 shrink-0">
                  {currentRecord.score}%
                </div>
              )}
            </div>

            {currentRecord.status === 'not_started' || currentRecord.status === 'in_progress' ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  დღევანდელი გეგმა მოიცავს მათემატიკის, ინგლისური ლექსიკისა და ლოგიკური გამეორების სავარჯიშოებს,
                  შერჩეულს შენი დონის მიხედვით. შეგიძლია დაიწყო, შეინახო და გააგრძელო მოგვიანებით.
                </p>
                <button
                  type="button"
                  onClick={startOrResume}
                  className="min-h-[48px] w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 shrink-0" />
                  <span>
                    {currentRecord.status === 'in_progress'
                      ? 'დავალების გაგრძელება'
                      : 'დავალების გახსნა'}
                  </span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                  {currentRecord.mistakes.length > 0 && (
                    <button
                      type="button"
                      onClick={handleStartRetryMistakes}
                      className="min-h-[44px] w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4 shrink-0" />
                      <span>შეცდომების თავიდან გავლა ({currentRecord.mistakes.length})</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onGoToNextRecommended}
                    className="min-h-[44px] w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <span>შემდეგი რეკომენდებული გაკვეთილი</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                </div>

                {/* Detailed Question Review */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    პასუხებისა და შეცდომების ანალიზი:
                  </h3>
                  {currentRecord.questions.map((q) => {
                    const userAns = currentRecord.answers[q.id];
                    const ok = userAns === q.correctAnswer;
                    return (
                      <div
                        key={q.id}
                        className={`rounded-2xl border p-4 text-xs space-y-1.5 ${
                          ok
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-red-500/10 border-red-500/30'
                        }`}
                      >
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          {ok ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                          )}
                          <span>{q.prompt}</span>
                        </div>
                        <div className="text-slate-700 dark:text-slate-300">
                          შენი პასუხი: <strong>{userAns || '—'}</strong> · სწორი პასუხი:{' '}
                          <strong>{q.correctAnswer}</strong>
                        </div>
                        <div className="text-slate-600 dark:text-slate-400">{q.explanation}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Assignment History Sidebar */}
          <div className="rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-5 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 dark:text-white">
              <History className="w-4 h-4 text-blue-500" />
              <span>დავალებების ისტორია</span>
            </div>
            <div className="space-y-2">
              {historyDates.map((dt) => {
                const rec = data.assignments[dt];
                const active = dt === currentRecord.date;
                return (
                  <button
                    key={dt}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dt);
                      setActiveMode('overview');
                    }}
                    className={`w-full min-h-[48px] rounded-xl border px-3.5 py-2 text-left flex items-center justify-between text-xs transition-colors ${
                      active
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-50 dark:bg-[#070D1F] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold font-mono-num">{dt}</div>
                      <div className={active ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}>
                        {STATUS_LABELS[rec.status]}
                      </div>
                    </div>
                    <span className="font-bold tabular-nums">
                      {rec.score !== null ? `${rec.score}%` : '—'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
