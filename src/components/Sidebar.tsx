import React, { useState, useEffect } from 'react';
import { Book, FileText, Folder as FolderIcon, Clock, Hash, Cpu, Calendar, LogIn, LogOut, Plus, Calculator, Settings, HelpCircle, Activity } from 'lucide-react';
import { AppMode } from '../App';
import { useAuth } from '../lib/AuthContext';
import { collection, addDoc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface SidebarProps {
  activeMode: AppMode;
  onSelectMode: (mode: AppMode, noteId?: string) => void;
  xrayMode?: boolean;
  onSettingsClick?: () => void;
}

interface Folder {
  id: string;
  name: string;
}

export default function Sidebar({ activeMode, onSelectMode, xrayMode = false, onSettingsClick }: SidebarProps) {
  const { user, signIn, signOut } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    if (!user) {
      setFolders([]);
      return;
    }
    const q = query(collection(db, 'folders'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedFolders: Folder[] = [];
      snapshot.forEach((doc) => {
        loadedFolders.push({ id: doc.id, name: doc.data().name });
      });
      setFolders(loadedFolders);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'folders');
    });
    return unsubscribe;
  }, [user]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newFolderName.trim()) return;
    try {
      await addDoc(collection(db, 'folders'), {
        ownerId: user.uid,
        name: newFolderName.trim(),
        createdAt: serverTimestamp(),
      });
      setNewFolderName('');
      setIsCreatingFolder(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'folders');
    }
  };

  const hiddenGameClass = xrayMode 
    ? 'ring-1 ring-green-500/50 rounded bg-green-900/10 flex items-center px-2 py-1.5 cursor-pointer mb-1' 
    : 'flex items-center px-2 py-1.5 rounded cursor-pointer mb-1';
  
  const hiddenIconClass = xrayMode ? 'text-green-500 w-4 h-4 mr-2 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]' : 'text-gray-400 w-4 h-4 mr-2';
  const hiddenTextClass = xrayMode ? 'text-green-400 font-bold drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]' : '';

  return (
    <div className="w-64 bg-[#fbfbfa] border-r border-gray-200 flex flex-col h-full text-sm shrink-0">
      <div className="p-4 flex items-center justify-between font-medium text-gray-700 hover:bg-gray-100 cursor-pointer">
        <div className="flex items-center">
          <div className="w-5 h-5 bg-blue-600 rounded text-white flex items-center justify-center mr-2 text-xs font-bold">
            {user ? user.displayName?.charAt(0).toUpperCase() || 'U' : 'G'}
          </div>
          {user ? '내 워크스페이스' : '학생 워크스페이스'}
        </div>
        {user ? (
          <LogOut className="w-4 h-4 text-gray-400 hover:text-gray-800" onClick={signOut} title="로그아웃" />
        ) : (
          <LogIn className="w-4 h-4 text-gray-400 hover:text-blue-600" onClick={signIn} title="로그인 (저장 활성화)" />
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto px-2 py-4">
        <div className="text-xs font-semibold text-gray-400 mb-2 px-2 tracking-wider">주요 기능</div>
        <div 
          className={`flex items-center px-2 py-1.5 rounded cursor-pointer mb-1 transition-colors duration-500 ${activeMode === 'notes' ? (xrayMode ? 'bg-green-900/20 text-green-400 font-bold drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]' : 'bg-gray-200 text-gray-800') : (xrayMode ? 'text-green-500 hover:bg-green-900/10' : 'text-gray-600 hover:bg-gray-100')}`}
          onClick={() => onSelectMode('notes')}
        >
          <Book className={`w-4 h-4 mr-2 ${xrayMode ? 'text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]' : 'text-gray-400'}`} />
          👋not-ion에 오신 것을 환영합니다!
        </div>

        <div 
          className={`flex items-center px-2 py-1.5 rounded cursor-pointer mb-1 transition-colors duration-500 ${activeMode === 'chat' ? (xrayMode ? 'bg-sky-900/20 text-sky-400 font-bold drop-shadow-[0_0_5px_rgba(56,189,248,0.8)]' : 'bg-gray-200 text-gray-800') : (xrayMode ? 'text-sky-500 hover:bg-sky-900/10' : 'text-gray-600 hover:bg-gray-100')}`}
          onClick={() => onSelectMode('chat')}
        >
          <Book className={`w-4 h-4 mr-2 ${xrayMode ? 'text-sky-400 drop-shadow-[0_0_5px_rgba(56,189,248,0.8)]' : 'text-gray-400'}`} />
          그룹 스터디 노트 {xrayMode && <span className="ml-1 text-xs text-blue-400 font-bold drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]">(비밀 채팅)</span>}
        </div>

        {/* Scattered Game 1 & 2 under Academic Management */}
        <div className={`text-xs font-semibold px-2 mt-6 justify-between flex items-center mb-2 tracking-wider transition-colors duration-500 ${xrayMode ? 'text-green-500 font-bold drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]' : 'text-gray-400'}`}>학사 관리</div>
        
        <div className={`${hiddenGameClass} ${activeMode === 'tetris' ? (xrayMode ? 'bg-green-900/20' : 'bg-gray-200 text-gray-800') : 'text-gray-600 hover:bg-gray-100'}`} onClick={() => onSelectMode('tetris')}>
          <Calendar className={hiddenIconClass} />
          <span className={hiddenTextClass}>시간표 조회 {xrayMode && <span className="ml-1 text-xs text-green-400 font-normal">(테트리스)</span>}</span>
        </div>
        
        <div className={`${hiddenGameClass} ${activeMode === '2048' ? (xrayMode ? 'bg-green-900/20' : 'bg-gray-200 text-gray-800') : 'text-gray-600 hover:bg-gray-100'}`} onClick={() => onSelectMode('2048')}>
          <Calculator className={hiddenIconClass} />
          <span className={hiddenTextClass}>학점 계산기 {xrayMode && <span className="ml-1 text-xs text-green-400 font-normal">(2048)</span>}</span>
        </div>

        {/* Scattered Game 6 under System logs */}
        <div className={`${hiddenGameClass} ${activeMode === 'snake' ? (xrayMode ? 'bg-green-900/20' : 'bg-gray-200 text-gray-800') : 'text-gray-600 hover:bg-gray-100'}`} onClick={() => onSelectMode('snake')}>
          <Activity className={hiddenIconClass} />
          <span className={hiddenTextClass}>진로 로드맵 {xrayMode && <span className="ml-1 text-xs text-green-400 font-normal">(스네이크)</span>}</span>
        </div>

        <div className="text-xs font-semibold text-gray-400 mb-2 mt-6 px-2 tracking-wider flex items-center justify-between">
          <span>페이지</span>
          {user && <Plus className="w-4 h-4 p-0.5 rounded hover:bg-gray-200 cursor-pointer hover:text-gray-800 transition" onClick={() => setIsCreatingFolder(!isCreatingFolder)} title="새 페이지 생성" />}
        </div>

        {isCreatingFolder && (
          <form onSubmit={handleCreateFolder} className="px-2 mb-2">
            <input 
              type="text" 
              autoFocus
              className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded outline-none focus:border-blue-500 shadow-sm"
              placeholder="페이지 이름 입력 후 Enter..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={() => setIsCreatingFolder(false)}
            />
          </form>
        )}

        {!user && (
          <div className="px-2 py-1 text-xs text-gray-400 italic">
            로그인하여 페이지를 생성하세요
          </div>
        )}

        {folders.map(folder => (
          <div 
            key={folder.id} 
            className={`flex items-center px-2 py-1.5 rounded cursor-pointer mb-1 ${activeMode === `note_${folder.id}` ? 'bg-gray-200 text-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => onSelectMode(`note_${folder.id}`, folder.id)}
          >
            <FileText className="w-4 h-4 mr-2 text-gray-400" />
            <span className="truncate">{folder.name}</span>
          </div>
        ))}
        {user && folders.length === 0 && !isCreatingFolder && (
          <div className="px-2 py-1.5 text-xs text-gray-400">페이지가 없습니다.</div>
        )}

        {/* Scattered Game 3 & 4 & 5 under Analytics */}
        <div className={`text-xs font-semibold px-2 mt-6 mb-2 tracking-wider transition-colors duration-500 ${xrayMode ? 'text-green-500 font-bold drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]' : 'text-gray-400'}`}>학습 도구</div>

        <div className={`${hiddenGameClass} ${activeMode === 'typing' ? (xrayMode ? 'bg-green-900/20' : 'bg-gray-200 text-gray-800') : 'text-gray-600 hover:bg-gray-100'}`} onClick={() => onSelectMode('typing')}>
          <Activity className={hiddenIconClass} />
          <span className={hiddenTextClass}>메모장 {xrayMode && <span className="ml-1 text-xs text-green-400 font-normal">(타자/방어)</span>}</span>
        </div>
        
        <div className={`${hiddenGameClass} ${activeMode === 'apple' ? (xrayMode ? 'bg-green-900/20' : 'bg-gray-200 text-gray-800') : 'text-gray-600 hover:bg-gray-100'}`} onClick={() => onSelectMode('apple')}>
          <Hash className={hiddenIconClass} />
          <span className={hiddenTextClass}>공학 계산기 {xrayMode && <span className="ml-1 text-xs text-green-400 font-normal">(사과)</span>}</span>
        </div>
        
        <div className={`${hiddenGameClass} ${activeMode === 'minesweeper' ? (xrayMode ? 'bg-green-900/20' : 'bg-gray-200 text-gray-800') : 'text-gray-600 hover:bg-gray-100'}`} onClick={() => onSelectMode('minesweeper')}>
          <Cpu className={hiddenIconClass} />
          <span className={hiddenTextClass}>체크리스트 {xrayMode && <span className="ml-1 text-xs text-green-400 font-normal">(지뢰찾기)</span>}</span>
        </div>
      </div>
      
      {/* Footer Utility Link - Looks very boring */}
      <div className="p-4 border-t border-gray-200 text-xs text-gray-400 flex flex-col gap-2">
         <div onClick={onSettingsClick} className={xrayMode ? 'ring-1 ring-purple-500/50 rounded bg-purple-900/10 flex items-center px-2 py-1.5 cursor-pointer -mx-2' : 'flex items-center hover:text-gray-600 cursor-pointer'}>
           <Settings className={xrayMode ? 'text-purple-500 w-3.5 h-3.5 mr-2 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]' : 'w-3.5 h-3.5 mr-2'} />
           <span className={xrayMode ? 'text-purple-400 font-bold drop-shadow-[0_0_5px_rgba(168,85,247,0.8)] flex-1' : ''}>시스템 환경설정 {xrayMode && <span className="ml-1 text-xs text-purple-400 font-normal">(소셜 웹뷰)</span>}</span>
         </div>
      </div>
    </div>
  );
}
