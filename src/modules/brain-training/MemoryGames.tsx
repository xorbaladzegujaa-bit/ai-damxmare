import React, { useEffect, useState } from 'react';
import { DifficultyLevel } from '../../types/app';
import { playErrorChime, playSuccessChime } from '../../services/speechAndSound';

interface MemoryGameProps {
  gameId: 'num_seq' | 'color_seq' | 'pattern_grid' | 'object_loc' | 'card_pairs' | 'word_recall';
  difficulty: DifficultyLevel;
  soundEnabled: boolean;
  onFinish: (score: number, accuracy?: number) => void;
}

const COLORS = [
  { id: 'blue', label: 'ლურჯი', cls: 'bg-blue-500' },
  { id: 'emerald', label: 'მწვანე', cls: 'bg-emerald-500' },
  { id: 'purple', label: 'იისფერი', cls: 'bg-purple-500' },
  { id: 'amber', label: 'ყვითელი', cls: 'bg-amber-400' },
];

const WORDS_POOL = [
  'მზე', 'წიგნი', 'წყალი', 'მთა', 'ხე', 'სახლი', 'ქალაქი', 'ზღვა', 'ვარსკვლავი', 'ღრუბელი', 'ქარი', 'ცოდნა',
];

const SYMBOLS = ['★', '◆', '▲', '●', '■', '✦', '✚', '❖'];

