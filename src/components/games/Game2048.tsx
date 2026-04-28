import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Table as TableIcon, RefreshCw, Download, Play } from 'lucide-react';

const GRADE_MAP: Record<number, { grade: string, colors: string }> = {
  2: { grade: 'F', colors: 'bg-red-50 text-red-700 border-red-200' },
  4: { grade: 'D', colors: 'bg-orange-50 text-orange-700 border-orange-200' },
  8: { grade: 'D+', colors: 'bg-amber-50 text-amber-700 border-amber-200' },
  16: { grade: 'C', colors: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  32: { grade: 'C+', colors: 'bg-lime-50 text-lime-700 border-lime-200' },
  64: { grade: 'B', colors: 'bg-green-50 text-green-700 border-green-200' },
  128: { grade: 'B+', colors: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  256: { grade: 'A', colors: 'bg-teal-50 text-teal-700 border-teal-200' },
  512: { grade: 'A+', colors: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  1024: { grade: '수석', colors: 'bg-blue-50 text-blue-700 border-blue-200 font-bold' },
  2048: { grade: '졸업!', colors: 'bg-indigo-600 text-white border-indigo-700 font-bold' },
};

export default function Game2048() {
  const { user } = useAuth();
  const [grid, setGrid] = useState<number[][]>([[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchHighScore = async () => {
      try {
        const q = query(
          collection(db, 'scores'),
          where('ownerId', '==', user.uid),
          where('game', '==', '2048'),
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
        game: '2048',
        score: finalScore,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'scores');
    }
  }, [user, highScore]);

  const addRandomTile = (currentGrid: number[][]) => {
    const emptyCells = [];
    for(let r=0; r<4; r++){
      for(let c=0; c<4; c++){
        if(currentGrid[r][c] === 0) emptyCells.push({r, c});
      }
    }
    if(emptyCells.length > 0){
      const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      currentGrid[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
    }
    return currentGrid;
  };

  const initGame = () => {
    let newGrid = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
    newGrid = addRandomTile(newGrid);
    newGrid = addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
    setPlaying(true);
    setTimeout(() => gameRef.current?.focus(), 50);
  };

  useEffect(() => {
    initGame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const slide = (row: number[]) => {
    let arr = row.filter(val => val);
    let missing = 4 - arr.length;
    let zeros = Array(missing).fill(0);
    arr = arr.concat(zeros);

    let gainedScore = 0;
    for (let i = 0; i < 3; i++) {
        if (arr[i] !== 0 && arr[i] === arr[i + 1]) {
            arr[i] = arr[i] * 2;
            arr[i + 1] = 0;
            gainedScore += arr[i];
        }
    }
    
    let arr2 = arr.filter(val => val);
    let missing2 = 4 - arr2.length;
    let zeros2 = Array(missing2).fill(0);
    arr2 = arr2.concat(zeros2);
    return { newRow: arr2, gainedScore };
  };

  const moveGrid = (direction: 'UP'|'DOWN'|'LEFT'|'RIGHT') => {
    if(!playing || gameOver) return;
    
    let newGrid = [...grid].map(row => [...row]);
    let totalGained = 0;
    let changed = false;

    const transpose = (matrix: number[][]) => matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));

    if(direction === 'UP' || direction === 'DOWN') newGrid = transpose(newGrid);

    for(let r=0; r<4; r++){
      let row = newGrid[r];
      if(direction === 'RIGHT' || direction === 'DOWN') row.reverse();
      const { newRow, gainedScore } = slide(row);
      if(direction === 'RIGHT' || direction === 'DOWN') newRow.reverse();
      
      if(newGrid[r].join(',') !== newRow.join(',')) changed = true;
      newGrid[r] = newRow;
      totalGained += gainedScore;
    }

    if(direction === 'UP' || direction === 'DOWN') newGrid = transpose(newGrid);

    if(changed){
      newGrid = addRandomTile(newGrid);
      setGrid(newGrid);
      setScore(s => s + totalGained);
    } else {
      let hasMoves = false;
      for(let r=0; r<4; r++){
        for(let c=0; c<4; c++){
          if(newGrid[r][c] === 0) hasMoves = true;
          if(c < 3 && newGrid[r][c] === newGrid[r][c+1]) hasMoves = true;
          if(r < 3 && newGrid[r][c] === newGrid[r+1][c]) hasMoves = true;
        }
      }
      if(!hasMoves){
        setGameOver(true);
        setPlaying(false);
        saveScore(score + totalGained);
      }
    }
  };

  return (
    <div className="h-full flex flex-col p-8 bg-gray-50 font-sans text-gray-800 focus:outline-none" tabIndex={0} onKeyDown={(e) => {
      // prevent default scroll
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
         e.preventDefault();
      }
      if(e.key === 'ArrowUp') moveGrid('UP');
      if(e.key === 'ArrowDown') moveGrid('DOWN');
      if(e.key === 'ArrowLeft') moveGrid('LEFT');
      if(e.key === 'ArrowRight') moveGrid('RIGHT');
    }} ref={gameRef}>
      
      {/* Spreadsheet Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-indigo-700">
           <TableIcon className="w-5 h-5" />
           <h2 className="font-semibold text-lg tracking-tight">학점 계산기</h2>
        </div>
        <div className="flex gap-2">
           <button onClick={initGame} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded transition" title="새로 계산">
             <RefreshCw className="w-4 h-4" />
           </button>
           <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded transition" title="내보내기">
             <Download className="w-4 h-4" />
           </button>
        </div>
      </div>
      
      {/* Formula Bar equivalent */}
      <div className="flex items-center border border-gray-300 bg-white px-3 py-1.5 rounded-sm shadow-sm mb-6 text-sm">
         <span className="text-gray-400 font-mono font-bold mr-3 italic">fx</span>
         <span className="flex-1 font-mono text-gray-700">
            =SUM(MERGE(GRADES, DIRECTION))
         </span>
         <span className="text-xs text-gray-500 border-l border-gray-200 pl-3">
             <span className="mr-3">MAX: {highScore}</span>
             SCORE: {score}
         </span>
      </div>

      <div className="flex-1 flex flex-col relative w-full max-w-3xl mx-auto bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
        
        {/* Spreadsheet Header Row */}
        <div className="bg-gray-100 flex border-b border-gray-300 select-none">
          <div className="w-10 flex-shrink-0 border-r border-gray-300"></div>
          {['A', 'B', 'C', 'D'].map(char => (
            <div key={char} className="flex-1 text-center py-1 text-xs font-semibold text-gray-500 border-r border-gray-200 last:border-0">{char}</div>
          ))}
        </div>

        <div className="flex-1 relative flex flex-col bg-[#fcfcfc]">
          {(!playing || gameOver) && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
              <div className="text-xl font-bold text-gray-700 mb-2">{gameOver ? '시뮬레이션 완료' : '시스템 준비됨'}</div>
              {gameOver && <div className="text-gray-600 mb-4 font-mono text-sm">최종 도출 학점 스코어: {score}</div>}
              <button 
                onClick={initGame}
                className="px-4 py-2 mt-2 bg-indigo-600 text-white text-sm font-semibold rounded hover:bg-indigo-700 transition shadow-sm flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                {gameOver ? '재실행 (Run again)' : '연산 시작 (Start)'}
              </button>
            </div>
          )}

          {/* Spreadsheet Body */}
          {grid.map((row, r) => (
            <div key={r} className="flex flex-1 border-b border-gray-200 last:border-0">
              <div className="w-10 flex-shrink-0 bg-gray-100 border-r border-gray-300 flex items-center justify-center text-xs font-semibold text-gray-500 select-none">
                {r + 1}
              </div>
              {row.map((cell, c) => {
                const display = GRADE_MAP[cell];
                return (
                  <div 
                    key={c} 
                    className="flex-1 border-r border-gray-100 last:border-0 relative flex items-center justify-center p-1"
                  >
                    {cell > 0 && (
                      <div className={`w-full h-full flex flex-col items-center justify-center border shadow-sm transition-all duration-150 ${display.colors}`}>
                         <span className="font-bold sm:text-lg">{display.grade}</span>
                         <span className="text-[10px] opacity-70 font-mono tracking-tighter">{cell}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4 text-center text-xs text-gray-400 font-mono">
        USE ARROW KEYS MAPPED TO ARRAY DIRECTIONAL VECTORS (↑ ↓ ← →)
      </div>
    </div>
  );
}
