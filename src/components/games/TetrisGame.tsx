import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { CalendarDays, Download, CalendarClock } from 'lucide-react';

const ROWS = 20;
const COLS = 10;
const TICK_RATE = 500;

const TETROMINOS = {
  0: { shape: [[0]], color: 'bg-transparent border-transparent' },
  I: { shape: [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]], color: 'bg-blue-100 border-blue-200 text-blue-800' },
  J: { shape: [[0, 2, 0], [0, 2, 0], [2, 2, 0]], color: 'bg-red-100 border-red-200 text-red-800' },
  L: { shape: [[0, 3, 0], [0, 3, 0], [0, 3, 3]], color: 'bg-orange-100 border-orange-200 text-orange-800' },
  O: { shape: [[4, 4], [4, 4]], color: 'bg-emerald-100 border-emerald-200 text-emerald-800' },
  S: { shape: [[0, 5, 5], [5, 5, 0], [0, 0, 0]], color: 'bg-violet-100 border-violet-200 text-violet-800' },
  T: { shape: [[0, 6, 0], [6, 6, 6], [0, 0, 0]], color: 'bg-rose-100 border-rose-200 text-rose-800' },
  Z: { shape: [[7, 7, 0], [0, 7, 7], [0, 0, 0]], color: 'bg-amber-100 border-amber-200 text-amber-800' },
};

const SHAPES = 'IJLOSTZ';

