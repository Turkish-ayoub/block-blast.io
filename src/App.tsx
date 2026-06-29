import React, { useState, useEffect, useRef } from 'react';
import { Crown, HelpCircle, Trophy, Sparkles, X, RotateCcw } from 'lucide-react';
import { Shape, GridMatrix, DraggedPiece, BlockColor } from './types';
import { getRandomShape, canPlaceShape, COLOR_MAP } from './utils/shapes';
import { 
  playGrabSound, 
  playDropSound, 
  playClearSound, 
  playGameOverSound, 
  playTriumphantSound 
} from './utils/audio';
import SoundToggle from './components/SoundToggle';
import GameOverModal from './components/GameOverModal';
import ShapeItem from './components/ShapeItem';

interface FloatingText {
  id: string;
  text: string;
  color: string;
  rotation: number;
}

const arcadeHooks = [
  "UNSTOPPABLE!", "ABSOLUTE GENIUS!", "BOOM! CLEAN SWEEP!", "PURE DOPAMINE!", 
  "MIND-BLOWING MOVE!", "YOU'RE A NATURAL!", "CAN ANYONE STOP YOU?", "GOD MODE ACTIVATED!", 
  "ELITE PLACEMENT!", "PRECISION PERFECT!", "THE BOARD IS AFRAID OF YOU!", "INSANE COMBO!", 
  "BREAKING RECORDS!", "LEGENDARY BLAST!", "FLAWLESS EXECUTION!", "TOTAL DOMINATION!", 
  "YOU'RE ON FIRE!", "SMASHING IT!", "UNBELIEVABLE SKILL!", "KEEP THE STREAK ALIVE!", 
  "MASTERCLASS!", "PURE PERFECTION!", "JAW-DROPPING MOVE!", "TOO GOOD!", 
  "UNMATCHED FOCUS!", "NEXT LEVEL!", "CRAZY SKILLS!", "TACTICAL BEAST!", 
  "BLOCK MASTER!", "PHENOMENAL!"
];

