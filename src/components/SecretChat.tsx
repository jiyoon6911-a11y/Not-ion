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
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
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
  
  return (
    <div className={`w-full h-full flex pt-[52px] ${xrayMode ? 'bg-[#0f0f13] text-purple-100 font-mono tracking-wider' : 'bg-white text-gray-800 font-sans'}`}>
      
      {/* Left Pane */}
      <div className={`w-64 flex flex-col border-r ${xrayMode ? 'border-purple-500/30 bg-[#121016]' : 'border-gray-200 bg-gray-50/50'}`}>
         
         <div className={`p-4 border-b ${xrayMode ? 'border-purple-500/30' : 'border-gray-200'} flex items-center justify-between`}>
             <div className="font-bold flex items-center gap-2">
                 {xrayMode ? (
                     <><MessageSquare className="w-5 h-5 text-purple-500"/> <span className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">연결된 노드</span></>
                 ) : (
                     <><Book className="w-5 h-5 text-gray-500"/> <span>공유 문서 목록</span></>
                 )}
             </div>
             <button onClick={() => setIsCreating(true)} className={`p-1.5 rounded transition-colors ${xrayMode ? 'hover:bg-purple-500/20 text-purple-400' : 'hover:bg-gray-200 text-gray-500'}`}>
                 <Plus className="w-4 h-4" />
             </button>
         </div>

         <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
             {chats.map(chat => (
                 <button
                     key={chat.id}
                     onClick={() => {setActiveChat(chat); setIsCreating(false);}}
                     className={`text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${
                       activeChat?.id === chat.id 
                       ? (xrayMode ? 'bg-purple-500/20 shadow-[inset_0_0_10px_rgba(168,85,247,0.2)] text-purple-300' : 'bg-white shadow-sm border border-gray-200 text-gray-900') 
                       : (xrayMode ? 'hover:bg-purple-500/10 text-purple-500/70' : 'hover:bg-gray-100/50 text-gray-600')
                     }`}
                 >
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${xrayMode ? 'bg-purple-900/50 border border-purple-500/30' : 'bg-blue-50 text-blue-600'}`}>
                         {xrayMode ? <User className="w-4 h-4 text-purple-400" /> : <FileText className="w-4 h-4"/>}
                     </div>
                     <div className="flex-1 overflow-hidden">
                        <div className={`text-sm font-medium truncate ${xrayMode && activeChat?.id === chat.id ? 'drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]' : ''}`}>
                            {xrayMode ? getFriendEmail(chat).split('@')[0] : `문서 #${chat.id.substring(0, 4)} 편집공유`}
                        </div>
                        <div className={`text-xs truncate mt-0.5 ${xrayMode ? 'text-purple-500/50' : 'text-gray-400'}`}>
                            {chat.lastMessage}
                        </div>
                     </div>
                 </button>
             ))}
         </div>
      </div>

      {/* Right Pane */}
      <div className="flex-1 flex flex-col relative bg-transparent">
          {!activeChat && !isCreating && (
              <div className={`flex-1 flex items-center justify-center flex-col ${xrayMode ? 'text-purple-500/50' : 'text-gray-400'}`}>
                  {xrayMode ? <MessageSquare className="w-16 h-16 mb-4 opacity-50 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" /> : <Book className="w-16 h-16 mb-4 opacity-30" />}
                  <p>{xrayMode ? '[ 연결 대기중... ]' : '좌측에서 문서를 선택하세요'}</p>
              </div>
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
                                : 'bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white text-gray-800'
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
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                          }`}>
                              {xrayMode ? '연결 시도' : '문서 생성'}
                          </button>
                      </div>
                  </form>
              </div>
          )}

          {activeChat && !isCreating && (
              <>
                  <div className={`h-16 border-b flex items-center px-6 shrink-0 ${xrayMode ? 'border-purple-500/30 bg-[#0f0f13]/80 backdrop-blur' : 'border-gray-200 bg-white/80 backdrop-blur'}`}>
                       <div className="font-bold text-lg flex items-center gap-3">
                           {xrayMode ? (
                               <><span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,1)]"></span> <span className="drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]">{getFriendEmail(activeChat)}</span></>
                           ) : (
                               <>문서 #{activeChat.id.substring(0,6)} 편집공유</>
                           )}
                       </div>
                  </div>

                  <div className={`flex-1 overflow-y-auto p-6 flex flex-col scroll-smooth ${xrayMode ? 'gap-4' : 'gap-2'}`}>
                      {messages.map(msg => {
                          const isMine = msg.senderEmail === user?.email;
                          
                          if (xrayMode) {
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
                              );
                          } else {
                              return (
                                  <div key={msg.id} className="flex font-mono text-[15px] leading-relaxed group">
                                      {!isMine && <div className="w-1 bg-gray-200 rounded-full mr-3 shrink-0"></div>}
                                      <div className={`flex-1 break-words py-1 ${isMine ? 'text-gray-800' : 'text-gray-600'}`}>
                                          {msg.text}
                                      </div>
                                  </div>
                              );
                          }
                      })}
                      <div ref={messagesEndRef} />
                  </div>

                  <div className={`p-4 shrink-0 border-t ${xrayMode ? 'border-purple-500/30 bg-[#0f0f13]' : 'border-gray-200 bg-white'}`}>
                      <form onSubmit={sendMessage} className={`flex items-center gap-3 w-full max-w-4xl mx-auto ${xrayMode ? '' : 'px-4'}`}>
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
                              <input
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder="문장 추가하기..."
                                    className="flex-1 bg-transparent border-none text-gray-800 placeholder-gray-300 font-mono text-[15px] outline-none"
                                    autoFocus
                              />
                          )}
                      </form>
                  </div>
              </>
          )}
      </div>
    </div>
  );
}
