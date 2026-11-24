import React, { useEffect, useRef, useState } from 'react';
import { DifficultyLevel } from '../../types/app';
import { playErrorChime, playSuccessChime } from '../../services/speechAndSound';

interface LogicAttentionProps {
  gameId:
    | 'logic_seq'
    | 'logic_missing'
    | 'logic_pattern'
    | 'logic_puzzle'
    | 'logic_shape'
    | 'logic_reason'
    | 'att_odd'
    | 'att_match'
    | 'att_reaction'
    | 'att_search'
    | 'att_focus';
  difficulty: DifficultyLevel;
  soundEnabled: boolean;
  onFinish: (score: number, accuracy?: number) => void;
}

interface QuizChallenge {
  prompt: string;
  options: string[];
  correct: string;
}

function generateLogicChallenges(gameId: string, difficulty: DifficultyLevel): QuizChallenge[] {
  const stepBase = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 4 : 7;
  const list: QuizChallenge[] = [];
  for (let r = 0; r < 5; r++) {
    if (gameId === 'logic_seq') {
      const start = (r + 1) * 2;
      const step = stepBase + r;
      const seq = [start, start + step, start + step * 2, start + step * 3];
      const ans = start + step * 4;
      list.push({
        prompt: `რომელი რიცხვი აგრძელებს მიმდევრობას? ${seq.join(', ')}, ?`,
        options: [ans, ans + 2, ans - 2, ans + step].map(String).sort(() => Math.random() - 0.5),
        correct: String(ans),
      });
    } else if (gameId === 'logic_missing') {
      const start = 3 + r * 3;
      const step = stepBase + 1;
      const ans = start + step * 2;
      list.push({
        prompt: `იპოვე გამოტოვებული რიცხვი: ${start}, ${start + step}, ?, ${start + step * 3}`,
        options: [ans, ans + 1, ans - 1, ans + step].map(String).sort(() => Math.random() - 0.5),
        correct: String(ans),
      });
    } else if (gameId === 'logic_pattern') {
      const patterns = [
        { p: '▲, ●, ▲, ●, ▲, ?', c: '●', o: ['●', '▲', '■', '◆'] },
        { p: '★, ★, ◆, ★, ★, ?', c: '◆', o: ['◆', '★', '●', '▲'] },
        { p: '■, ▲, ●, ■, ▲, ?', c: '●', o: ['●', '■', '▲', '✦'] },
        { p: '2, 4, 8, 16, ?', c: '32', o: ['32', '24', '20', '30'] },
        { p: '1, 3, 6, 10, ?', c: '15', o: ['15', '12', '14', '16'] },
      ];
      const item = patterns[r % patterns.length];
      list.push({
        prompt: `იპოვე კანონზომიერება: ${item.p}`,
        options: [...item.o].sort(() => Math.random() - 0.5),
        correct: item.c,
      });
    } else if (gameId === 'logic_shape') {
      const shapes = [
        { p: 'რომელ ფიგურას აქვს ზუსტად 3 კუთხე და 3 გვერდი?', c: 'სამკუთხედი (▲)', o: ['სამკუთხედი (▲)', 'კვადრატი (■)', 'წრე (●)', 'ხუთკუთხედი'] },
        { p: 'რომელ ფიგურას არ აქვს არცერთი კუთხე?', c: 'წრე (●)', o: ['წრე (●)', 'კვადრატი (■)', 'მართკუთხედი', 'სამკუთხედი (▲)'] },
        { p: '4 ტოლი გვერდი და 4 მართი კუთხე აქვს...', c: 'კვადრატს (■)', o: ['კვადრატს (■)', 'სამკუთხედს', 'წრეს', 'ოვალს'] },
        { p: 'რომელი ფიგურა იქმნება ორი ტოლი კვადრატის გვერდიგვერდ დადებით?', c: 'მართკუთხედი', o: ['მართკუთხედი', 'წრე', 'სამკუთხედი', 'რომბი'] },
        { p: 'რამდენი გვერდი აქვს ექვსკუთხედს?', c: '6', o: ['6', '4', '5', '8'] },
      ];
      const item = shapes[r % shapes.length];
      list.push({ prompt: item.p, options: [...item.o].sort(() => Math.random() - 0.5), correct: item.c });
    } else if (gameId === 'logic_puzzle') {
      const puzzles = [
        { p: 'ანა მაღალია ლუკაზე. ლუკა მაღალია გიორგიზე. ვინ არის ყველაზე დაბალი?', c: 'გიორგი', o: ['გიორგი', 'ანა', 'ლუკა', 'თანაბრები არიან'] },
        { p: 'ყუთში 5 ვაშლია. აიღე 2 ვაშლი. რამდენი ვაშლი გაქვს შენ?', c: '2', o: ['2', '3', '5', '0'] },
        { p: 'თუ დღეს ორშაბათია, რა დღე იქნება 3 დღის შემდეგ?', c: 'ხუთშაბათი', o: ['ხუთშაბათი', 'ოთხშაბათი', 'პარასკევი', 'სამშაბათი'] },
        { p: 'კატას 4 ფეხი აქვს, ჩიტს — 2. რამდენი ფეხია სულ 2 კატასა და 1 ჩიტზე?', c: '10', o: ['10', '8', '6', '12'] },
        { p: 'მატარებელში 10 მგზავრია. 3 ჩავიდა და 2 ამოვიდა. რამდენი მგზავრია?', c: '9', o: ['9', '11', '8', '10'] },
      ];
      const item = puzzles[r % puzzles.length];
      list.push({ prompt: item.p, options: [...item.o].sort(() => Math.random() - 0.5), correct: item.c });
    } else {
      const reason = [
        { p: 'ყველა ფრინველს აქვს ფრთა. არწივი ფრინველია. მაშასადამე...', c: 'არწივს აქვს ფრთა', o: ['არწივს აქვს ფრთა', 'ყველა ფრინველი არწივია', 'არწივი თევზია', 'ფრთა მხოლოდ არწივს აქვს'] },
        { p: 'თუ წვიმს, ქუჩა სველია. ქუჩა მშრალია. მაშასადამე...', c: 'ახლა არ წვიმს', o: ['ახლა არ წვიმს', 'ახლა წვიმს', 'ზამთარია', 'ქარია'] },
        { p: 'ორი რიცხვის ჯამია 10, სხვაობა — 2. რომელია ეს რიცხვები?', c: '6 და 4', o: ['6 და 4', '7 და 3', '8 და 2', '5 და 5'] },
        { p: 'პირველი წიგნი უფრო სქელია მეორეზე, მესამე უფრო თხელია მეორეზე. რომელია ყველაზე სქელი?', c: 'პირველი', o: ['პირველი', 'მეორე', 'მესამე', 'უცნობია'] },
        { p: 'დღე-ღამეში 24 საათია. რამდენი საათია ნახევარ დღე-ღამეში?', c: '12', o: ['12', '8', '6', '24'] },
      ];
      const item = reason[r % reason.length];
      list.push({ prompt: item.p, options: [...item.o].sort(() => Math.random() - 0.5), correct: item.c });
    }
  }
  return list;
}

