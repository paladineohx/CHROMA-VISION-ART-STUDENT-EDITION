/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Timer, RotateCcw, Play, Info, CheckCircle2, XCircle } from 'lucide-react';

// --- Types ---
type GameStatus = 'idle' | 'playing' | 'gameover';

interface Color {
  h: number;
  s: number;
  l: number;
}

// --- Constants ---
const GRID_SIZE = 5;
const INITIAL_TIME = 30;
const INITIAL_DIFF = 20; // Initial lightness difference in %
const MIN_DIFF = 1.5; // Minimum lightness difference

export default function App() {
  const [status, setStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [level, setLevel] = useState(1);
  const [baseColor, setBaseColor] = useState<Color>({ h: 0, s: 0, l: 0 });
  const [diffIndex, setDiffIndex] = useState(-1);
  const [diffColor, setDiffColor] = useState<Color>({ h: 0, s: 0, l: 0 });
  const [showExplanation, setShowExplanation] = useState(false);
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Helpers ---
  const generateLevel = useCallback(() => {
    const h = Math.floor(Math.random() * 360);
    const s = 40 + Math.floor(Math.random() * 40); // 40-80% saturation
    const l = 30 + Math.floor(Math.random() * 40); // 30-70% lightness

    // Difficulty scaling: diff decreases as level increases
    // Using a logarithmic-like decay for a smooth challenge curve
    const currentDiff = Math.max(MIN_DIFF, INITIAL_DIFF / Math.pow(level, 0.4));
    
    const isLighter = Math.random() > 0.5;
    const dl = isLighter ? currentDiff : -currentDiff;

    setBaseColor({ h, s, l });
    setDiffColor({ h, s, l: l + dl });
    setDiffIndex(Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE)));
  }, [level]);

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setTimeLeft(INITIAL_TIME);
    setStatus('playing');
    setLastResult(null);
    generateLevel();
  };

  const handleBlockClick = (index: number) => {
    if (status !== 'playing') return;

    if (index === diffIndex) {
      setScore(s => s + 1);
      setLevel(l => l + 1);
      setTimeLeft(t => Math.min(INITIAL_TIME, t + 2)); // Bonus time
      setLastResult('correct');
      generateLevel();
    } else {
      setTimeLeft(t => Math.max(0, t - 3)); // Penalty
      setLastResult('wrong');
    }

    // Reset result indicator after a short delay
    setTimeout(() => setLastResult(null), 500);
  };

  // --- Effects ---
  useEffect(() => {
    if (status === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            setStatus('gameover');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, timeLeft]);

  const colorToCss = (c: Color) => `hsl(${c.h}, ${c.s}%, ${c.l}%)`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-zinc-50">
      {/* Header */}
      <header className="w-full max-w-md mb-8 flex flex-col items-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold tracking-tighter text-zinc-900 mb-2"
        >
          CHROMA VISION
        </motion.h1>
        <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">
          Art Student Edition
        </p>
      </header>

      {/* Main Game Area */}
      <main className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-zinc-200/50 border border-zinc-100 p-6 relative overflow-hidden">
        
        {/* Stats Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-zinc-100 rounded-xl">
              <Trophy className="w-5 h-5 text-zinc-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-400 leading-none mb-1">Score</p>
              <p className="text-xl font-mono font-bold text-zinc-800">{score}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl transition-colors ${timeLeft < 10 ? 'bg-red-100' : 'bg-zinc-100'}`}>
              <Timer className={`w-5 h-5 ${timeLeft < 10 ? 'text-red-600' : 'text-zinc-600'}`} />
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-zinc-400 leading-none mb-1">Time</p>
              <p className={`text-xl font-mono font-bold ${timeLeft < 10 ? 'text-red-600' : 'text-zinc-800'}`}>
                {timeLeft}s
              </p>
            </div>
          </div>
        </div>

        {/* Game Content */}
        <div className="relative aspect-square w-full">
          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.div 
                key="idle"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-4"
              >
                <div className="w-20 h-20 bg-emerald-500 rounded-2xl mb-6 flex items-center justify-center shadow-lg shadow-emerald-200">
                  <Play className="w-10 h-10 text-white fill-current" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-800 mb-2">Ready to test?</h2>
                <p className="text-zinc-500 text-sm mb-8 max-w-[240px]">
                  Find the block with the slightly different shade. It gets harder every level.
                </p>
                <button 
                  onClick={startGame}
                  className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-zinc-200"
                >
                  START CHALLENGE
                </button>
              </motion.div>
            )}

            {status === 'playing' && (
              <motion.div 
                key="playing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-5 gap-2 w-full h-full"
              >
                {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
                  <motion.button
                    key={`${level}-${i}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleBlockClick(i)}
                    className="w-full h-full rounded-lg shadow-sm cursor-pointer"
                    style={{ 
                      backgroundColor: i === diffIndex ? colorToCss(diffColor) : colorToCss(baseColor) 
                    }}
                  />
                ))}
              </motion.div>
            )}

            {status === 'gameover' && (
              <motion.div 
                key="gameover"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-white/90 backdrop-blur-sm z-10"
              >
                <div className="mb-6">
                  <p className="text-zinc-400 uppercase font-bold tracking-widest text-xs mb-2">Final Score</p>
                  <h2 className="text-7xl font-bold text-zinc-900">{score}</h2>
                </div>
                
                <div className="flex flex-col gap-3 w-full">
                  <button 
                    onClick={startGame}
                    className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all active:scale-95"
                  >
                    <RotateCcw className="w-5 h-5" />
                    TRY AGAIN
                  </button>
                  <button 
                    onClick={() => setShowExplanation(true)}
                    className="w-full py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all"
                  >
                    <Info className="w-5 h-5" />
                    WHY IS THIS HARD?
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feedback Indicators */}
          <AnimatePresence>
            {lastResult === 'correct' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1.2 }}
                exit={{ opacity: 0, scale: 1.5 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
              >
                <CheckCircle2 className="w-24 h-24 text-emerald-500/80" />
              </motion.div>
            )}
            {lastResult === 'wrong' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1.2 }}
                exit={{ opacity: 0, scale: 1.5 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
              >
                <XCircle className="w-24 h-24 text-red-500/80" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Level Progress Bar */}
        {status === 'playing' && (
          <div className="mt-6 w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-zinc-900"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (level / 50) * 100)}%` }}
            />
          </div>
        )}
      </main>

      {/* Explanation Modal */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowExplanation(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">Color Sensitivity</h3>
              <div className="space-y-4 text-zinc-600 text-sm leading-relaxed">
                <p>
                  Human eyes perceive colors through <strong>cones</strong>. For art students, training these receptors to detect subtle <strong>Just Noticeable Differences (JND)</strong> is crucial.
                </p>
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <p className="font-bold text-zinc-800 mb-2">The Challenge:</p>
                  <p>As you progress, the lightness difference (ΔL) drops from 20% to as low as 1.5%. This pushes your visual processing to its limits.</p>
                </div>
                <p>
                  Factors like screen brightness, ambient light, and even your fatigue level can affect your performance.
                </p>
              </div>
              <button 
                onClick={() => setShowExplanation(false)}
                className="w-full mt-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold"
              >
                GOT IT
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-8 text-zinc-400 text-[10px] uppercase font-bold tracking-widest text-center">
        <p>© 2026 Chroma Vision Lab</p>
        <p className="mt-1">Designed for Precision</p>
      </footer>
    </div>
  );
}
