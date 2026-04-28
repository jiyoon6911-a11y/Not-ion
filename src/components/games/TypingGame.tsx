import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Keyboard, ShieldAlert, Award } from 'lucide-react';

const TEXTS = [
  "공자는 물었다. '배우고 때때로 그것을 익히면 또한 기쁘지 아니한가? 벗이 먼 곳에서 찾아오면 또한 즐겁지 아니한가? 남이 알아주지 않아도 성내지 않는다면 또한 군자답지 아니한가?'",
  "인공지능은 컴퓨터 공학의 이상향 중 하나로, 인간의 지능이 가지는 학습, 추론, 지각, 자연언어 이해능력 등을 컴퓨터 프로그램으로 실현한 기술이다.",
  "현대 사회에서는 정보화가 급격하게 진행되면서 수많은 데이터가 매일 생성되고 있다. 이를 효율적으로 처리하고 분석하는 능력이 갈수록 중요해지고 있다.",
  "소프트웨어 공학은 소프트웨어의 개발, 운용, 유지보수, 폐기 처분에 이르는 모든 과정에 대하여 체계적이고 구문론적인 접근 방식을 적용하는 학문이다.",
  "데이터베이스는 여러 사람이 공유하고 사용할 목적으로 통합 관리되는 데이터의 집합이다. 검색과 갱신 등 자료의 처리를 신속하고 정확하게 수행하도록 구성되어 있다.",
  "네트워크는 노드들이 자원을 공유할 수 있게 하는 통신망이다. 망을 구성하는 컴퓨터 및 통신 장비들은 서로 논리적인, 혹은 물리적인 연결을 통하여 데이터를 주고받는다.",
  "운영체제는 하드웨어를 제어하고, 응용 프로그램과 사용자에게 편리한 인터페이스를 제공하는 시스템 소프트웨어다. 컴퓨터의 한정된 자원을 효율적으로 분배하는 역할을 한다."
];

const FALLING_WORDS = [
  '알고리즘', '운영체제', '인공지능', '데이터베이스', '네트워크', '컴파일러', 
  '소프트웨어', '프로그래밍', '컴퓨터구조', '자료구조', '머신러닝', '딥러닝',
  '블록체인', '클라우드', '빅데이터', '메타버스', '프론트엔드', '백엔드',
  '객체지향', '리눅스', '서버', '컨테이너', '자바스크립트', '파이썬', '타입스크립트'
];

type FallingWord = {
  id: number;
  word: string;
  x: number; // percentage width
  y: number; // percentage height
  speed: number;
};

