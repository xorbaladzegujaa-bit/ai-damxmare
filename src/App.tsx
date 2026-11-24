import { useCallback, useEffect, useState } from 'react';
import { Award, Bell, X } from 'lucide-react';
import {
  AppData,
  DailyAssignmentRecord,
  GameScoreRecord,
  LearnSubView,
  MoodType,
  NavTab,
  ReminderItem,
  ToolsState,
  UserProfile,
} from './types/app';
import {
  createDefaultReminders,
  getOrCreateActiveUserId,
  getTodayDateStr,
  loadUserAppData,
  resetUserAccount,
  saveUserAppData,
} from './services/storage';
import { AchievementDefinition, evaluateAchievements } from './services/achievements';
import { checkDueReminders, triggerForegroundNotification } from './services/notifications';
import { playReminderChime } from './services/speechAndSound';
import { Onboarding } from './components/Onboarding';
import { LayoutShell } from './components/LayoutShell';
import { DashboardHome } from './components/DashboardHome';
import { LearnHub } from './components/LearnHub';
import { MathModule } from './modules/math/MathModule';
import { EnglishModule } from './modules/english/EnglishModule';
import { DailyAssignmentsModule } from './modules/assignments/DailyAssignmentsModule';
import { BrainTrainingModule } from './modules/brain-training/BrainTrainingModule';
import { AITeacherModule } from './modules/ai-teacher/AITeacherModule';
import { WellnessModule } from './modules/wellness/WellnessModule';
import { RemindersModule } from './modules/reminders/RemindersModule';
import { ProgressModule } from './modules/progress/ProgressModule';
import { ToolsModule } from './modules/tools/ToolsModule';
import { ProfileModule } from './modules/profile/ProfileModule';

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [learnView, setLearnView] = useState<LearnSubView>('hub');
  const [aiInitialPrompt, setAiInitialPrompt] = useState('');
  const [unlockedToast, setUnlockedToast] = useState<AchievementDefinition | null>(null);
  const [activeReminderToast, setActiveReminderToast] = useState<ReminderItem | null>(null);

  useEffect(() => {
    const uid = getOrCreateActiveUserId();
    loadUserAppData(uid).then((loaded) => {
      setData(loaded);
    });
  }, []);

  useEffect(() => {
    if (!data) return;
    document.documentElement.classList.toggle('dark', data.profile.theme === 'dark');
  }, [data?.profile.theme]);

  const commitData = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => {
      if (!prev) return prev;
      const updated = updater(prev);
      const { achievements, newlyUnlocked } = evaluateAchievements(updated);
      const finalData: AppData = { ...updated, achievements };
      saveUserAppData(finalData);
      if (newlyUnlocked.length > 0) {
        setUnlockedToast(newlyUnlocked[0]);
        setTimeout(() => setUnlockedToast(null), 4500);
      }
      return finalData;
    });
  }, []);

  // In-App Reminder Center foreground check
  useEffect(() => {
    if (!data?.profile.onboardingCompleted) return;
    const check = () => {
      const due = checkDueReminders(data.reminders, new Date());
      if (due.length > 0) {
        const first = due[0];
        setActiveReminderToast(first);
        playReminderChime(first.soundEnabled && data.profile.soundEnabled);
        triggerForegroundNotification(first);
        commitData((prev) => ({
          ...prev,
          reminders: prev.reminders.map((r) =>
            r.id === first.id
              ? { ...r, lastTriggeredDate: getTodayDateStr(), snoozedUntil: undefined }
              : r
          ),
        }));
      }
    };
    const timer = setInterval(check, 20000);
    return () => clearInterval(timer);
  }, [data?.reminders, data?.profile.onboardingCompleted, data?.profile.soundEnabled, commitData]);

  const handleNavigate = (tab: NavTab, subView?: LearnSubView) => {
    setActiveTab(tab);
    if (tab === 'learn') {
      setLearnView(subView || 'hub');
    }
  };

  if (!data) {
    return (
      <div className="min-h-dvh bg-[#070D1F] text-slate-200 flex items-center justify-center p-4 text-sm text-center">
        იტვირთება SmartLearn AI...
      </div>
    );
  }

  if (!data.profile.onboardingCompleted) {
    return (
      <Onboarding
        initialProfile={data.profile}
        onComplete={(updates) => {
          commitData((prev) => ({
            ...prev,
            profile: { ...prev.profile, ...updates },
            reminders: createDefaultReminders(updates.preferredReminderTime),
          }));
        }}
      />
    );
  }

  const updateStudyLog = (
    prevLog: AppData['studyLog'],
    delta: { minutes?: number; lessons?: number; questions?: number; correct?: number }
  ) => {
    const today = getTodayDateStr();
    const cur = prevLog[today] || {
      date: today,
      minutes: 0,
      lessonsCompleted: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
    };
    return {
      ...prevLog,
      [today]: {
        ...cur,
        minutes: cur.minutes + (delta.minutes || 0),
        lessonsCompleted: cur.lessonsCompleted + (delta.lessons || 0),
        questionsAnswered: cur.questionsAnswered + (delta.questions || 0),
        correctAnswers: cur.correctAnswers + (delta.correct || 0),
      },
    };
  };

  const handleCompleteMathLesson = (payload: {
    lessonId: string;
    levelId: number;
    score: number;
    passed: boolean;
    questionsCount: number;
    correctCount: number;
    mistakes: string[];
    topic: string;
  }) => {
    commitData((prev) => {
      const existing = prev.mathProgress.lessons[payload.lessonId];
      const nextLessons = {
        ...prev.mathProgress.lessons,
        [payload.lessonId]: {
          lessonId: payload.lessonId,
          levelId: payload.levelId,
          completed: Boolean(existing?.completed || payload.passed),
          bestScore: Math.max(existing?.bestScore || 0, payload.score),
          attempts: (existing?.attempts || 0) + 1,
          lastPracticedAt: new Date().toISOString(),
        },
      };
      const weakTopics = payload.passed
        ? prev.mathProgress.weakTopics.filter((t) => t !== payload.topic)
        : Array.from(new Set([...prev.mathProgress.weakTopics, payload.topic]));

      return {
        ...prev,
        mathProgress: {
          lessons: nextLessons,
          weakTopics,
          recentMistakes: [...payload.mistakes, ...prev.mathProgress.recentMistakes].slice(0, 10),
        },
        studyLog: updateStudyLog(prev.studyLog, {
          minutes: 5,
          lessons: payload.passed ? 1 : 0,
          questions: payload.questionsCount,
          correct: payload.correctCount,
        }),
      };
    });
  };

  const handleMasterLetter = (letter: string) => {
    commitData((prev) => {
      if (prev.englishProgress.masteredLetters.includes(letter)) return prev;
      return {
        ...prev,
        englishProgress: {
          ...prev.englishProgress,
          masteredLetters: [...prev.englishProgress.masteredLetters, letter],
        },
        studyLog: updateStudyLog(prev.studyLog, { minutes: 1, questions: 1, correct: 1 }),
      };
    });
  };

  const handleRecordVocabAttempt = (wordId: string, correct: boolean) => {
    commitData((prev) => {
      const cur = prev.englishProgress.vocabulary[wordId] || {
        wordId,
        attempts: 0,
        correctCount: 0,
        mistakeCount: 0,
        easeFactor: 1.5,
        nextReviewAt: new Date().toISOString(),
        mastered: false,
      };
      const nextCorrect = cur.correctCount + (correct ? 1 : 0);
      const nextMistakes = cur.mistakeCount + (correct ? 0 : 1);
      const nextEase = correct ? Math.min(3.0, cur.easeFactor + 0.3) : Math.max(1.0, cur.easeFactor - 0.3);
      const hoursDelay = correct ? Math.round(12 * nextEase) : 0.25;
      const nextReviewAt = new Date(Date.now() + hoursDelay * 3600 * 1000).toISOString();

      return {
        ...prev,
        englishProgress: {
          ...prev.englishProgress,
          vocabulary: {
            ...prev.englishProgress.vocabulary,
            [wordId]: {
              ...cur,
              attempts: cur.attempts + 1,
              correctCount: nextCorrect,
              mistakeCount: nextMistakes,
              easeFactor: nextEase,
              nextReviewAt,
              mastered: nextCorrect >= 2 && nextCorrect > nextMistakes,
            },
          },
        },
        studyLog: updateStudyLog(prev.studyLog, {
          minutes: 1,
          questions: 1,
          correct: correct ? 1 : 0,
        }),
      };
    });
  };

  const handleCompleteEnglishStage = (
    stageId: string,
    questionsCount: number,
    correctCount: number,
    mistakes: string[]
  ) => {
    commitData((prev) => {
      const passed = correctCount / Math.max(1, questionsCount) >= 0.6;
      const completedStages =
        passed && !prev.englishProgress.completedStages.includes(stageId)
          ? [...prev.englishProgress.completedStages, stageId]
          : prev.englishProgress.completedStages;
      return {
        ...prev,
        englishProgress: {
          ...prev.englishProgress,
          completedStages,
          recentMistakes: [...mistakes, ...prev.englishProgress.recentMistakes].slice(0, 10),
        },
        studyLog: updateStudyLog(prev.studyLog, {
          minutes: 4,
          lessons: passed ? 1 : 0,
          questions: questionsCount,
          correct: correctCount,
        }),
      };
    });
  };

  const handleSaveAssignment = (record: DailyAssignmentRecord, correctDelta?: number) => {
    commitData((prev) => ({
      ...prev,
      assignments: {
        ...prev.assignments,
        [record.date]: record,
      },
      studyLog:
        correctDelta !== undefined
          ? updateStudyLog(prev.studyLog, {
              minutes: 6,
              questions: record.questions.length,
              correct: correctDelta,
            })
          : prev.studyLog,
    }));
  };

  const handleRecordGameScore = (record: GameScoreRecord) => {
    commitData((prev) => ({
      ...prev,
      gameScores: [...prev.gameScores, record],
      studyLog: updateStudyLog(prev.studyLog, { minutes: 2 }),
    }));
  };

  const handleAddMood = (mood: MoodType, note: string) => {
    commitData((prev) => ({
      ...prev,
      moodEntries: [
        ...prev.moodEntries,
        {
          id: `mood_${Date.now()}`,
          mood,
          note,
          createdAt: new Date().toISOString(),
          date: getTodayDateStr(),
        },
      ],
    }));
  };

  const handleAddJournal = (title: string, content: string) => {
    commitData((prev) => ({
      ...prev,
      journalEntries: [
        ...prev.journalEntries,
        {
          id: `jr_${Date.now()}`,
          title,
          content,
          createdAt: new Date().toISOString(),
          privateLocalOnly: true,
        },
      ],
    }));
  };

  const handleUpdateTools = (next: ToolsState, addedMinutes?: number) => {
    commitData((prev) => ({
      ...prev,
      tools: next,
      studyLog: addedMinutes ? updateStudyLog(prev.studyLog, { minutes: addedMinutes }) : prev.studyLog,
    }));
  };

  const handleUpdateProfile = (updates: Partial<UserProfile>) => {
    commitData((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...updates },
    }));
  };

  const handleReset = async () => {
    const fresh = await resetUserAccount(data.profile.userId);
    setData(fresh);
    setActiveTab('home');
    setLearnView('hub');
  };

  return (
    <LayoutShell
      activeTab={activeTab}
      learnView={learnView}
      theme={data.profile.theme}
      userName={data.profile.name}
      onNavigate={handleNavigate}
      onToggleTheme={() =>
        handleUpdateProfile({ theme: data.profile.theme === 'dark' ? 'light' : 'dark' })
      }
    >
      {/* Achievement Unlocked Toast */}
      {unlockedToast && (
        <div className="mb-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 px-3.5 sm:px-4 py-3 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <Award className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="text-xs min-w-0">
              <strong className="text-slate-900 dark:text-white block break-words">
                ახალი მიღწევა: {unlockedToast.title}
              </strong>
              <div className="text-slate-600 dark:text-slate-300 break-words">
                {unlockedToast.description}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setUnlockedToast(null)}
            aria-label="დახურვა"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* In-App Reminder Banner */}
      {activeReminderToast && (
        <div className="mb-4 rounded-2xl bg-blue-600/15 border border-blue-500/40 px-3.5 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <Bell className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5 sm:mt-0" />
            <div className="text-xs min-w-0">
              <strong className="text-slate-900 dark:text-white block break-words">
                შეხსენება ({activeReminderToast.time}): {activeReminderToast.title}
              </strong>
              <div className="text-slate-600 dark:text-slate-300 break-words">
                {activeReminderToast.description}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const snoozeUntil = new Date(
                  Date.now() + activeReminderToast.snoozeMinutes * 60000
                ).toISOString();
                commitData((prev) => ({
                  ...prev,
                  reminders: prev.reminders.map((r) =>
                    r.id === activeReminderToast.id
                      ? { ...r, snoozedUntil: snoozeUntil, lastTriggeredDate: undefined }
                      : r
                  ),
                }));
                setActiveReminderToast(null);
              }}
              className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
            >
              გადადება ({activeReminderToast.snoozeMinutes} წთ)
            </button>
            <button
              type="button"
              onClick={() => setActiveReminderToast(null)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
            >
              დახურვა
            </button>
          </div>
        </div>
      )}

      {/* Main Route Views */}
      {activeTab === 'home' && <DashboardHome data={data} onNavigate={handleNavigate} />}

      {activeTab === 'learn' && (
        <>
          {learnView === 'hub' && <LearnHub onSelect={(sub) => setLearnView(sub)} />}
          {learnView === 'math' && (
            <MathModule
              mathProgress={data.mathProgress}
              soundEnabled={data.profile.soundEnabled}
              onCompleteLesson={handleCompleteMathLesson}
              onAskAiHelp={(topic) => {
                setAiInitialPrompt(`გთხოვ ამიხსნა თემა: ${topic}. ჯერ მომეცი მარტივი ახსნა და მაგალითი.`);
                setActiveTab('teacher');
              }}
            />
          )}
          {learnView === 'english' && (
            <EnglishModule
              englishProgress={data.englishProgress}
              soundEnabled={data.profile.soundEnabled}
              onMasterLetter={handleMasterLetter}
              onRecordVocabAttempt={handleRecordVocabAttempt}
              onCompleteStage={handleCompleteEnglishStage}
            />
          )}
          {learnView === 'assignments' && (
            <DailyAssignmentsModule
              data={data}
              onSaveAssignment={handleSaveAssignment}
              onGoToNextRecommended={() => {
                setLearnView('math');
              }}
            />
          )}
          {learnView === 'brain' && (
            <BrainTrainingModule
              gameScores={data.gameScores}
              soundEnabled={data.profile.soundEnabled}
              onRecordScore={handleRecordGameScore}
            />
          )}
          {learnView === 'wellness' && (
            <WellnessModule
              moodEntries={data.moodEntries}
              journalEntries={data.journalEntries}
              onAddMood={handleAddMood}
              onAddJournal={handleAddJournal}
            />
          )}
          {learnView === 'reminders' && (
            <RemindersModule
              userId={data.profile.userId}
              reminders={data.reminders}
              onSaveReminders={(next) => commitData((prev) => ({ ...prev, reminders: next }))}
            />
          )}
          {learnView === 'tools' && (
            <ToolsModule
              tools={data.tools}
              soundEnabled={data.profile.soundEnabled}
              onUpdateTools={handleUpdateTools}
            />
          )}
        </>
      )}

      {activeTab === 'teacher' && (
        <AITeacherModule
          data={data}
          initialPrompt={aiInitialPrompt}
          onGoToOfflineLessons={() => handleNavigate('learn', 'math')}
        />
      )}

      {activeTab === 'progress' && <ProgressModule data={data} />}

      {activeTab === 'profile' && (
        <ProfileModule
          data={data}
          onUpdateProfile={handleUpdateProfile}
          onImportData={(imported) => commitData(() => imported)}
          onResetAccount={handleReset}
        />
      )}
    </LayoutShell>
  );
}
