export type NavTab =
  | 'home'
  | 'learn'
  | 'teacher'
  | 'progress'
  | 'profile';

export type LearnSubView =
  | 'hub'
  | 'math'
  | 'english'
  | 'assignments'
  | 'brain'
  | 'wellness'
  | 'reminders'
  | 'tools';

export type KnowledgeLevel = 'absolute_beginner' | 'beginner' | 'intermediate';
export type SubjectFocus = 'math' | 'english' | 'memory' | 'all';
export type ThemeMode = 'dark' | 'light';

export interface UserProfile {
  userId: string;
  name: string;
  subjectFocus: SubjectFocus;
  level: KnowledgeLevel;
  dailyGoalMinutes: number;
  preferredReminderTime: string;
  mainGoal: string;
  theme: ThemeMode;
  soundEnabled: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
  isGuestMode: boolean;
}

export interface MathLessonRecord {
  lessonId: string;
  levelId: number;
  completed: boolean;
  bestScore: number; // 0..100
  attempts: number;
  lastPracticedAt: string;
}

export interface MathProgress {
  lessons: Record<string, MathLessonRecord>;
  weakTopics: string[];
  recentMistakes: string[];
}

export interface VocabularyMastery {
  wordId: string;
  attempts: number;
  correctCount: number;
  mistakeCount: number;
  easeFactor: number;
  nextReviewAt: string; // ISO date
  mastered: boolean;
}

export interface EnglishProgress {
  masteredLetters: string[];
  completedStages: string[];
  vocabulary: Record<string, VocabularyMastery>;
  weakTopics: string[];
  recentMistakes: string[];
}

export type AssignmentStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'completed'
  | 'needs_review';

export interface AssignmentQuestion {
  id: string;
  subject: 'math' | 'english' | 'memory' | 'review';
  topic: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface DailyAssignmentRecord {
  date: string; // YYYY-MM-DD
  status: AssignmentStatus;
  questions: AssignmentQuestion[];
  answers: Record<string, string>;
  currentIndex: number;
  score: number | null;
  mistakes: string[];
  startedAt?: string;
  submittedAt?: string;
}

export type BrainCategory = 'memory' | 'logic' | 'attention' | 'motor';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface GameScoreRecord {
  id: string;
  gameId: string;
  gameTitle: string;
  category: BrainCategory;
  difficulty: DifficultyLevel;
  score: number;
  accuracy?: number;
  playedAt: string;
}

export type MoodType =
  | 'happy'
  | 'calm'
  | 'tired'
  | 'stressed'
  | 'sad'
  | 'anxious';

export interface MoodEntry {
  id: string;
  mood: MoodType;
  note?: string;
  createdAt: string;
  date: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  privateLocalOnly: boolean;
}

export type ReminderCategory =
  | 'math'
  | 'english'
  | 'assignments'
  | 'brain'
  | 'goals'
  | 'relaxation'
  | 'routine';

export interface ReminderItem {
  id: string;
  title: string;
  description: string;
  category: ReminderCategory;
  time: string; // HH:MM
  daysOfWeek: number[]; // 0=Sun..6=Sat
  repeat: 'daily' | 'weekdays' | 'weekends' | 'custom';
  soundEnabled: boolean;
  enabled: boolean;
  snoozeMinutes: number;
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
  snoozedUntil?: string;
  lastTriggeredDate?: string;
}

export interface PlannerTask {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface PersonalGoal {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string;
}

export interface HabitItem {
  id: string;
  title: string;
  completedDates: string[]; // YYYY-MM-DD[]
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

export interface ReflectionItem {
  id: string;
  date: string;
  wentWell: string;
  improveTomorrow: string;
}

export interface ToolsState {
  tasks: PlannerTask[];
  goals: PersonalGoal[];
  habits: HabitItem[];
  notes: NoteItem[];
  reflections: ReflectionItem[];
  totalStudySeconds: number;
}

export interface StudyLogDay {
  date: string; // YYYY-MM-DD
  minutes: number;
  lessonsCompleted: number;
  questionsAnswered: number;
  correctAnswers: number;
}

export interface AchievementUnlock {
  id: string;
  unlockedAt: string;
}

export interface AppData {
  profile: UserProfile;
  mathProgress: MathProgress;
  englishProgress: EnglishProgress;
  assignments: Record<string, DailyAssignmentRecord>;
  gameScores: GameScoreRecord[];
  moodEntries: MoodEntry[];
  journalEntries: JournalEntry[];
  reminders: ReminderItem[];
  tools: ToolsState;
  studyLog: Record<string, StudyLogDay>;
  achievements: AchievementUnlock[];
}
