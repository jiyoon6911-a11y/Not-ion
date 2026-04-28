import React, { useState } from 'react';
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
  setXrayMode?: (mode: boolean) => void;
  saveStatus?: 'idle' | 'saving' | 'saved';
  trueStudyMode?: boolean;
}

export default function FacadeNotes({ content, setContent, title = '👋not-ion에 오신 것을 환영합니다!', setTitle = () => {}, activeMode, onSelectMode, xrayMode, setXrayMode, saveStatus = 'idle', trueStudyMode = false }: FacadeNotesProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="h-full flex flex-col w-full mx-auto overflow-hidden relative">
      {xrayMode && (
        <div className="absolute top-0 left-0 w-full h-[3px] bg-green-500 shadow-[0_0_15px_rgba(34,197,94,1),0_0_30px_rgba(34,197,94,0.8)] z-[100] animate-scanline pointer-events-none" />
      )}

      {xrayMode && title === '👋not-ion에 오신 것을 환영합니다!' && (
        <div 
          className="absolute inset-0 z-[60] py-16 overflow-hidden pointer-events-auto cursor-pointer"
          onClick={() => setXrayMode && setXrayMode(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-none" />
          
          <div className="absolute inset-0 animate-[fadeIn_0.5s_ease-in-out_1s_both]">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full px-4 pointer-events-none">
              <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)] mb-4 animate-[pulse_2s_ease-in-out_infinite]">
                [ 시스템 우회 포털 활성화 ]
              </h1>
              <p className="text-green-300 text-lg md:text-xl font-medium drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]">
                본 시스템은 완벽한 노트 앱의 형상을 한 은밀한 딴짓 공간입니다.
              </p>
              <div className="mt-8 text-red-500 font-bold text-2xl animate-pulse bg-black/50 inline-block px-6 py-3 rounded-xl border border-red-500/50">
                ⚠️ 긴급상황(교수님 접근시): ESC누르기!
              </div>
            </div>

            <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="h-12 w-0.5 bg-gradient-to-b from-green-400 to-transparent shadow-[0_0_10px_rgba(34,197,94,0.8)] mb-2 animate-bounce" />
              <div className="bg-black/80 border border-green-500 text-green-400 p-4 rounded-lg shadow-[0_0_20px_rgba(34,197,94,0.6)] max-w-md text-center backdrop-blur-md pointer-events-none">
                <h3 className="font-bold text-lg mb-1 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]">상단 위장 툴바</h3>
                <p className="text-sm opacity-90">X-Ray 모드에서 노출된 네온 아이콘들은 사실 게임 및 비밀 기능을 실행하는 우회 포트입니다.</p>
              </div>
            </div>

            <div className="absolute bottom-8 right-8 flex flex-col items-end">
              <div className="bg-black/80 border border-green-500 text-green-400 p-4 rounded-lg shadow-[0_0_20px_rgba(34,197,94,0.6)] max-w-sm text-right mb-2 backdrop-blur-md">
                <h3 className="font-bold text-lg mb-1 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]">엑스레이 탐지기</h3>
                <p className="text-sm opacity-90">엑스레이 탐지기 버튼을 통해, 숨겨진 진짜기능을 찾으세요.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fake UI Toolbar */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm p-2 flex items-center gap-1 text-gray-500 sticky top-0 z-[80] sticky-toolbar">
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
        <button 
          className="p-1.5 hover:bg-gray-100 rounded cursor-pointer"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => document.execCommand('bold', false, undefined)}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button 
          className="p-1.5 hover:bg-gray-100 rounded cursor-pointer"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => document.execCommand('italic', false, undefined)}
        >
          <Italic className="w-4 h-4" />
        </button>
        <button 
          className="p-1.5 hover:bg-gray-100 rounded cursor-pointer"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => document.execCommand('underline', false, undefined)}
        >
          <Underline className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1"></div>
        <button 
          className="p-1.5 hover:bg-gray-100 rounded cursor-pointer"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => document.execCommand('justifyLeft', false, undefined)}
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button 
          className="p-1.5 hover:bg-gray-100 rounded cursor-pointer"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => document.execCommand('justifyCenter', false, undefined)}
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button 
          className="p-1.5 hover:bg-gray-100 rounded cursor-pointer"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => document.execCommand('justifyRight', false, undefined)}
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1"></div>
        
        {!trueStudyMode && (
          <>
            <button 
              className={`p-1.5 rounded transition-all duration-500 relative ${xrayMode ? 'bg-green-900/10 text-green-400 ring-1 ring-green-500/50 z-20 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)] cursor-pointer hover:bg-green-900/30' : 'hover:bg-gray-100 cursor-pointer'}`} 
              onClick={(e) => { e.stopPropagation(); onSelectMode?.('typing'); }} 
            >
              {xrayMode && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 border border-green-500 text-green-400 text-xs px-2 py-1 rounded shadow-[0_0_10px_rgba(34,197,94,0.5)] whitespace-nowrap font-bold pointer-events-none">Typing 도구</span>}
              <Type className="w-4 h-4" />
            </button>
            <button 
              className={`p-1.5 rounded transition-all duration-500 relative ${xrayMode ? 'bg-green-900/10 text-green-400 ring-1 ring-green-500/50 z-20 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)] cursor-pointer hover:bg-green-900/30' : 'hover:bg-gray-100 cursor-pointer'}`} 
              onClick={(e) => { e.stopPropagation(); onSelectMode?.('tetris'); }} 
            >
              {xrayMode && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 border border-green-500 text-green-400 text-xs px-2 py-1 rounded shadow-[0_0_10px_rgba(34,197,94,0.5)] whitespace-nowrap font-bold pointer-events-none">Tetris 도구</span>}
              <Table className="w-4 h-4" />
            </button>
            <button 
              className={`p-1.5 rounded transition-all duration-500 relative ${xrayMode ? 'bg-green-900/10 text-green-400 ring-1 ring-green-500/50 z-20 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)] cursor-pointer hover:bg-green-900/30' : 'hover:bg-gray-100 cursor-pointer'}`} 
              onClick={(e) => { e.stopPropagation(); onSelectMode?.('minesweeper'); }} 
            >
              {xrayMode && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 border border-green-500 text-green-400 text-xs px-2 py-1 rounded shadow-[0_0_10px_rgba(34,197,94,0.5)] whitespace-nowrap font-bold pointer-events-none">Minesweeper 도구</span>}
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button 
              className={`p-1.5 rounded transition-all duration-500 relative ${xrayMode ? 'bg-green-900/10 text-green-400 ring-1 ring-green-500/50 z-20 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)] cursor-pointer hover:bg-green-900/30' : 'hover:bg-gray-100 cursor-pointer'}`} 
              onClick={(e) => { e.stopPropagation(); onSelectMode?.('2048'); }} 
            >
              {xrayMode && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 border border-green-500 text-green-400 text-xs px-2 py-1 rounded shadow-[0_0_10px_rgba(34,197,94,0.5)] whitespace-nowrap font-bold pointer-events-none">2048 도구</span>}
              <Calculator className="w-4 h-4" />
            </button>
            <button 
              className={`p-1.5 rounded transition-all duration-500 relative ${xrayMode ? 'bg-green-900/10 text-green-400 ring-1 ring-green-500/50 z-20 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)] cursor-pointer hover:bg-green-900/30' : 'hover:bg-gray-100 cursor-pointer'}`} 
              onClick={(e) => { e.stopPropagation(); onSelectMode?.('apple'); }} 
            >
              {xrayMode && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 border border-green-500 text-green-400 text-xs px-2 py-1 rounded shadow-[0_0_10px_rgba(34,197,94,0.5)] whitespace-nowrap font-bold pointer-events-none">Apple 도구</span>}
              <PieChart className="w-4 h-4" />
            </button>
            <button 
              className={`p-1.5 rounded transition-all duration-500 relative ${xrayMode ? 'bg-green-900/10 text-green-400 ring-1 ring-green-500/50 z-20 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)] cursor-pointer hover:bg-green-900/30' : 'hover:bg-gray-100 cursor-pointer'}`} 
              onClick={(e) => { e.stopPropagation(); onSelectMode?.('snake'); }} 
            >
              {xrayMode && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 border border-green-500 text-green-400 text-xs px-2 py-1 rounded shadow-[0_0_10px_rgba(34,197,94,0.5)] whitespace-nowrap font-bold pointer-events-none">Snake 도구</span>}
              <Terminal className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
          </>
        )}
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

      <div className="flex-1 overflow-y-auto px-8 md:px-12 lg:px-24 py-12 w-full">
        <div className="flex items-center text-gray-400 text-sm mb-4 gap-2">
          <span>대학교 노트</span>
          <span>/</span>
          {activeMode === 'notes' ? (
            <span className="text-gray-600 font-medium">👋not-ion에 오신 것을 환영합니다!</span>
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
        <div
          className="w-full h-full min-h-[500px] text-gray-800 leading-relaxed text-[16px] font-sans cursor-text whitespace-pre-wrap break-words border-none outline-none"
          contentEditable
          suppressContentEditableWarning
          dangerouslySetInnerHTML={{ __html: content }}
          onBlur={(e) => {
            setContent(e.currentTarget.innerHTML);
          }}
        />
      </div>
    </div>
  );
}
