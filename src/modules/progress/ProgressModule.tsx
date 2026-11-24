import React, { useMemo, useState } from 'react';
import { Award, CheckCircle2, Lock, TrendingUp } from 'lucide-react';
import { AppData } from '../../types/app';
import { MATH_LEVELS } from '../../data/mathCurriculum';
import { VOCABULARY_BANK } from '../../data/englishCurriculum';
import { ACHIEVEMENT_DEFINITIONS, calculateStreak } from '../../services/achievements';
import { getTodayDateStr } from '../../services/storage';

interface ProgressModuleProps {
  data: AppData;
}

export const ProgressModule: React.FC<ProgressModuleProps> = ({ data }) => {
  const [range, setRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const totalMathLessons = MATH_LEVELS.reduce((acc, l) => acc + l.lessons.length, 0);
  const completedMath = Object.values(data.mathProgress.lessons).filter((l) => l.completed).length;
  const mathMasteryPct = Math.round((completedMath / Math.max(1, totalMathLessons)) * 100);

  const vocabLearned = Object.values(data.englishProgress.vocabulary).filter((v) => v.mastered).length;
  const englishUnitsTotal = 26 + VOCABULARY_BANK.length + 7; // letters + vocab + sentence/grammar stages
  const englishDone =
    data.englishProgress.masteredLetters.length +
    vocabLearned +
    data.englishProgress.completedStages.length;
  const englishMasteryPct = Math.min(100, Math.round((englishDone / englishUnitsTotal) * 100));

  const submittedAssignments = Object.values(data.assignments).filter(
    (a) => a.status === 'submitted' || a.status === 'completed' || a.status === 'needs_review'
  );
  const assignmentAccuracy =
    submittedAssignments.length > 0
      ? Math.round(
          submittedAssignments.reduce((acc, a) => acc + (a.score || 0), 0) /
            submittedAssignments.length
        )
      : 0;

  const avgBrainScore =
    data.gameScores.length > 0
      ? Math.round(
          data.gameScores.reduce((acc, g) => acc + g.score, 0) / data.gameScores.length
        )
      : 0;

  const streak = calculateStreak(data.studyLog);
  const totalMinutes =
    Object.values(data.studyLog).reduce((acc, d) => acc + d.minutes, 0) +
    Math.round((data.tools.totalStudySeconds || 0) / 60);

  const weakTopics = Array.from(
    new Set([...data.mathProgress.weakTopics, ...data.englishProgress.weakTopics])
  );

  // Build chart data strictly from real studyLog entries
  const chartPoints = useMemo(() => {
    const daysCount = range === 'daily' ? 1 : range === 'weekly' ? 7 : 30;
    const arr: { label: string; minutes: number; accuracy: number }[] = [];
    const now = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = getTodayDateStr(d);
      const log = data.studyLog[key];
      const acc =
        log && log.questionsAnswered > 0
          ? Math.round((log.correctAnswers / log.questionsAnswered) * 100)
          : 0;
      arr.push({
        label: range === 'monthly' && i % 5 !== 0 ? '' : key.slice(5),
        minutes: log?.minutes || 0,
        accuracy: acc,
      });
    }
    return arr;
  }, [data.studyLog, range]);

  const maxMinutes = Math.max(15, ...chartPoints.map((p) => p.minutes));
  const unlockedSet = new Set(data.achievements.map((a) => a.id));

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-fluid-title font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-cyan-500 shrink-0" />
            <span>პროგრესი და მიღწევები</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            ყველა მაჩვენებელი ითვლება რეალურად შესრულებული გაკვეთილებისა და სავარჯიშოების მიხედვით.
          </p>
        </div>

        <div className="grid grid-cols-3 sm:flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800 shrink-0">
          {(
            [
              ['daily', 'დღიური'],
              ['weekly', 'კვირის'],
              ['monthly', 'თვის'],
            ] as const
          ).map(([id, lbl]) => (
            <button
              key={id}
              type="button"
              onClick={() => setRange(id)}
              className={`min-h-[40px] px-3 py-1 rounded-lg text-xs font-semibold ${
                range === id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Key Mastery Cards */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 min-w-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 break-words">მათემატიკის ათვისება</div>
          <div className="text-2xl font-bold tabular-nums text-blue-500 mt-1">{mathMasteryPct}%</div>
          <div className="text-xs text-slate-500 mt-1 break-words">
            {completedMath} / {totalMathLessons} გაკვეთილი
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 min-w-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 break-words">ინგლისურის ათვისება</div>
          <div className="text-2xl font-bold tabular-nums text-purple-500 mt-1">{englishMasteryPct}%</div>
          <div className="text-xs text-slate-500 mt-1 break-words">
            ასოები: {data.englishProgress.masteredLetters.length}/26 · სიტყვა: {vocabLearned}
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 min-w-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 break-words">დავალებების სიზუსტე</div>
          <div className="text-2xl font-bold tabular-nums text-emerald-500 mt-1">{assignmentAccuracy}%</div>
          <div className="text-xs text-slate-500 mt-1 break-words">
            გაგზავნილია: {submittedAssignments.length}
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 min-w-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 break-words">ტვინის ვარჯიში და დრო</div>
          <div className="text-2xl font-bold tabular-nums text-cyan-500 mt-1">{avgBrainScore} ქ</div>
          <div className="text-xs text-slate-500 mt-1 break-words">
            სერია: {streak} დღე · სულ: {totalMinutes} წთ
          </div>
        </div>
      </div>

      {/* Adaptive Responsive Activity Chart */}
      <section className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 min-[360px]:p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold text-base text-slate-900 dark:text-white">
            სწავლის დროის დინამიკა (წუთები)
          </h2>
          <span className="text-xs text-slate-500 font-mono-num">მაქს: {maxMinutes} წთ</span>
        </div>

        <div className="w-full">
          <div
            className={`w-full h-44 sm:h-48 flex items-end pt-5 pb-1 border-b border-slate-200 dark:border-slate-800 ${
              range === 'monthly' ? 'gap-[2px] sm:gap-1' : 'gap-2 sm:gap-3'
            }`}
          >
            {chartPoints.map((pt, idx) => {
              const heightPct = Math.max(4, Math.round((pt.minutes / maxMinutes) * 100));
              return (
                <div key={idx} className="flex-1 min-w-0 flex flex-col items-center justify-end h-full gap-1">
                  <span className="text-[9px] sm:text-[10px] font-mono-num text-slate-500 truncate max-w-full">
                    {pt.minutes > 0 ? pt.minutes : ''}
                  </span>
                  <div
                    title={`${pt.minutes} წთ`}
                    className={`w-full max-w-[36px] rounded-t-md sm:rounded-t-lg transition-all ${
                      pt.minutes > 0
                        ? 'bg-gradient-to-t from-blue-600 to-cyan-400'
                        : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[9px] sm:text-[10px] font-mono-num text-slate-400 h-3.5 whitespace-nowrap">
                    {pt.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Weak Topics */}
      <section className="rounded-2xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 sm:p-5 space-y-2">
        <h2 className="font-bold text-sm text-slate-900 dark:text-white">
          თემები, რომლებიც საჭიროებს დამატებით გამეორებას
        </h2>
        {weakTopics.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ამ ეტაპზე სუსტი თემები არ დაფიქსირებულა. გააგრძელე სავარჯიშოები!
          </p>
        ) : (
          <ul className="space-y-1 text-xs text-amber-600 dark:text-amber-300">
            {weakTopics.map((wt) => (
              <li key={wt} className="break-words">• {wt}</li>
            ))}
          </ul>
        )}
      </section>

      {/* Achievements Grid */}
      <section className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 min-[360px]:p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500 shrink-0" />
            <span>მიღწევები ({unlockedSet.size} / {ACHIEVEMENT_DEFINITIONS.length})</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ACHIEVEMENT_DEFINITIONS.map((def) => {
            const unlocked = unlockedSet.has(def.id);
            return (
              <div
                key={def.id}
                className={`rounded-2xl border p-4 space-y-1.5 min-w-0 ${
                  unlocked
                    ? 'bg-emerald-500/10 border-emerald-500/40'
                    : 'bg-slate-50 dark:bg-[#070D1F] border-slate-200 dark:border-slate-800 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white break-words">
                    {def.title}
                  </span>
                  {unlocked ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed break-words">
                  {def.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
