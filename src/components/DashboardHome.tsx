import React from 'react';
import {
  ArrowRight,
  Award,
  Bell,
  Bot,
  Brain,
  Calculator,
  CalendarCheck,
  Clock,
  Flame,
  HeartHandshake,
  Languages,
  Target,
  Wrench,
} from 'lucide-react';
import { AppData, LearnSubView, NavTab } from '../types/app';
import { MATH_LEVELS, isMathLessonUnlocked } from '../data/mathCurriculum';
import { ACHIEVEMENT_DEFINITIONS, calculateStreak } from '../services/achievements';
import { getTodayDateStr } from '../services/storage';

interface DashboardHomeProps {
  data: AppData;
  onNavigate: (tab: NavTab, subView?: LearnSubView) => void;
}

const LEVEL_LABELS: Record<AppData['profile']['level'], string> = {
  absolute_beginner: 'სრული დამწყები (0-დან)',
  beginner: 'საბაზისო',
  intermediate: 'საშუალო',
};

export const DashboardHome: React.FC<DashboardHomeProps> = ({ data, onNavigate }) => {
  const today = getTodayDateStr();
  const streak = calculateStreak(data.studyLog);

  const allMathLessons = MATH_LEVELS.flatMap((lvl) => lvl.lessons);
  const completedMathCount = allMathLessons.filter(
    (l) => data.mathProgress.lessons[l.id]?.completed
  ).length;
  const masteredLettersCount = data.englishProgress.masteredLetters.length;
  const completedEnglishStagesCount = data.englishProgress.completedStages.length;
  const totalCompletedLessons = completedMathCount + completedEnglishStagesCount + (masteredLettersCount >= 26 ? 1 : 0);

  const todayAssignment = data.assignments[today];
  const pendingAssignmentCount = Object.values(data.assignments).filter(
    (a) => a.status === 'not_started' || a.status === 'in_progress' || a.status === 'needs_review'
  ).length;
  const todayHasPending =
    !todayAssignment ||
    todayAssignment.status === 'not_started' ||
    todayAssignment.status === 'in_progress' ||
    todayAssignment.status === 'needs_review';

  const totalLogMinutes = Object.values(data.studyLog).reduce((acc, d) => acc + d.minutes, 0);
  const totalToolMinutes = Math.round((data.tools.totalStudySeconds || 0) / 60);
  const totalMinutes = totalLogMinutes + totalToolMinutes;
  const todayMinutes = data.studyLog[today]?.minutes || 0;
  const dailyGoalProgress = Math.min(
    100,
    Math.round((todayMinutes / Math.max(1, data.profile.dailyGoalMinutes)) * 100)
  );

  // Recommended next lesson based on real progress
  const nextMathLesson = allMathLessons.find(
    (l) =>
      !data.mathProgress.lessons[l.id]?.completed &&
      isMathLessonUnlocked(l.levelId, l.order, data.mathProgress.lessons)
  );

  let recommendedTitle = 'ინგლისური ანბანის შესწავლა';
  let recommendedDesc = 'დაიწყე პირველი ასოების ამოცნობით და გამოთქმით.';
  let recommendedTarget: { tab: NavTab; sub: LearnSubView } = { tab: 'learn', sub: 'english' };

  if (data.profile.subjectFocus === 'math' || (nextMathLesson && completedMathCount <= masteredLettersCount)) {
    if (nextMathLesson) {
      recommendedTitle = `მათემატიკა: ${nextMathLesson.title}`;
      recommendedDesc = nextMathLesson.subtitle;
      recommendedTarget = { tab: 'learn', sub: 'math' };
    }
  } else if (masteredLettersCount >= 26) {
    recommendedTitle = 'ინგლისური ლექსიკა და წინადადებები';
    recommendedDesc = 'გაიმდიდრე სიტყვების მარაგი და ივარჯიშე ფრაზებში.';
    recommendedTarget = { tab: 'learn', sub: 'english' };
  }

  const nextReminder = data.reminders
    .filter((r) => r.enabled)
    .sort((a, b) => a.time.localeCompare(b.time))[0];

  const unlockedDefs = ACHIEVEMENT_DEFINITIONS.filter((def) =>
    data.achievements.some((a) => a.id === def.id)
  );

  return (
    <div className="space-y-5 sm:space-y-7">
      {/* Hero Greeting & Primary Daily CTA */}
      <section className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 min-[360px]:p-5 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
          <div className="space-y-2 max-w-2xl min-w-0">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 break-words">
              {LEVEL_LABELS[data.profile.level]} · დღიური მიზანი: {data.profile.dailyGoalMinutes} წუთი
            </div>
            <h1 className="text-fluid-display font-bold text-slate-900 dark:text-white tracking-tight break-words">
              გამარჯობა, {data.profile.name || 'მოსწავლე'}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words">
              {data.profile.mainGoal || 'ყოველდღიური ნაბიჯებით ააშენე მყარი ცოდნა მათემატიკასა და ინგლისურში.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => onNavigate('learn', 'assignments')}
              className="min-h-[48px] w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <CalendarCheck className="w-4 h-4 shrink-0" />
              <span className="truncate">{todayHasPending ? 'დღის დავალების დაწყება' : 'დღის დავალების ნახვა'}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>

        {/* Daily Study Goal Bar */}
        <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2">
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              დღევანდელი სწავლის პროგრესი
            </span>
            <span className="font-mono-num text-slate-900 dark:text-cyan-400 font-semibold">
              {todayMinutes} / {data.profile.dailyGoalMinutes} წუთი ({dailyGoalProgress}%)
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${dailyGoalProgress}%` }}
            />
          </div>
        </div>
      </section>

      {/* 4 Real KPI Metrics */}
      <section className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 sm:p-5 min-w-0">
          <div className="flex items-start justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="break-words">დასრულებული გაკვეთილი</span>
            <Target className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
          </div>
          <div className="text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            {totalCompletedLessons}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">
            მათემატიკა {completedMathCount} · ანბანი {masteredLettersCount}/26
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 sm:p-5 min-w-0">
          <div className="flex items-start justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="break-words">მიმდინარე სერია</span>
            <Flame className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          </div>
          <div className="text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            {streak} დღე
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">
            {streak > 0 ? 'ყოველდღიური აქტივობა' : 'დაიწყე დღევანდელი სწავლა'}
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 sm:p-5 min-w-0">
          <div className="flex items-start justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="break-words">დასასრულებელი დავალება</span>
            <CalendarCheck className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
          </div>
          <div className="text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            {todayHasPending ? Math.max(1, pendingAssignmentCount) : pendingAssignmentCount}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">
            {todayAssignment?.status === 'completed' ? 'დღევანდელი შესრულებულია' : 'დღევანდელი გელოდება'}
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 sm:p-5 min-w-0">
          <div className="flex items-start justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="break-words">სწავლის საერთო დრო</span>
            <Clock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          </div>
          <div className="text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            {totalMinutes} წთ
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">
            მიღწევები: {unlockedDefs.length} / {ACHIEVEMENT_DEFINITIONS.length}
          </div>
        </div>
      </section>

      {/* Recommended Next Lesson + Quick Modules Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="lg:col-span-1 rounded-2xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-5 sm:p-6 flex flex-col justify-between min-w-0">
          <div>
            <div className="text-xs font-medium text-cyan-600 dark:text-cyan-400 mb-2">
              რეკომენდებული შემდეგი გაკვეთილი
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 break-words">
              {recommendedTitle}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words">
              {recommendedDesc}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate(recommendedTarget.tab, recommendedTarget.sub)}
            className="mt-5 sm:mt-6 min-h-[44px] w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors px-4"
          >
            <span>გაკვეთილზე გადასვლა</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <button
            type="button"
            onClick={() => onNavigate('learn', 'math')}
            className="min-h-[88px] text-left rounded-2xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 hover:border-blue-500/60 p-4 sm:p-5 flex items-start gap-3.5 sm:gap-4 transition-colors min-w-0"
          >
            <div className="w-11 h-11 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0">
              <Calculator className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-900 dark:text-white break-words">მათემატიკა (0-დან)</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">
                6 დონე · რიცხვები, არითმეტიკა, ალგებრა და ფუნქციები
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('learn', 'english')}
            className="min-h-[88px] text-left rounded-2xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 hover:border-purple-500/60 p-4 sm:p-5 flex items-start gap-3.5 sm:gap-4 transition-colors min-w-0"
          >
            <div className="w-11 h-11 rounded-2xl bg-purple-500/15 text-purple-500 flex items-center justify-center shrink-0">
              <Languages className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-900 dark:text-white break-words">ინგლისური ანბანიდან</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">
                26 ასო, ლექსიკონი, გრამატიკა და დიალოგები
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('learn', 'brain')}
            className="min-h-[88px] text-left rounded-2xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 hover:border-cyan-500/60 p-4 sm:p-5 flex items-start gap-3.5 sm:gap-4 transition-colors min-w-0"
          >
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 text-cyan-500 flex items-center justify-center shrink-0">
              <Brain className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-900 dark:text-white break-words">ტვინის ვარჯიში</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">
                მეხსიერების, ლოგიკის, ყურადღებისა და მოტორიკის თამაშები
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('teacher')}
            className="min-h-[88px] text-left rounded-2xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 hover:border-emerald-500/60 p-4 sm:p-5 flex items-start gap-3.5 sm:gap-4 transition-colors min-w-0"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-900 dark:text-white break-words">AI პირადი მასწავლებელი</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">
                ეტაპობრივი ახსნა, მინიშნებები და პრაქტიკული კითხვები
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* Secondary Tools: Wellness, Reminders, Personal Dev, Achievements */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        <button
          type="button"
          onClick={() => onNavigate('learn', 'wellness')}
          className="min-h-[76px] text-left rounded-2xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 hover:border-emerald-500/60 p-4 sm:p-5 flex items-center justify-between gap-3 transition-colors min-w-0"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm text-slate-900 dark:text-white break-words">
                ფსიქოლოგიური დამხმარე
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                განწყობა, სუნთქვა და პირადი დღიური
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('learn', 'reminders')}
          className="min-h-[76px] text-left rounded-2xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 hover:border-blue-500/60 p-4 sm:p-5 flex items-center justify-between gap-3 transition-colors min-w-0"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm text-slate-900 dark:text-white break-words">
                ჭკვიანი შეხსენებები
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {nextReminder ? `შემდეგი: ${nextReminder.time} · ${nextReminder.title}` : 'გრაფიკის დაყენება'}
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('learn', 'tools')}
          className="min-h-[76px] text-left rounded-2xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 hover:border-purple-500/60 p-4 sm:p-5 flex items-center justify-between gap-3 transition-colors min-w-0"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm text-slate-900 dark:text-white break-words">
                განვითარების ხელსაწყოები
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                დღის გეგმა, ჩვევები, ტაიმერი და კალკულატორი
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>
      </section>

      {/* Current Achievements Summary */}
      <section className="rounded-2xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 dark:text-white">
            <Award className="w-4 h-4 text-amber-500 shrink-0" />
            <span>მიღებული მიღწევები</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('progress')}
            className="min-h-[36px] text-xs font-medium text-blue-600 dark:text-cyan-400 hover:underline whitespace-nowrap"
          >
            ყველას ნახვა
          </button>
        </div>
        {unlockedDefs.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            ჯერ მიღწევა არ გაქვს გახსნილი. დაასრულე პირველი გაკვეთილი ან გაგზავნე დღის დავალება პირველი ჯილდოს მისაღებად.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {unlockedDefs.slice(0, 3).map((ach) => (
              <div
                key={ach.id}
                className="rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 p-3 min-w-0"
              >
                <div className="font-semibold text-xs text-slate-900 dark:text-white break-words">
                  {ach.title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">
                  {ach.description}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
