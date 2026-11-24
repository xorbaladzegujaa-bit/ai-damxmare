import { AppData, ReminderItem } from '../types/app';

const DB_NAME = 'SmartLearnDB';
const DB_VERSION = 1;
const STORE_NAME = 'user_workspaces';
const ACTIVE_USER_KEY = 'smartlearn_active_user_id';

export function getTodayDateStr(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function createUserId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `guest_${crypto.randomUUID()}`;
  }
  return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateActiveUserId(): string {
  try {
    const existing = localStorage.getItem(ACTIVE_USER_KEY);
    if (existing && existing.startsWith('guest_')) {
      return existing;
    }
    const next = createUserId();
    localStorage.setItem(ACTIVE_USER_KEY, next);
    return next;
  } catch {
    return 'guest_default';
  }
}

export function createDefaultReminders(preferredTime = '18:00'): ReminderItem[] {
  const tz =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Tbilisi'
      : 'Asia/Tbilisi';
  return [
    {
      id: 'rem_english_morning',
      title: 'ინგლისურის გაკვეთილი',
      description: '10 წუთი ახალი სიტყვები და ანბანის გამეორება',
      category: 'english',
      time: '09:00',
      daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
      repeat: 'daily',
      soundEnabled: true,
      enabled: false,
      snoozeMinutes: 10,
      quietHoursStart: '23:00',
      quietHoursEnd: '07:30',
      timezone: tz,
    },
    {
      id: 'rem_math_evening',
      title: 'მათემატიკის ვარჯიში',
      description: 'ეტაპობრივი სავარჯიშოები ნულიდან',
      category: 'math',
      time: preferredTime || '18:00',
      daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
      repeat: 'daily',
      soundEnabled: true,
      enabled: true,
      snoozeMinutes: 10,
      quietHoursStart: '23:00',
      quietHoursEnd: '07:30',
      timezone: tz,
    },
    {
      id: 'rem_daily_assignment',
      title: 'დღის დავალების დასრულება',
      description: 'შეამოწმე და გაგზავნე დღევანდელი დავალება',
      category: 'assignments',
      time: '20:00',
      daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
      repeat: 'daily',
      soundEnabled: true,
      enabled: false,
      snoozeMinutes: 15,
      quietHoursStart: '23:00',
      quietHoursEnd: '07:30',
      timezone: tz,
    },
  ];
}

export function createInitialAppData(userId: string): AppData {
  return {
    profile: {
      userId,
      name: '',
      subjectFocus: 'all',
      level: 'absolute_beginner',
      dailyGoalMinutes: 15,
      preferredReminderTime: '18:00',
      mainGoal: '',
      theme: 'dark',
      soundEnabled: true,
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
      isGuestMode: true,
    },
    mathProgress: {
      lessons: {},
      weakTopics: [],
      recentMistakes: [],
    },
    englishProgress: {
      masteredLetters: [],
      completedStages: [],
      vocabulary: {},
      weakTopics: [],
      recentMistakes: [],
    },
    assignments: {},
    gameScores: [],
    moodEntries: [],
    journalEntries: [],
    reminders: createDefaultReminders('18:00'),
    tools: {
      tasks: [],
      goals: [],
      habits: [],
      notes: [],
      reflections: [],
      totalStudySeconds: 0,
    },
    studyLog: {},
    achievements: [],
  };
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'userId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
  });
}

export async function loadUserAppData(userId: string): Promise<AppData> {
  const fallbackKey = `smartlearn_workspace_${userId}`;
  try {
    const db = await openDB();
    const result = await new Promise<AppData | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(userId);
      req.onsuccess = () => {
        const record = req.result as { userId: string; data: AppData } | undefined;
        resolve(record?.data);
      };
      req.onerror = () => reject(req.error);
    });
    if (result && result.profile?.userId === userId) {
      return mergeWithDefaults(result, userId);
    }
  } catch {
    // Fallback to localStorage below
  }

  try {
    const raw = localStorage.getItem(fallbackKey);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      if (parsed && parsed.profile?.userId === userId) {
        return mergeWithDefaults(parsed, userId);
      }
    }
  } catch {
    // Ignore corrupt localStorage
  }

  return createInitialAppData(userId);
}

function mergeWithDefaults(saved: Partial<AppData>, userId: string): AppData {
  const base = createInitialAppData(userId);
  return {
    ...base,
    ...saved,
    profile: { ...base.profile, ...(saved.profile || {}), userId },
    mathProgress: { ...base.mathProgress, ...(saved.mathProgress || {}) },
    englishProgress: { ...base.englishProgress, ...(saved.englishProgress || {}) },
    assignments: saved.assignments || {},
    gameScores: Array.isArray(saved.gameScores) ? saved.gameScores : [],
    moodEntries: Array.isArray(saved.moodEntries) ? saved.moodEntries : [],
    journalEntries: Array.isArray(saved.journalEntries) ? saved.journalEntries : [],
    reminders: Array.isArray(saved.reminders) ? saved.reminders : base.reminders,
    tools: { ...base.tools, ...(saved.tools || {}) },
    studyLog: saved.studyLog || {},
    achievements: Array.isArray(saved.achievements) ? saved.achievements : [],
  };
}

export async function saveUserAppData(data: AppData): Promise<void> {
  const userId = data.profile.userId;
  const fallbackKey = `smartlearn_workspace_${userId}`;
  try {
    localStorage.setItem(fallbackKey, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors in fallback mirror
  }

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ userId, data, updatedAt: new Date().toISOString() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Already persisted to localStorage fallback
  }
}

export async function resetUserAccount(currentUserId: string): Promise<AppData> {
  const newUserId = createUserId();
  try {
    localStorage.removeItem(`smartlearn_workspace_${currentUserId}`);
    localStorage.setItem(ACTIVE_USER_KEY, newUserId);
  } catch {
    // ignore
  }
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(currentUserId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // ignore
  }
  const fresh = createInitialAppData(newUserId);
  await saveUserAppData(fresh);
  return fresh;
}

export function exportAppDataAsJson(data: AppData): string {
  return JSON.stringify(
    {
      app: 'SmartLearn AI',
      version: 1,
      exportedAt: new Date().toISOString(),
      data,
    },
    null,
    2
  );
}