export default function App() {
  // Game states
  const [board, setBoard] = useState<GridMatrix>(() => 
    Array(8).fill(null).map(() => Array(8).fill(null))
  );
  const [activeShapes, setActiveShapes] = useState<(Shape | null)[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [linesClearedTotal, setLinesClearedTotal] = useState(0);
  const [combos, setCombos] = useState(1);
  const [streak, setStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [consecutiveContinues, setConsecutiveContinues] = useState(0);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  const triggerFloatingPhrase = () => {
    const phrase = arcadeHooks[Math.floor(Math.random() * arcadeHooks.length)];
    const colors = [
      '#FFBF00', // Neon Amber
      '#39ff14', // Lime Green
      '#00f3ff'  // Cyan
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const id = `float_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const rotation = (Math.random() * 10) - 5; // -5 to 5 degrees

    const newText: FloatingText = { id, text: phrase, color, rotation };
    setFloatingTexts((prev) => [...prev, newText]);
useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('pointerdown', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0,
        buttons: 1
      });
      window.dispatchEvent(mouseEvent);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('pointermove', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        buttons: 1
      });
      window.dispatchEvent(mouseEvent);
      if (e.cancelable) e.preventDefault();
    };

    const handleTouchEnd = () => {
      const mouseEvent = new MouseEvent('pointerup', {
        button: 0,
        buttons: 0
      });
      window.dispatchEvent(mouseEvent);
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((t) => t.id !== id));
    }, 750);
  };

  // Drag states
  const [draggedPiece, setDraggedPiece] = useState<DraggedPiece | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const [boardCellSize, setBoardCellSize] = useState(40);
  const [isClearingCells, setIsClearingCells] = useState<Record<string, boolean>>({});

  // Refs
  const boardRef = useRef<HTMLDivElement>(null);

  // Load high score & initial pieces on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('block_blast_high_score');
      if (saved) {
        setHighScore(parseInt(saved, 10));
      }
    }
    // Generate 3 initial shapes
    setActiveShapes([getRandomShape(), getRandomShape(), getRandomShape()]);
  }, []);

  // Listen to window size to adapt absolute floating cell sizes precisely
  useEffect(() => {
    const handleResize = () => {
      if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        setBoardCellSize(rect.width / 8);
      }
    };

    handleResize(); // Initial call
    window.addEventListener('resize', handleResize);
    
    // Add small delay to allow DOM to settle fully
    const timer = setTimeout(handleResize, 150);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [board]);

  // Pointer move/up global listeners for drag-and-drop
  useEffect(() => {
    if (!draggedPiece) return;

    const handlePointerMove = (e: PointerEvent) => {
      setDraggedPiece((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          clientX: e.clientX,
          clientY: e.clientY,
        };
      });

      // Compute board landing coordinates
      updateBoardHover(e.clientX, e.clientY, draggedPiece.shape);
    };

    const handlePointerUp = (e: PointerEvent) => {
      handlePieceDrop(e.clientX, e.clientY);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [draggedPiece, board]);

  // Compute hovering target row and column on 8x8 matrix
  const updateBoardHover = (pointerX: number, pointerY: number, shape: Shape) => {
    const boardEl = boardRef.current;
    if (!boardEl) return;

    const rect = boardEl.getBoundingClientRect();
    const cellSize = rect.width / 8;

    // Detect if the user is dragging on a touchscreen device to offset the piece upwards
    const isTouchDevice = 
      typeof window !== 'undefined' && 
      ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    const verticalOffset = isTouchDevice ? 55 : 10;

    const floatWidth = shape.width * cellSize;
    const floatHeight = shape.height * cellSize;

    // Calculate top-left screen coordinate of the shape
    const floatLeft = pointerX - floatWidth / 2;
    const floatTop = pointerY - floatHeight / 2 - verticalOffset;

    // Snapping logic: convert screen coordinates to 0-7 matrix indexes
    const col = Math.round((floatLeft - rect.left) / cellSize);
    const row = Math.round((floatTop - rect.top) / cellSize);

    if (canPlaceShape(shape.grid, board, row, col)) {
      setHoveredRow(row);
      setHoveredCol(col);
    } else {
      setHoveredRow(null);
      setHoveredCol(null);
    }
  };

  // Handle pointer down on a slot item
  const handlePointerDown = (
    e: React.PointerEvent<any>,
    index: number,
    shape: any
  ) => {
    // Left mouse click or touch screen press
    if (e.button !== 0 && e.button !== undefined) return;

    playGrabSound();

    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    // Measure exact cell size from the board ref right away to sync scaling 1:1
    if (boardRef.current) {
      const bRect = boardRef.current.getBoundingClientRect();
      setBoardCellSize(bRect.width / 8);
    }

    setDraggedPiece({
      id: shape.id,
      shape,
      clientX,
      clientY,
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top,
      originalIndex: index,
      sourceRect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      },
    });
  };

  // Handle snapping shape onto board, resetting dock, and checking clears
  const handlePieceDrop = (pointerX: number, pointerY: number) => {
    if (!draggedPiece) return;

    const shape = draggedPiece.shape;
    const boardEl = boardRef.current;

    let placed = false;
    let targetRow = -1;
    let targetCol = -1;

    if (boardEl) {
      const rect = boardEl.getBoundingClientRect();
      const cellSize = rect.width / 8;

      const isTouchDevice = 
        typeof window !== 'undefined' && 
        ('ontouchstart' in window || navigator.maxTouchPoints > 0);
      const verticalOffset = isTouchDevice ? 55 : 10;

      const floatWidth = shape.width * cellSize;
      const floatHeight = shape.height * cellSize;
      const floatLeft = pointerX - floatWidth / 2;
      const floatTop = pointerY - floatHeight / 2 - verticalOffset;

      const col = Math.round((floatLeft - rect.left) / cellSize);
      const row = Math.round((floatTop - rect.top) / cellSize);

      if (canPlaceShape(shape.grid, board, row, col)) {
        placed = true;
        targetRow = row;
        targetCol = col;
      }
    }

    if (placed && targetRow !== -1 && targetCol !== -1) {
      // 1. Lock blocks into board
      const newBoard = board.map((r) => [...r]);
      for (let r = 0; r < shape.height; r++) {
        for (let c = 0; c < shape.width; c++) {
          if (shape.grid[r][c] === 1) {
            newBoard[targetRow + r][targetCol + c] = shape.color;
          }
        }
      }

      playDropSound();

      // 2. Remove shape from dock slot
      const nextShapes = [...activeShapes];
      nextShapes[draggedPiece.originalIndex] = null;

      // Check if all 3 shapes are placed. If so, generate another set of 3
      const allPlaced = nextShapes.every((s) => s === null);
      let finalShapes = nextShapes;
      if (allPlaced) {
        finalShapes = [getRandomShape(), getRandomShape(), getRandomShape()];
      }

      // 3. Process lines and check if board cleared
      processLineClears(newBoard, finalShapes);

    } else {
      // Return back to slot if place is invalid
      setHoveredRow(null);
      setHoveredCol(null);
      setDraggedPiece(null);
    }
  };

  // Complete row/column checking, flash animations, and combos
  const processLineClears = (currentBoard: GridMatrix, nextShapes: (Shape | null)[]) => {
    const rowsToClear: number[] = [];
    const colsToClear: number[] = [];

    // Evaluate rows
    for (let r = 0; r < 8; r++) {
      if (currentBoard[r].every((cell) => cell !== null)) {
        rowsToClear.push(r);
      }
    }

    // Evaluate columns
    for (let c = 0; c < 8; c++) {
      let allFilled = true;
      for (let r = 0; r < 8; r++) {
        if (currentBoard[r][c] === null) {
          allFilled = false;
          break;
        }
      }
      if (allFilled) {
        colsToClear.push(c);
      }
    }

    const totalLines = rowsToClear.length + colsToClear.length;

    if (totalLines > 0) {
      // Trigger dynamic arcade float phrase!
      triggerFloatingPhrase();

      // Flag cells for flash dissolve clear animation
      const clearingMap: Record<string, boolean> = {};
      
      for (const r of rowsToClear) {
        for (let c = 0; c < 8; c++) {
          clearingMap[`${r},${c}`] = true;
        }
      }
      for (const c of colsToClear) {
        for (let r = 0; r < 8; r++) {
          clearingMap[`${r},${c}`] = true;
        }
      }

      setIsClearingCells(clearingMap);

      // Increment consecutive streak turns
      const nextStreak = streak + 1;
      setStreak(nextStreak);

      // Score multipliers: 1=100, 2=300, 3=600, 4=1000, 5=1500, etc.
      const scoreTiers = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600];
      const baseClearedScore = scoreTiers[totalLines] || (totalLines * 400);
      const streakBonus = (nextStreak - 1) * 50;
      const pointsAwarded = baseClearedScore + streakBonus;

      const newScore = score + pointsAwarded;
      const nextLinesTotal = linesClearedTotal + totalLines;
      const nextCombos = Math.max(combos, totalLines);

      // Play escalating audio arpeggio based on cleared columns/rows
      playClearSound(totalLines);

      // Block-state cleanup after short animation delay
      setTimeout(() => {
        const clearedBoard = currentBoard.map((row, r) =>
          row.map((cell, c) => {
            const isRowCleared = rowsToClear.includes(r);
            const isColCleared = colsToClear.includes(c);
            return isRowCleared || isColCleared ? null : cell;
          })
        );

        setIsClearingCells({});
        setBoard(clearedBoard);
        setScore(newScore);
        setLinesClearedTotal(nextLinesTotal);
        setCombos(nextCombos);

        // Save high score if beaten
        let currentHighScore = highScore;
        if (newScore > highScore) {
          currentHighScore = newScore;
          setHighScore(newScore);
          localStorage.setItem('block_blast_high_score', newScore.toString());
        }

        // Apply shapes & check game over on the fresh matrix
        setActiveShapes(nextShapes);
        setDraggedPiece(null);
        setHoveredRow(null);
        setHoveredCol(null);

        verifyGameOver(clearedBoard, nextShapes, currentHighScore, newScore);

      }, 280); // Syncs with CSS animate-flash-clear duration (280ms)

    } else {
      // Reset streak multiplier
      setStreak(0);
      setBoard(currentBoard);
      setActiveShapes(nextShapes);
      setDraggedPiece(null);
      setHoveredRow(null);
      setHoveredCol(null);

      verifyGameOver(currentBoard, nextShapes, highScore, score);
    }
  };

  // Game over check
  const verifyGameOver = (
    boardMatrix: GridMatrix,
    currentShapes: (Shape | null)[],
    currentHighScore: number,
    currentScore: number
  ) => {
    // Verify if there are legal coordinates for any remaining block shape
    const hasMoves = currentShapes.some((s) => {
      if (s === null) return false;
      // Loop board coordinates
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (canPlaceShape(s.grid, boardMatrix, r, c)) {
            return true;
          }
        }
      }
      return false;
    });

    const activeCount = currentShapes.filter(s => s !== null).length;

    // Only declare game over if active shapes exist but none can be placed
    if (activeCount > 0 && !hasMoves) {
      setTimeout(() => {
        setGameOver(true);
        playGameOverSound();
        if (currentScore > currentHighScore) {
          localStorage.setItem('block_blast_high_score', currentScore.toString());
        }
      }, 500);
    }
  };

  // Continue game supporting revival (Post-Ad Revival Mechanism)
  const handleContinueGame = () => {
    // 1. Keep the current High Score and current live Score intact.
    // 2. Clear a 3x3 section in the center of the grid (indices 2, 3, 4)
    const newBoard = board.map((row, rIdx) =>
      row.map((cell, cIdx) => {
        if (rIdx >= 2 && rIdx <= 4 && cIdx >= 2 && cIdx <= 4) {
          return null;
        }
        return cell;
      })
    );
    setBoard(newBoard);

    // 3. Clear the 3 blocked pieces at the bottom and generate 3 completely new, playable random shapes.
    setActiveShapes([getRandomShape(), getRandomShape(), getRandomShape()]);

    // 4. Increment the consecutiveContinues state variable by 1.
    setConsecutiveContinues((prev) => prev + 1);

    // Reset gameplay temp states
    setStreak(0);
    setDraggedPiece(null);
    setHoveredRow(null);
    setHoveredCol(null);
    setIsClearingCells({});
    setGameOver(false);
    playTriumphantSound();
  };

  // Reset core game states (Restart from Scratch)
  const handleResetGame = () => {
    setBoard(Array(8).fill(null).map(() => Array(8).fill(null)));
    setScore(0);
    setConsecutiveContinues(0); // Reset consecutive continues to 0
    setLinesClearedTotal(0);
    setStreak(0);
    setCombos(1);
    setGameOver(false);
    setActiveShapes([getRandomShape(), getRandomShape(), getRandomShape()]);
    setDraggedPiece(null);
    setHoveredRow(null);
    setHoveredCol(null);
    setIsClearingCells({});
    playTriumphantSound();
  };

  // Warn user before resetting active session
  const handleManualResetRequest = () => {
    if (window.confirm("Start a new round? Your current progress will be lost.")) {
      handleResetGame();
    }
  };

  // Compute absolute properties of the touch-raised floating element
  const isTouch = 
    typeof window !== 'undefined' && 
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  const verticalOffset = isTouch ? 55 : 10;

  return (
    <div
      id="game-viewport"
      className="min-h-screen bg-[#070b13] text-white flex flex-col items-center justify-between py-4 px-4 select-none overflow-x-hidden font-sans relative"
    >
      {/* Visual background textures */}
      <div className="absolute inset-0 bg-retro-scanlines pointer-events-none opacity-5 z-20"></div>
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* TOP DASHBOARD (Control Panel) */}
      <header className="w-full max-w-md flex flex-col gap-3 mt-1.5 z-10 shrink-0">
        <div className="flex items-center justify-between">
          {/* High Score tracker with minimal crown */}
          <div
            id="highscore-badge"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-amber-500/10 text-amber-400 font-mono text-xs shadow-md"
          >
            <Crown className="w-4 h-4 text-amber-400 fill-amber-400/10 shrink-0 animate-pulse" />
            <span className="font-bold tracking-tight">BEST: {highScore}</span>
          </div>

          {/* Action controllers */}
          <div className="flex items-center gap-2">
            <button
              id="help-btn"
              onClick={() => setIsHelpOpen(true)}
              className="p-2 rounded-lg bg-slate-800/60 border border-white/10 hover:bg-slate-700/80 hover:border-white/20 transition-all text-slate-300 hover:text-white cursor-pointer"
              title="How to Play"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <SoundToggle />
            <button
              id="reset-btn"
              onClick={handleManualResetRequest}
              className="p-2 rounded-lg bg-slate-800/60 border border-white/10 hover:bg-slate-700/80 hover:border-white/20 transition-all text-slate-300 hover:text-white cursor-pointer"
              title="Restart Game"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current score display - Elevated slightly */}
        <div className="text-center py-1 flex flex-col items-center justify-center relative">
          <span className="text-[10px] tracking-[0.25em] text-slate-400 uppercase font-mono font-bold mb-0.5">
            Score
          </span>
          <div className="relative inline-block">
            <h1
              id="current-score-text"
              className="text-4xl xs:text-5xl font-black text-white tracking-tight font-display drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]"
            >
              {score}
            </h1>
            {streak > 1 && (
              <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gradient-to-r from-emerald-500 to-teal-500 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full shadow-md uppercase tracking-wider font-mono animate-bounce">
                STREAK {streak}
              </span>
            )}
          </div>
        </div>

        {/* Dedicated high-visibility visual lane (CLS Protection - Fixed Height) */}
        <div className="w-full h-8 relative flex justify-center items-center overflow-visible select-none">
          {floatingTexts.map((item) => (
            <div
              key={item.id}
              className="absolute left-1/2 pointer-events-none font-display font-black text-xl xs:text-2xl tracking-wider uppercase whitespace-nowrap animate-arcade-crisp-glide"
              style={{
                color: item.color,
                textShadow: '2px 2px 0px #000000',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
              }}
            >
              {item.text}
            </div>
          ))}
        </div>
      </header>

      {/* MIDDLE CANVAS (The 8x8 Grid System) */}
      <main className="w-full max-w-md flex justify-center items-center my-4 z-10 shrink-0">
        <div
          ref={boardRef}
          id="game-board-grid"
          className="w-full max-w-[340px] xs:max-w-[370px] sm:max-w-[400px] aspect-square bg-[#0c1220]/95 rounded-2xl p-2.5 grid grid-cols-8 grid-rows-8 gap-1.5 shadow-2xl relative border-4 border-slate-800/80 grid-glow"
        >

          {board.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              // Highlight landing preview cells
              let isPreview = false;
              let previewColor: BlockColor | null = null;
              
              if (hoveredRow !== null && hoveredCol !== null && draggedPiece) {
                const shape = draggedPiece.shape;
                const shapeR = rIdx - hoveredRow;
                const shapeC = cIdx - hoveredCol;
                
                if (
                  shapeR >= 0 &&
                  shapeR < shape.height &&
                  shapeC >= 0 &&
                  shapeC < shape.width &&
                  shape.grid[shapeR][shapeC] === 1
                ) {
                  isPreview = true;
                  previewColor = shape.color;
                }
              }

              const isClearing = isClearingCells[`${rIdx},${cIdx}`];

              return (
                <div
                  key={`cell-${rIdx}-${cIdx}`}
                  className="relative aspect-square rounded-[5px] overflow-hidden flex items-center justify-center select-none"
                >
                  {/* Base grid background tile */}
                  <div className="absolute inset-0 bg-[#162033]/30 border border-white/[0.015] rounded-[5px]"></div>

                  {/* Locked blocks on board with Bevel looks */}
                  {cell && !isClearing && (
                    <div
                      className="absolute inset-0 rounded-[5px] border-t-[3px] border-l-[3px] border-r-[3px] border-b-[3px] shadow-md animate-pop-in"
                      style={{
                        backgroundColor: COLOR_MAP[cell].base,
                        borderTopColor: COLOR_MAP[cell].light,
                        borderLeftColor: COLOR_MAP[cell].light,
                        borderBottomColor: COLOR_MAP[cell].dark,
                        borderRightColor: COLOR_MAP[cell].dark,
                        boxShadow: `inset 1px 1px 0px rgba(255,255,255,0.2), 0 2px 4px ${COLOR_MAP[cell].glow}`,
                      }}
                    />
                  )}

                  {/* Previews cells hover look */}
                  {isPreview && !cell && (
                    <div
                      className="absolute inset-0 rounded-[5px] border-t-[3px] border-l-[3px] border-r-[3px] border-b-[3px] shadow-inner opacity-40 scale-[0.96] animate-pulse-subtle"
                      style={{
                        backgroundColor: COLOR_MAP[previewColor!].base,
                        borderTopColor: COLOR_MAP[previewColor!].light,
                        borderLeftColor: COLOR_MAP[previewColor!].light,
                        borderBottomColor: COLOR_MAP[previewColor!].dark,
                        borderRightColor: COLOR_MAP[previewColor!].dark,
                      }}
                    />
                  )}

                  {/* Row/Col Clear Flash Overlay */}
                  {isClearing && (
                    <div className="absolute inset-0 bg-white rounded-[5px] animate-flash-clear z-10" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* BOTTOM DOCK (The Piece Generator) */}
      <footer className="w-full max-w-md flex flex-col items-center gap-2 mb-2 z-10 shrink-0">
        <span className="text-[10px] tracking-widest text-slate-500 uppercase font-mono font-bold">
          Drag & Drop Shapes
        </span>
        <div
          id="piece-generator-dock"
          className="w-full max-w-md bg-slate-950/40 border border-slate-900 rounded-3xl p-3.5 flex justify-center items-center gap-3.5 shadow-lg backdrop-blur-sm"
        >
          {activeShapes.map((shape, idx) => (
            <ShapeItem
              key={`slot-${idx}-${shape ? shape.id : 'empty'}`}
              shape={shape}
              index={idx}
              isDraggingThis={draggedPiece?.originalIndex === idx}
              onPointerDown={handlePointerDown}
            />
          ))}
        </div>
      </footer>

      {/* ABSOLUTE ACTIVE DRAG COMPONENT (Cursor/Finger Follower) */}
      {draggedPiece && (
        <div
          id="dragging-piece-floating"
          className="fixed pointer-events-none z-50 select-none scale-[1.06] transition-transform duration-75"
          style={{
            left: `${draggedPiece.clientX - (draggedPiece.shape.width * boardCellSize) / 2}px`,
            top: `${draggedPiece.clientY - (draggedPiece.shape.height * boardCellSize) / 2 - verticalOffset}px`,
          }}
        >
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${draggedPiece.shape.width}, minmax(0, 1fr))`,
              width: `${draggedPiece.shape.width * boardCellSize}px`,
              height: `${draggedPiece.shape.height * boardCellSize}px`,
            }}
          >
            {draggedPiece.shape.grid.map((row, rIdx) =>
              row.map((val, cIdx) => {
                if (val === 1) {
                  const colorDetail = COLOR_MAP[draggedPiece.shape.color];
                  return (
                    <div
                      key={`drag-cell-${rIdx}-${cIdx}`}
                      className="rounded-[5px] border-t-[3px] border-l-[3px] border-r-[3px] border-b-[3px] shadow-lg"
                      style={{
                        width: `${boardCellSize}px`,
                        height: `${boardCellSize}px`,
                        backgroundColor: colorDetail.base,
                        borderTopColor: colorDetail.light,
                        borderLeftColor: colorDetail.light,
                        borderBottomColor: colorDetail.dark,
                        borderRightColor: colorDetail.dark,
                        boxShadow: `inset 1px 1px 0px rgba(255,255,255,0.25), 0 4px 8px ${colorDetail.glow}`,
                      }}
                    />
                  );
                } else {
                  return (
                    <div
                      key={`drag-cell-empty-${rIdx}-${cIdx}`}
                      className="opacity-0 pointer-events-none"
                      style={{
                        width: `${boardCellSize}px`,
                        height: `${boardCellSize}px`,
                      }}
                    />
                  );
                }
              })
            )}
          </div>
        </div>
      )}

      {/* GAME OVER DIALOG MODAL */}
      {gameOver && (
        <GameOverModal
          score={score}
          highScore={highScore}
          combos={combos}
          linesClearedTotal={linesClearedTotal}
          consecutiveContinues={consecutiveContinues}
          onContinue={handleContinueGame}
          onReset={handleResetGame}
        />
      )}

      {/* INSTRUCTIONS / HELP DIALOG MODAL */}
      {isHelpOpen && (
        <div
          id="help-modal-overlay"
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div
            id="help-card"
            className="bg-slate-900 border-2 border-slate-800 rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl relative animate-scale-up"
          >
            <button
              onClick={() => setIsHelpOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800/80 border border-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center mb-4">
              <div className="p-3 bg-blue-500/10 rounded-full border border-blue-500/20 text-blue-400">
                <Trophy className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold mt-2 font-display">How to Play</h2>
            </div>

            <div className="text-left space-y-4 text-slate-300 text-sm font-sans mb-6">
              <p>
                <strong className="text-white">1. Place blocks:</strong> Drag puzzle pieces from the bottom generator dock and place them anywhere on the 8x8 grid.
              </p>
              <p>
                <strong className="text-white">2. Clear lines:</strong> Fill complete rows (horizontally) or columns (vertically) with blocks. Cleared lines dissolve and grant points!
              </p>
              <p>
                <strong className="text-white">3. Multipliers & Combos:</strong> Clear multiple lines simultaneously for massive combo multipliers. Clear lines on consecutive turns to maintain a streak!
              </p>
              <p>
                <strong className="text-white">4. No Moves = Game Over:</strong> Always plan ahead! If no active pieces can legally fit onto the board, you lose.
              </p>
            </div>

            <button
              id="close-help-btn"
              onClick={() => setIsHelpOpen(false)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-white/5 cursor-pointer"
            >
              Start Playing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
