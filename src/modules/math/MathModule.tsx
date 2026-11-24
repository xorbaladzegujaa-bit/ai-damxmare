import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Play,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import {
  MATH_LEVELS,
  MathLessonDef,
  MathQuestion,
  isMathLessonUnlocked,
} from '../../data/mathCurriculum';
import { MathProgress } from '../../types/app';
import { MathVisualStage } from './MathVisualStage';
import { playErrorChime, playSuccessChime } from '../../services/speechAndSound';

interface MathModuleProps {
  mathProgress: MathProgress;
  soundEnabled: boolean;
  onCompleteLesson: (payload: {
    lessonId: string;
    levelId: number;
    score: number;
    passed: boolean;
    questionsCount: number;
    correctCount: number;
    mistakes: string[];
    topic: string;
  }) => void;
  onAskAiHelp: (topic: string) => void;
}

export const MathModule: React.FC<MathModuleProps> = ({
  mathProgress,
  soundEnabled,
  onCompleteLesson,
  onAskAiHelp,
}) => {
  const [selectedLevelId, setSelectedLevelId] = useState<number>(1);
  const [activeLesson, setActiveLesson] = useState<MathLessonDef | null>(null);
  const [phase, setPhase] = useState<'learn' | 'quiz' | 'result'>('learn');
  const [questions, setQuestions] = useState<MathQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakes, setMistakes] = useState<string[]>([]);

  const currentLevel = useMemo(
    () => MATH_LEVELS.find((l) => l.id === selectedLevelId) || MATH_LEVELS[0],
    [selectedLevelId]
  );

  const openLesson = (lesson: MathLessonDef) => {
    setActiveLesson(lesson);
    setPhase('learn');
    setQuestions([]);
    setQIndex(0);
    setSelectedOption(null);
    setIsChecked(false);
    setCorrectCount(0);
    setMistakes([]);
  };

  const startQuiz = () => {
    if (!activeLesson) return;
    const generated = activeLesson.generateQuestions(5);
    setQuestions(generated);
    setPhase('quiz');
    setQIndex(0);
    setSelectedOption(null);
    setIsChecked(false);
    setCorrectCount(0);
    setMistakes([]);
  };

  const handleCheckAnswer = () => {
    if (!selectedOption || !questions[qIndex] || isChecked) return;
    const currentQ = questions[qIndex];
    const ok = selectedOption === currentQ.correctAnswer;
    setIsChecked(true);
    if (ok) {
      setCorrectCount((c) => c + 1);
      playSuccessChime(soundEnabled);
    } else {
      setMistakes((prev) => [...prev, `${currentQ.prompt} (სწორი პასუხი: ${currentQ.correctAnswer})`]);
      playErrorChime(soundEnabled);
    }
  };

  const handleNextQuestion = () => {
    if (!activeLesson) return;
    if (qIndex + 1 < questions.length) {
      setQIndex((i) => i + 1);
      setSelectedOption(null);
      setIsChecked(false);
    } else {
      const score = Math.round((correctCount / questions.length) * 100);
      const passed = score >= 70;
      setPhase('result');
      onCompleteLesson({
        lessonId: activeLesson.id,
        levelId: activeLesson.levelId,
        score,
        passed,
        questionsCount: questions.length,
        correctCount,
        mistakes,
        topic: activeLesson.title,
      });
    }
  };

  // Active Lesson View
  if (activeLesson) {
    const currentQ = questions[qIndex];
    const finalScore = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

    return (
      <div className="space-y-5 sm:space-y-6">
        <div className="flex flex-col min-[460px]:flex-row min-[460px]:items-center justify-between gap-2.5 sm:gap-4">
          <button
            type="button"
            onClick={() => setActiveLesson(null)}
            className="min-h-[44px] w-full min-[460px]:w-auto px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>დონეებზე დაბრუნება</span>
          </button>

          <button
            type="button"
            onClick={() => onAskAiHelp(`მათემატიკა — ${activeLesson.title}`)}
            className="min-h-[44px] w-full min-[460px]:w-auto px-4 py-2 rounded-xl bg-purple-600/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 text-xs font-semibold text-center"
          >
            AI მასწავლებლის დახმარება
          </button>
        </div>

        {phase === 'learn' && (
          <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 min-[360px]:p-6 sm:p-8 space-y-5 sm:space-y-6">
            <div>
              <div className="text-xs font-medium text-cyan-600 dark:text-cyan-400">
                დონე {activeLesson.levelId} · გაკვეთილი {activeLesson.order}
              </div>
              <h1 className="text-fluid-title font-bold text-slate-900 dark:text-white mt-1 break-words">
                {activeLesson.title}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                {activeLesson.explanation}
              </p>
            </div>

            <MathVisualStage
              type={activeLesson.visualDemo.type}
              a={activeLesson.visualDemo.a}
              b={activeLesson.visualDemo.b}
              caption={activeLesson.visualDemo.caption}
            />

            <div className="space-y-2.5">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                ეტაპობრივი ახსნა:
              </h2>
              <ol className="space-y-2">
                {activeLesson.steps.map((st, idx) => (
                  <li
                    key={idx}
                    className="rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 flex items-start gap-3"
                  >
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span>{st}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={startQuiz}
                className="min-h-[48px] w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
              >
                <Play className="w-4 h-4" />
                <span>პრაქტიკისა და ტესტის დაწყება (5 კითხვა)</span>
              </button>
            </div>
          </div>
        )}

        {phase === 'quiz' && currentQ && (
          <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 min-[360px]:p-6 sm:p-8 space-y-5 sm:space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="break-words">{activeLesson.title}</span>
              <span className="font-mono-num shrink-0">
                კითხვა {qIndex + 1} / {questions.length}
              </span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all duration-300"
                style={{ width: `${((qIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{currentQ.prompt}</h2>

            {currentQ.visual?.type === 'count' && currentQ.visual.a && (
              <div className="flex flex-wrap gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800">
                {Array.from({ length: currentQ.visual.a }, (_, i) => (
                  <span key={i} className="w-7 h-7 rounded-full bg-cyan-500" />
                ))}
              </div>
            )}

            {currentQ.visual?.type === 'add' && currentQ.visual.a && currentQ.visual.b && (
              <div className="flex flex-wrap items-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800">
                {Array.from({ length: currentQ.visual.a }, (_, i) => (
                  <span key={`va_${i}`} className="w-6 h-6 rounded-md bg-blue-500" />
                ))}
                <span className="font-bold text-slate-500 px-1">+</span>
                {Array.from({ length: currentQ.visual.b }, (_, i) => (
                  <span key={`vb_${i}`} className="w-6 h-6 rounded-md bg-emerald-500" />
                ))}
              </div>
            )}

            {currentQ.visual?.type === 'sub' && currentQ.visual.a && currentQ.visual.b !== undefined && (
              <div className="flex flex-wrap items-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800">
                {Array.from({ length: currentQ.visual.a }, (_, i) => (
                  <span
                    key={`vs_${i}`}
                    className={`w-6 h-6 rounded-md ${
                      i >= currentQ.visual!.a! - currentQ.visual!.b!
                        ? 'bg-red-500/35 border border-red-400'
                        : 'bg-blue-500'
                    }`}
                  />
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2.5 sm:gap-3">
              {currentQ.options.map((opt) => {
                const isSelected = selectedOption === opt;
                const isCorrect = opt === currentQ.correctAnswer;
                let style =
                  'bg-slate-50 dark:bg-[#070D1F] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 hover:border-blue-500';
                if (isChecked) {
                  if (isCorrect) {
                    style = 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300';
                  } else if (isSelected && !isCorrect) {
                    style = 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-300';
                  }
                } else if (isSelected) {
                  style = 'bg-blue-600/20 border-cyan-400 text-blue-700 dark:text-white';
                }

                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={isChecked}
                    onClick={() => setSelectedOption(opt)}
                    className={`min-h-[54px] rounded-2xl border px-4 py-3 text-base font-semibold tabular-nums transition-colors ${style}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {isChecked && (
              <div
                className={`rounded-2xl p-4 border text-sm ${
                  selectedOption === currentQ.correctAnswer
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-200'
                    : 'bg-red-500/15 border-red-500/40 text-red-800 dark:text-red-200'
                }`}
              >
                <div className="font-semibold flex items-center gap-2 mb-1">
                  {selectedOption === currentQ.correctAnswer ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>სწორია!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>არასწორია — სწორი პასუხია: {currentQ.correctAnswer}</span>
                    </>
                  )}
                </div>
                <p className="text-xs leading-relaxed">{currentQ.explanation}</p>
              </div>
            )}

            <div className="flex justify-end">
              {!isChecked ? (
                <button
                  type="button"
                  disabled={!selectedOption}
                  onClick={handleCheckAnswer}
                  className="min-h-[48px] w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 disabled:opacity-40 text-white font-semibold text-sm"
                >
                  პასუხის შემოწმება
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="min-h-[48px] w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm"
                >
                  {qIndex + 1 < questions.length ? 'შემდეგი კითხვა' : 'შედეგის ნახვა'}
                </button>
              )}
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-5 sm:p-8 space-y-5 text-center">
            <div className="text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
              {finalScore}% ({correctCount} / {questions.length})
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {finalScore >= 70
                ? 'შესანიშნავია! გაკვეთილი ჩაბარებულია და შემდეგი საფეხური გაიხსნა.'
                : 'გადასვლისთვის საჭიროა მინიმუმ 70%. გადახედე ახსნას და სცადე თავიდან.'}
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={startQuiz}
                className="min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>თავიდან გავლა</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveLesson(null)}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold"
              >
                გაკვეთილების სიაში დაბრუნება
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-fluid-title font-bold text-slate-900 dark:text-white">მათემატიკა — ნულიდან ოსტატობამდე</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          გაიარე 6 პროგრესული დონე. შემდეგი გაკვეთილი იხსნება წინა გაკვეთილში მინიმუმ 70%-იანი შედეგის შემდეგ.
        </p>
      </div>

      {/* Level Selector Tabs */}
      <div className="grid grid-cols-2 min-[480px]:grid-cols-3 lg:flex lg:flex-wrap gap-2">
        {MATH_LEVELS.map((lvl) => {
          const active = lvl.id === selectedLevelId;
          const doneCount = lvl.lessons.filter((l) => mathProgress.lessons[l.id]?.completed).length;
          return (
            <button
              key={lvl.id}
              type="button"
              onClick={() => setSelectedLevelId(lvl.id)}
              className={`min-h-[44px] px-3 sm:px-4 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition-colors ${
                active
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-white dark:bg-[#0E1730] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-500/50'
              }`}
            >
              დონე {lvl.id} ({doneCount}/{lvl.lessons.length})
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 min-[360px]:p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white break-words">{currentLevel.title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">{currentLevel.description}</p>
        </div>

        <div className="space-y-3">
          {currentLevel.lessons.map((lesson) => {
            const unlocked = isMathLessonUnlocked(
              lesson.levelId,
              lesson.order,
              mathProgress.lessons
            );
            const record = mathProgress.lessons[lesson.id];
            const completed = Boolean(record?.completed);

            return (
              <div
                key={lesson.id}
                className={`rounded-2xl border p-3.5 sm:p-4 flex flex-col min-[440px]:flex-row min-[440px]:items-center justify-between gap-3 sm:gap-4 ${
                  unlocked
                    ? 'bg-slate-50 dark:bg-[#070D1F] border-slate-200 dark:border-slate-800'
                    : 'bg-slate-100/70 dark:bg-[#070D1F]/50 border-slate-200/70 dark:border-slate-800/40 opacity-70'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      completed
                        ? 'bg-emerald-500/20 text-emerald-500'
                        : unlocked
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-300 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {completed ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : unlocked ? (
                      lesson.order
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-slate-900 dark:text-white break-words">
                      {lesson.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                      {unlocked
                        ? record
                          ? `${lesson.subtitle} · საუკეთესო შედეგი: ${record.bestScore}%`
                          : lesson.subtitle
                        : 'დაბლოკილია — ჯერ დაასრულე წინა გაკვეთილი (≥70%)'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!unlocked}
                  onClick={() => openLesson(lesson)}
                  className={`min-h-[44px] w-full min-[440px]:w-auto px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 ${
                    unlocked
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {completed ? 'გამეორება' : unlocked ? 'დაწყება' : 'ჩაკეტილია'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
