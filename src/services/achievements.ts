import { AchievementUnlock, AppData } from '../types/app';
import { getTodayDateStr } from './storage';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  category: 'lessons' | 'assignments' | 'streak' | 'english' | 'math' | 'brain';
  check: (data: AppData, streak: number) => boolean;
}

export function calculateStreak(studyLog: AppData['studyLog']): number {
  const activeDates = Object.values(studyLog)
    .filter((d) => d.minutes > 0 || d.lessonsCompleted > 0 || d.questionsAnswered > 0)
    .map((d) => d.date)
    .sort()
    .reverse();

  if (activeDates.length === 0) return 0;

  const today = getTodayDateStr();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = getTodayDateStr(yesterdayDate);

  const dateSet = new Set(activeDates);
  if (!dateSet.has(today) && !dateSet.has(yesterday)) {
    return 0;
  }

  let streak = 0;
  const cursor = new Date();
  if (!dateSet.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (dateSet.has(getTodayDateStr(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'first_lesson',
    title: 'პირველი ნაბიჯი',
    description: 'დაასრულე პირველი გაკვეთილი მათემატიკაში ან ინგლისურში.',
    category: 'lessons',
    check: (data) => {
      const mathDone = Object.values(data.mathProgress.lessons).some((l) => l.completed);
      const engDone =
        data.englishProgress.masteredLetters.length >= 5 ||
        data.englishProgress.completedStages.length > 0;
      return mathDone || engDone;
    },
  },
  {
    id: 'first_assignment',
    title: 'დავალების გმირი',
    description: 'გაგზავნე პირველი დღის დავალება.',
    category: 'assignments',
    check: (data) =>
      Object.values(data.assignments).some(
        (a) => a.status === 'submitted' || a.status === 'completed' || a.status === 'needs_review'
      ),
  },
  {
    id: 'streak_7',
    title: '7-დღიანი სერია',
    description: 'ისწავლე ზედიზედ 7 დღის განმავლობაში.',
    category: 'streak',
    check: (_data, streak) => streak >= 7,
  },
  {
    id: 'words_100',
    title: '100 ინგლისური სიტყვა',
    description: 'ათვისებული გაქვს 100 ინგლისური სიტყვა ლექსიკონიდან.',
    category: 'english',
    check: (data) =>
      Object.values(data.englishProgress.vocabulary).filter((v) => v.mastered).length >= 100,
  },
  {
    id: 'words_25',
    title: 'პირველი 25 სიტყვა',
    description: 'ათვისებული გაქვს 25 ინგლისური სიტყვა.',
    category: 'english',
    check: (data) =>
      Object.values(data.englishProgress.vocabulary).filter((v) => v.mastered).length >= 25,
  },
  {
    id: 'math_level_1',
    title: 'რიცხვების ოსტატი',
    description: 'დაასრულე მათემატიკის 1-ლი დონის ყველა გაკვეთილი.',
    category: 'math',
    check: (data) => {
      const lvl1 = Object.values(data.mathProgress.lessons).filter(
        (l) => l.levelId === 1 && l.completed
      );
      return lvl1.length >= 5;
    },
  },
  {
    id: 'brain_best',
    title: 'ტვინის ვარჯიშის რეკორდი',
    description: 'მიაღწიე 80+ ქულას ტვინის ვარჯიშის ნებისმიერ თამაშში.',
    category: 'brain',
    check: (data) => data.gameScores.some((g) => g.score >= 80),
  },
  {
    id: 'alphabet_master',
    title: 'ანბანის მცოდნე',
    description: 'ისწავლე ინგლისური ანბანის 26-ვე ასო.',
    category: 'english',
    check: (data) => data.englishProgress.masteredLetters.length >= 26,
  },
];

export function evaluateAchievements(data: AppData): {
  achievements: AchievementUnlock[];
  newlyUnlocked: AchievementDefinition[];
} {
  const streak = calculateStreak(data.studyLog);
  const existingIds = new Set(data.achievements.map((a) => a.id));
  const updated = [...data.achievements];
  const newlyUnlocked: AchievementDefinition[] = [];

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (!existingIds.has(def.id) && def.check(data, streak)) {
      updated.push({ id: def.id, unlockedAt: new Date().toISOString() });
      newlyUnlocked.push(def);
    }
  }

  return { achievements: updated, newlyUnlocked };
}
