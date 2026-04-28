import React, { useState, useEffect, useRef } from 'react';
import { Book, MessageSquare, Plus, Send, Play, FileText, Settings, User } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

interface Chat {
  id: string;
  userEmails: string[];
  lastMessage: string;
  updatedAt: any;
  game?: any;
}

interface Message {
  id: string;
  chatId: string;
  senderEmail: string;
  text: string;
  createdAt: any;
}

export default function SecretChat({ xrayMode = false }: { xrayMode?: boolean }) {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.email) return;

    try {
      const q = query(
        collection(db, 'chats'),
        where('userEmails', 'array-contains', user.email)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const chatsData: Chat[] = [];
        snapshot.forEach((doc) => {
          chatsData.push({ id: doc.id, ...doc.data() } as Chat);
        });
        chatsData.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
        setChats(chatsData);
        
        if (activeChat) {
          const updatedActiveChat = chatsData.find(c => c.id === activeChat.id);
          if (updatedActiveChat) setActiveChat(updatedActiveChat);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'chats');
      });

      return () => unsubscribe();
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  useEffect(() => {
    if (!activeChat) return;

    try {
      const q = query(
        collection(db, 'messages'),
        where('chatId', '==', activeChat.id),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs: Message[] = [];
        snapshot.forEach((doc) => {
          msgs.push({ id: doc.id, ...doc.data() } as Message);
        });
        setMessages(msgs);
        if (xrayMode) {
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
        }
      }, (error) => {
         handleFirestoreError(error, OperationType.GET, 'messages');
      });

      return () => unsubscribe();
    } catch (e) {
      console.error(e);
    }
  }, [activeChat?.id]);

  const createChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email || !friendEmail.trim() || friendEmail === user.email) return;

    try {
      const existing = chats.find(c => c.userEmails.includes(friendEmail));
      if (existing) {
        setActiveChat(existing);
        setIsCreating(false);
        setFriendEmail('');
        return;
      }

      const docRef = await addDoc(collection(db, 'chats'), {
        userEmails: [user.email, friendEmail],
        lastMessage: '연결이 시작되었습니다.',
        updatedAt: serverTimestamp(),
      });
      
      const newChat: Chat = { id: docRef.id, userEmails: [user.email, friendEmail], lastMessage: '연결이 시작되었습니다.', updatedAt: null };
      setActiveChat(newChat);
      setIsCreating(false);
      setFriendEmail('');
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, 'chats');
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user?.email || !activeChat || !newMessage.trim()) return;

    const text = newMessage;
    setNewMessage('');

    try {
      await addDoc(collection(db, 'messages'), {
        chatId: activeChat.id,
        senderEmail: user.email,
        text,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'chats', activeChat.id), {
        lastMessage: text,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
    }
  };

  const getFriendEmail = (chat: Chat) => chat.userEmails.find(e => e !== user?.email) || '알 수 없음';
  
  // Non-xrayMode (Excel Theme) pre-processing
  const excelRows: { id: string, type: 'name' | 'message' | 'empty', text?: string, isMine?: boolean }[] = [];
  if (!xrayMode && activeChat) {
      let lastSender = '';
      messages.forEach((msg, idx) => {
         const isMine = msg.senderEmail === user?.email;
         excelRows.push({ id: `msg-${msg.id}`, type: 'message', text: msg.text, isMine });
         lastSender = msg.senderEmail;
      });
      const MIN_ROWS = 40;
      let emptyCount = 0;
      while (excelRows.length < MIN_ROWS) {
         excelRows.push({ id: `empty-${emptyCount++}`, type: 'empty' });
      }
      // if we have more messages than MIN_ROWS, pad a bit at the end
      if (emptyCount === 0) {
         for(let i=0; i<5; i++) excelRows.push({ id: `empty-pad-${i}`, type: 'empty' });
      }
  }

  return (
    <div className={`w-full h-full flex pt-[52px] ${xrayMode ? 'flex-row bg-[#0f0f13] text-purple-100 font-mono tracking-wider' : 'flex-col bg-[#e6e8eb] text-gray-800 font-sans'}`}>
      
      {/* Left Pane (Only showing in xrayMode) */}
      {xrayMode && (
          <div className="w-64 flex flex-col border-r border-purple-500/30 bg-[#121016]">
             
             <div className="p-4 border-b border-purple-500/30 flex items-center justify-between">
                 <div className="font-bold flex items-center gap-2">
                     <MessageSquare className="w-5 h-5 text-purple-500"/> <span className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">연결된 노드</span>
                 </div>
                 <button onClick={() => setIsCreating(true)} className="p-1.5 rounded transition-colors hover:bg-purple-500/20 text-purple-400">
                     <Plus className="w-4 h-4" />
                 </button>
             </div>

             <div className="flex-1 overflow-y-auto flex flex-col">
                 {chats.map(chat => (
                     <button
                         key={chat.id}
                         onClick={() => {setActiveChat(chat); setIsCreating(false);}}
                         className={`text-left p-3 flex items-center gap-3 transition-colors ${
                           activeChat?.id === chat.id 
                           ? 'bg-purple-500/20 shadow-[inset_0_0_10px_rgba(168,85,247,0.2)] text-purple-300 rounded-lg m-2'
                           : 'hover:bg-purple-500/10 text-purple-500/70 rounded-lg m-2'
                         }`}
                     >
                         <div className="w-8 h-8 flex items-center justify-center shrink-0 rounded-full bg-purple-900/50 border border-purple-500/30">
                             <User className="w-4 h-4 text-purple-400" />
                         </div>
                         <div className="flex-1 overflow-hidden">
                            <div className={`text-sm font-medium truncate ${activeChat?.id === chat.id ? 'drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]' : ''}`}>
                                {getFriendEmail(chat).split('@')[0]}
                            </div>
                            <div className="text-xs truncate mt-0.5 text-purple-500/50">
                                {chat.lastMessage}
                            </div>
                         </div>
                     </button>
                 ))}
             </div>
          </div>
      )}

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col relative ${xrayMode ? 'bg-[#0f0f13]' : 'bg-white'}`}>
          {!activeChat && !isCreating && (
              xrayMode ? (
                  <div className="flex-1 flex items-center justify-center flex-col text-purple-500/50 p-8 text-center">
                      <MessageSquare className="w-16 h-16 mb-6 opacity-50 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] animate-pulse" />
                      <h3 className="text-xl font-bold mb-4 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] text-purple-400">통신 네트워크 접속됨</h3>
                      <div className="space-y-4 p-6 bg-purple-900/10 border border-purple-500/20 rounded-xl leading-relaxed text-sm max-w-md shadow-[inset_0_0_20px_rgba(168,85,247,0.05)]">
                         <p>이 화면은 시스템의 숨겨진 채팅 인터페이스입니다.<br/>평상시에는 스프레드시트로 위장됩니다.</p>
                         <div className="flex items-start text-left gap-3">
                             <div className="w-6 h-6 rounded bg-purple-500/20 border border-purple-500/50 flex items-center justify-center shrink-0 mt-0.5"><Plus className="w-4 h-4 text-purple-400" /></div>
                             <p>좌측 상단 버튼을 눌러 이메일로 <strong>새 대화 상대를 추가</strong>하세요.</p>
                         </div>
                         <div className="flex items-start text-left gap-3">
                             <div className="w-6 h-6 rounded bg-purple-500/20 border border-purple-500/50 flex items-center justify-center shrink-0 mt-0.5"><User className="w-4 h-4 text-purple-400" /></div>
                             <p>좌측 목록에서 <strong>연결된 노드(친구)를 선택</strong>하여 대화를 시작할 수 있습니다.</p>
                         </div>
                      </div>
                  </div>
              ) : (
                  <div className="flex-1 bg-[#f3f2f1] overflow-y-auto">
                      <div className="max-w-5xl mx-auto p-8">
                         <div className="mb-10 text-2xl text-gray-800">
                             안녕하세요.
                         </div>
                         <div className="mb-4 flex items-center justify-between">
                             <h2 className="text-sm font-semibold text-gray-700">새로 만들기</h2>
                             <button className="text-sm text-green-700 hover:underline">추가 서식 파일 &rarr;</button>
                         </div>
                         <div className="flex gap-4 mb-10 overflow-x-auto pb-4">
                             <button onClick={() => setIsCreating(true)} className="flex flex-col items-start gap-2 bg-white hover:bg-green-50 transition border border-gray-200 rounded-md p-1 shadow-sm w-[200px] shrink-0">
                                <div className="w-full aspect-[4/3] bg-[#f8f9fc] border border-gray-200 mb-2 relative overflow-hidden flex items-center justify-center rounded-sm">
                                    <div className="absolute top-0 left-0 right-0 h-5 bg-green-600/10 border-b border-green-600/20"></div>
                                    <div className="absolute top-5 left-0 bottom-0 w-5 bg-gray-100 border-r border-gray-200"></div>
                                    <div className="w-full h-full flex flex-col pt-5 pl-5 gap-[1px]">
                                        <div className="flex gap-[1px] w-full h-5"><div className="flex-1 border border-gray-200 border-t-0 border-l-0 bg-white"></div><div className="flex-1 border border-gray-200 border-t-0 border-l-0 bg-white"></div><div className="flex-1 border border-gray-200 border-t-0 border-l-0 bg-white"></div></div>
                                        <div className="flex gap-[1px] w-full h-5"><div className="flex-1 border-2 border-green-600 bg-white z-10 -ml-[1px] -mt-[1px]"></div><div className="flex-1 border border-gray-200 border-t-0 border-l-0 bg-white"></div><div className="flex-1 border border-gray-200 border-t-0 border-l-0 bg-white"></div></div>
                                        <div className="flex gap-[1px] w-full h-5"><div className="flex-1 border border-gray-200 border-t-0 border-l-0 bg-white"></div><div className="flex-1 border border-gray-200 border-t-0 border-l-0 bg-white"></div><div className="flex-1 border border-gray-200 border-t-0 border-l-0 bg-white"></div></div>
                                    </div>
                                </div>
                                <span className="font-semibold text-sm text-gray-800 px-1">새 통합 문서</span>
                             </button>
                         </div>

                         <div className="mb-4">
                             <div className="flex items-center gap-6 mb-4 border-b border-gray-200">
                                 <button className="text-sm font-semibold text-gray-800 border-b-[3px] border-green-700 py-2 bg-green-700/10 px-4 rounded-t-sm">최근 항목</button>
                             </div>
                             <div className="flex justify-end mb-4">
                                 <div className="relative w-64">
                                     <input type="text" placeholder="검색" className="w-full bg-white border border-gray-300 rounded-sm py-1.5 px-3 pl-8 text-sm outline-none focus:border-green-600 transition-colors" />
                                     <svg className="w-4 h-4 text-gray-500 absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                 </div>
                             </div>
                             <div className="flex text-[11px] text-gray-500 border-b border-gray-200 pb-2 mb-2">
                                 <div className="flex-1 font-medium">이름</div>
                                 <div className="w-32 font-medium">수정한 날짜</div>
                             </div>
                             <div className="flex flex-col gap-1">
                                 {chats.map(chat => (
                                     <button key={chat.id} onClick={() => setActiveChat(chat)} className="flex items-center text-left py-3 px-2 hover:bg-black/5 rounded transition text-sm">
                                         <div className="flex items-center gap-4 flex-1">
                                             <div className="w-8 h-8 bg-green-600 rounded-sm flex flex-col items-center justify-center text-white shrink-0 relative overflow-hidden shadow-sm">
                                                <div className="absolute top-0 right-0 w-0 h-0 border-t-[8px] border-t-white border-l-[8px] border-l-transparent border-b-[8px] border-b-transparent border-r-[8px] border-r-white"></div>
                                                <div className="text-white text-[10px] font-bold absolute bottom-[2px] right=[2px] flex items-end ml-3 mb-0">x</div>
                                                <div className="w-[18px] h-[18px] bg-white rounded-sm mt-1 -ml-1 text-green-700 flex items-center justify-center shadow-lg"><FileText className="w-3 h-3" /></div>
                                             </div>
                                             <div className="flex flex-col">
                                                 <span className="font-medium text-gray-800 text-[13px]">{getFriendEmail(chat).split('@')[0]}.xlsx</span>
                                                 <span className="text-[11px] text-gray-500 mt-0.5">바탕 화면 » {getFriendEmail(chat)}</span>
                                             </div>
                                         </div>
                                         <div className="w-32 text-[12px] text-gray-600">
                                             {chat.updatedAt ? new Date(chat.updatedAt.toDate()).toLocaleDateString() : '최근'}
                                         </div>
                                     </button>
                                 ))}
                             </div>
                         </div>
                      </div>
                  </div>
              )
          )}

          {isCreating && (
              <div className="flex-1 p-8 max-w-2xl mx-auto w-full">
                  <h2 className={`font-bold text-2xl mb-8 ${xrayMode ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'text-gray-800'}`}>
                      {xrayMode ? '새 노드 연결 대상 지정' : '새 공유 문서 작성하기'}
                  </h2>
                  <form onSubmit={createChat} className="flex flex-col gap-6">
                      <div>
                          <label className={`block text-sm font-bold mb-2 ${xrayMode ? 'text-purple-500' : 'text-gray-600'}`}>
                              {xrayMode ? '대상자 식별자 (이메일)' : '참여자 초청 이메일'}
                          </label>
                          <input 
                              type="email" 
                              value={friendEmail}
                              onChange={e => setFriendEmail(e.target.value)}
                              placeholder="user@example.com"
                              className={`w-full p-4 rounded-xl outline-none transition-all ${
                                xrayMode 
                                ? 'bg-black/50 border border-purple-500/50 text-purple-200 placeholder-purple-800 focus:border-purple-400 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                                : 'bg-gray-50 border border-gray-200 focus:border-green-600 focus:bg-white text-gray-800'
                              }`}
                              required
                          />
                      </div>
                      <div className="flex justify-end gap-3 mt-4">
                          <button type="button" onClick={() => setIsCreating(false)} className={`px-6 py-3 rounded-lg font-bold transition-all ${xrayMode ? 'text-purple-500 hover:bg-purple-900/40' : 'text-gray-500 hover:bg-gray-100'}`}>
                              취소
                          </button>
                          <button type="submit" className={`px-6 py-3 rounded-lg font-bold transition-all ${
                            xrayMode 
                            ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
                            : 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                          }`}>
                              {xrayMode ? '연결 시도' : '문서 생성'}
                          </button>
                      </div>
                  </form>
              </div>
          )}

          {activeChat && !isCreating && (
              <>
                  {xrayMode ? (
                      <div className={`h-16 border-b flex items-center px-6 shrink-0 border-purple-500/30 bg-[#0f0f13]/80 backdrop-blur`}>
                           <div className="font-bold text-lg flex items-center gap-3">
                               <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,1)]"></span> <span className="drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]">{getFriendEmail(activeChat)}</span>
                           </div>
                      </div>
                  ) : (
                      <div className="h-10 bg-white border-b border-gray-300 flex text-xs text-gray-800 shrink-0 select-none">
                         <div className="w-10 border-r border-gray-300 bg-[#f8f9fc] flex items-center justify-center shrink-0"></div>
                         {['A', 'B', 'C', 'D', 'E', 'F'].map((col, idx) => (
                             <div key={col} className={`flex-1 border-r border-gray-300 flex items-center justify-center bg-[#f8f9fc] hover:bg-[#e8ebf2] transition-colors cursor-default`}>
                                 {col}
                             </div>
                         ))}
                      </div>
                  )}

                  <div className={`flex-1 overflow-y-auto flex flex-col scroll-smooth ${xrayMode ? 'p-6 gap-4 bg-[#0f0f13]' : 'bg-white'}`}>
                      {xrayMode ? (
                          <>
                              {messages.map(msg => {
                                  const isMine = msg.senderEmail === user?.email;
                                  return (
                                      <div key={msg.id} className={`flex flex-col max-w-[70%] ${isMine ? 'self-end items-end' : 'self-start items-start'}`}>
                                          <div className={`px-4 py-2.5 rounded-2xl ${
                                              isMine 
                                              ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30 rounded-tr-sm shadow-[0_0_10px_rgba(168,85,247,0.1)]' 
                                              : 'bg-black/40 text-purple-300 border border-purple-500/20 rounded-tl-sm'
                                          }`}>
                                              {msg.text}
                                          </div>
                                      </div>
                                  )
                              })}
                              <div ref={messagesEndRef} />
                          </>
                      ) : (
                        <div className="flex-1 text-[13px]">
                              {excelRows.map((row, idx) => (
                                  <div key={row.id} ref={row.type !== 'empty' && idx === excelRows.filter(r => r.type !== 'empty').length - 1 ? messagesEndRef : null} className="w-full flex h-[26px]">
                                     <div className="w-10 flex-shrink-0 border-r border-b border-gray-300 bg-[#f8f9fc] flex items-center justify-center text-xs text-gray-500 select-none hover:bg-[#e8ebf2] transition-colors cursor-default">
                                       {idx + 1}
                                     </div>
                                     <div className="flex-1 flex relative">
                                        {/* Grid lines */}
                                        {Array.from({length: 6}).map((_, i) => (
                                            <div key={i} className={`flex-1 border-b border-gray-200 ${i < 5 ? 'border-r' : ''}`} />
                                        ))}

                                        {/* Content overlay */}
                                        {row.type !== 'empty' && (
                                            <div className="absolute inset-0 flex">
                                               {row.type === 'name' && (
                                                    <div className="w-1/3 flex items-center px-2 font-bold text-gray-800">
                                                        {row.text}
                                                    </div>
                                               )}
                                               {row.type === 'message' && row.isMine && (
                                                    <div className="ml-auto w-1/3 bg-[#eef4fe] border border-blue-200 text-gray-800 flex items-center px-2">
                                                        {row.text}
                                                    </div>
                                               )}
                                               {row.type === 'message' && !row.isMine && (
                                                    <div className="mr-auto w-1/2 flex items-center px-2 text-gray-800">
                                                        {row.text}
                                                    </div>
                                               )}
                                            </div>
                                        )}
                                     </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  <div className={`shrink-0 ${xrayMode ? 'p-4 border-t border-purple-500/30 bg-[#0f0f13]' : 'border-t border-gray-300 bg-white'}`}>
                      <form onSubmit={sendMessage} className={`${xrayMode ? 'flex items-center gap-3 w-full max-w-4xl mx-auto' : 'flex items-center h-10'}`}>
                          {xrayMode ? (
                              <>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder="암호화된 문자열 입력..."
                                    className="flex-1 bg-black/50 border border-purple-500/40 text-purple-100 placeholder-purple-800 px-4 py-3 rounded-xl outline-none focus:border-purple-400 focus:shadow-[0_0_10px_rgba(168,85,247,0.3)] transition-all"
                                />
                                <button 
                                    type="submit" 
                                    disabled={!newMessage.trim()}
                                    className={`p-3 rounded-xl transition-all ${newMessage.trim() ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-purple-900/30 text-purple-700'}`}
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                              </>
                          ) : (
                              <>
                                <div className="w-10 border-r border-gray-300 h-full flex items-center justify-center text-gray-500 italic font-serif bg-[#f8f9fc] shrink-0 text-sm select-none">
                                    fx
                                </div>
                                <input
                                      type="text"
                                      value={newMessage}
                                      onChange={e => setNewMessage(e.target.value)}
                                      className="flex-1 h-full px-3 outline-none text-[13px] text-gray-800"
                                      autoFocus
                                />
                                <button 
                                    type="submit" 
                                    disabled={!newMessage.trim()}
                                    className={`w-20 h-full border-l border-gray-300 text-[13px] font-medium transition-colors ${newMessage.trim() ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-[#f8f9fc] text-gray-400 hover:bg-[#e8ebf2]'}`}
                                >
                                    전송
                                </button>
                              </>
                          )}
                      </form>
                  </div>
              </>
          )}

          {/* Excel Bottom Sheets Tab */}
          {!xrayMode && (
              <div className="flex bg-[#f8f9fc] border-t border-gray-300 h-[30px] items-center text-[13px] text-gray-600 shrink-0 overflow-x-auto excel-scrollbar">
                  <div className="flex px-1 shrink-0 border-r border-gray-300 h-full items-center mr-1">
                      <button onClick={() => setIsCreating(true)} className="p-1 hover:bg-gray-200 rounded text-gray-600 mx-1">
                          <Plus className="w-4 h-4" />
                      </button>
                  </div>
                  {chats.map((chat, idx) => (
                      <button
                          key={chat.id}
                          onClick={() => {setActiveChat(chat); setIsCreating(false);}}
                          className={`px-4 h-[28px] mt-[2px] border border-b-0 border-gray-300 rounded-t-lg flex items-center min-w-[100px] justify-center transition-colors mr-1 ${
                              activeChat?.id === chat.id
                              ? 'bg-white font-bold text-green-700 shadow-sm relative z-10 -mb-[1px]'
                              : 'bg-[#e8ebf2] hover:bg-[#f0f2f5] text-gray-600 border-b border-gray-300'
                          }`}
                      >
                          {getFriendEmail(chat).split('@')[0]}
                      </button>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
}
