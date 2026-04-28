import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Calculator, Play, RotateCcw, Save } from 'lucide-react';

const ROWS = 10;
const COLS = 17;
const GAME_TIME = 120; // 2 minutes

interface CellData {
  value: number;
  id: string;
}

export default function AppleGame() {
  const { user } = useAuth();
  const [grid, setGrid] = useState<(CellData | null)[][]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState<{ r: number; c: number } | null>(null);
  const [endPos, setEndPos] = useState<{ r: number; c: number } | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [highScore, setHighScore] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

  // Fetch High Score
  useEffect(() => {
    if (!user) return;
    const fetchHighScore = async () => {
      try {
        const q = query(
          collection(db, 'scores'),
          where('ownerId', '==', user.uid),
          where('game', '==', 'apple'),
          orderBy('score', 'desc'),
          limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setHighScore(querySnapshot.docs[0].data().score);
        }
      } catch (error) {
        // Silently handle if index doesn't exist yet
        console.error(error);
      }
    };
    fetchHighScore();
  }, [user]);

  const saveScore = useCallback(async (finalScore: number) => {
    if (!user || finalScore === 0) return;
    if (finalScore > highScore) setHighScore(finalScore);
    try {
      await addDoc(collection(db, 'scores'), {
        ownerId: user.uid,
        game: 'apple',
        score: finalScore,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'scores');
    }
  }, [user, highScore]);

  const initGame = useCallback(() => {
    const newGrid: (CellData | null)[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const row: CellData[] = [];
      for (let c = 0; c < COLS; c++) {
        row.push({
          value: Math.floor(Math.random() * 9) + 1,
          id: `${r}-${c}-${Math.random()}`,
        });
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
    setScore(0);
    setTimeLeft(GAME_TIME);
    setGameState('playing');
  }, []);

  useEffect(() => {
    if (gameState === 'idle') {
      initGame();
    }
  }, [gameState, initGame]);

  useEffect(() => {
    let timer: any;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('gameover');
      saveScore(score);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, score, saveScore]);

  const handlePointerDown = (r: number, c: number, e: React.PointerEvent) => {
    if (gameState !== 'playing') return;
    if (e.target instanceof HTMLElement) {
      e.target.releasePointerCapture(e.pointerId);
    }
    setIsSelecting(true);
    setStartPos({ r, c });
    setEndPos({ r, c });
  };

  const handlePointerMove = (r: number, c: number) => {
    if (!isSelecting) return;
    setEndPos({ r, c });
  };

  const handlePointerUp = () => {
    if (!isSelecting || !startPos || !endPos) {
      setIsSelecting(false);
      return;
    }

    const minR = Math.min(startPos.r, endPos.r);
    const maxR = Math.max(startPos.r, endPos.r);
    const minC = Math.min(startPos.c, endPos.c);
    const maxC = Math.max(startPos.c, endPos.c);

    let sum = 0;
    const selectedCells: { r: number; c: number }[] = [];

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const cell = grid[r][c];
        if (cell) {
          sum += cell.value;
          selectedCells.push({ r, c });
        }
      }
    }

    if (sum === 10) {
      setScore(s => s + selectedCells.length * 10);
      setGrid(prev => {
        const newGrid = [...prev].map(row => [...row]);
        for (const cell of selectedCells) {
          newGrid[cell.r][cell.c] = null;
        }
        return newGrid;
      });
    }

    setIsSelecting(false);
    setStartPos(null);
    setEndPos(null);
  };

  useEffect(() => {
    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, [isSelecting, startPos, endPos, grid]);

  const isCellSelected = (r: number, c: number) => {
    if (!isSelecting || !startPos || !endPos) return false;
    const minR = Math.min(startPos.r, endPos.r);
    const maxR = Math.max(startPos.r, endPos.r);
    const minC = Math.min(startPos.c, endPos.c);
    const maxC = Math.max(startPos.c, endPos.c);
    return r >= minR && r <= maxR && c >= minC && c <= maxC;
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate current selection sum for display
  let currentSelectionSum = 0;
  let currentSelectionCount = 0;
  if (isSelecting && startPos && endPos) {
    const minR = Math.min(startPos.r, endPos.r);
    const maxR = Math.max(startPos.r, endPos.r);
    const minC = Math.min(startPos.c, endPos.c);
    const maxC = Math.max(startPos.c, endPos.c);
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const cell = grid[r][c];
        if (cell) {
          currentSelectionSum += cell.value;
          currentSelectionCount++;
        }
      }
    }
  }

  return (
    <div className="h-full flex flex-col p-4 sm:p-8 bg-gray-50 text-gray-800 font-sans select-none overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
              <Calculator className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">수강 데이터 군집화</h1>
              <p className="text-sm text-gray-500 font-medium mt-1">Data Matrix Clustering Analysis</p>
            </div>
          </div>
          
          <div className="flex bg-gray-50 p-2 rounded-xl border border-gray-100 gap-2">
            <div className="px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-100 min-w-[120px]">
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Status</div>
              <div className={`text-sm font-bold flex items-center gap-2 ${gameState === 'playing' ? 'text-emerald-600' : 'text-rose-500'}`}>
                <span className={`w-2 h-2 rounded-full ${gameState === 'playing' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                {gameState === 'playing' ? 'ACTIVE' : 'HALTED'}
              </div>
            </div>
            <div className="px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-100 min-w-[120px]">
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Time Left</div>
              <div className="text-xl font-mono text-gray-800 font-bold leading-none">{formatTime(timeLeft)}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Main Grid Area */}
          <div className="lg:col-span-3 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 relative">
            
            <div className="flex justify-between items-end mb-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Primary Data Node Matrix</h2>
                <p className="text-sm text-gray-500 mt-1">Select adjacent nodes that sum to exactly 10.</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Selection Checksum</div>
                <div className="text-2xl font-mono font-bold">
                  Σ = <span className={isSelecting && currentSelectionSum === 10 ? 'text-emerald-600' : isSelecting ? 'text-indigo-600' : 'text-gray-300'}>
                    {isSelecting ? currentSelectionSum : '0'}
                  </span>
                </div>
              </div>
            </div>

            <div 
              className="relative flex justify-center"
              ref={gridRef}
              onPointerLeave={() => setIsSelecting(false)}
            >
              {gameState === 'gameover' && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm rounded-xl">
                  <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center mb-4">
                    <Save className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900 mb-2">분석 완료 (Analysis Complete)</h2>
                  <p className="text-gray-500 mb-8 max-w-sm text-center">
                    군집화 데이터 처리가 완료되었습니다. 산출된 총 데이터 포인트 로그가 서버에 기록되었습니다.
                  </p>
                  <button 
                    onClick={initGame}
                    className="px-8 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-all flex items-center gap-3 shadow-lg shadow-gray-200"
                  >
                    <RotateCcw className="w-5 h-5" /> RESTART ANALYSIS
                  </button>
                </div>
              )}

              {/* Matrix Grid */}
              <div className="inline-flex flex-col gap-1.5" style={{ touchAction: 'none' }}>
                {grid.map((row, r) => (
                  <div key={r} className="flex gap-1.5 justify-center" style={{ touchAction: 'none' }}>
                    {row.map((cell, c) => {
                      const selected = isCellSelected(r, c);
                      return (
                        <div
                          key={cell ? cell.id : `empty-${r}-${c}`}
                          onPointerDown={(e) => handlePointerDown(r, c, e)}
                          onPointerMove={(e) => {
                            if (e.buttons > 0) {
                               handlePointerMove(r, c);
                            }
                          }}
                          className={`
                            relative w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center text-sm sm:text-base font-bold rounded-lg cursor-pointer transition-all duration-150 select-none overflow-hidden
                            ${!cell ? 'bg-transparent text-transparent pointer-events-none' : 
                              selected ? 'bg-indigo-600 text-white scale-95 shadow-inner' : 'bg-gray-50 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200 hover:border-indigo-200'}
                          `}
                          style={{ touchAction: 'none' }}
                        >
                          {cell?.value}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="flex flex-col gap-4">
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="text-xs text-indigo-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Performance
              </div>
              <div className="text-4xl font-extrabold text-gray-900 tracking-tight font-mono mb-1">
                {score.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Current Score Log</div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               <div className="text-xs text-orange-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Best Record
              </div>
              <div className="text-3xl font-bold text-gray-800 tracking-tight font-mono mb-1">
                {highScore.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Maximum Data Points</div>
            </div>

            <button 
              onClick={initGame}
              className="mt-4 w-full py-4 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5 text-gray-400" />
              RESET MATRIX
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