export default function TypingGame() {
  const { user } = useAuth();
  const [mode, setMode] = useState<'transcription' | 'falling'>('transcription');

  // --- Transcription State ---
  const [textIndex, setTextIndex] = useState(0);
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [transcriptionHighScore, setTranscriptionHighScore] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // --- Falling State ---
  const [words, setWords] = useState<FallingWord[]>([]);
  const [fallingInput, setFallingInput] = useState('');
  const [fallingScore, setFallingScore] = useState(0);
  const [fallingHighScore, setFallingHighScore] = useState(0);
  const [fallingHealth, setFallingHealth] = useState(5);
  const [fallingPlaying, setFallingPlaying] = useState(false);
  const [fallingGameOver, setFallingGameOver] = useState(false);
  const fallingInputRef = useRef<HTMLInputElement>(null);
  const wordIdRef = useRef(0);

  const targetText = TEXTS[textIndex];

  // --- Fetch High Scores ---
  useEffect(() => {
    if (!user) return;
    const fetchHighScores = async () => {
      try {
        const fetchScore = async (gameId: string) => {
          const q = query(
            collection(db, 'scores'),
            where('ownerId', '==', user.uid),
            where('game', '==', gameId),
            orderBy('score', 'desc'),
            limit(1)
          );
          const snap = await getDocs(q);
          return snap.empty ? 0 : snap.docs[0].data().score;
        };

        const [tScore, fScore] = await Promise.all([
          fetchScore('typing_transcription'),
          fetchScore('typing_falling')
        ]);
        
        setTranscriptionHighScore(tScore);
        setFallingHighScore(fScore);
      } catch (error) {
        console.error(error);
      }
    };
    fetchHighScores();
  }, [user]);

  const saveScore = useCallback(async (finalScore: number, gameMode: string) => {
    if (!user || finalScore === 0) return;
    
    // Update local max immediately
    if (gameMode === 'transcription' && finalScore > transcriptionHighScore) {
      setTranscriptionHighScore(finalScore);
    } else if (gameMode === 'falling' && finalScore > fallingHighScore) {
      setFallingHighScore(finalScore);
    }

    try {
      await addDoc(collection(db, 'scores'), {
        ownerId: user.uid,
        game: `typing_${gameMode}`,
        score: finalScore,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'scores');
    }
  }, [user, transcriptionHighScore, fallingHighScore]);

  // --- Common Effects ---
  useEffect(() => {
    if (mode === 'transcription' && inputRef.current) {
      inputRef.current.focus();
    } else if (mode === 'falling' && fallingPlaying && fallingInputRef.current) {
      fallingInputRef.current.focus();
    }
  }, [textIndex, mode, fallingPlaying]);

  // --- Transcription Logic ---
  useEffect(() => {
    if (mode === 'transcription' && input.length === targetText.length && startTime) {
      const timeTaken = (Date.now() - startTime) / 1000 / 60; // in minutes
      const wordCount = targetText.length / 5;
      const wpmCalc = Math.round(wordCount / timeTaken);
      setWpm(wpmCalc);

      let correctChars = 0;
      for (let i = 0; i < targetText.length; i++) {
        if (input[i] === targetText[i]) correctChars++;
      }
      const acc = Math.round((correctChars / targetText.length) * 100);
      setAccuracy(acc);
      const finalScore = Math.round(wpmCalc * (acc / 100));
      saveScore(finalScore, 'transcription');
    }
  }, [input, targetText, startTime, mode, saveScore]);

  const handleTranscriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length === 1 && !startTime) {
      setStartTime(Date.now());
    }
    if (val.length <= targetText.length) {
      setInput(val);
    }
  };

  const handleRestartTranscription = () => {
    setInput('');
    setStartTime(null);
    setWpm(null);
    setAccuracy(null);
    setTextIndex((i) => (i + 1) % TEXTS.length);
    if (inputRef.current) inputRef.current.focus();
  };

  // --- Falling Logic ---
  const spawnWord = useCallback(() => {
    const text = FALLING_WORDS[Math.floor(Math.random() * FALLING_WORDS.length)];
    const wordObj: FallingWord = {
      id: wordIdRef.current++,
      word: text,
      x: 5 + Math.random() * 80, // 5% to 85% width
      y: -10,
      speed: 0.3 + Math.random() * 0.7 + (fallingScore / 500) * 0.5,
    };
    setWords(prev => [...prev, wordObj]);
  }, [fallingScore]);

  useEffect(() => {
    let spawnTimer: any;
    let moveTimer: any;
    if (mode === 'falling' && fallingPlaying && !fallingGameOver) {
      spawnTimer = setInterval(spawnWord, Math.max(800, 2500 - fallingScore * 10)); 
      moveTimer = setInterval(() => {
        setWords(prev => {
          const next = prev.map(w => ({ ...w, y: w.y + w.speed }));
          const missed = next.filter(w => w.y > 100);
          if (missed.length > 0) {
            setFallingHealth(h => {
               const newHealth = h - missed.length;
               if (newHealth <= 0) {
                 setFallingGameOver(true);
                 setFallingPlaying(false);
               }
               return newHealth;
            });
          }
          return next.filter(w => w.y <= 100);
        });
      }, 50);
    }
    return () => {
      clearInterval(spawnTimer);
      clearInterval(moveTimer);
    }
  }, [mode, fallingPlaying, fallingGameOver, spawnWord, fallingScore]);

  useEffect(() => {
    if (fallingGameOver && fallingScore > 0) {
      saveScore(fallingScore, 'falling');
    }
  }, [fallingGameOver, fallingScore, saveScore]);

  const handleFallingInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFallingInput(val);
    
    // Automatically check for match without enter
    const matchedIndex = words.findIndex(w => w.word === val);
    if (matchedIndex !== -1) {
      const newWords = [...words];
      newWords.splice(matchedIndex, 1);
      setWords(newWords);
      setFallingInput('');
      setFallingScore(s => s + 10);
    }
  };

  const startFallingGame = () => {
    setWords([]);
    setFallingInput('');
    setFallingScore(0);
    setFallingHealth(5);
    setFallingGameOver(false);
    setFallingPlaying(true);
    setTimeout(() => {
      fallingInputRef.current?.focus();
    }, 100);
  };

  return (
    <div className="h-full flex flex-col px-8 sm:px-16 py-8 sm:py-12 max-w-5xl mx-auto w-full relative bg-gray-50/50">
      <div className="flex justify-between items-start mb-8 border-b border-gray-200 pb-6 shrink-0 flex-col md:flex-row gap-4">
        <div className="flex gap-4 items-start">
           <div className="p-3 bg-blue-100 text-blue-700 rounded-lg shrink-0 mt-1">
             <Keyboard className="w-6 h-6" />
           </div>
           <div>
             <h2 className="text-gray-400 text-xs tracking-[0.2em] uppercase font-bold mb-1">데이터 입력 및 처리 능력 진단</h2>
             <div className="text-2xl font-bold tracking-tight text-gray-800">
               {mode === 'transcription' ? '필기 속도 측정 (WPM/ACC)' : '순차적 데이터 검증 테스트'}
             </div>
           </div>
        </div>
        
        <div className="flex flex-col items-end gap-3 w-full md:w-auto">
          <div className="flex gap-4 w-full md:w-auto justify-end">
            <div className="flex flex-col items-end px-4 py-1.5 bg-white border border-gray-200 rounded shadow-sm">
               <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                 <Award className="w-3 h-3" /> BEST
               </span>
               <span className="font-mono font-bold text-gray-700">
                 {mode === 'transcription' ? Math.round(transcriptionHighScore) || 0 : fallingHighScore}
               </span>
            </div>
            
            <button 
              onClick={() => {
                setMode(m => {
                  if (m === 'transcription') {
                    startFallingGame();
                    return 'falling';
                  } else {
                    return 'transcription';
                  }
                });
              }}
              className="text-xs px-4 py-1.5 bg-gray-800 text-white hover:bg-gray-700 rounded shadow-sm font-bold transition whitespace-nowrap"
            >
              측정 모드 변경
            </button>
          </div>
          
          <div className="flex gap-4 mt-2 border-t border-gray-200 pt-3 w-full justify-end">
            {mode === 'transcription' && wpm !== null && (
              <>
                <div className="text-xs text-gray-500 font-mono">
                  WPM: <span className="font-bold text-lg text-blue-600">{wpm}</span>
                </div>
                <div className="text-xs text-gray-500 font-mono">
                  ACC: <span className="font-bold text-lg text-emerald-600">{accuracy}%</span>
                </div>
              </>
            )}
            {mode === 'falling' && (
              <>
                <div className="text-xs text-gray-500 font-mono">
                  SCORE: <span className="font-bold text-lg text-blue-600">{fallingScore}</span>
                </div>
                <div className="text-xs text-gray-500 font-mono flex items-center gap-2">
                  ERRORS ALLOWED: <span className={`font-bold text-lg flex items-center gap-1 ${fallingHealth <= 2 ? 'text-orange-500' : 'text-gray-700'}`}>
                    <Award className="w-4 h-4" /> {fallingHealth}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {mode === 'transcription' ? (
        <div className="flex-1 flex flex-col relative bg-white border border-gray-200 rounded-xl shadow-sm p-8 cursor-text mt-4" onClick={() => inputRef.current?.focus()}>
          
          {!startTime && wpm === null && (
            <div className="absolute -top-12 right-0 z-20" onClick={(e) => e.stopPropagation()}>
              <select
                className="text-sm border border-gray-200 rounded-lg px-4 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold cursor-pointer shadow-sm"
                value={textIndex}
                onChange={(e) => {
                  setTextIndex(Number(e.target.value));
                  setInput('');
                }}
              >
                {TEXTS.map((t, idx) => (
                  <option key={idx} value={idx}>
                    지문 {idx + 1}: {t.substring(0, 15)}...
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="font-serif text-xl sm:text-2xl leading-[2.5] text-gray-400 select-none">
            {targetText.split('').map((char, i) => {
              let charClass = "transition-all duration-75 relative";
              if (i < input.length) {
                if (input[i] === char) {
                  charClass = "text-gray-800"; // Correct
                } else {
                  charClass = "text-red-600 font-bold underline decoration-red-300 decoration-2 underline-offset-4 bg-red-50"; // Incorrect
                }
              } else if (i === input.length) {
                charClass = "text-blue-500 bg-blue-50/50 outline outline-2 outline-blue-400 outline-offset-2 rounded-sm shadow-[0_0_8px_rgba(59,130,246,0.5)] z-10 font-bold"; // Cursor
              }
              return <span key={i} className={charClass}>{char}</span>;
            })}
          </div>

          <textarea
            ref={inputRef}
            value={input}
            onChange={handleTranscriptionChange}
            className="absolute w-px h-px opacity-0 -left-[9999px]"
            autoComplete="off"
            spellCheck="false"
          />

          {wpm !== null && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-xl flex-col">
              <div className="text-2xl font-bold font-mono text-gray-800 mb-6 flex items-center gap-6">
                 <div className="text-center">
                    <div className="text-sm text-gray-500 uppercase tracking-widest mb-1">Final Score</div>
                    <div className="text-4xl text-blue-600">{Math.round(wpm * (accuracy! / 100))}</div>
                 </div>
              </div>
              <button 
                onClick={handleRestartTranscription}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition shadow-lg shadow-blue-600/20"
              >
                다음 진단 테스트
              </button>
            </div>
          )}
        </div>
      ) : (
        <div 
          className="flex-1 flex flex-col relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm cursor-text" 
          onClick={() => fallingInputRef.current?.focus()}
        >
          {(!fallingPlaying || fallingGameOver) && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
              <div className={`text-2xl font-bold mb-2 tracking-tight ${fallingGameOver ? 'text-red-500' : 'text-gray-800'}`}>
                 {fallingGameOver ? '동적 인지 측정 실패 (허용치 초과)' : '동적 인지 추적 시스템 대기중'}
              </div>
              {fallingGameOver && <div className="text-gray-500 mb-8 font-mono text-sm max-w-sm text-center">측정 프로세스 종료. 최종 도출 점수: <span className="text-gray-900 font-bold text-xl">{fallingScore}</span></div>}
              <button 
                onClick={startFallingGame}
                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
              >
                {fallingGameOver ? '진단 초기화 후 재시작' : '동적 진단 테스트 시작'}
              </button>
            </div>
          )}

          {/* Radar scanline effect - subtle professional */}
          <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.05)_50%)] bg-[length:100%_4px] z-10"></div>

          {/* Canvas Area */}
          <div className="flex-1 relative overflow-hidden pointer-events-none bg-gray-50/50">
            {words.map(w => (
              <div 
                key={w.id} 
                className="absolute font-bold px-3 py-1.5 border border-gray-200 bg-white rounded shadow-sm transition-all whitespace-nowrap z-0 text-sm flex items-center justify-center font-mono text-gray-700"
                style={{ 
                   left: `${w.x}%`, 
                   top: `${w.y}%`, 
                   transform: 'translateX(-50%)'
                }}
              >
                {w.word}
              </div>
            ))}
            
            {/* Danger Zone Line */}
            <div className="absolute bottom-16 left-0 right-0 border-t border-gray-300 bg-gray-100/50 h-16 pointer-events-none z-0 flex items-end pb-2 justify-center">
              <span className="text-xs text-gray-400 font-bold tracking-widest leading-none">시간 초과 임계선 (Timeout Threshold)</span>
            </div>
          </div>

          {/* Input Area */}
          <div className="h-24 border-t border-gray-200 bg-white flex flex-col items-center justify-center p-4 relative z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
             <input
               ref={fallingInputRef}
               type="text"
               value={fallingInput}
               onChange={handleFallingInput}
               disabled={!fallingPlaying || fallingGameOver}
               className="w-full max-w-md px-6 py-3 bg-white border-2 border-gray-300 text-gray-800 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition disabled:opacity-50 text-center font-bold text-lg tracking-wider placeholder-gray-400"
               placeholder="대상 단어를 입력하여 소거..."
               autoComplete="off"
               spellCheck="false"
             />
          </div>
        </div>
      )}
      
      <div className="mt-8 shrink-0 text-xs text-gray-400 text-center uppercase tracking-widest pb-4">
        긴급 종료: ESC 키 홈 화면 복귀
      </div>
    </div>
  );
}
