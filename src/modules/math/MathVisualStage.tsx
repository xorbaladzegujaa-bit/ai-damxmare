import React, { useState } from 'react';

interface MathVisualStageProps {
  type:
    | 'counting'
    | 'number_line'
    | 'addition'
    | 'subtraction'
    | 'multiplication'
    | 'division'
    | 'fraction'
    | 'coordinate'
    | 'geometry';
  a: number;
  b: number;
  caption: string;
}

export const MathVisualStage: React.FC<MathVisualStageProps> = ({ type, a, b, caption }) => {
  const [tappedCount, setTappedCount] = useState(0);

  if (type === 'counting') {
    const count = Math.min(12, Math.max(1, a));
    return (
      <div className="rounded-2xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex flex-wrap items-center gap-2.5 mb-3">
          {Array.from({ length: count }, (_, idx) => {
            const active = idx < tappedCount;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setTappedCount(idx + 1)}
                className={`w-11 h-11 rounded-full font-bold text-sm tabular-nums transition-transform active:scale-95 border ${
                  active
                    ? 'bg-cyan-500 border-cyan-400 text-white'
                    : 'bg-blue-500/20 border-blue-500/40 text-blue-600 dark:text-cyan-300'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          {caption} {tappedCount > 0 ? `· დათვლილია: ${tappedCount}` : '· შეეხე წრეებს დასათვლელად'}
        </p>
      </div>
    );
  }

  if (type === 'number_line') {
    const min = Math.min(0, a, b) - 1;
    const max = Math.max(10, a, b) + 1;
    const ticks: number[] = [];
    const step = max - min > 16 ? Math.ceil((max - min) / 10) : 1;
    for (let v = min; v <= max; v += step) ticks.push(v);

    return (
      <div className="rounded-2xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4">
        <div className="w-full overflow-x-auto no-scrollbar pb-2">
          <div className="min-w-[240px] flex items-center justify-between gap-1 border-b-2 border-slate-300 dark:border-slate-700 pb-2 pt-3 px-1 sm:px-2">
            {ticks.map((val) => {
              const isStart = val === a;
              const isEnd = val === b;
              return (
                <div key={val} className="flex flex-col items-center gap-1 min-w-0">
                  <div
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                      isEnd
                        ? 'bg-emerald-500 ring-4 ring-emerald-500/25'
                        : isStart
                        ? 'bg-cyan-500 ring-4 ring-cyan-500/25'
                        : 'bg-slate-400 dark:bg-slate-600'
                    }`}
                  />
                  <span className="text-[11px] sm:text-xs font-mono-num text-slate-700 dark:text-slate-300">
                    {val}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">{caption}</p>
      </div>
    );
  }

  if (type === 'addition' || type === 'subtraction') {
    const first = Math.min(10, Math.max(1, a));
    const second = Math.min(10, Math.max(1, b));
    return (
      <div className="rounded-2xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: first }, (_, idx) => (
              <span
                key={`a_${idx}`}
                className={`w-6 h-6 rounded-md ${
                  type === 'subtraction' && idx >= Math.max(0, first - second)
                    ? 'bg-red-500/30 border border-red-400/50 line-through'
                    : 'bg-blue-500/80'
                }`}
              />
            ))}
          </div>
          {type === 'addition' && (
            <>
              <span className="font-bold text-slate-500 px-1">+</span>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: second }, (_, idx) => (
                  <span key={`b_${idx}`} className="w-6 h-6 rounded-md bg-emerald-500/80" />
                ))}
              </div>
            </>
          )}
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300">{caption}</p>
      </div>
    );
  }

  if (type === 'multiplication') {
    const rows = Math.min(6, Math.max(1, a));
    const cols = Math.min(8, Math.max(1, b));
    return (
      <div className="rounded-2xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <div className="space-y-1.5">
          {Array.from({ length: rows }, (_, r) => (
            <div key={r} className="flex items-center gap-1.5">
              {Array.from({ length: cols }, (_, c) => (
                <span key={c} className="w-4 h-4 rounded-full bg-purple-500/80" />
              ))}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300">{caption}</p>
      </div>
    );
  }

  if (type === 'division') {
    const groups = Math.min(6, Math.max(2, b));
    const perGroup = Math.max(1, Math.floor(a / groups));
    return (
      <div className="rounded-2xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: groups }, (_, g) => (
            <div
              key={g}
              className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-2 flex gap-1.5"
            >
              {Array.from({ length: perGroup }, (_, i) => (
                <span key={i} className="w-3.5 h-3.5 rounded-full bg-cyan-500" />
              ))}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300">{caption}</p>
      </div>
    );
  }

  if (type === 'fraction') {
    const parts = Math.min(10, Math.max(2, b > 10 ? 10 : b));
    const filled = b > 10 ? Math.round((a / b) * 10) : Math.min(parts, a);
    return (
      <div className="rounded-2xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${parts}, minmax(0, 1fr))` }}>
          {Array.from({ length: parts }, (_, idx) => (
            <div
              key={idx}
              className={`h-8 rounded-md border ${
                idx < filled
                  ? 'bg-emerald-500/80 border-emerald-400'
                  : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300">{caption}</p>
      </div>
    );
  }

  if (type === 'geometry') {
    return (
      <div className="rounded-2xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <div className="flex flex-col min-[380px]:flex-row min-[380px]:items-center gap-3 sm:gap-4">
          <div className="w-28 sm:w-32 h-20 rounded-lg border-2 border-cyan-500 bg-cyan-500/15 flex items-center justify-center text-xs font-mono-num text-cyan-600 dark:text-cyan-300 shrink-0">
            {a} × {b} = {a * b}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <div>სიგრძე = {a} სმ</div>
            <div>სიგანე = {b} სმ</div>
            <div>პერიმეტრი = {2 * (a + b)} სმ</div>
          </div>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300">{caption}</p>
      </div>
    );
  }

  // Coordinate graph
  const px = Math.min(5, Math.max(0, a));
  const py = Math.min(5, Math.max(0, b));
  return (
    <div className="rounded-2xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-800 p-4 space-y-2">
      <svg viewBox="0 0 180 140" className="w-full max-w-[240px] h-auto">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={i}>
            <line x1={25 + i * 25} y1={15} x2={25 + i * 25} y2={115} stroke="currentColor" className="text-slate-300 dark:text-slate-800" strokeWidth="1" />
            <line x1={25} y1={115 - i * 20} x2={155} y2={115 - i * 20} stroke="currentColor" className="text-slate-300 dark:text-slate-800" strokeWidth="1" />
          </g>
        ))}
        <line x1={25} y1={115} x2={160} y2={115} stroke="#38BDF8" strokeWidth="2" />
        <line x1={25} y1={115} x2={25} y2={10} stroke="#38BDF8" strokeWidth="2" />
        <circle cx={25 + px * 25} cy={115 - py * 20} r="5" fill="#10B981" />
        <text x={32 + px * 25} y={112 - py * 20} fontSize="10" fill="#10B981">
          ({px}, {py})
        </text>
      </svg>
      <p className="text-xs text-slate-600 dark:text-slate-300">{caption}</p>
    </div>
  );
};
