import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Headphones,
  Mic,
  RefreshCw,
  Volume2,
  XCircle,
} from 'lucide-react';
import {
  ENGLISH_ALPHABET,
  GRAMMAR_LESSONS,
  PRACTICAL_DIALOGUES,
  SENTENCE_LESSONS,
  VOCABULARY_BANK,
  VOCAB_CATEGORIES,
  VocabWord,
} from '../../data/englishCurriculum';
import { EnglishProgress } from '../../types/app';
import {
  isSpeechSynthesisSupported,
  playErrorChime,
  playSuccessChime,
  speakEnglish,
} from '../../services/speechAndSound';

interface EnglishModuleProps {
  englishProgress: EnglishProgress;
  soundEnabled: boolean;
  onMasterLetter: (letter: string) => void;
  onRecordVocabAttempt: (wordId: string, correct: boolean) => void;
  onCompleteStage: (stageId: string, questionsCount: number, correctCount: number, mistakes: string[]) => void;
}

type EnglishTab = 'alphabet' | 'vocab' | 'sentences' | 'grammar' | 'practical';

export const EnglishModule: React.FC<EnglishModuleProps> = ({
  englishProgress,
  soundEnabled,
  onMasterLetter,
  onRecordVocabAttempt,
  onCompleteStage,
}) => {
  const [activeTab, setActiveTab] = useState<EnglishTab>('alphabet');

  // Stage 1: Alphabet state
  const [selectedLetterIdx, setSelectedLetterIdx] = useState(0);
  const [alphaQuizMode, setAlphaQuizMode] = useState(false);
  const [alphaTargetIdx, setAlphaTargetIdx] = useState(0);
  const [alphaOptions, setAlphaOptions] = useState<string[]>([]);
  const [alphaFeedback, setAlphaFeedback] = useState<string | null>(null);

  // Stage 2: Vocabulary state
  const [vocabCat, setVocabCat] = useState<VocabWord['category']>('numbers');
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewWord, setReviewWord] = useState<VocabWord | null>(null);
  const [reviewOptions, setReviewOptions] = useState<string[]>([]);
  const [reviewFeedback, setReviewFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Stage 3 & 4: Lesson quiz state
  const [activeLessonId, setActiveLessonId] = useState<string>(SENTENCE_LESSONS[0].id);
  const [lessonAnswers, setLessonAnswers] = useState<Record<string, string>>({});
  const [lessonSubmitted, setLessonSubmitted] = useState(false);

  // Stage 5: Practical state
  const [activeDialogueId, setActiveDialogueId] = useState(PRACTICAL_DIALOGUES[0].id);
  const [readingAnswer, setReadingAnswer] = useState<string | null>(null);
  const [readingChecked, setReadingChecked] = useState(false);
  const [listeningWord, setListeningWord] = useState<VocabWord | null>(null);
  const [listeningChoices, setListeningChoices] = useState<string[]>([]);
  const [listeningFeedback, setListeningFeedback] = useState<string | null>(null);
  const [writingInput, setWritingInput] = useState('');
  const [writingFeedback, setWritingFeedback] = useState<string | null>(null);
  const [spokenText, setSpokenText] = useState('');
  const [listeningMic, setListeningMic] = useState(false);

  const audioSupported = isSpeechSynthesisSupported();
  const currentLetter = ENGLISH_ALPHABET[selectedLetterIdx];

  const startAlphabetQuiz = () => {
    const idx = Math.floor(Math.random() * ENGLISH_ALPHABET.length);
    const target = ENGLISH_ALPHABET[idx];
    const distractors = ENGLISH_ALPHABET.filter((_, i) => i !== idx)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((l) => l.upper);
    const opts = [target.upper, ...distractors].sort(() => Math.random() - 0.5);
    setAlphaTargetIdx(idx);
    setAlphaOptions(opts);
    setAlphaFeedback(null);
    setAlphaQuizMode(true);
    speakEnglish(target.upper);
  };

  const handleAlphaPick = (letter: string) => {
    const target = ENGLISH_ALPHABET[alphaTargetIdx];
    if (letter === target.upper) {
      playSuccessChime(soundEnabled);
      onMasterLetter(target.upper);
      setAlphaFeedback(`სწორია! ${target.upper}${target.lower} გამოითქმის „${target.pronunciationKa}“.`);
    } else {
      playErrorChime(soundEnabled);
      setAlphaFeedback(`არასწორია. სწორი ასო იყო ${target.upper} („${target.pronunciationKa}“).`);
    }
  };

  const dueVocabWords = useMemo(() => {
    const now = Date.now();
    return VOCABULARY_BANK.filter((w) => {
      const m = englishProgress.vocabulary[w.id];
      if (!m) return true;
      return new Date(m.nextReviewAt).getTime() <= now || m.mistakeCount > m.correctCount;
    });
  }, [englishProgress.vocabulary]);

  const startNextVocabReview = () => {
    const pool = dueVocabWords.length > 0 ? dueVocabWords : VOCABULARY_BANK;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    const distractors = VOCABULARY_BANK.filter((w) => w.id !== picked.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((w) => w.georgian);
    const opts = [picked.georgian, ...distractors].sort(() => Math.random() - 0.5);
    setReviewWord(picked);
    setReviewOptions(opts);
    setReviewFeedback(null);
    setReviewMode(true);
  };

  const handleVocabAnswer = (choice: string) => {
    if (!reviewWord || reviewFeedback) return;
    const ok = choice === reviewWord.georgian;
    onRecordVocabAttempt(reviewWord.id, ok);
    if (ok) {
      playSuccessChime(soundEnabled);
      setReviewFeedback({
        ok: true,
        text: `სწორია! ${reviewWord.english} — ${reviewWord.georgian} („${reviewWord.pronunciationKa}“).`,
      });
    } else {
      playErrorChime(soundEnabled);
      setReviewFeedback({
        ok: false,
        text: `სწორი თარგმანია: „${reviewWord.georgian}“. ეს სიტყვა მალე ისევ დაგიბრუნდება გამეორებაში.`,
      });
    }
  };

  const startListeningExercise = () => {
    const picked = VOCABULARY_BANK[Math.floor(Math.random() * VOCABULARY_BANK.length)];
    const others = VOCABULARY_BANK.filter((w) => w.id !== picked.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((w) => w.english);
    setListeningWord(picked);
    setListeningChoices([picked.english, ...others].sort(() => Math.random() - 0.5));
    setListeningFeedback(null);
    speakEnglish(picked.english);
  };

  const handleCheckWriting = () => {
    const trimmed = writingInput.trim();
    if (trimmed.length < 4) {
      setWritingFeedback('ჩაწერე სრული ინგლისური წინადადება (მაგ: I am a student. ან I like tea.).');
      return;
    }
    const startsUpper = /^[A-Z]/.test(trimmed);
    const endsPunct = /[.!?]$/.test(trimmed);
    const hasKnownPattern = /\b(I am|You are|He is|She is|It is|This is|I have|I like|I want|My name is)\b/i.test(
      trimmed
    );
    if (startsUpper && endsPunct && hasKnownPattern) {
      playSuccessChime(soundEnabled);
      setWritingFeedback('შესანიშნავია! წინადადება სწორად იწყება დიდი ასოთი, მთავრდება სასვენი ნიშნით და იყენებს სწორ კონსტრუქციას.');
    } else {
      setWritingFeedback(
        `კარგი მცდელობაა! შეამოწმე: ${!startsUpper ? 'დაიწყე დიდი ასოთი; ' : ''}${
          !endsPunct ? 'დაამატე წერტილი ბოლოში; ' : ''
        }${!hasKnownPattern ? 'გამოიყენე I am / I like / I have / I want.' : ''}`
      );
    }
  };

  const startSpeechPractice = (targetPhrase: string) => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

    if (!SpeechRec) {
      setSpokenText(`მიკროფონით ამოცნობა ამ ბრაუზერში მიუწვდომელია. მოუსმინე და გაიმეორე ხმამაღლა: „${targetPhrase}“`);
      speakEnglish(targetPhrase);
      return;
    }

    try {
      const rec = new SpeechRec() as {
        lang: string;
        interimResults: boolean;
        onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
      rec.lang = 'en-US';
      rec.interimResults = false;
      setListeningMic(true);
      rec.onresult = (event) => {
        const said = event.results[0]?.[0]?.transcript || '';
        setSpokenText(`შენ თქვი: „${said}“`);
      };
      rec.onerror = () => {
        setSpokenText('ხმის ამოცნობა ვერ მოხერხდა. შეამოწმე მიკროფონის ნებართვა ან გაიმეორე ხმამაღლა.');
      };
      rec.onend = () => setListeningMic(false);
      rec.start();
    } catch {
      setListeningMic(false);
    }
  };

  const lessonsForStage = activeTab === 'sentences' ? SENTENCE_LESSONS : GRAMMAR_LESSONS;
  const activeLesson =
    lessonsForStage.find((l) => l.id === activeLessonId) || lessonsForStage[0];

  const handleSubmitLessonQuiz = () => {
    const qs = activeLesson.quiz;
    let correct = 0;
    const mistakes: string[] = [];
    for (const q of qs) {
      if (lessonAnswers[q.id] === q.correctAnswer) {
        correct++;
      } else {
        mistakes.push(`${q.promptKa} (სწორი: ${q.correctAnswer})`);
      }
    }
    setLessonSubmitted(true);
    if (correct === qs.length) playSuccessChime(soundEnabled);
    onCompleteStage(activeLesson.id, qs.length, correct, mistakes);
  };

  const activeDialogue =
    PRACTICAL_DIALOGUES.find((d) => d.id === activeDialogueId) || PRACTICAL_DIALOGUES[0];

  const masteredCount = Object.values(englishProgress.vocabulary).filter((v) => v.mastered).length;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-fluid-title font-bold text-slate-900 dark:text-white">ინგლისური — ანბანიდან საუბრამდე</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 break-words">
            ყველა ახალი მასალა ახსნილია ქართულად · ათვისებული ასოები: {englishProgress.masteredLetters.length}/26 · სიტყვები: {masteredCount}
          </p>
        </div>
      </div>

      {/* Stage Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ['alphabet', '1. ანბანი (26)'],
            ['vocab', '2. ლექსიკა'],
            ['sentences', '3. წინადადებები'],
            ['grammar', '4. გრამატიკა'],
            ['practical', '5. პრაქტიკა'],
          ] as [EnglishTab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setActiveTab(id);
              if (id === 'sentences') setActiveLessonId(SENTENCE_LESSONS[0].id);
              if (id === 'grammar') setActiveLessonId(GRAMMAR_LESSONS[0].id);
              setLessonAnswers({});
              setLessonSubmitted(false);
            }}
            className={`min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === id
                ? 'bg-purple-600 border-purple-500 text-white'
                : 'bg-white dark:bg-[#0E1730] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* STAGE 1: ALPHABET */}
      {activeTab === 'alphabet' && (
        <div className="space-y-5">
          <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 min-[360px]:p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">ინგლისური ანბანის 26 ასო</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  დააჭირე ასოს გამოთქმისა და მაგალითის სანახავად
                </p>
              </div>
              <button
                type="button"
                onClick={startAlphabetQuiz}
                className="min-h-[44px] w-full min-[420px]:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold whitespace-nowrap"
              >
                {alphaQuizMode ? 'ახალი კითხვა' : 'ასოების ამოცნობის ტესტი'}
              </button>
            </div>

            {alphaQuizMode && (
              <div className="rounded-2xl bg-blue-600/10 border border-blue-500/30 p-3.5 sm:p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white break-words">
                    მოუსმინე ან წაიკითხე გამოთქმა და აირჩიე სწორი ასო: „{ENGLISH_ALPHABET[alphaTargetIdx].pronunciationKa}“
                  </div>
                  <button
                    type="button"
                    onClick={() => speakEnglish(ENGLISH_ALPHABET[alphaTargetIdx].upper)}
                    className="min-h-[44px] w-full sm:w-auto px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>მოსმენა</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 min-[420px]:grid-cols-4 gap-2.5">
                  {alphaOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleAlphaPick(opt)}
                      className="min-h-[48px] rounded-xl bg-white dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700 font-bold text-lg text-slate-900 dark:text-white hover:border-cyan-400"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {alphaFeedback && (
                  <div className="text-xs font-medium text-slate-800 dark:text-cyan-300">
                    {alphaFeedback}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-5 min-[375px]:grid-cols-6 sm:grid-cols-9 lg:grid-cols-[repeat(13,minmax(0,1fr))] gap-1.5 sm:gap-2">
              {ENGLISH_ALPHABET.map((item, idx) => {
                const isSelected = idx === selectedLetterIdx;
                const isMastered = englishProgress.masteredLetters.includes(item.upper);
                return (
                  <button
                    key={item.upper}
                    type="button"
                    onClick={() => {
                      setSelectedLetterIdx(idx);
                      speakEnglish(item.upper);
                    }}
                    className={`min-h-[48px] rounded-xl border font-bold text-sm flex flex-col items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-purple-600 border-purple-400 text-white'
                        : isMastered
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-50 dark:bg-[#070D1F] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    <span>
                      {item.upper}
                      {item.lower}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white break-words">
                  {currentLetter.upper} {currentLetter.lower}{' '}
                  <span className="text-base sm:text-lg font-medium text-cyan-600 dark:text-cyan-400">
                    [{currentLetter.pronunciationKa}]
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{currentLetter.soundHintKa}</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  მაგალითი: <strong>{currentLetter.exampleWord}</strong> — {currentLetter.exampleMeaningKa}
                </p>
              </div>
              <div className="flex flex-col min-[420px]:flex-row flex-wrap gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => speakEnglish(`${currentLetter.upper}. ${currentLetter.exampleWord}`)}
                  className="min-h-[44px] w-full min-[420px]:w-auto px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <Volume2 className="w-4 h-4 text-cyan-500 shrink-0" />
                  <span>{audioSupported ? 'მოსმენა' : 'ფონეტიკური მინიშნება'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onMasterLetter(currentLetter.upper)}
                  className="min-h-[44px] w-full min-[420px]:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {englishProgress.masteredLetters.includes(currentLetter.upper)
                      ? 'ათვისებულია'
                      : 'ვისწავლე ეს ასო'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 2: VOCABULARY + SPACED REPETITION */}
      {activeTab === 'vocab' && (
        <div className="space-y-5">
          <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 min-[360px]:p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">საბაზისო ლექსიკა და გამეორება</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  გასამეორებელი სიტყვები: {dueVocabWords.length} · ინტერვალური გამეორების სისტემა
                </p>
              </div>
              <button
                type="button"
                onClick={startNextVocabReview}
                className="min-h-[44px] w-full min-[440px]:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-semibold flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <RefreshCw className="w-4 h-4 shrink-0" />
                <span>{reviewMode ? 'შემდეგი სიტყვა' : 'სიტყვების ტესტი და გამეორება'}</span>
              </button>
            </div>

            {reviewMode && reviewWord && (
              <div className="rounded-2xl bg-purple-600/10 border border-purple-500/30 p-4 sm:p-5 space-y-4">
                <div className="flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <div className="text-xs text-purple-400 font-medium">აირჩიე სწორი ქართული თარგმანი</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 break-words">
                      {reviewWord.english}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      გამოთქმა: [{reviewWord.pronunciationKa}]
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => speakEnglish(reviewWord.english)}
                    className="min-h-[44px] w-full min-[380px]:w-auto px-3.5 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>მოსმენა</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2.5">
                  {reviewOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      disabled={Boolean(reviewFeedback)}
                      onClick={() => handleVocabAnswer(opt)}
                      className="min-h-[48px] rounded-xl bg-white dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white hover:border-purple-400"
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {reviewFeedback && (
                  <div
                    className={`rounded-xl p-3 text-xs font-medium flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-2.5 ${
                      reviewFeedback.ok
                        ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200'
                        : 'bg-red-500/20 text-red-800 dark:text-red-200'
                    }`}
                  >
                    <span className="break-words">{reviewFeedback.text}</span>
                    <button
                      type="button"
                      onClick={startNextVocabReview}
                      className="min-h-[44px] px-3.5 py-2 rounded-lg bg-white/20 font-semibold whitespace-nowrap shrink-0"
                    >
                      შემდეგი
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Category filter */}
            <div className="flex flex-wrap gap-2">
              {VOCAB_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setVocabCat(cat.id)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    vocabCat === cat.id
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-50 dark:bg-[#070D1F] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {cat.labelKa}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {VOCABULARY_BANK.filter((w) => w.category === vocabCat).map((word) => {
                const mastery = englishProgress.vocabulary[word.id];
                return (
                  <div
                    key={word.id}
                    className="rounded-2xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-slate-900 dark:text-white">
                            {word.english}
                          </span>
                          <span className="text-xs text-cyan-600 dark:text-cyan-400">
                            [{word.pronunciationKa}]
                          </span>
                        </div>
                        <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {word.georgian}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => speakEnglish(`${word.english}. ${word.exampleEn}`)}
                        aria-label={`მოუსმინე ${word.english}`}
                        className="min-w-[44px] min-h-[44px] rounded-xl bg-blue-600/15 text-blue-600 dark:text-cyan-400 flex items-center justify-center shrink-0"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800 pt-2">
                      <div>{word.exampleEn}</div>
                      <div className="text-slate-500 dark:text-slate-400 mt-0.5">{word.exampleKa}</div>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {mastery?.mastered
                        ? 'ათვისებულია'
                        : mastery
                        ? `გავლილია ${mastery.attempts}-ჯერ`
                        : 'ახალი სიტყვა'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STAGE 3 & 4: SENTENCES & GRAMMAR */}
      {(activeTab === 'sentences' || activeTab === 'grammar') && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {lessonsForStage.map((l) => {
              const done = englishProgress.completedStages.includes(l.id);
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => {
                    setActiveLessonId(l.id);
                    setLessonAnswers({});
                    setLessonSubmitted(false);
                  }}
                  className={`min-h-[42px] px-4 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                    activeLesson.id === l.id
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-white dark:bg-[#0E1730] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {done ? '✓ ' : ''}
                  {l.titleKa}
                </button>
              );
            })}
          </div>

          <div className="rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-5 sm:p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{activeLesson.titleKa}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {activeLesson.explanationKa}
              </p>
            </div>

            <div className="space-y-2.5">
              {activeLesson.examples.map((ex, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="font-semibold text-sm text-slate-900 dark:text-white">{ex.en}</div>
                    <div className="text-xs text-cyan-600 dark:text-cyan-400 mt-0.5">[{ex.pronunciationKa}]</div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{ex.ka}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => speakEnglish(ex.en)}
                    aria-label="მოსმენა"
                    className="min-w-[44px] min-h-[44px] rounded-xl bg-blue-600/15 text-blue-600 dark:text-cyan-400 flex items-center justify-center shrink-0"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Interactive Quiz */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-semibold text-base text-slate-900 dark:text-white">ცოდნის შემოწმება</h3>
              {activeLesson.quiz.map((q) => (
                <div key={q.id} className="space-y-2">
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{q.promptKa}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt) => {
                      const picked = lessonAnswers[q.id] === opt;
                      const isRight = opt === q.correctAnswer;
                      let cls =
                        'bg-slate-50 dark:bg-[#070D1F] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200';
                      if (lessonSubmitted) {
                        if (isRight) cls = 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-200';
                        else if (picked) cls = 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-200';
                      } else if (picked) {
                        cls = 'bg-blue-600/20 border-blue-500 text-blue-700 dark:text-white';
                      }
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={lessonSubmitted}
                          onClick={() => setLessonAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                          className={`min-h-[44px] text-left rounded-xl border px-3.5 py-2 text-xs font-semibold ${cls}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {lessonSubmitted && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      {lessonAnswers[q.id] === q.correctAnswer ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      )}
                      <span>{q.explanationKa}</span>
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                disabled={
                  lessonSubmitted ||
                  activeLesson.quiz.some((q) => !lessonAnswers[q.id])
                }
                onClick={handleSubmitLessonQuiz}
                className="min-h-[48px] w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 disabled:opacity-40 text-white font-semibold text-sm"
              >
                პასუხების შემოწმება
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 5: PRACTICAL ENGLISH */}
      {activeTab === 'practical' && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {PRACTICAL_DIALOGUES.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  setActiveDialogueId(d.id);
                  setReadingAnswer(null);
                  setReadingChecked(false);
                }}
                className={`min-h-[42px] px-4 py-2 rounded-xl border text-xs font-semibold ${
                  activeDialogue.id === d.id
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-white dark:bg-[#0E1730] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {d.titleKa}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Dialogue + Speaking */}
            <div className="rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-5 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                ყოველდღიური დიალოგი: {activeDialogue.titleKa}
              </h2>
              <div className="space-y-2.5">
                {activeDialogue.lines.map((line, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 p-3.5 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                        {line.speaker}
                      </div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">
                        {line.en}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{line.ka}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => speakEnglish(line.en)}
                      className="min-w-[44px] min-h-[44px] rounded-xl bg-blue-600/15 text-blue-600 dark:text-cyan-400 flex items-center justify-center shrink-0"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  საუბრის პრაქტიკა:
                </div>
                <button
                  type="button"
                  onClick={() => startSpeechPractice(activeDialogue.lines[0].en)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold flex items-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  <span>{listeningMic ? 'გისმენ...' : 'წარმოთქვი პირველი ფრაზა'}</span>
                </button>
                {spokenText && (
                  <div className="text-xs text-slate-600 dark:text-cyan-300">{spokenText}</div>
                )}
              </div>
            </div>

            {/* Reading, Listening & Writing */}
            <div className="space-y-5">
              <div className="rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">მოკლე ტექსტის კითხვა</h3>
                  <button
                    type="button"
                    onClick={() => speakEnglish(activeDialogue.readingTextEn)}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl bg-blue-600/15 text-blue-600 dark:text-cyan-400 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>წაკითხვა</span>
                  </button>
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {activeDialogue.readingTextEn}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  თარგმანი: {activeDialogue.readingTextKa}
                </p>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 pt-2">
                  {activeDialogue.questionKa}
                </div>
                <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2">
                  {activeDialogue.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setReadingAnswer(opt);
                        setReadingChecked(true);
                        if (opt === activeDialogue.correctAnswer) playSuccessChime(soundEnabled);
                        else playErrorChime(soundEnabled);
                      }}
                      className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-semibold ${
                        readingChecked && opt === activeDialogue.correctAnswer
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-200'
                          : readingChecked && readingAnswer === opt
                          ? 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-200'
                          : 'bg-slate-50 dark:bg-[#070D1F] border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Listening Exercise */}
              <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-cyan-500 shrink-0" />
                    <span>მოსმენის სავარჯიშო</span>
                  </h3>
                  <button
                    type="button"
                    onClick={startListeningExercise}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-cyan-600 text-white text-xs font-semibold"
                  >
                    {listeningWord ? 'სხვა სიტყვა' : 'დაწყება'}
                  </button>
                </div>
                {listeningWord && (
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => speakEnglish(listeningWord.english)}
                      className="min-h-[44px] w-full min-[380px]:w-auto px-4 py-2 rounded-xl border border-cyan-500/40 text-xs font-semibold text-cyan-600 dark:text-cyan-300 flex items-center justify-center gap-2"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>ხელახლა მოსმენა</span>
                    </button>
                    <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2">
                      {listeningChoices.map((ch) => (
                        <button
                          key={ch}
                          type="button"
                          onClick={() => {
                            if (ch === listeningWord.english) {
                              playSuccessChime(soundEnabled);
                              setListeningFeedback(`სწორია! ${listeningWord.english} (${listeningWord.georgian})`);
                            } else {
                              playErrorChime(soundEnabled);
                              setListeningFeedback(`სწორი სიტყვა იყო: ${listeningWord.english}`);
                            }
                          }}
                          className="min-h-[44px] rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 text-xs font-semibold"
                        >
                          {ch}
                        </button>
                      ))}
                    </div>
                    {listeningFeedback && (
                      <div className="text-xs font-medium text-cyan-600 dark:text-cyan-300">
                        {listeningFeedback}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Simple Writing */}
              <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 sm:p-5 space-y-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">მარტივი წინადადების წერა</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  დაწერე მარტივი ინგლისური წინადადება (მაგ: „I am happy.“ ან „I like apples.“)
                </p>
                <div className="flex flex-col min-[420px]:flex-row gap-2">
                  <input
                    type="text"
                    value={writingInput}
                    onChange={(e) => setWritingInput(e.target.value)}
                    placeholder="I am..."
                    className="flex-1 min-h-[44px] rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700 px-3.5 text-base sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleCheckWriting}
                    className="min-h-[44px] w-full min-[420px]:w-auto px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold whitespace-nowrap"
                  >
                    შემოწმება
                  </button>
                </div>
                {writingFeedback && (
                  <div className="text-xs text-slate-700 dark:text-slate-200">{writingFeedback}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
