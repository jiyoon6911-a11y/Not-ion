import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Search } from 'lucide-react';
import Sidebar from './components/Sidebar';
import FacadeNotes from './components/FacadeNotes';
import TypingGame from './components/games/TypingGame';
import AppleGame from './components/games/AppleGame';
import Minesweeper from './components/games/Minesweeper';
import TetrisGame from './components/games/TetrisGame';
import Game2048 from './components/games/Game2048';
import SnakeGame from './components/games/SnakeGame';
import BossGame from './components/games/BossGame';
import RulesModal from './components/RulesModal';
import SecretBrowserPiP from './components/SecretBrowserPiP';
import SecretChat from './components/SecretChat';
import { useAuth } from './lib/AuthContext';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

export type AppMode = 'notes' | 'typing' | 'apple' | 'minesweeper' | 'tetris' | '2048' | 'snake' | string;

export default function App() {
  const { user } = useAuth();
  const [activeMode, setActiveMode] = useState<AppMode>('notes');
  const [activeNoteContent, setActiveNoteContent] = useState('[x] <strong>딴</strong> 필기에 집중하여 최적의 학업 효율을 만들어 보세요.\n[ ] <strong>짓</strong>눌린 일정 속에서 잠시 나만의 여유를 갖는 법을 배워보세요.\n[ ] <strong>하</strong>나의 페이지에서 모든 복잡한 과제를 관리할 수 있습니다.\n[ ] <strong>러</strong>닝 타임 내내 당신의 열정을 실시간으로 기록하세요.\n[ ] <strong>왔</strong>다 갔다 하는 마우스 커서는 이제 그만, 한 곳에 정착하세요.\n[ ] <strong>니</strong>즈(Needs)에 맞는 완벽한 디지털 공간이 여기 준비되어 있습니다.');
  const [activeNoteTitle, setActiveNoteTitle] = useState('👋not-ion에 오신 것을 환영합니다!');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [xrayMode, setXrayMode] = useState(false);
  const [showPiP, setShowPiP] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // To avoid saving on first load
  const isInitialLoad = useRef(true);

  // Load Note
  useEffect(() => {
    isInitialLoad.current = true;
    if (activeMode === 'notes' && user) {
      const fetchRootNote = async () => {
        try {
          const q = query(collection(db, 'notes'), where('folderId', '==', 'root'), where('ownerId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          if (querySnapshot.empty) {
            setActiveNoteTitle('👋not-ion에 오신 것을 환영합니다!');
            setActiveNoteContent('[x] <strong>딴</strong> 필기에 집중하여 최적의 학업 효율을 만들어 보세요.\n[ ] <strong>짓</strong>눌린 일정 속에서 잠시 나만의 여유를 갖는 법을 배워보세요.\n[ ] <strong>하</strong>나의 페이지에서 모든 복잡한 과제를 관리할 수 있습니다.\n[ ] <strong>러</strong>닝 타임 내내 당신의 열정을 실시간으로 기록하세요.\n[ ] <strong>왔</strong>다 갔다 하는 마우스 커서는 이제 그만, 한 곳에 정착하세요.\n[ ] <strong>니</strong>즈(Needs)에 맞는 완벽한 디지털 공간이 여기 준비되어 있습니다.');
            setActiveNoteId(`new_root`);
          } else {
            const noteDoc = querySnapshot.docs[0];
            setActiveNoteTitle(noteDoc.data().title);
            setActiveNoteContent(noteDoc.data().content);
            setActiveNoteId(noteDoc.id);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setTimeout(() => { isInitialLoad.current = false; }, 100);
        }
      };
      fetchRootNote();
      return;
    } else if (activeMode === 'notes') {
      setActiveNoteTitle('👋not-ion에 오신 것을 환영합니다!');
      setActiveNoteContent('[x] <strong>딴</strong> 필기에 집중하여 최적의 학업 효율을 만들어 보세요.\n[ ] <strong>짓</strong>눌린 일정 속에서 잠시 나만의 여유를 갖는 법을 배워보세요.\n[ ] <strong>하</strong>나의 페이지에서 모든 복잡한 과제를 관리할 수 있습니다.\n[ ] <strong>러</strong>닝 타임 내내 당신의 열정을 실시간으로 기록하세요.\n[ ] <strong>왔</strong>다 갔다 하는 마우스 커서는 이제 그만, 한 곳에 정착하세요.\n[ ] <strong>니</strong>즈(Needs)에 맞는 완벽한 디지털 공간이 여기 준비되어 있습니다.');
      setActiveNoteId(null);
      isInitialLoad.current = false;
      return;
    }

    if (activeMode.startsWith('note_') && user) {
      const folderId = activeMode.split('_')[1];
      const fetchNote = async () => {
        try {
          const q = query(collection(db, 'notes'), where('folderId', '==', folderId), where('ownerId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          if (querySnapshot.empty) {
            // Note doesn't exist for this folder, we'll create it when user types
            setActiveNoteTitle('새 노트');
            setActiveNoteContent('');
            setActiveNoteId(`new_${folderId}`);
          } else {
            const noteDoc = querySnapshot.docs[0];
            setActiveNoteTitle(noteDoc.data().title);
            setActiveNoteContent(noteDoc.data().content);
            setActiveNoteId(noteDoc.id);
          }
        } catch (error) {
          console.error(error);
          setActiveNoteTitle('로드 실패');
          setActiveNoteContent('노트를 불러올 수 없습니다.');
        } finally {
          setTimeout(() => { isInitialLoad.current = false; }, 100);
        }
      };
      fetchNote();
    } else {
       isInitialLoad.current = false;
    }
  }, [activeMode, user]);

  // Save Note Auto
  useEffect(() => {
    if (isInitialLoad.current || (!activeMode.startsWith('note_') && activeMode !== 'notes') || !user) return;
    
    setSaveStatus('saving');
    const saveNote = async () => {
      if (!activeNoteId) {
        setSaveStatus('idle');
        return;
      }
      
      try {
        if (activeNoteId.startsWith('new_')) {
          const folderId = activeNoteId.split('_')[1];
          const newDoc = await addDoc(collection(db, 'notes'), {
            ownerId: user.uid,
            folderId: folderId,
            title: activeNoteTitle,
            content: activeNoteContent,
            updatedAt: serverTimestamp(),
          });
          setActiveNoteId(newDoc.id);
        } else {
          await updateDoc(doc(db, 'notes', activeNoteId), {
            title: activeNoteTitle,
            content: activeNoteContent,
            updatedAt: serverTimestamp(),
          });
        }
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error(error);
        setSaveStatus('idle');
      }
    };

    const timeoutId = setTimeout(saveNote, 1000); // 1s debounce
    return () => clearTimeout(timeoutId);
  }, [activeNoteContent, activeNoteTitle, activeNoteId, activeMode, user]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMode('notes');
        setXrayMode(false);
        setShowRules(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isGameMode = activeMode !== 'notes' && activeMode !== 'chat' && !activeMode.startsWith('note_');

  return (
    <div className={`flex h-screen bg-white text-gray-800 font-sans selection:bg-blue-100 ${xrayMode ? 'xray-active' : ''}`}>
      <Sidebar 

        activeMode={activeMode} 
        onSelectMode={(mode, id) => {
          setActiveMode(mode);
        }} 
        xrayMode={xrayMode}
        onSettingsClick={() => setShowPiP(true)}
      />
      <main className="flex-1 overflow-hidden relative bg-white flex flex-col">
        {(activeMode === 'notes' || activeMode.startsWith('note_')) && (
           <FacadeNotes 
             activeMode={activeMode} 
             noteId={activeNoteId} 
             content={activeNoteContent} 
             setContent={setActiveNoteContent}
             title={activeNoteTitle}
             setTitle={setActiveNoteTitle} 
             onSelectMode={setActiveMode}
             xrayMode={xrayMode}
             setXrayMode={setXrayMode}
             saveStatus={saveStatus}
           />
        )}
        {activeMode === 'chat' && <SecretChat xrayMode={xrayMode} />}
        {activeMode === 'typing' && <TypingGame />}
        {activeMode === 'apple' && <AppleGame />}
        {activeMode === 'minesweeper' && <Minesweeper />}
        {activeMode === 'tetris' && <TetrisGame />}
        {activeMode === '2048' && <Game2048 />}
        {activeMode === 'snake' && <SnakeGame />}
        {activeMode === 'boss_game' && <BossGame />}
      </main>

      {isGameMode && showRules && <RulesModal onClose={() => setShowRules(false)} activeMode={activeMode} />}
      {showPiP && <SecretBrowserPiP onClose={() => setShowPiP(false)} />}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
        <button 
          className="bg-red-500/90 backdrop-blur border border-red-600 text-white hover:bg-red-600 p-3 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:shadow-[0_0_25px_rgba(239,68,68,0.8)] transition-all flex items-center justify-center group"
          onClick={() => setActiveMode('boss_game')}
        >
          <div className="w-6 h-6 flex items-center justify-center font-bold">!</div>
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 ease-in-out font-bold text-sm">진짜 공부모드</span>
        </button>

        <button 
          className={`bg-white/90 backdrop-blur border border-gray-300 ${xrayMode ? 'text-green-500 border-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'text-gray-500 hover:text-gray-800'} hover:bg-gray-50 p-3 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group`}
          onClick={() => setXrayMode(!xrayMode)}
        >
          <Search className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 ease-in-out font-medium text-sm">X-Ray 탐지기</span>
        </button>

        {isGameMode && (
          <button 
            className="bg-white/90 backdrop-blur border border-gray-300 text-gray-500 hover:text-gray-800 hover:bg-gray-50 p-3 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
            onClick={() => setShowRules(true)}
          >
            <BookOpen className="w-6 h-6" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 ease-in-out font-medium text-sm">학술 가이드 열람</span>
          </button>
        )}
      </div>

      {xrayMode && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden mix-blend-screen">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%),linear-gradient(90deg,rgba(0,255,0,0.06),rgba(0,255,0,0.02),rgba(0,255,0,0.06))] bg-[length:100%_4px,3px_100%] opacity-30"></div>
          <div className="absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent via-green-400/30 to-transparent animate-scanline"></div>
        </div>
      )}
    </div>
  );
}