export default function TetrisGame() {
  const { user } = useAuth();
  const [grid, setGrid] = useState<number[][]>(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
  const [playerInfo, setPlayerInfo] = useState({
    pos: { x: 0, y: 0 },
    tetromino: TETROMINOS[0].shape,
    collided: false,
  });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [playing, setPlaying] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchHighScore = async () => {
      try {
        const q = query(
          collection(db, 'scores'),
          where('ownerId', '==', user.uid),
          where('game', '==', 'tetris'),
          orderBy('score', 'desc'),
          limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setHighScore(querySnapshot.docs[0].data().score);
        }
      } catch (error) {
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
        game: 'tetris',
        score: finalScore,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'scores');
    }
  }, [user, highScore]);

  const resetGame = useCallback(() => {
    setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
    setScore(0);
    setGameOver(false);
    setPlaying(true);
    spawnTetromino();
    setTimeout(() => gameRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  const spawnTetromino = () => {
    const shapeId = SHAPES[Math.floor(Math.random() * SHAPES.length)] as keyof typeof TETROMINOS;
    const tetromino = TETROMINOS[shapeId].shape;
    setPlayerInfo({
      pos: { x: COLS / 2 - 1, y: 0 },
      tetromino,
      collided: false,
    });
  };

  const checkCollision = (piece: number[][], targetPos: { x: number, y: number }, g: number[][]) => {
    for (let y = 0; y < piece.length; y += 1) {
      for (let x = 0; x < piece[y].length; x += 1) {
        if (piece[y][x] !== 0) {
          if (
            !g[y + targetPos.y] || 
            g[y + targetPos.y][x + targetPos.x] === undefined || 
            g[y + targetPos.y][x + targetPos.x] !== 0
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const rotate = (matrix: number[][]) => {
    const rotated = matrix.map((_, index) => matrix.map((col) => col[index]));
    return rotated.map((row) => row.reverse());
  };

  const playerRotate = () => {
    const clonedPiece = rotate(playerInfo.tetromino);
    if (!checkCollision(clonedPiece, playerInfo.pos, grid)) {
      setPlayerInfo((prev) => ({ ...prev, tetromino: clonedPiece }));
    }
  };

  const updatePlayerPos = (x: number, y: number, collided: boolean) => {
    setPlayerInfo((prev) => ({
      ...prev,
      pos: { x: prev.pos.x + x, y: prev.pos.y + y },
      collided,
      tetromino: prev.tetromino
    }));
  };

  const movePlayer = (dir: number) => {
    if (!checkCollision(playerInfo.tetromino, { x: playerInfo.pos.x + dir, y: playerInfo.pos.y }, grid)) {
      updatePlayerPos(dir, 0, false);
    }
  };

  const drop = () => {
    if (!checkCollision(playerInfo.tetromino, { x: playerInfo.pos.x, y: playerInfo.pos.y + 1 }, grid)) {
      updatePlayerPos(0, 1, false);
    } else {
      if (playerInfo.pos.y < 1) {
        setGameOver(true);
        setPlaying(false);
        saveScore(score);
      }
      updatePlayerPos(0, 0, true);
    }
  };

  const dropPlayer = () => {
    drop();
  };

  useEffect(() => {
    if (!playing || gameOver) return;

    if (playerInfo.collided) {
      const newGrid = [...grid];
      playerInfo.tetromino.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            newGrid[y + playerInfo.pos.y][x + playerInfo.pos.x] = value;
          }
        });
      });

      let clearedRows = 0;
      const sweptGrid = newGrid.reduce((acc, row) => {
        if (row.lastIndexOf(0) === -1) {
          clearedRows++;
          acc.unshift(new Array(COLS).fill(0));
          return acc;
        }
        acc.push(row);
        return acc;
      }, [] as number[][]);

      setGrid(sweptGrid);
      if (clearedRows > 0) {
        setScore((prev) => prev + clearedRows * 100);
      }
      spawnTetromino();
    }
  }, [playerInfo.collided, playing, gameOver]);

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      drop();
    }, Math.max(100, TICK_RATE - score * 2));
    return () => clearInterval(interval);
  }, [playing, drop, score]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // prevent default scroll
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
       e.preventDefault();
    }
    if (!playing || gameOver) return;
    if (e.key === 'ArrowLeft') movePlayer(-1);
    else if (e.key === 'ArrowRight') movePlayer(1);
    else if (e.key === 'ArrowDown') dropPlayer();
    else if (e.key === 'ArrowUp') playerRotate();
  };

  // Merge grid and player piece for rendering
  const displayGrid = grid.map(row => [...row]);
  if (playing && !playerInfo.collided) {
    playerInfo.tetromino.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0 && displayGrid[y + playerInfo.pos.y] && displayGrid[y + playerInfo.pos.y][x + playerInfo.pos.x] !== undefined) {
          displayGrid[y + playerInfo.pos.y][x + playerInfo.pos.x] = value;
        }
      });
    });
  }

  return (
    <div className="h-full flex flex-col p-8 bg-gray-50 font-sans text-gray-800 focus:outline-none" tabIndex={0} onKeyDown={handleKeyDown} ref={gameRef}>
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3 text-indigo-700">
          <CalendarDays className="w-6 h-6" />
          <div>
             <h2 className="font-bold text-lg tracking-tight text-gray-800">시간표 조회</h2>
             <div className="text-xs text-gray-500 mt-1">전자출결 연동 시스템 (BETA)</div>
          </div>
        </div>
        <div className="flex items-center gap-6">
           <div className="flex flex-col text-right">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Max Hours</span>
              <span className="text-sm font-bold text-gray-700">{Math.max(highScore, score)}H</span>
           </div>
           <div className="flex flex-col text-right">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Current</span>
              <span className="text-sm font-bold text-indigo-600">{score}H</span>
           </div>
           <div className="flex flex-col text-right">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Server</span>
              <span className={`text-sm font-bold flex items-center gap-1 ${gameOver ? 'text-red-500' : playing ? 'text-green-500' : 'text-yellow-500'}`}>
                 {gameOver ? 'ERR' : playing ? 'SYNC' : 'IDLE'}
                 <CalendarClock className="w-3 h-3" />
              </span>
           </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative touch-none">
        
        {(!playing || gameOver) && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm w-full max-w-md mx-auto h-[300px]">
             <div className="text-xl font-bold text-gray-800 mb-2">{gameOver ? '시간표 충돌 발생 (Conflict)' : '수강신청 서버 대기열'}</div>
             {gameOver && <div className="text-gray-600 mb-6 font-mono text-sm">이수 확정 시간: {score} Hours</div>}
             <button 
               onClick={resetGame}
               className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-md hover:bg-indigo-700 transition shadow-[0_3px_0_theme(colors.indigo.800)] active:translate-y-1 active:shadow-none flex items-center gap-2"
             >
               <Download className="w-4 h-4" />
               {gameOver ? '초기화 후 재신청' : '매크로 등록 및 시작'}
             </button>
          </div>
        )}

        <div className="flex border border-gray-300 rounded-lg bg-white shadow-xl overflow-hidden relative">
          
          {/* Subtle grid lines background to look more like a planner */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[length:24px_24px] pointer-events-none"></div>

          {/* Time sidebar */}
          <div className="w-12 bg-[#F8F9FA] border-r border-gray-300 flex flex-col select-none relative z-10">
            <div className="h-[24px] border-b border-gray-300 bg-gray-100"></div>
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-[48px] border-b border-gray-200 text-[10px] text-gray-400 font-bold text-center py-1 bg-[#F8F9FA]">
                {9 + i}:00
              </div>
            ))}
          </div>

          <div className="flex flex-col z-10 bg-white/50">
            <div className="flex border-b border-gray-300 bg-[#F8F9FA] h-[24px] select-none">
              {['월', '화', '수', '목', '금'].map((day, idx) => (
                <div key={day} className="w-[48px] text-[10px] font-bold text-gray-500 text-center leading-[24px] border-r border-gray-200 last:border-r-0">
                  {day} {idx+12}일
                </div>
              ))}
            </div>

            <div className="relative overflow-hidden" style={{ width: '240px', height: '480px' }}>
              {displayGrid.map((row, r) => (
                <div key={r} className="flex h-[24px]">
                  {row.map((cell, c) => {
                    const typeObj = Object.values(TETROMINOS).find((_, idx) => idx === cell) || TETROMINOS[0];
                    return (
                      <div
                        key={`${r}-${c}`}
                        className={`w-[24px] h-[24px] ${cell === 0 ? 'bg-transparent' : typeObj.color + ' z-20 border-solid border opacity-95 shadow-[0_1px_2px_rgba(0,0,0,0.1)] rounded-[2px] m-[0.5px] w-[23px] h-[23px]'}`}
                      ></div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="ml-12 hidden md:block text-xs text-gray-500 leading-relaxed border-l border-gray-200 pl-6 py-4">
          <p className="font-bold mb-3 text-gray-700 tracking-tight">오류 대응 매뉴얼 (단축키):</p>
          <ul className="space-y-2">
             <li className="flex gap-2 items-center"><span className="bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold">←</span><span className="bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold">→</span><span>배정 요일 변경</span></li>
             <li className="flex gap-2 items-center"><span className="bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold">↑</span><span>시간대 회전</span></li>
             <li className="flex gap-2 items-center"><span className="bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold">↓</span><span>즉시 배정 강제 (Soft-Drop)</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
