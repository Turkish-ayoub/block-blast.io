import React, { useState } from 'react';
import { Trophy, RotateCcw, Crown, Sparkles, Loader2, Play } from 'lucide-react';
import { triggerMonetagVignette } from '../utils/audio';

interface GameOverModalProps {
  score: number;
  highScore: number;
  combos: number;
  linesClearedTotal: number;
  consecutiveContinues: number;
  onContinue: () => void;
  onReset: () => void;
}

export default function GameOverModal({
  score,
  highScore,
  combos,
  linesClearedTotal,
  consecutiveContinues,
  onContinue,
  onReset,
}: GameOverModalProps) {
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const isNewHighScore = score > 0 && score >= highScore;

  const adsRequired = consecutiveContinues + 1;

  const handleContinueClick = () => {
    setIsAdLoading(true);
    setCurrentAdIndex(1);

    // Sequential recursion loop to fire Monetag Vignette {adsRequired} times
    const triggerNextAd = (index: number) => {
      if (index <= adsRequired) {
        setCurrentAdIndex(index);
        triggerMonetagVignette(() => {
          triggerNextAd(index + 1);
        });
      } else {
        setIsAdLoading(false);
        setCurrentAdIndex(0);
        onContinue();
      }
    };

    triggerNextAd(1);
  };

  return (
    <div
      id="game-over-overlay"
      className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
    >
      <div
        id="game-over-card"
        className="bg-slate-900 border-2 border-slate-700/80 rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl relative overflow-hidden animate-scale-up"
      >
        {/* Retro scanlines effect */}
        <div className="absolute inset-0 bg-retro-scanlines pointer-events-none opacity-5"></div>

        {/* Ambient background glow */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-purple-600/20 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-600/20 rounded-full blur-2xl"></div>

        {isNewHighScore ? (
          <div className="relative mb-4 flex flex-col items-center">
            <div className="p-4 bg-amber-500/10 rounded-full border border-amber-500/20 mb-2 relative animate-bounce">
              <Crown className="w-12 h-12 text-amber-400" />
              <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-300 animate-pulse" />
            </div>
            <span className="text-xs uppercase tracking-widest text-amber-400 font-bold font-mono">
              New Record!
            </span>
          </div>
        ) : (
          <div className="relative mb-4 flex flex-col items-center">
            <div className="p-4 bg-slate-800 rounded-full border border-slate-700 mb-2">
              <Trophy className="w-12 h-12 text-slate-400" />
            </div>
            <span className="text-xs uppercase tracking-widest text-slate-400 font-mono">
              Game Over
            </span>
          </div>
        )}

        <h2 className="text-3xl font-extrabold text-white tracking-tight mb-6">
          {isNewHighScore ? "Incredible Job!" : "No More Moves"}
        </h2>

        {/* Score displays */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800">
            <div className="text-xs text-slate-400 mb-1 font-mono uppercase">Your Score</div>
            <div className="text-2xl font-black text-white">{score}</div>
          </div>
          <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800">
            <div className="text-xs text-slate-400 mb-1 font-mono uppercase">High Score</div>
            <div className="text-2xl font-black text-amber-400 flex items-center justify-center gap-1">
              <Crown className="w-4 h-4 text-amber-400 shrink-0" />
              {Math.max(score, highScore)}
            </div>
          </div>
        </div>

        {/* Stats List */}
        <div className="bg-slate-950/30 rounded-2xl p-4 border border-slate-800/80 mb-6 text-left space-y-3 font-mono text-sm text-slate-300">
          <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
            <span>Total Lines Cleared:</span>
            <span className="font-bold text-white">{linesClearedTotal}</span>
          </div>
          <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
            <span>Best Combo Multiplier:</span>
            <span className="font-bold text-emerald-400">
              {combos > 1 ? `${combos}X Combo` : '1X (None)'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Consecutive Continues:</span>
            <span className="font-bold text-purple-400">{consecutiveContinues}</span>
          </div>
        </div>

        {/* STACKED BUTTON CONTROLS */}
        <div className="flex flex-col gap-3">
          {/* Top Button (Primary CTA): Continue Game (Watch {X} Ads) */}
          <button
            id="continue-ad-btn"
            onClick={handleContinueClick}
            disabled={isAdLoading}
            className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-white font-extrabold rounded-2xl shadow-lg shadow-orange-950/30 transform active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-80"
          >
            {isAdLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Watching Ad ({currentAdIndex}/{adsRequired})...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" />
                <span className="text-base font-bold">
                  Continue Game (Watch {adsRequired} {adsRequired === 1 ? 'Ad' : 'Ads'})
                </span>
              </>
            )}
          </button>

          {/* Bottom Button (Secondary CTA): Restart from Scratch */}
          <button
            id="restart-scratch-btn"
            onClick={onReset}
            disabled={isAdLoading}
            className="w-full py-3.5 px-6 bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white font-semibold rounded-2xl border border-slate-700/60 shadow-md transform active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm">Restart from Scratch</span>
          </button>
        </div>
      </div>
    </div>
  );
}