export const MemoryGames: React.FC<MemoryGameProps> = ({
  gameId,
  difficulty,
  soundEnabled,
  onFinish,
}) => {
  const diffMult = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1.5 : 2;
  const [phase, setPhase] = useState<'memorize' | 'recall'>('memorize');
  const [round, setRound] = useState(1);
  const [totalScore, setTotalScore] = useState(0);

  // Number / Color sequence
  const [sequence, setSequence] = useState<string[]>([]);
  const [userSeq, setUserSeq] = useState<string[]>([]);
  const [showIdx, setShowIdx] = useState<number>(-1);

  // Grid pattern / Object location
  const gridSize = difficulty === 'easy' ? 3 : 4;
  const [targetCells, setTargetCells] = useState<number[]>([]);
  const [pickedCells, setPickedCells] = useState<number[]>([]);

  // Card pairs
  const pairCount = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8;
  const [cards, setCards] = useState<{ id: number; sym: string; flipped: boolean; matched: boolean }[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  // Word recall
  const [targetWords, setTargetWords] = useState<string[]>([]);
  const [wordChoices, setWordChoices] = useState<string[]>([]);
  const [pickedWords, setPickedWords] = useState<string[]>([]);

  // Setup round
  useEffect(() => {
    setUserSeq([]);
    setPickedCells([]);
    setPickedWords([]);

    if (gameId === 'num_seq') {
      const len = Math.min(8, Math.round((2 + round) * (difficulty === 'hard' ? 1.2 : 1)));
      const seq = Array.from({ length: len }, () => String(Math.floor(Math.random() * 9) + 1));
      setSequence(seq);
      setPhase('memorize');
      const t = setTimeout(() => setPhase('recall'), Math.max(1800, len * 650));
      return () => clearTimeout(t);
    }

    if (gameId === 'color_seq') {
      const len = 2 + round + (difficulty === 'hard' ? 1 : 0);
      const seq = Array.from({ length: len }, () => COLORS[Math.floor(Math.random() * COLORS.length)].id);
      setSequence(seq);
      setPhase('memorize');
      let step = 0;
      setShowIdx(0);
      const interval = setInterval(() => {
        step++;
        if (step >= seq.length) {
          clearInterval(interval);
          setShowIdx(-1);
          setPhase('recall');
        } else {
          setShowIdx(step);
        }
      }, difficulty === 'hard' ? 550 : 750);
      return () => clearInterval(interval);
    }

    if (gameId === 'pattern_grid' || gameId === 'object_loc') {
      const total = gridSize * gridSize;
      const count = Math.min(total - 2, 2 + round + (difficulty === 'hard' ? 2 : 0));
      const indices = Array.from({ length: total }, (_, i) => i)
        .sort(() => Math.random() - 0.5)
        .slice(0, count);
      setTargetCells(indices);
      setPhase('memorize');
      const t = setTimeout(() => setPhase('recall'), difficulty === 'hard' ? 1800 : 2500);
      return () => clearTimeout(t);
    }

    if (gameId === 'card_pairs') {
      const syms = SYMBOLS.slice(0, pairCount);
      const deck = [...syms, ...syms]
        .sort(() => Math.random() - 0.5)
        .map((sym, idx) => ({ id: idx, sym, flipped: false, matched: false }));
      setCards(deck);
      setFlippedIds([]);
      setMoves(0);
      setPhase('recall');
    }

    if (gameId === 'word_recall') {
      const count = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
      const shuffled = [...WORDS_POOL].sort(() => Math.random() - 0.5);
      const targets = shuffled.slice(0, count);
      const distractors = shuffled.slice(count, count + 4);
      setTargetWords(targets);
      setWordChoices([...targets, ...distractors].sort(() => Math.random() - 0.5));
      setPhase('memorize');
      const t = setTimeout(() => setPhase('recall'), 3200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [gameId, round, difficulty]);

  const advanceRound = (roundPoints: number, ok: boolean) => {
    const nextScore = totalScore + roundPoints;
    setTotalScore(nextScore);
    if (ok) playSuccessChime(soundEnabled);
    else playErrorChime(soundEnabled);

    if (round >= 3) {
      const finalScore = Math.min(100, Math.round(nextScore / 3));
      onFinish(finalScore, finalScore);
    } else {
      setRound((r) => r + 1);
    }
  };

  if (gameId === 'num_seq') {
    const handleDigit = (d: string) => {
      if (phase !== 'recall') return;
      const next = [...userSeq, d];
      setUserSeq(next);
      const idx = next.length - 1;
      if (d !== sequence[idx]) {
        advanceRound(Math.round((idx / sequence.length) * 60), false);
        return;
      }
      if (next.length === sequence.length) {
        advanceRound(Math.min(100, Math.round(70 + 15 * diffMult)), true);
      }
    };

    return (
      <div className="space-y-5 text-center">
        <div className="text-xs text-slate-500 dark:text-slate-400">რაუნდი {round} / 3</div>
        {phase === 'memorize' ? (
          <div className="py-6 sm:py-8 space-y-2">
            <div className="text-xs text-cyan-500 font-medium">დაიმახსოვრე რიცხვების თანმიმდევრობა:</div>
            <div className="text-2xl min-[380px]:text-3xl sm:text-4xl font-bold font-mono-num tracking-wider sm:tracking-widest text-slate-900 dark:text-white break-words">
              {sequence.join(' ')}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
              აკრიფე იგივე თანმიმდევრობა ({userSeq.length}/{sequence.length}):
            </div>
            <div className="min-h-[40px] text-xl sm:text-2xl font-bold font-mono-num tracking-wider sm:tracking-widest text-cyan-500 break-words">
              {userSeq.join(' ') || '—'}
            </div>
            <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDigit(d)}
                  className="min-h-[52px] rounded-xl bg-slate-100 dark:bg-[#070D1F] border border-slate-300 dark:border-slate-700 font-bold text-lg hover:border-cyan-400"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (gameId === 'color_seq') {
    const handleColor = (id: string) => {
      if (phase !== 'recall') return;
      const next = [...userSeq, id];
      setUserSeq(next);
      const idx = next.length - 1;
      if (id !== sequence[idx]) {
        advanceRound(Math.round((idx / sequence.length) * 60), false);
        return;
      }
      if (next.length === sequence.length) {
        advanceRound(Math.min(100, Math.round(70 + 15 * diffMult)), true);
      }
    };

    return (
      <div className="space-y-5 text-center">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          რაუნდი {round} / 3 · {phase === 'memorize' ? 'დააკვირდი ნათებას' : `გაიმეორე (${userSeq.length}/${sequence.length})`}
        </div>
        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
          {COLORS.map((c) => {
            const lit = phase === 'memorize' && showIdx >= 0 && sequence[showIdx] === c.id;
            return (
              <button
                key={c.id}
                type="button"
                disabled={phase === 'memorize'}
                onClick={() => handleColor(c.id)}
                className={`h-24 rounded-2xl ${c.cls} text-white font-semibold text-sm transition-transform ${
                  lit ? 'scale-105 ring-4 ring-white shadow-xl' : 'opacity-80 hover:opacity-100'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (gameId === 'pattern_grid' || gameId === 'object_loc') {
    const toggleCell = (idx: number) => {
      if (phase !== 'recall') return;
      if (pickedCells.includes(idx)) return;
      const next = [...pickedCells, idx];
      setPickedCells(next);
      if (next.length === targetCells.length) {
        const hits = next.filter((c) => targetCells.includes(c)).length;
        const pct = Math.round((hits / targetCells.length) * 100);
        advanceRound(pct, pct >= 70);
      }
    };

    return (
      <div className="space-y-4 text-center">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          რაუნდი {round} / 3 ·{' '}
          {phase === 'memorize'
            ? 'დაიმახსოვრე მონიშნული უჯრები'
            : `მონიშნე ${targetCells.length} ადგილი (${pickedCells.length}/${targetCells.length})`}
        </div>
        <div
          className="grid gap-2 max-w-xs mx-auto"
          style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: gridSize * gridSize }, (_, idx) => {
            const isTarget = targetCells.includes(idx);
            const isPicked = pickedCells.includes(idx);
            const showLit = (phase === 'memorize' && isTarget) || isPicked;
            return (
              <button
                key={idx}
                type="button"
                disabled={phase === 'memorize'}
                onClick={() => toggleCell(idx)}
                className={`aspect-square rounded-xl border text-lg font-bold flex items-center justify-center transition-colors ${
                  showLit
                    ? 'bg-cyan-500 border-cyan-400 text-white'
                    : 'bg-slate-100 dark:bg-[#070D1F] border-slate-300 dark:border-slate-700'
                }`}
              >
                {showLit ? (gameId === 'object_loc' ? '★' : '') : ''}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (gameId === 'card_pairs') {
    const flipCard = (id: number) => {
      if (flippedIds.length >= 2) return;
      const card = cards.find((c) => c.id === id);
      if (!card || card.flipped || card.matched) return;

      const updated = cards.map((c) => (c.id === id ? { ...c, flipped: true } : c));
      setCards(updated);
      const nextFlipped = [...flippedIds, id];
      setFlippedIds(nextFlipped);

      if (nextFlipped.length === 2) {
        setMoves((m) => m + 1);
        const [aId, bId] = nextFlipped;
        const a = updated.find((c) => c.id === aId)!;
        const b = updated.find((c) => c.id === bId)!;
        if (a.sym === b.sym) {
          playSuccessChime(soundEnabled);
          const matchedDeck = updated.map((c) =>
            c.id === aId || c.id === bId ? { ...c, matched: true } : c
          );
          setCards(matchedDeck);
          setFlippedIds([]);
          if (matchedDeck.every((c) => c.matched)) {
            const efficiency = Math.max(40, Math.min(100, Math.round((pairCount / Math.max(pairCount, moves + 1)) * 100)));
            onFinish(efficiency, efficiency);
          }
        } else {
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) => (c.id === aId || c.id === bId ? { ...c, flipped: false } : c))
            );
            setFlippedIds([]);
          }, 650);
        }
      }
    };

    return (
      <div className="space-y-4 text-center">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          იპოვე ყველა წყვილი · სვლები: <span className="font-mono-num">{moves}</span>
        </div>
        <div className="grid grid-cols-4 gap-2.5 max-w-sm mx-auto">
          {cards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => flipCard(card.id)}
              className={`aspect-square rounded-xl border text-2xl font-bold flex items-center justify-center transition-colors ${
                card.flipped || card.matched
                  ? 'bg-purple-600 border-purple-400 text-white'
                  : 'bg-slate-100 dark:bg-[#070D1F] border-slate-300 dark:border-slate-700 text-slate-400'
              }`}
            >
              {card.flipped || card.matched ? card.sym : '?'}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // word_recall
  const toggleWord = (w: string) => {
    if (phase !== 'recall') return;
    if (pickedWords.includes(w)) {
      setPickedWords((prev) => prev.filter((x) => x !== w));
    } else if (pickedWords.length < targetWords.length) {
      setPickedWords((prev) => [...prev, w]);
    }
  };

  const submitWords = () => {
    const hits = pickedWords.filter((w) => targetWords.includes(w)).length;
    const pct = Math.round((hits / targetWords.length) * 100);
    advanceRound(pct, pct >= 70);
  };

  return (
    <div className="space-y-4 text-center">
      <div className="text-xs text-slate-500 dark:text-slate-400">რაუნდი {round} / 3</div>
      {phase === 'memorize' ? (
        <div className="py-6 space-y-3">
          <div className="text-xs text-cyan-500 font-medium">დაიმახსოვრე ეს სიტყვები:</div>
          <div className="flex flex-wrap justify-center gap-2.5">
            {targetWords.map((w) => (
              <span
                key={w}
                className="px-4 py-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-base font-bold text-slate-900 dark:text-white"
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm font-medium">
            აირჩიე {targetWords.length} სიტყვა, რომლებიც ნახე ({pickedWords.length}/{targetWords.length}):
          </div>
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-lg mx-auto">
            {wordChoices.map((w) => {
              const active = pickedWords.includes(w);
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => toggleWord(w)}
                  className={`min-h-[48px] rounded-xl border px-3 py-2 text-sm font-semibold ${
                    active
                      ? 'bg-cyan-500 border-cyan-400 text-white'
                      : 'bg-slate-50 dark:bg-[#070D1F] border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {w}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            disabled={pickedWords.length !== targetWords.length}
            onClick={submitWords}
            className="min-h-[48px] w-full min-[380px]:w-auto px-6 py-2.5 rounded-xl bg-blue-600 disabled:opacity-40 text-white text-sm font-semibold"
          >
            დადასტურება
          </button>
        </div>
      )}
    </div>
  );
};
