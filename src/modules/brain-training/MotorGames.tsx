import React, { useEffect, useRef, useState } from 'react';
import { DifficultyLevel } from '../../types/app';
import { playErrorChime, playSuccessChime } from '../../services/speechAndSound';

interface MotorGamesProps {
  gameId: 'motor_moving' | 'motor_follow' | 'motor_drag' | 'motor_trace' | 'motor_timed';
  difficulty: DifficultyLevel;
  soundEnabled: boolean;
  onFinish: (score: number, accuracy?: number) => void;
}

export const MotorGames: React.FC<MotorGamesProps> = ({
  gameId,
  difficulty,
  soundEnabled,
  onFinish,
}) => {
  // 1. Tap moving targets
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);

  // 2. Follow moving object
  const [followPos, setFollowPos] = useState({ x: 50, y: 50 });
  const [trackingScore, setTrackingScore] = useState(0);
  const [isTracking, setIsTracking] = useState(false);

  // 3. Drag objects into positions
  const dragItems = [
    { id: 'circle', label: 'წრე ●', zone: 'zone_a' },
    { id: 'square', label: 'კვადრატი ■', zone: 'zone_b' },
    { id: 'triangle', label: 'სამკუთხედი ▲', zone: 'zone_c' },
  ];
  const [placed, setPlaced] = useState<Record<string, boolean>>({});
  const [selectedDragId, setSelectedDragId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPointerPos, setDragPointerPos] = useState<{ x: number; y: number } | null>(null);

  // 4. Trace simple shapes on Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [tracePoints, setTracePoints] = useState<{ x: number; y: number }[]>([]);

  // 5. Timed sequence tapping (1..9)
  const [nextNum, setNextNum] = useState(1);
  const [numPositions] = useState<number[]>(() =>
    [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5)
  );
  const startTimeRef = useRef<number>(Date.now());

  // Moving targets timer & movement
  useEffect(() => {
    if (gameId !== 'motor_moving') return;
    const speedMs = difficulty === 'easy' ? 1400 : difficulty === 'medium' ? 1050 : 750;
    const moveTimer = setInterval(() => {
      setTargetPos({
        x: 12 + Math.random() * 76,
        y: 14 + Math.random() * 72,
      });
    }, speedMs);
    const countdown = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(moveTimer);
          clearInterval(countdown);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      clearInterval(moveTimer);
      clearInterval(countdown);
    };
  }, [gameId, difficulty]);

  useEffect(() => {
    if (gameId === 'motor_moving' && timeLeft === 0) {
      const total = hits + misses;
      const acc = total > 0 ? Math.round((hits / total) * 100) : 0;
      const score = Math.min(100, Math.round(hits * 7 + acc * 0.3));
      onFinish(score, acc);
    }
  }, [gameId, timeLeft]);

  // Follow moving object animation
  useEffect(() => {
    if (gameId !== 'motor_follow') return;
    let angle = 0;
    const speed = difficulty === 'easy' ? 0.04 : difficulty === 'medium' ? 0.065 : 0.09;
    const anim = setInterval(() => {
      angle += speed;
      setFollowPos({
        x: 50 + Math.cos(angle) * 34,
        y: 50 + Math.sin(angle * 1.4) * 32,
      });
    }, 30);

    const countdown = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(anim);
          clearInterval(countdown);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      clearInterval(anim);
      clearInterval(countdown);
    };
  }, [gameId, difficulty]);

  useEffect(() => {
    if (gameId === 'motor_follow' && timeLeft === 0) {
      const finalScore = Math.min(100, Math.round(trackingScore));
      onFinish(finalScore, finalScore);
    }
  }, [gameId, timeLeft]);

  // Draw guide shape on canvas for motor_trace
  useEffect(() => {
    if (gameId !== 'motor_trace' || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 300, 220);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 10;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(150, 110, 72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [gameId]);

  if (gameId === 'motor_moving') {
    const targetSize = difficulty === 'easy' ? 56 : difficulty === 'medium' ? 48 : 44;
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>დარჩა დრო: <strong className="font-mono-num">{timeLeft} წმ</strong></span>
          <span>მოხვედრა: <strong className="font-mono-num text-emerald-500">{hits}</strong></span>
        </div>
        <div
          onClick={() => setMisses((m) => m + 1)}
          className="relative w-full h-64 rounded-2xl bg-slate-100 dark:bg-[#070D1F] border border-slate-300 dark:border-slate-700 overflow-hidden cursor-crosshair select-none"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setHits((h) => h + 1);
              playSuccessChime(soundEnabled);
              setTargetPos({
                x: 12 + Math.random() * 76,
                y: 14 + Math.random() * 72,
              });
            }}
            style={{
              left: `${targetPos.x}%`,
              top: `${targetPos.y}%`,
              width: targetSize,
              height: targetSize,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg border-2 border-white"
            aria-label="სამიზნე"
          />
        </div>
      </div>
    );
  }

  if (gameId === 'motor_follow') {
    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isTracking) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;
      const dist = Math.hypot(px - followPos.x, py - followPos.y);
      if (dist <= 14) {
        setTrackingScore((s) => Math.min(100, s + 0.9));
      }
    };

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>დრო: <strong className="font-mono-num">{timeLeft} წმ</strong></span>
          <span>სიზუსტე: <strong className="font-mono-num text-cyan-500">{Math.round(trackingScore)}%</strong></span>
        </div>
        <div
          onPointerDown={() => setIsTracking(true)}
          onPointerUp={() => setIsTracking(false)}
          onPointerLeave={() => setIsTracking(false)}
          onPointerMove={handlePointerMove}
          className="relative w-full h-64 rounded-2xl bg-slate-100 dark:bg-[#070D1F] border border-slate-300 dark:border-slate-700 overflow-hidden touch-none select-none"
        >
          <div className="absolute inset-x-0 top-2 text-center text-[11px] text-slate-500">
            დააჭირე და გაჰყევი მოძრავ წრეს თითით ან მაუსით
          </div>
          <div
            style={{
              left: `${followPos.x}%`,
              top: `${followPos.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className={`absolute w-12 h-12 rounded-full transition-colors ${
              isTracking ? 'bg-emerald-500 ring-4 ring-emerald-400/40' : 'bg-blue-600'
            }`}
          />
        </div>
      </div>
    );
  }

  if (gameId === 'motor_drag') {
    const placeIntoZone = (zoneId: string, itemId = selectedDragId) => {
      if (!itemId) return;
      const item = dragItems.find((d) => d.id === itemId);
      if (!item) return;
      if (item.zone === zoneId) {
        playSuccessChime(soundEnabled);
        const next = { ...placed, [item.id]: true };
        setPlaced(next);
        setSelectedDragId(null);
        if (Object.keys(next).length === dragItems.length) {
          onFinish(100, 100);
        }
      } else {
        playErrorChime(soundEnabled);
      }
    };

    const draggedItem = dragItems.find((d) => d.id === draggingId);

    return (
      <div
        className="space-y-5 relative select-none"
        onPointerMove={(e) => {
          if (!draggingId) return;
          setDragPointerPos({ x: e.clientX, y: e.clientY });
        }}
        onPointerUp={(e) => {
          if (!draggingId) return;
          const hitEl = document.elementFromPoint(e.clientX, e.clientY);
          const zoneEl = hitEl?.closest('[data-drop-zone]');
          const zoneId = zoneEl?.getAttribute('data-drop-zone');
          if (zoneId) {
            placeIntoZone(zoneId, draggingId);
          }
          setDraggingId(null);
          setDragPointerPos(null);
        }}
        onPointerCancel={() => {
          setDraggingId(null);
          setDragPointerPos(null);
        }}
      >
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          გადაათრიე თითით/მაუსით ან შეეხე ფიგურას და შემდეგ სწორ ზონას
        </p>

        <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3">
          {dragItems.map((item) => {
            if (placed[item.id]) return null;
            const active = selectedDragId === item.id || draggingId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                draggable
                onDragStart={() => setSelectedDragId(item.id)}
                onPointerDown={(e) => {
                  setSelectedDragId(item.id);
                  setDraggingId(item.id);
                  setDragPointerPos({ x: e.clientX, y: e.clientY });
                }}
                onClick={() => setSelectedDragId(item.id)}
                className={`min-h-[48px] px-4 py-2 rounded-xl border text-sm font-semibold cursor-grab touch-none ${
                  active
                    ? 'bg-blue-600 border-blue-400 text-white'
                    : 'bg-slate-50 dark:bg-[#070D1F] border-slate-300 dark:border-slate-700'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-2.5 sm:gap-3">
          {dragItems.map((item) => (
            <button
              key={item.zone}
              type="button"
              data-drop-zone={item.zone}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => placeIntoZone(item.zone)}
              onClick={() => placeIntoZone(item.zone)}
              className={`min-h-[72px] sm:h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center px-2 text-xs font-semibold transition-colors ${
                placed[item.id]
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500'
                  : draggingId
                  ? 'border-cyan-400/70 bg-cyan-500/5 text-slate-600 dark:text-slate-300'
                  : 'border-slate-400 dark:border-slate-700 text-slate-500'
              }`}
            >
              <span>{item.label}</span>
              <span className="mt-1 text-[11px]">
                {placed[item.id] ? 'მოთავსებულია ✓' : 'ჩასვი აქ'}
              </span>
            </button>
          ))}
        </div>

        {draggedItem && dragPointerPos && (
          <div
            style={{ left: dragPointerPos.x, top: dragPointerPos.y, transform: 'translate(-50%, -120%)' }}
            className="fixed z-50 pointer-events-none px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-xl border border-cyan-300"
          >
            {draggedItem.label}
          </div>
        )}
      </div>
    );
  }

  if (gameId === 'motor_trace') {
    const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * 300,
        y: ((e.clientY - rect.top) / rect.height) * 220,
      };
    };

    const drawPt = (pt: { x: number; y: number }, prev?: { x: number; y: number }) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo((prev || pt).x, (prev || pt).y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    };

    const evaluateTrace = () => {
      if (tracePoints.length < 10) return;
      const distances = tracePoints.map((p) => Math.abs(Math.hypot(p.x - 150, p.y - 110) - 72));
      const avgErr = distances.reduce((a, b) => a + b, 0) / distances.length;
      const acc = Math.max(20, Math.min(100, Math.round(100 - avgErr * 2.2)));
      playSuccessChime(soundEnabled);
      onFinish(acc, acc);
    };

    return (
      <div className="space-y-4 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          შემოხაზე წრე წყვეტილ ხაზზე მაუსით ან თითით და დააჭირე შეფასებას
        </p>
        <canvas
          ref={canvasRef}
          width={300}
          height={220}
          onPointerDown={(e) => {
            setDrawing(true);
            const pt = getPos(e);
            setTracePoints([pt]);
          }}
          onPointerMove={(e) => {
            if (!drawing) return;
            const pt = getPos(e);
            setTracePoints((prev) => {
              drawPt(pt, prev[prev.length - 1]);
              return [...prev, pt];
            });
          }}
          onPointerUp={() => setDrawing(false)}
          className="mx-auto rounded-2xl bg-slate-50 dark:bg-[#070D1F] border border-slate-300 dark:border-slate-700 touch-none max-w-full"
        />
        <button
          type="button"
          disabled={tracePoints.length < 10}
          onClick={evaluateTrace}
          className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-600 disabled:opacity-40 text-white text-xs font-semibold"
        >
          სიზუსტის შეფასება
        </button>
      </div>
    );
  }

  // motor_timed: Sequential tapping 1..9
  const handleTapNumber = (n: number) => {
    if (n === nextNum) {
      playSuccessChime(soundEnabled);
      if (n === 9) {
        const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
        const score = Math.max(30, Math.min(100, Math.round(115 - elapsedSec * 4)));
        onFinish(score, 100);
      } else {
        setNextNum(n + 1);
      }
    } else {
      playErrorChime(soundEnabled);
    }
  };

  return (
    <div className="space-y-4 text-center">
      <div className="text-xs text-slate-500 dark:text-slate-400">
        სწრაფად შეეხე რიცხვებს თანმიმდევრობით 1-დან 9-მდე · შემდეგი: <strong className="text-cyan-500">{nextNum}</strong>
      </div>
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        {numPositions.map((n) => {
          const done = n < nextNum;
          return (
            <button
              key={n}
              type="button"
              disabled={done}
              onClick={() => handleTapNumber(n)}
              className={`min-h-[60px] rounded-2xl border font-bold text-xl tabular-nums transition-colors ${
                done
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-500'
                  : 'bg-slate-50 dark:bg-[#070D1F] border-slate-300 dark:border-slate-700 hover:border-cyan-400'
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
};
