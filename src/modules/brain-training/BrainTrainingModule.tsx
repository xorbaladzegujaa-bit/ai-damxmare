import React, { useMemo, useState } from 'react';
import { Award, Brain, Play, RotateCcw, Trophy } from 'lucide-react';
import { BrainCategory, DifficultyLevel, GameScoreRecord } from '../../types/app';
import { MemoryGames } from './MemoryGames';
import { LogicAndAttentionGames } from './LogicAndAttentionGames';
import { MotorGames } from './MotorGames';

interface BrainTrainingModuleProps {
  gameScores: GameScoreRecord[];
  soundEnabled: boolean;
  onRecordScore: (record: GameScoreRecord) => void;
}

interface GameCatalogItem {
  id: string;
  title: string;
  category: BrainCategory;
  instructions: string;
}

const GAME_CATALOG: GameCatalogItem[] = [
  // Memory
  { id: 'num_seq', title: 'რიცხვების მიმდევრობა', category: 'memory', instructions: 'დაიმახსოვრე ეკრანზე ნაჩვენები რიცხვები და აკრიფე იგივე თანმიმდევრობით.' },
  { id: 'color_seq', title: 'ფერების მიმდევრობა', category: 'memory', instructions: 'დააკვირდი ფერების ანთების თანმიმდევრობას და გაიმეორე ზუსტად.' },
  { id: 'pattern_grid', title: 'ნიმუშის დამახსოვრება', category: 'memory', instructions: 'დაიმახსოვრე ბადეზე შეფერილი უჯრები და მონიშნე გაქრობის შემდეგ.' },
  { id: 'object_loc', title: 'ობიექტების მდებარეობა', category: 'memory', instructions: 'დაიმახსოვრე ვარსკვლავების მდებარეობა და იპოვე ისინი მეხსიერებით.' },
  { id: 'card_pairs', title: 'წყვილი ბარათები', category: 'memory', instructions: 'გახსენი ბარათები და იპოვე ყველა ერთნაირი სიმბოლოს წყვილი.' },
  { id: 'word_recall', title: 'სიტყვების დამახსოვრება', category: 'memory', instructions: 'წაიკითხე ნაჩვენები სიტყვები და შემდეგ ამოიცანი სიიდან.' },

  // Logic
  { id: 'logic_seq', title: 'რიცხვითი მიმდევრობები', category: 'logic', instructions: 'დაადგინე ზრდის წესი და იპოვე შემდეგი რიცხვი.' },
  { id: 'logic_missing', title: 'გამოტოვებული რიცხვი', category: 'logic', instructions: 'იპოვე კანონზომიერება და შეავსე გამოტოვებული ადგილი.' },
  { id: 'logic_pattern', title: 'კანონზომიერების ამოცნობა', category: 'logic', instructions: 'დააკვირდი სიმბოლოების ან რიცხვების განმეორებას.' },
  { id: 'logic_puzzle', title: 'ლოგიკური ამოცანები', category: 'logic', instructions: 'გააანალიზე მოკლე პირობა და აირჩიე სწორი დასკვნა.' },
  { id: 'logic_shape', title: 'ფიგურების შესაბამისობა', category: 'logic', instructions: 'შეადარე გეომეტრიული ფიგურების თვისებები.' },
  { id: 'logic_reason', title: 'მსჯელობის გამოწვევა', category: 'logic', instructions: 'გამოიყენე დედუქციური მსჯელობა სწორი პასუხის მისაღებად.' },

  // Attention
  { id: 'att_odd', title: 'იპოვე განსხვავებული', category: 'attention', instructions: 'სწრაფად იპოვე ერთადერთი განსხვავებული სიმბოლო ბადეში.' },
  { id: 'att_match', title: 'შესაბამისი სიმბოლოები', category: 'attention', instructions: 'ამოიცანი მითითებული სამიზნე სიმბოლო მსგავს ფორმებს შორის.' },
  { id: 'att_reaction', title: 'რეაქციის დროის ტესტი', category: 'attention', instructions: 'დაელოდე მწვანე ფერს და დააჭირე რაც შეიძლება სწრაფად.' },
  { id: 'att_search', title: 'ვიზუალური ძებნა', category: 'attention', instructions: 'იპოვე სამიზნე სიმბოლო ფართო ბადეში.' },
  { id: 'att_focus', title: 'კონცენტრაციის გამოწვევა', category: 'attention', instructions: 'აირჩიე ტექსტის რეალური ფერი და არ დაიბნე სიტყვის მნიშვნელობით.' },

  // Motor
  { id: 'motor_moving', title: 'მოძრავი სამიზნეები', category: 'motor', instructions: 'შეეხე მოძრავ წრეს 15 წამის განმავლობაში რაც შეიძლება მეტჯერ.' },
  { id: 'motor_follow', title: 'მიჰყევი მოძრავ ობიექტს', category: 'motor', instructions: 'დააჭირე და გაჰყევი მოძრავ წრეს შეუჩერებლად.' },
  { id: 'motor_drag', title: 'გადაათრიე სწორ ადგილას', category: 'motor', instructions: 'გადაიტანე თითოეული ფიგურა მის შესაბამის ზონაში.' },
  { id: 'motor_trace', title: 'ფიგურების შემოხაზვა', category: 'motor', instructions: 'შემოხაზე წყვეტილი წრე ზუსტად და შეამოწმე ხაზის სიზუსტე.' },
  { id: 'motor_timed', title: 'ხელისა და თვალის კოორდინაცია', category: 'motor', instructions: 'სწრაფად შეეხე რიცხვებს 1-დან 9-მდე თანმიმდევრობით.' },
];

