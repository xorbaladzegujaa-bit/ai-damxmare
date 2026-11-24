import React, { useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Bot,
  CheckCircle2,
  Lightbulb,
  MessageSquare,
  Send,
  Sparkles,
} from 'lucide-react';
import { AppData } from '../../types/app';
import { useOnlineStatus } from '../../hooks/usePWAInstall';

interface AITeacherModuleProps {
  data: AppData;
  initialPrompt?: string;
  onGoToOfflineLessons: () => void;
}

interface PracticeCard {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface TeacherMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  steps?: string[];
  hintOnly?: boolean;
  practiceQuestion?: PracticeCard;
}

export const AITeacherModule: React.FC<AITeacherModuleProps> = ({
  data,
  initialPrompt = '',
  onGoToOfflineLessons,
}) => {
  const isOnline = useOnlineStatus();
  const [subject, setSubject] = useState<'math' | 'english' | 'general'>('general');
  const [mode, setMode] = useState<'explain' | 'hint' | 'worked_example' | 'practice'>('explain');
  const [input, setInput] = useState(initialPrompt);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [messages, setMessages] = useState<TeacherMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `გამარჯობა, ${
        data.profile.name || 'მოსწავლე'
      }! მე ვარ შენი პირადი მასწავლებელი. მკითხე მათემატიკის ან ინგლისურის შესახებ, მოითხოვე მინიშნება ან ეტაპობრივი ახსნა.`,
    },
  ]);

  // Practice answer tracking per message
  const [pickedAnswers, setPickedAnswers] = useState<Record<string, string>>({});

  // English conversation mode
  const [convMode, setConvMode] = useState(false);
  const [convScenario, setConvScenario] = useState('greeting');

  const weakTopics = [
    ...data.mathProgress.weakTopics,
    ...data.englishProgress.weakTopics,
  ].slice(0, 6);

  const recentMistakes = [
    ...data.mathProgress.recentMistakes,
    ...data.englishProgress.recentMistakes,
  ].slice(0, 4);

  const completedLessons =
    Object.values(data.mathProgress.lessons).filter((l) => l.completed).length +
    data.englishProgress.completedStages.length;

  const sendTeacherMessage = async (overrideText?: string, overrideMode = mode) => {
    const textToSend = (overrideText !== undefined ? overrideText : input).trim();
    if (!textToSend || loading) return;

    if (!isOnline) {
      setErrorMsg('ინტერნეტთან კავშირი გამორთულია. AI მასწავლებელს სჭირდება ინტერნეტი — შეგიძლია გააგრძელო ოფლაინ გაკვეთილებით.');
      return;
    }

    setErrorMsg(null);
    const userMsg: TeacherMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: textToSend,
    };
    setMessages((prev) => [...prev, userMsg]);
    if (overrideText === undefined) setInput('');
    setLoading(true);

    try {
      if (convMode) {
        const res = await fetch('/api/ai/english', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userSentence: textToSend,
            scenario: convScenario,
            level: data.profile.level,
          }),
        });
        const payload = await res.json();
        if (!res.ok) {
          setErrorMsg(payload.error || 'AI სერვისი დროებით მიუწვდომელია.');
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `m_${Date.now()}`,
              role: 'model',
              text: `${payload.isCorrect ? 'სწორია! ' : ''}${payload.georgianFeedback}\n\nსწორი ფორმა: ${
                payload.correctedEnglish
              }\n\nდიალოგის გაგრძელება: "${payload.nextEnglishPrompt}" (${payload.nextPromptGeorgian})`,
            },
          ]);
        }
      } else {
        const res = await fetch('/api/ai/teacher', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: textToSend,
            mode: overrideMode,
            subject,
            userContext: {
              level: data.profile.level,
              completedLessons,
              weakTopics,
              recentMistakes,
            },
            history: messages.slice(-6).map((m) => ({ role: m.role, text: m.text })),
          }),
        });
        const payload = await res.json();
        if (!res.ok) {
          setErrorMsg(payload.error || 'AI მასწავლებელი დროებით მიუწვდომელია.');
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `m_${Date.now()}`,
              role: 'model',
              text: payload.reply || 'მიღებულია.',
              steps: Array.isArray(payload.steps) ? payload.steps : [],
              hintOnly: Boolean(payload.hintOnly),
              practiceQuestion: payload.practiceQuestion,
            },
          ]);
        }
      }
    } catch {
      setErrorMsg('სერვერთან დაკავშირება ვერ მოხერხდა. შეგიძლია გააგრძელო შენახული ოფლაინ გაკვეთილებით.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:gap-4 short-viewport-gap h-[calc(100dvh-9.5rem)] md:h-[calc(100dvh-4.5rem)] min-h-[180px]">
      <div className="flex flex-col min-[460px]:flex-row min-[460px]:items-center min-[460px]:justify-between gap-2 shrink-0">
        <div className="min-w-0">
          <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-500 shrink-0" />
            <span className="truncate">AI პირადი მასწავლებელი</span>
          </h1>
          <p className="hidden sm:block short-viewport-hide text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5 break-words">
            გეხმარება მინიშნებით, ეტაპობრივი ახსნით და შენს დონეზე მორგებული სავარჯიშოებით.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setConvMode((c) => !c)}
          className={`min-h-[44px] w-full min-[460px]:w-auto px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 whitespace-nowrap shrink-0 ${
            convMode
              ? 'bg-purple-600 border-purple-500 text-white'
              : 'bg-white dark:bg-[#0E1730] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4 shrink-0" />
          <span>{convMode ? 'სტანდარტულ რეჟიმში დაბრუნება' : 'ინგლისური საუბრის პრაქტიკა'}</span>
        </button>
      </div>

      {/* Mode & Subject Controls */}
      <div className="space-y-1.5 sm:space-y-2 shrink-0">
        {!convMode ? (
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {(
              [
                ['general', 'ზოგადი'],
                ['math', 'მათემატიკა'],
                ['english', 'ინგლისური'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSubject(id)}
                className={`min-h-[38px] sm:min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap shrink-0 ${
                  subject === id
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-white dark:bg-[#0E1730] border-slate-200 dark:border-slate-800'
                }`}
              >
                {label}
              </button>
            ))}

            <span className="text-slate-400 px-1 shrink-0">·</span>

            {(
              [
                ['explain', 'მარტივი ახსნა'],
                ['hint', 'მხოლოდ მინიშნება'],
                ['worked_example', 'ამოხსნილი მაგალითი'],
                ['practice', 'სავარჯიშო კითხვა'],
              ] as const
            ).map(([mId, mLabel]) => (
              <button
                key={mId}
                type="button"
                onClick={() => setMode(mId)}
                className={`min-h-[38px] sm:min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap shrink-0 ${
                  mode === mId
                    ? 'bg-cyan-600 border-cyan-500 text-white'
                    : 'bg-white dark:bg-[#0E1730] border-slate-200 dark:border-slate-800'
                }`}
              >
                {mLabel}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {[
              ['greeting', 'მისალმება'],
              ['shopping', 'მაღაზიაში'],
              ['directions', 'გზის კითხვა'],
              ['intro', 'გაცნობა'],
            ].map(([sc, lbl]) => (
              <button
                key={sc}
                type="button"
                onClick={() => setConvScenario(sc)}
                className={`min-h-[38px] sm:min-h-[40px] px-3.5 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap shrink-0 ${
                  convScenario === sc
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-white dark:bg-[#0E1730] border-slate-200 dark:border-slate-800'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        )}

        {/* Quick Prompts (hidden on ultra-short landscape heights so input remains pinned) */}
        {!convMode && (
          <div className="flex short-viewport-hide items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
            <button
              type="button"
              onClick={() => sendTeacherMessage('ამიხსენი ათეულის გავლით მიმატება მარტივად.', 'explain')}
              className="min-h-[36px] sm:min-h-[38px] px-3 py-1.5 rounded-xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800 text-xs whitespace-nowrap shrink-0"
            >
              ამიხსენი მიმატება 20-მდე
            </button>
            <button
              type="button"
              onClick={() => sendTeacherMessage('ამიხსენი ინგლისური არტიკლები a, an, the ქართულად.', 'explain')}
              className="min-h-[36px] sm:min-h-[38px] px-3 py-1.5 rounded-xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800 text-xs whitespace-nowrap shrink-0"
            >
              ინგლისური არტიკლები
            </button>
            <button
              type="button"
              onClick={() =>
                sendTeacherMessage(
                  weakTopics.length > 0
                    ? `ჩემი სუსტი თემებია: ${weakTopics.join(', ')}. მომეცი პრაქტიკული კითხვა.`
                    : 'მომეცი ჩემი დონის შესაბამისი სავარჯიშო კითხვა.',
                  'practice'
                )
              }
              className="min-h-[36px] sm:min-h-[38px] px-3 py-1.5 rounded-xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800 text-xs whitespace-nowrap shrink-0"
            >
              სავარჯიშო სუსტ თემებზე
            </button>
          </div>
        )}
      </div>

      {/* Chat Stream */}
      <div className="flex-1 min-h-0 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-3 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[92%] sm:max-w-[80%] rounded-2xl p-3.5 sm:p-4 text-sm space-y-3 min-w-0 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100'
              }`}
            >
              {msg.hintOnly && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500">
                  <Lightbulb className="w-4 h-4 shrink-0" />
                  <span>მინიშნება (სცადე ჯერ თავად ამოხსნა)</span>
                </div>
              )}

              <div className="whitespace-pre-line leading-relaxed break-words">{msg.text}</div>

              {msg.steps && msg.steps.length > 0 && (
                <ol className="space-y-1.5 text-xs border-t border-slate-200 dark:border-slate-800 pt-2.5">
                  {msg.steps.map((st, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-cyan-500 shrink-0">{idx + 1}.</span>
                      <span className="break-words">{st}</span>
                    </li>
                  ))}
                </ol>
              )}

              {msg.practiceQuestion && (
                <div className="rounded-xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-700 p-3 sm:p-3.5 space-y-2.5">
                  <div className="text-xs font-semibold text-purple-500 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>პრაქტიკული სავარჯიშო</span>
                  </div>
                  <div className="font-semibold text-sm break-words">{msg.practiceQuestion.question}</div>
                  <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2">
                    {msg.practiceQuestion.options.map((opt) => {
                      const picked = pickedAnswers[msg.id] === opt;
                      const answered = Boolean(pickedAnswers[msg.id]);
                      const isRight = opt === msg.practiceQuestion!.correctAnswer;
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={answered}
                          onClick={() => setPickedAnswers((prev) => ({ ...prev, [msg.id]: opt }))}
                          className={`min-h-[44px] rounded-xl border px-3 py-1.5 text-xs font-semibold break-words ${
                            answered && isRight
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-300'
                              : answered && picked
                              ? 'bg-red-500/20 border-red-500 text-red-600 dark:text-red-300'
                              : 'bg-slate-50 dark:bg-[#070D1F] border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {pickedAnswers[msg.id] && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="break-words">{msg.practiceQuestion.explanation}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-xs text-slate-500 dark:text-slate-400">მასწავლებელი ფიქრობს...</div>
        )}
      </div>

      {errorMsg && (
        <div className="shrink-0 rounded-2xl bg-red-500/15 border border-red-500/40 p-3.5 text-xs text-red-800 dark:text-red-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-start gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="break-words">{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={onGoToOfflineLessons}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white dark:bg-[#0E1730] border border-red-400/40 font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>ოფლაინ გაკვეთილებზე გადასვლა</span>
          </button>
        </div>
      )}

      {/* Input Bar - Pinned & Always Accessible */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendTeacherMessage();
        }}
        className="flex gap-2 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            convMode
              ? 'დაწერე ინგლისური წინადადება (მაგ: Hello)...'
              : 'დასვი შეკითხვა ქართულად...'
          }
          className="flex-1 min-w-0 min-h-[48px] rounded-2xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800 px-3.5 sm:px-4 text-base sm:text-sm focus:outline-none focus:border-cyan-400"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="გაგზავნა"
          className="min-w-[48px] min-h-[48px] px-4 sm:px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 disabled:opacity-40 text-white font-semibold text-sm flex items-center justify-center gap-2 shrink-0"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">გაგზავნა</span>
        </button>
      </form>
    </div>
  );
};
