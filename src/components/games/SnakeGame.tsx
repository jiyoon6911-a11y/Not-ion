import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Activity, Power, TerminalSquare } from 'lucide-react';

const GRID_SIZE = 20;
const TICK_RATE = 100;

type Point = { x: number, y: number };

export default function SnakeGame() {
  const { user } = useAuth();
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]);
  const [food, setFood] = useState<Point>({ x: 15, y: 5 });
  const [dir, setDir] = useState<Point>({ x: 0, y: -1 });
  const [playing, setPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const gameRef = useRef<HTMLDivElement>(null);
  
  // Track last executed direction to prevent rapid reverse turning bug
  const currentDir = useRef(dir);

  useEffect(() => {
    if (!user) return;
    const fetchHighScore = async () => {
      try {
        const q = query(
          collection(db, 'scores'),
          where('ownerId', '==', user.uid),
          where('game', '==', 'snake'),
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
        game: 'snake',
        score: finalScore,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'scores');
    }
  }, [user, highScore]);

  const initGame = () => {
    setSnake([{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]);
    setDir({ x: 0, y: -1 });
    currentDir.current = { x: 0, y: -1 };
    setFood({ x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) });
    setScore(0);
    setGameOver(false);
    setPlaying(true);
    setTimeout(() => gameRef.current?.focus(), 50);
  };

  useEffect(() => {
    initGame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gameLoop = useCallback(() => {
    if (!playing || gameOver) return;

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = { x: head.x + currentDir.current.x, y: head.y + currentDir.current.y };

      // Wall collision
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setGameOver(true);
        setPlaying(false);
        saveScore(score);
        return prevSnake;
      }

      // Self collision
      if (prevSnake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        setGameOver(true);
        setPlaying(false);
        saveScore(score);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        let newFood = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
        // Ensure food isn't on snake
        while (newSnake.some(seg => seg.x === newFood.x && seg.y === newFood.y)) {
          newFood = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
        }
        setFood(newFood);
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [playing, gameOver, food, score, saveScore]);

  useEffect(() => {
    const interval = setInterval(gameLoop, TICK_RATE);
    return () => clearInterval(interval);
  }, [gameLoop]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if(!playing || gameOver) return;
    const keyMap: Record<string, Point> = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 }
    };
    
    if (keyMap[e.key]) {
      e.preventDefault();
      const nextDir = keyMap[e.key];
      // Prevent 180 degree turn
      if (currentDir.current.x + nextDir.x !== 0 || currentDir.current.y + nextDir.y !== 0) {
         setDir(nextDir);
         currentDir.current = nextDir;
      }
    }
  };

  // Render text-based grid
  const renderGrid = () => {
    const tiles = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      let row = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        if (food.x === x && food.y === y) {
          row.push(<span key={x} className="inline-block w-8 text-center text-red-600 bg-red-50 border border-red-200 text-[10px] p-[2px] leading-none font-bold rounded-sm shadow-sm scale-[1.1] z-10 transition-transform">EXP</span>);
        } else {
          const isSnake = snake.some(seg => seg.x === x && seg.y === y);
          const isHead = snake[0].x === x && snake[0].y === y;
          if (isHead) row.push(<span key={x} className="inline-block w-8 text-center text-white bg-blue-600 border border-blue-700 font-bold text-[10px] p-[2px] leading-none rounded-sm shadow-sm z-10">PTR</span>);
          else if (isSnake) row.push(<span key={x} className="inline-block w-8 text-center text-gray-600 bg-gray-200 border border-gray-300 text-[10px] p-[2px] leading-none rounded-sm opacity-80">LOG</span>);
          else row.push(<span key={x} className="inline-block w-8 text-center text-gray-300 border border-transparent text-[10px] p-[2px] leading-none">···</span>);
        }
      }
      tiles.push(<div key={y} className="flex gap-[2px] mb-[2px] leading-none">{row}</div>);
    }
    return tiles;
  };

  return (
    <div className="h-full flex flex-col p-8 bg-white font-mono text-gray-800 focus:outline-none" tabIndex={0} onKeyDown={handleKeyDown} ref={gameRef}>
      
      {/* Tool Header */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <TerminalSquare className="w-5 h-5 text-gray-600" />
          <div>
            <h2 className="font-bold text-lg tracking-tight text-gray-800">진로 로드맵</h2>
            <div className="text-xs text-gray-500 mt-1">Runtime Sync Analysis & Network Traversal</div>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm">
           <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest text-right">Max Nodes</span>
              <span className="font-bold text-blue-600 text-right">{Math.max(highScore / 10, score / 10)}</span>
           </div>
           <div className="flex flex-col">
             <span className="text-[10px] text-gray-400 uppercase tracking-widest text-right">Status</span>
             <span className={`font-bold text-right flex items-center gap-2 ${gameOver ? 'text-red-500' : playing ? 'text-green-600' : 'text-yellow-600'}`}>
               {playing && !gameOver && <Activity className="w-3 h-3 animate-pulse" />}
               {gameOver ? 'ERR_CRITICAL' : playing ? 'ACTIVE_SYNC' : 'IDLE_WAIT'}
             </span>
           </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative touch-none bg-gray-50/50 rounded-lg p-4">
        
        {/* Terminal Screen Container */}
        <div className="relative bg-white p-2 rounded shadow-sm border border-gray-200 flex flex-col">
          
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200 text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">
            <span>Grid Pointer Instance 0x1A</span>
            <span>Current Size: {score / 10 + 3} Blocks</span>
          </div>

          <div className="relative p-2 text-xs sm:text-sm selection:bg-blue-100">
            
            {(!playing || gameOver) && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm border border-gray-200">
                <div className={`text-xl font-bold mb-2 flex items-center gap-3 ${gameOver ? 'text-red-600' : 'text-blue-800'}`}>
                   <Power className="w-6 h-6" />
                   {gameOver ? '프로세스 강제 종료 (Collision)' : '추적 대기 상태'}
                </div>
                {gameOver && <div className="text-gray-600 mb-6 font-mono text-sm">오류 원인: 메모리 누수 / 수집된 노드: {score / 10}</div>}
                <button 
                  onClick={initGame}
                  className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition rounded shadow-sm text-xs"
                >
                  {gameOver ? '초기화 후 재시작' : '프로세스 시작'}
                </button>
              </div>
            )}

            {renderGrid()}
          </div>
        </div>
        
        <div className="ml-8 hidden lg:block text-xs text-gray-500 leading-relaxed max-w-[200px] border-l border-gray-200 pl-4 py-4">
          <p className="font-bold mb-2 text-gray-700">관리자 가이드 (단축키):</p>
          <p>방향키를 사용하여 로그 포인터의 이동 경로를 지정하십시오.</p>
          <p className="mt-4 text-red-500/80 font-bold font-mono text-[10px] border p-2 bg-red-50/50 rounded">주의: 경로 중첩 또는 영역 이탈 시 즉각적인 프로세스 충돌이 발생합니다.</p>
        </div>
      </div>

      <div className="mt-6 text-[10px] text-gray-400 text-center uppercase tracking-widest flex justify-between">
        <span>Press ESC to drop session</span>
        <span>Version: 3.2.14</span>
      </div>
    </div>
  );
}
