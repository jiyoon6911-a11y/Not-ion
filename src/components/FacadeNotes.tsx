import React from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link, Image as ImageIcon, Type, AlignLeft, AlignCenter, AlignRight, Terminal, Check, Loader2, Save, Calculator, Grid3x3, Table, PieChart } from 'lucide-react';

interface FacadeNotesProps {
  content: string;
  setContent: (content: string) => void;
  title?: string;
  setTitle?: (title: string) => void;
  activeMode?: string;
  noteId?: string | null;
  onSelectMode?: (mode: string) => void;
  xrayMode?: boolean;
  saveStatus?: 'idle' | 'saving' | 'saved';
}

export default function FacadeNotes({ content, setContent, title = '수학 II', setTitle = () => {}, activeMode, onSelectMode, xrayMode, saveStatus = 'idle' }: FacadeNotesProps) {
  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto overflow-hidden relative">
      {/* Fake UI Toolbar */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm p-2 flex items-center gap-1 text-gray-500 sticky top-0 z-10 sticky-toolbar">
        <select className="bg-transparent border-none outline-none text-sm font-medium mr-2 hover:bg-gray-100 p-1 rounded cursor-pointer">
          <option>일반 텍스트</option>
          <option>제목 1</option>
          <option>제목 2</option>
        </select>
        <div className="w-px h-4 bg-gray-300 mx-1"></div>
        <select className="bg-transparent border-none outline-none text-sm mr-2 hover:bg-gray-100 p-1 rounded cursor-pointer">
          <option>기본 글꼴</option>
          <option>바탕체</option>
          <option>고딕체</option>
        </select>
        <div className="w-px h-4 bg-gray-300 mx-1"></div>
        <button className="p-1.5 hover:bg-gray-100 rounded cursor-text"><Bold className="w-4 h-4" /></button>
        <button className="p-1.5 hover:bg-gray-100 rounded cursor-text"><Italic className="w-4 h-4" /></button>
        <button className="p-1.5 hover:bg-gray-100 rounded cursor-text"><Underline className="w-4 h-4" /></button>
        <button 
          className={`p-1.5 rounded transition-all duration-500 relative ${xrayMode ? 'bg-green-900/10 text-green-400 ring-1 ring-green-500/50 z-20 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)] cursor-pointer' : 'hover:bg-gray-100 cursor-text'}`} 
          onClick={() => xrayMode && onSelectMode?.('typing')} 
        >
          {xrayMode && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 border border-green-500 text-green-400 text-xs px-2 py-1 rounded shadow-[0_0_10px_rgba(34,197,94,0.5)] whitespace-nowrap font-bold pointer-events-none">Typing 도구</span>}
          <Type className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1"></div>
        <button className="p-1.5 hover:bg-gray-100 rounded cursor-text"><AlignLeft className="w-4 h-4" /></button>
        <button className="p-1.5 hover:bg-gray-100 rounded cursor-text"><AlignCenter className="w-4 h-4" /></button>
        <button className="p-1.5 hover:bg-gray-100 rounded cursor-text"><AlignRight className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-gray-300 mx-1"></div>
        <button 
          className={`p-1.5 rounded transition-all duration-500 relative ${xrayMode ? 'bg-green-900/10 text-green-400 ring-1 ring-green-500/50 z-20 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)] cursor-pointer' : 'hover:bg-gray-100 cursor-text'}`} 
          onClick={() => xrayMode && onSelectMode?.('tetris')} 
        >
          {xrayMode && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 border border-green-500 text-green-400 text-xs px-2 py-1 rounded shadow-[0_0_10px_rgba(34,197,94,0.5)] whitespace-nowrap font-bold pointer-events-none">Tetris 도구</span>}
          <Table className="w-4 h-4" />
        </button>
        <button 
          className={`p-1.5 rounded transition-all duration-500 relative ${xrayMode ? 'bg-green-900/10 text-green-400 ring-1 ring-green-500/50 z-20 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)] cursor-pointer' : 'hover:bg-gray-100 cursor-text'}`} 
          onClick={() => xrayMode && onSelectMode?.('minesweeper')} 
        >
          {xrayMode && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 border border-green-500 text-green-400 text-xs px-2 py-1 rounded shadow-[0_0_10px_rgba(34,197,94,0.5)] whitespace-nowrap font-bold pointer-events-none">Minesweeper 도구</span>}
          <Grid3x3 className="w-4 h-4" />
        </button>
        <button 
          className={`p-1.5 rounded transition-all duration-500 relative ${xrayMode ? 'bg-green-900/10 text-green-400 ring-1 ring-green-500/50 z-20 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)] cursor-pointer' : 'hover:bg-gray-100 cursor-text'}`} 
          onClick={() => xrayMode && onSelectMode?.('2048')} 
        >
          {xrayMode && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 border border-green-500 text-green-400 text-xs px-2 py-1 rounded shadow-[0_0_10px_rgba(34,197,94,0.5)] whitespace-nowrap font-bold pointer-events-none">2048 도구</span>}
          <Calculator className="w-4 h-4" />
        </button>
        <button 
          className={`p-1.5 rounded transition-all duration-500 relative ${xrayMode ? 'bg-green-900/10 text-green-400 ring-1 ring-green-500/50 z-20 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)] cursor-pointer' : 'hover:bg-gray-100 cursor-text'}`} 
          onClick={() => xrayMode && onSelectMode?.('apple')} 
        >
          {xrayMode && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 border border-green-500 text-green-400 text-xs px-2 py-1 rounded shadow-[0_0_10px_rgba(34,197,94,0.5)] whitespace-nowrap font-bold pointer-events-none">Apple 도구</span>}
          <PieChart className="w-4 h-4" />
        </button>
        <button 
          className={`p-1.5 rounded transition-all duration-500 relative ${xrayMode ? 'bg-green-900/10 text-green-400 ring-1 ring-green-500/50 z-20 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)] cursor-pointer' : 'hover:bg-gray-100 cursor-text'}`} 
          onClick={() => xrayMode && onSelectMode?.('snake')} 
        >
          {xrayMode && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 border border-green-500 text-green-400 text-xs px-2 py-1 rounded shadow-[0_0_10px_rgba(34,197,94,0.5)] whitespace-nowrap font-bold pointer-events-none">Snake 도구</span>}
          <Terminal className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1"></div>
        <button className="p-1.5 hover:bg-gray-100 rounded cursor-text ml-auto"><Link className="w-4 h-4" /></button>
        <button className="p-1.5 hover:bg-gray-100 rounded cursor-text"><ImageIcon className="w-4 h-4" /></button>
        
        {saveStatus === 'saving' && (
          <div className="flex items-center text-gray-400 text-xs ml-2 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> 저장 중...
          </div>
        )}
        {saveStatus === 'saved' && (
          <div className="flex items-center text-green-600 text-xs ml-2">
            <Check className="w-3.5 h-3.5 mr-1" /> 클라우드에 저장됨
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-8 sm:px-16 py-12">
        <div className="flex items-center text-gray-400 text-sm mb-4 gap-2">
          <span>대학교 노트</span>
          <span>/</span>
          {activeMode === 'notes' ? (
            <span className="text-gray-600 font-medium">자유 필기장</span>
          ) : (
             <span className="text-gray-600 font-medium">개인 폴더</span>
          )}
        </div>
        <input
          type="text"
          className="w-full text-4xl font-bold border-none outline-none mb-4 placeholder-gray-300 text-gray-900 bg-transparent"
          placeholder="제목 없음"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full h-full min-h-[500px] resize-none border-none outline-none text-gray-800 leading-relaxed text-lg bg-transparent font-serif placeholder-gray-300"
          placeholder="여기에 필기를 시작하세요... (우측 하단 돋보기를 눌러 비밀 도구 탐색)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