const CATEGORY_LABELS: Record<BrainCategory, string> = {
  memory: 'მეხსიერება',
  logic: 'ლოგიკა',
  attention: 'ყურადღება',
  motor: 'მოტორიკა',
};

const DIFF_LABELS: Record<DifficultyLevel, string> = {
  easy: 'მარტივი',
  medium: 'საშუალო',
  hard: 'რთული',
};

export const BrainTrainingModule: React.FC<BrainTrainingModuleProps> = ({
  gameScores,
  soundEnabled,
  onRecordScore,
}) => {
  const [category, setCategory] = useState<BrainCategory>('memory');
  const [activeGame, setActiveGame] = useState<GameCatalogItem | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  const [playState, setPlayState] = useState<'ready' | 'playing' | 'result'>('ready');
  const [runKey, setRunKey] = useState(0);
  const [lastResult, setLastResult] = useState<{ score: number; accuracy?: number } | null>(null);

  const gamesInCat = useMemo(
    () => GAME_CATALOG.filter((g) => g.category === category),
    [category]
  );

  const getPersonalBest = (gameId: string) => {
    const scores = gameScores.filter((s) => s.gameId === gameId).map((s) => s.score);
    return scores.length > 0 ? Math.max(...scores) : 0;
  };

  const handleGameFinish = (score: number, accuracy?: number) => {
    if (!activeGame) return;
    setLastResult({ score, accuracy });
    setPlayState('result');
    onRecordScore({
      id: `gs_${Date.now()}`,
      gameId: activeGame.id,
      gameTitle: activeGame.title,
      category: activeGame.category,
      difficulty,
      score,
      accuracy,
      playedAt: new Date().toISOString(),
    });
  };

  if (activeGame) {
    const best = getPersonalBest(activeGame.id);
    const history = gameScores
      .filter((s) => s.gameId === activeGame.id)
      .slice(-5)
      .reverse();

    return (
      <div className="space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setActiveGame(null);
              setPlayState('ready');
            }}
            className="min-h-[44px] w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-center"
          >
            ყველა თამაშზე დაბრუნება
          </button>

          <div className="grid grid-cols-3 sm:flex items-center gap-2">
            {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((d) => (
              <button
                key={d}
                type="button"
                disabled={playState === 'playing'}
                onClick={() => setDifficulty(d)}
                className={`min-h-[44px] px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                  difficulty === d
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-white dark:bg-[#0E1730] border-slate-200 dark:border-slate-800'
                }`}
              >
                {DIFF_LABELS[d]}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 min-[360px]:p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">
                {CATEGORY_LABELS[activeGame.category]} · {DIFF_LABELS[difficulty]}
              </div>
              <h2 className="text-fluid-title font-bold text-slate-900 dark:text-white break-words">
                {activeGame.title}
              </h2>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0">
              <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
              <span>პირადი რეკორდი: <strong className="font-mono-num text-slate-900 dark:text-white">{best}</strong></span>
            </div>
          </div>

          {playState === 'ready' && (
            <div className="py-6 space-y-4 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                {activeGame.instructions}
              </p>
              <button
                type="button"
                onClick={() => {
                  setRunKey((k) => k + 1);
                  setPlayState('playing');
                }}
                className="min-h-[48px] w-full min-[400px]:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm inline-flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 shrink-0" />
                <span>თამაშის დაწყება</span>
              </button>
            </div>
          )}

          {playState === 'playing' && (
            <div key={runKey} className="pt-2">
              {activeGame.category === 'memory' && (
                <MemoryGames
                  gameId={activeGame.id as 'num_seq'}
                  difficulty={difficulty}
                  soundEnabled={soundEnabled}
                  onFinish={handleGameFinish}
                />
              )}
              {(activeGame.category === 'logic' || activeGame.category === 'attention') && (
                <LogicAndAttentionGames
                  gameId={activeGame.id as 'logic_seq'}
                  difficulty={difficulty}
                  soundEnabled={soundEnabled}
                  onFinish={handleGameFinish}
                />
              )}
              {activeGame.category === 'motor' && (
                <MotorGames
                  gameId={activeGame.id as 'motor_moving'}
                  difficulty={difficulty}
                  soundEnabled={soundEnabled}
                  onFinish={handleGameFinish}
                />
              )}
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setRunKey((k) => k + 1)}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>თავიდან დაწყება</span>
                </button>
              </div>
            </div>
          )}

          {playState === 'result' && lastResult && (
            <div className="py-6 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-500">
                <Award className="w-8 h-8" />
              </div>
              <div className="text-3xl font-bold font-mono-num text-slate-900 dark:text-white">
                {lastResult.score} ქულა
              </div>
              {lastResult.accuracy !== undefined && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  სიზუსტე: {lastResult.accuracy}% · პირადი რეკორდი: {Math.max(best, lastResult.score)}
                </div>
              )}
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRunKey((k) => k + 1);
                    setPlayState('playing');
                  }}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>კიდევ თამაში</span>
                </button>
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                ბოლო შედეგების ისტორია:
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs tabular-nums"
                  >
                    <strong>{h.score}</strong> ({DIFF_LABELS[h.difficulty]})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-fluid-title font-bold text-slate-900 dark:text-white flex items-start sm:items-center gap-2.5">
          <Brain className="w-6 h-6 text-cyan-500 shrink-0 mt-0.5 sm:mt-0" />
          <span>ტვინის ვარჯიში — მეხსიერება, ლოგიკა, ყურადღება და მოტორიკა</span>
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          22 ინტერაქტიული თამაში სირთულის დონეებითა და პირადი რეკორდების შენახვით.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
        {(['memory', 'logic', 'attention', 'motor'] as BrainCategory[]).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`min-h-[44px] px-3 sm:px-4 py-2 rounded-xl border text-xs font-semibold transition-colors ${
              category === cat
                ? 'bg-cyan-600 border-cyan-500 text-white'
                : 'bg-white dark:bg-[#0E1730] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {gamesInCat.map((game) => {
          const best = getPersonalBest(game.id);
          return (
            <div
              key={game.id}
              className="rounded-2xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 sm:p-5 flex flex-col justify-between gap-4 min-w-0"
            >
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                  <span>{CATEGORY_LABELS[game.category]}</span>
                  <span className="font-mono-num">რეკორდი: {best}</span>
                </div>
                <h2 className="font-bold text-base text-slate-900 dark:text-white break-words">
                  {game.title}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed break-words">
                  {game.instructions}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveGame(game);
                  setPlayState('ready');
                  setLastResult(null);
                }}
                className="min-h-[44px] w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 shrink-0" />
                <span>თამაში</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
