import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookMarked,
  HeartHandshake,
  Lock,
  Pause,
  Play,
  Send,
  Wind,
} from 'lucide-react';
import { JournalEntry, MoodEntry, MoodType } from '../../types/app';
import { getTodayDateStr } from '../../services/storage';
import { useOnlineStatus } from '../../hooks/usePWAInstall';

interface WellnessModuleProps {
  moodEntries: MoodEntry[];
  journalEntries: JournalEntry[];
  onAddMood: (mood: MoodType, note: string) => void;
  onAddJournal: (title: string, content: string) => void;
}

const MOOD_OPTIONS: { id: MoodType; label: string; color: string }[] = [
  { id: 'happy', label: 'ბედნიერი', color: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-500' },
  { id: 'calm', label: 'მშვიდი', color: 'border-cyan-500/50 bg-cyan-500/15 text-cyan-500' },
  { id: 'tired', label: 'დაღლილი', color: 'border-amber-500/50 bg-amber-500/15 text-amber-500' },
  { id: 'stressed', label: 'სტრესული', color: 'border-orange-500/50 bg-orange-500/15 text-orange-500' },
  { id: 'sad', label: 'სევდიანი', color: 'border-blue-500/50 bg-blue-500/15 text-blue-500' },
  { id: 'anxious', label: 'შეშფოთებული', color: 'border-purple-500/50 bg-purple-500/15 text-purple-500' },
];

export const WellnessModule: React.FC<WellnessModuleProps> = ({
  moodEntries,
  journalEntries,
  onAddMood,
  onAddJournal,
}) => {
  const isOnline = useOnlineStatus();
  const [selectedMood, setSelectedMood] = useState<MoodType>('calm');
  const [moodNote, setMoodNote] = useState('');
  const [moodSavedToast, setMoodSavedToast] = useState(false);

  // Breathing timer (4-4-4-4 box breathing)
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathStageIdx, setBreathStageIdx] = useState(0); // 0 inhale, 1 hold, 2 exhale, 3 rest
  const [breathSec, setBreathSec] = useState(4);
  const [cyclesDone, setCyclesDone] = useState(0);

  const breathStages = [
    { label: 'ჩაისუნთქე ნელა', duration: 4, scale: 'scale-125 bg-cyan-500/30 border-cyan-400' },
    { label: 'შეიკავე სუნთქვა', duration: 4, scale: 'scale-125 bg-blue-500/30 border-blue-400' },
    { label: 'ამოისუნთქე მშვიდად', duration: 4, scale: 'scale-90 bg-emerald-500/25 border-emerald-400' },
    { label: 'დაისვენე', duration: 2, scale: 'scale-90 bg-slate-500/20 border-slate-400' },
  ];

  useEffect(() => {
    if (!breathingActive) return;
    const t = setInterval(() => {
      setBreathSec((prev) => {
        if (prev > 1) return prev - 1;
        setBreathStageIdx((idx) => {
          const next = (idx + 1) % breathStages.length;
          if (next === 0) setCyclesDone((c) => c + 1);
          setBreathSec(breathStages[next].duration);
          return next;
        });
        return 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [breathingActive]);

  // Private journal
  const [jTitle, setJTitle] = useState('');
  const [jContent, setJContent] = useState('');
  const [journalError, setJournalError] = useState('');

  // AI Wellness chat
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [safetyAlert, setSafetyAlert] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([
    {
      role: 'model',
      text: 'გამარჯობა. შეგიძლია გამიზიარო როგორ ჩაიარა დღემ, რა გაღელვებს ან უბრალოდ ვისაუბროთ სიმშვიდესა და მოტივაციაზე.',
    },
  ]);

  const handleSaveMood = () => {
    onAddMood(selectedMood, moodNote.trim());
    setMoodNote('');
    setMoodSavedToast(true);
    setTimeout(() => setMoodSavedToast(false), 2500);
  };

  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault();
    setJournalError('');
    if (jContent.trim().length < 5) {
      setJournalError('ჩაწერე მინიმუმ რამდენიმე სიტყვა დღიურში.');
      return;
    }
    onAddJournal(jTitle.trim() || `ჩანაწერი · ${getTodayDateStr()}`, jContent.trim());
    setJTitle('');
    setJContent('');
  };

  const sendWellnessMessage = async (textOverride?: string) => {
    const msg = (textOverride ?? chatInput).trim();
    if (!msg || chatLoading) return;
    if (!isOnline) {
      setChatError('AI საუბრისთვის საჭიროა ინტერნეტი. სუნთქვის ტაიმერი და პირადი დღიური მუშაობს ოფლაინ.');
      return;
    }

    setChatError('');
    setChatHistory((prev) => [...prev, { role: 'user', text: msg }]);
    if (!textOverride) setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/ai/wellness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          mood: selectedMood,
          history: chatHistory.slice(-6),
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setChatError(payload.error || 'სერვისი დროებით მიუწვდომელია.');
      } else {
        if (payload.safetyAlert) setSafetyAlert(true);
        setChatHistory((prev) => [...prev, { role: 'model', text: payload.reply }]);
      }
    } catch {
      setChatError('კავშირის შეცდომა. გამოიყენე სუნთქვის ვარჯიში ან პირადი დღიური.');
    } finally {
      setChatLoading(false);
    }
  };

  const currentStage = breathStages[breathStageIdx];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-fluid-title font-bold text-slate-900 dark:text-white flex items-start sm:items-center gap-2.5">
          <HeartHandshake className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5 sm:mt-0" />
          <span>ფსიქოლოგიური კეთილდღეობის დამხმარე</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          მხარდამჭერი სივრცე სტრესის მართვისთვის. აპლიკაცია არ ცვლის ფსიქოლოგს ან ექიმს და არ სვამს დიაგნოზს.
        </p>
      </div>

      {safetyAlert && (
        <div className="rounded-2xl bg-red-500/15 border border-red-500/50 p-4 text-sm text-red-900 dark:text-red-100 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <strong>გადაუდებელი დახმარება:</strong> თუ საფრთხეში ხარ ან მძიმე კრიზისს გადიხარ, დარეკე{' '}
            <strong>112</strong>-ზე ან დაუკავშირდი სანდო ახლობელსა და პროფესიონალს.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Daily Mood Check-in */}
        <section className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 min-[360px]:p-5 sm:p-6 space-y-4">
          <h2 className="font-bold text-base text-slate-900 dark:text-white">დღევანდელი განწყობის აღრიცხვა</h2>
          <div className="grid grid-cols-2 min-[460px]:grid-cols-3 gap-2">
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMood(m.id)}
                className={`min-h-[46px] rounded-xl border px-2.5 py-2 text-xs font-semibold transition-colors break-words ${
                  selectedMood === m.id
                    ? m.color
                    : 'bg-slate-50 dark:bg-[#070D1F] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={moodNote}
            onChange={(e) => setMoodNote(e.target.value)}
            placeholder="მოკლე შენიშვნა (სურვილისამებრ)..."
            className="w-full min-h-[44px] rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700 px-3.5 text-base sm:text-sm"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleSaveMood}
              className="min-h-[44px] w-full min-[380px]:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
            >
              განწყობის შენახვა
            </button>
            {moodSavedToast && (
              <span className="text-xs text-emerald-500 font-medium">შენახულია მოწყობილობაზე</span>
            )}
          </div>

          {moodEntries.length > 0 && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="text-xs font-semibold text-slate-500">ბოლო ჩანაწერები:</div>
              {moodEntries.slice(-3).reverse().map((me) => (
                <div key={me.id} className="text-xs text-slate-600 dark:text-slate-300 flex justify-between gap-2">
                  <span>{MOOD_OPTIONS.find((o) => o.id === me.mood)?.label}</span>
                  <span className="font-mono-num text-slate-400 shrink-0">{me.date}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Guided Breathing Timer */}
        <section className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 min-[360px]:p-5 sm:p-6 flex flex-col items-center justify-between text-center space-y-5 overflow-hidden">
          <div className="w-full flex items-center justify-between gap-2">
            <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Wind className="w-4 h-4 text-cyan-500 shrink-0" />
              <span>სუნთქვის სავარჯიშო</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono-num shrink-0">ციკლი: {cyclesDone}</span>
          </div>

          <div className="py-8 sm:py-10 flex items-center justify-center">
            <div
              className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full border-2 flex flex-col items-center justify-center transition-transform duration-1000 ease-in-out ${
                breathingActive
                  ? currentStage.scale
                  : 'scale-100 bg-slate-100 dark:bg-[#070D1F] border-slate-300 dark:border-slate-700'
              }`}
            >
              <div className="text-2xl sm:text-3xl font-bold font-mono-num text-slate-900 dark:text-white">
                {breathingActive ? breathSec : '4-4-4'}
              </div>
              <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1 px-2">
                {breathingActive ? currentStage.label : 'დასაწყებად დააჭირე'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (breathingActive) {
                setBreathingActive(false);
              } else {
                setBreathStageIdx(0);
                setBreathSec(breathStages[0].duration);
                setBreathingActive(true);
              }
            }}
            className="min-h-[44px] w-full min-[380px]:w-auto px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center justify-center gap-2"
          >
            {breathingActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{breathingActive ? 'გაჩერება' : 'სუნთქვის დაწყება'}</span>
          </button>
        </section>
      </div>

      {/* Private Local Journal + AI Supportive Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Private Journal */}
        <section className="rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-purple-500" />
                <span>პირადი დღიური</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-500" />
                <span>ინახება მხოლოდ ამ მოწყობილობაზე და ავტომატურად არასდროს იგზავნება AI-სთან.</span>
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveJournal} className="space-y-3">
            <input
              type="text"
              value={jTitle}
              onChange={(e) => setJTitle(e.target.value)}
              placeholder="სათაური (სურვილისამებრ)"
              className="w-full min-h-[44px] rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700 px-3.5 text-base sm:text-sm"
            />
            <textarea
              rows={3}
              value={jContent}
              onChange={(e) => setJContent(e.target.value)}
              placeholder="დაწერე შენი ფიქრები, დღის შეჯამება ან მადლიერების ჩანაწერი..."
              className="w-full rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700 p-3.5 text-base sm:text-sm"
            />
            {journalError && <div className="text-xs text-red-500">{journalError}</div>}
            <button
              type="submit"
              className="min-h-[44px] w-full min-[380px]:w-auto px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
            >
              დღიურში შენახვა
            </button>
          </form>

          {journalEntries.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto">
              {journalEntries.slice().reverse().map((je) => (
                <div
                  key={je.id}
                  className="rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 p-3 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-900 dark:text-white">
                    <span className="truncate">{je.title}</span>
                    <span className="font-mono-num text-slate-400 shrink-0">{je.createdAt.slice(0, 10)}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 break-words">{je.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* AI Supportive Conversation */}
        <section className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 min-[360px]:p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h2 className="font-bold text-base text-slate-900 dark:text-white">მშვიდი AI საუბარი და მხარდაჭერა</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => sendWellnessMessage('დღეს დავიღალე და მოტივაცია მჭირდება.')}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 text-xs"
              >
                მოტივაცია მჭირდება
              </button>
              <button
                type="button"
                onClick={() => sendWellnessMessage('რთული დღე მქონდა, როგორ განვიტვირთო?')}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 text-xs"
              >
                სტრესის მართვა
              </button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {chatHistory.map((m, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl p-3 text-xs leading-relaxed break-words ${
                    m.role === 'user'
                      ? 'bg-emerald-600 text-white ml-3 sm:ml-6'
                      : 'bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 mr-3 sm:mr-6'
                  }`}
                >
                  {m.text}
                </div>
              ))}
              {chatLoading && <div className="text-xs text-slate-400">პასუხი იწერება...</div>}
            </div>
            {chatError && <div className="text-xs text-amber-500">{chatError}</div>}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendWellnessMessage();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="გამიზიარე შენი ფიქრი..."
              className="flex-1 min-w-0 min-h-[44px] rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700 px-3.5 text-base sm:text-sm"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              aria-label="გაგზავნა"
              className="min-w-[44px] min-h-[44px] px-4 rounded-xl bg-emerald-600 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
