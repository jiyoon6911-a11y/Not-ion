import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Terminal, Bug, Play, Flag, Cpu } from 'lucide-react';

const ROWS = 16;
const COLS = 16;
const MINES = 40;

interface Cell {
  r: number;
  c: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

export default function Minesweeper() {
  const { user } = useAuth();
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [flags, setFlags] = useState(0);
  const [timePassed, setTimePassed] = useState(0);
  const [bestTime, setBestTime] = useState(Infinity);

  // Fetch High Score (Best Time)
  useEffect(() => {
    if (!user) return;
    const fetchHighScore = async () => {
      try {
        const q = query(
          collection(db, 'scores'),
          where('ownerId', '==', user.uid),
          where('game', '==', 'minesweeper'),
          orderBy('score', 'asc'), // Ascending because lower time is better
          limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setBestTime(querySnapshot.docs[0].data().score);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchHighScore();
  }, [user]);

  const saveScore = useCallback(async (time: number) => {
    if (!user || time === 0) return;
    if (time < bestTime) setBestTime(time);
    try {
      await addDoc(collection(db, 'scores'), {
        ownerId: user.uid,
        game: 'minesweeper',
        score: time,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'scores');
    }
  }, [user, bestTime]);

  const initGrid = useCallback(() => {
    const newGrid: Cell[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < COLS; c++) {
        row.push({
          r, c,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
        });
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
    setGameState('playing');
    setFlags(0);
    setTimePassed(0);
  }, []);

  useEffect(() => {
    if (gameState === 'idle') initGrid();
  }, [gameState, initGrid]);

  useEffect(() => {
    let timer: any;
    if (gameState === 'playing') {
      timer = setInterval(() => {
        setTimePassed(t => t + 1);
      }, 1000);
    } else if (gameState === 'won') {
      saveScore(timePassed);
    }
    return () => clearInterval(timer);
  }, [gameState, saveScore, timePassed]);

  const placeMines = (firstR: number, firstC: number, currentGrid: Cell[][]) => {
    let minesPlaced = 0;
    while (minesPlaced < MINES) {
      const mr = Math.floor(Math.random() * ROWS);
      const mc = Math.floor(Math.random() * COLS);
      // Avoid first click location and existing mines
      if ((mr !== firstR || mc !== firstC) && !currentGrid[mr][mc].isMine) {
        currentGrid[mr][mc].isMine = true;
        minesPlaced++;
      }
    }

    // Calc neighbors
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!currentGrid[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (r + dr >= 0 && r + dr < ROWS && c + dc >= 0 && c + dc < COLS) {
                if (currentGrid[r + dr][c + dc].isMine) count++;
              }
            }
          }
          currentGrid[r][c].neighborMines = count;
        }
      }
    }
  };

  const revealCell = (r: number, c: number) => {
    if (gameState !== 'playing') return;
    const newGrid = [...grid].map(row => [...row].map(cell => ({...cell})));
    const cell = newGrid[r][c];
    
    if (cell.isRevealed || cell.isFlagged) return;

    // Place mines on first click
    let isFirstClick = true;
    for(let i=0; i<ROWS; i++){
      for(let j=0; j<COLS; j++){
        if (grid[i][j].isRevealed) isFirstClick = false;
      }
    }

    if (isFirstClick) {
      placeMines(r, c, newGrid);
    }

    if (newGrid[r][c].isMine) {
      // Game over
      newGrid.forEach(row => row.forEach(c => {
        if (c.isMine) c.isRevealed = true;
      }));
      setGrid(newGrid);
      setGameState('lost');
      return;
    }

    // Flood fill algorithm for revealing empty cells
    const queue = [[r, c]];
    while (queue.length > 0) {
      const [currR, currC] = queue.shift()!;
      const currCell = newGrid[currR][currC];
      
      if (!currCell.isRevealed && !currCell.isFlagged) {
        currCell.isRevealed = true;
        if (currCell.neighborMines === 0) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = currR + dr;
              const nc = currC + dc;
              if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                if (!newGrid[nr][nc].isRevealed) {
                  queue.push([nr, nc]);
                }
              }
            }
          }
        }
      }
    }

    setGrid(newGrid);

    // Check win condition
    let unrevealedSafeCells = 0;
    newGrid.forEach(row => row.forEach(c => {
      if (!c.isMine && !c.isRevealed) unrevealedSafeCells++;
    }));
    if (unrevealedSafeCells === 0) {
      setGameState('won');
    }
  };

  const toggleFlag = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameState !== 'playing') return;
    
    const newGrid = [...grid].map(row => [...row].map(cell => ({...cell})));
    const cell = newGrid[r][c];
    
    if (!cell.isRevealed) {
      if (!cell.isFlagged && flags < MINES) {
        cell.isFlagged = true;
        setFlags(f => f + 1);
      } else if (cell.isFlagged) {
        cell.isFlagged = false;
        setFlags(f => f - 1);
      }
      setGrid(newGrid);
    }
  };

  const toHex = (num: number) => num.toString(16).padStart(2, '0').toUpperCase();

  return (
    <div className="h-full flex flex-col p-8 bg-gray-50 font-sans text-gray-800">
      <div className="flex justify-between items-end mb-6 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <Terminal className="w-6 h-6 text-indigo-600" />
          <div>
            <h2 className="font-bold text-xl tracking-tight text-gray-800">체크리스트</h2>
            <div className="text-xs text-gray-500 mt-1">MEMORY_NODE_ANALYSIS_TOOL v1.4.2</div>
          </div>
        </div>
        <div className="text-right flex items-center gap-6">
          <div className="flex flex-col items-end">
             <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">BEST (SEC)</span>
             <span className="text-lg font-bold text-indigo-600">{bestTime === Infinity ? 'N/A' : bestTime}</span>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">CLOCK</span>
             <span className="text-lg font-bold text-gray-700">{timePassed}</span>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">REMAINING FLAGS</span>
             <span className="text-lg font-bold text-gray-700">{MINES - flags}</span>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">SYS_STATUS</span>
             <span className={`text-lg font-bold flex items-center gap-2 ${gameState === 'won' ? 'text-green-600' : gameState === 'lost' ? 'text-red-500' : 'text-blue-600'}`}>
               {gameState.toUpperCase()}
             </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative touch-none bg-white border border-gray-200 rounded-xl shadow-sm p-4">
        {(gameState === 'won' || gameState === 'lost') && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl">
            <div className={`flex items-center gap-3 text-2xl font-bold mb-2 tracking-tight ${gameState === 'won' ? 'text-emerald-600' : 'text-red-600'}`}>
              {gameState === 'won' ? <Cpu className="w-8 h-8" /> : <Bug className="w-8 h-8" />}
              {gameState === 'won' ? '검증 완료 (Anomaly Isolated)' : '치명적 오류 발생 (Mines Tripped)'}
            </div>
            {gameState === 'won' && <div className="text-gray-600 font-mono mb-4 text-sm">소요 시간: {timePassed} 초</div>}
            <button 
              onClick={initGrid}
              className="mt-4 px-6 py-2.5 bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition rounded-md shadow-sm"
            >
               재검사 시작
            </button>
          </div>
        )}

        <div className="inline-block p-1 bg-gray-100 border border-gray-300 rounded shadow-sm overflow-hidden relative">
          
          {grid.map((row, r) => (
            <div key={r} className="flex">
              {/* Row Header (Hex) */}
              <div className="w-6 sm:w-8 flex items-center justify-center text-[10px] sm:text-xs text-gray-400 select-none bg-gray-50 border-r border-b border-gray-200">
                0x{toHex(r)}
              </div>
              
              {row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  onClick={() => revealCell(r, c)}
                  onContextMenu={(e) => toggleFlag(e, r, c)}
                  className={`relative w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-[10px] sm:text-xs font-bold cursor-pointer select-none border-r border-b
                    ${cell.isRevealed ? 
                      (cell.isMine ? 'bg-red-50 border-red-200 text-red-500 shadow-inner' : 'bg-white border-gray-200 text-gray-700 shadow-inner') : 
                      'bg-gray-100 hover:bg-gray-200 border-gray-300 shadow-[inset_-1px_-1px_2px_rgba(0,0,0,0.05),inset_1px_1px_2px_rgba(255,255,255,0.8)]'
                    }
                  `}
                >
                  {cell.isRevealed ? (
                    cell.isMine ? <Bug className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" /> : (cell.neighborMines > 0 ? (
                      <span className={
                        cell.neighborMines === 1 ? 'text-blue-600' :
                        cell.neighborMines === 2 ? 'text-emerald-600' :
                        cell.neighborMines === 3 ? 'text-red-500' :
                        cell.neighborMines === 4 ? 'text-purple-600' :
                        cell.neighborMines === 5 ? 'text-orange-600' : 'text-gray-800'
                      }>{cell.neighborMines}</span>
                    ) : '')
                  ) : (
                    cell.isFlagged ? <Flag className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 fill-red-500" /> : ''
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex justify-between items-center text-xs text-gray-400 tracking-wider">
        <span>취소: ESC 키</span>
        <span>좌클릭: 노드 스캔 | 우클릭: 의심 마커 표시</span>
      </div>
    </div>
  );
}