export const LogicAndAttentionGames: React.FC<LogicAttentionProps> = ({
  gameId,
  difficulty,
  soundEnabled,
  onFinish,
}) => {
  const [round, setRound] = useState(0);
  const [correctHits, setCorrectHits] = useState(0);

  // Logic quiz bank
  const [logicList] = useState<QuizChallenge[]>(() =>
    gameId.startsWith('logic_') ? generateLogicChallenges(gameId, difficulty) : []
  );

  // Attention: Reaction test
  const [reactState, setReactState] = useState<'waiting' | 'ready' | 'go' | 'tooSoon'>('waiting');
  const [reactTimes, setReactTimes] = useState<number[]>([]);
  const goTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  // Attention: Visual Grid (odd / search / match)
  const gridDim = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
  const [gridSymbols, setGridSymbols] = useState<string[]>([]);
  const [targetSymbol, setTargetSymbol] = useState<string>('★');
  const [targetIndex, setTargetIndex] = useState<number>(0);

  // Attention: Stroop concentration
  const stroopColors = [
    { name: 'წითელი', hex: '#EF4444' },
    { name: 'ლურჯი', hex: '#3B82F6' },
    { name: 'მწვანე', hex: '#10B981' },
    { name: 'ყვითელი', hex: '#F59E0B' },
  ];
  const [stroopWord, setStroopWord] = useState(stroopColors[0]);
  const [stroopInk, setStroopInk] = useState(stroopColors[1]);

  useEffect(() => {
    if (gameId === 'att_odd' || gameId === 'att_search' || gameId === 'att_match') {
      const pairs = [
        ['◆', '◇'],
        ['●', '○'],
        ['▲', '△'],
        ['★', '☆'],
        ['■', '□'],
        ['✚', '✕'],
      ];
      const [main, odd] = pairs[(round + Math.floor(Math.random() * pairs.length)) % pairs.length];
      const total = gridDim * gridDim;
      const idx = Math.floor(Math.random() * total);
      const arr = Array.from({ length: total }, (_, i) => (i === idx ? odd : main));
      setGridSymbols(arr);
      setTargetSymbol(odd);
      setTargetIndex(idx);
    }

    if (gameId === 'att_focus') {
      const w = stroopColors[Math.floor(Math.random() * stroopColors.length)];
      let ink = stroopColors[Math.floor(Math.random() * stroopColors.length)];
      if (difficulty !== 'easy' && ink.name === w.name) {
        ink = stroopColors[(stroopColors.indexOf(w) + 1) % stroopColors.length];
      }
      setStroopWord(w);
      setStroopInk(ink);
    }
  }, [gameId, round, difficulty]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (gameId.startsWith('logic_')) {
    const q = logicList[round];
    const handlePick = (opt: string) => {
      const ok = opt === q.correct;
      const nextHits = ok ? correctHits + 1 : correctHits;
      setCorrectHits(nextHits);
      if (ok) playSuccessChime(soundEnabled);
      else playErrorChime(soundEnabled);

      if (round + 1 >= logicList.length) {
        const pct = Math.round((nextHits / logicList.length) * 100);
        onFinish(pct, pct);
      } else {
        setRound((r) => r + 1);
      }
    };

    return (
      <div className="space-y-5">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          ამოცანა {round + 1} / {logicList.length}
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{q.prompt}</h3>
        <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2.5 sm:gap-3">
          {q.options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => handlePick(opt)}
              className="min-h-[52px] rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700 hover:border-cyan-400 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white break-words"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (gameId === 'att_reaction') {
    const startTrial = () => {
      setReactState('ready');
      const delay = 1000 + Math.random() * (difficulty === 'hard' ? 2800 : 2000);
      timerRef.current = window.setTimeout(() => {
        goTimeRef.current = performance.now();
        setReactState('go');
      }, delay);
    };

    const handleTapStage = () => {
      if (reactState === 'waiting' || reactState === 'tooSoon') {
        startTrial();
        return;
      }
      if (reactState === 'ready') {
        if (timerRef.current) clearTimeout(timerRef.current);
        setReactState('tooSoon');
        playErrorChime(soundEnabled);
        return;
      }
      if (reactState === 'go') {
        const ms = Math.round(performance.now() - goTimeRef.current);
        playSuccessChime(soundEnabled);
        const nextTimes = [...reactTimes, ms];
        setReactTimes(nextTimes);
        setReactState('waiting');
        if (nextTimes.length >= 3) {
          const avg = nextTimes.reduce((a, b) => a + b, 0) / nextTimes.length;
          const score = Math.max(20, Math.min(100, Math.round(115 - avg / 8)));
          onFinish(score, score);
        }
      }
    };

    return (
      <div className="space-y-4 text-center">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          ცდა {Math.min(3, reactTimes.length + 1)} / 3 · საშუალო:{' '}
          {reactTimes.length > 0
            ? `${Math.round(reactTimes.reduce((a, b) => a + b, 0) / reactTimes.length)} მწმ`
            : '—'}
        </div>
        <button
          type="button"
          onClick={handleTapStage}
          className={`w-full h-48 rounded-2xl font-bold text-lg text-white transition-colors ${
            reactState === 'go'
              ? 'bg-emerald-500'
              : reactState === 'ready'
              ? 'bg-amber-500'
              : reactState === 'tooSoon'
              ? 'bg-red-500'
              : 'bg-blue-600'
          }`}
        >
          {reactState === 'waiting' && 'დააჭირე დასაწყებად'}
          {reactState === 'ready' && 'დაელოდე მწვანე ფერს...'}
          {reactState === 'go' && 'დააჭირე ახლავე!'}
          {reactState === 'tooSoon' && 'ნაადრევი იყო! დააჭირე თავიდან'}
        </button>
      </div>
    );
  }

  if (gameId === 'att_focus') {
    const handleStroopPick = (colorName: string) => {
      const ok = colorName === stroopInk.name;
      const nextHits = ok ? correctHits + 1 : correctHits;
      setCorrectHits(nextHits);
      if (ok) playSuccessChime(soundEnabled);
      else playErrorChime(soundEnabled);

      if (round + 1 >= 5) {
        const pct = Math.round((nextHits / 5) * 100);
        onFinish(pct, pct);
      } else {
        setRound((r) => r + 1);
      }
    };

    return (
      <div className="space-y-5 text-center">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          რაუნდი {round + 1} / 5 · აირჩიე <strong>ტექსტის ფერი</strong> (და არა სიტყვის მნიშვნელობა)
        </div>
        <div className="py-5 sm:py-6 text-3xl sm:text-4xl font-bold" style={{ color: stroopInk.hex }}>
          {stroopWord.name}
        </div>
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2.5 sm:gap-3 max-w-sm mx-auto">
          {stroopColors.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => handleStroopPick(c.name)}
              className="min-h-[48px] rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700 font-semibold text-sm hover:border-cyan-400"
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // att_odd, att_search, att_match
  const handleGridPick = (idx: number) => {
    const ok = idx === targetIndex;
    const nextHits = ok ? correctHits + 1 : correctHits;
    setCorrectHits(nextHits);
    if (ok) playSuccessChime(soundEnabled);
    else playErrorChime(soundEnabled);

    if (round + 1 >= 5) {
      const pct = Math.round((nextHits / 5) * 100);
      onFinish(pct, pct);
    } else {
      setRound((r) => r + 1);
    }
  };

  return (
    <div className="space-y-4 text-center">
      <div className="text-xs text-slate-500 dark:text-slate-400">
        რაუნდი {round + 1} / 5 · იპოვე სიმბოლო: <strong className="text-lg text-cyan-500">{targetSymbol}</strong>
      </div>
      <div
        className="grid gap-1.5 sm:gap-2 max-w-[300px] sm:max-w-xs mx-auto"
        style={{ gridTemplateColumns: `repeat(${gridDim}, minmax(0, 1fr))` }}
      >
        {gridSymbols.map((sym, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleGridPick(idx)}
            className="min-h-[44px] aspect-square rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700 text-xl sm:text-2xl flex items-center justify-center hover:border-cyan-400"
          >
            {sym}
          </button>
        ))}
      </div>
    </div>
  );
};
