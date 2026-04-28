import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Sign in error', error);
      if (error?.code === 'auth/unauthorized-domain') {
        alert("현재 접속하신 도메인이 Firebase 인증 허용 도메인에 등록되어 있지 않습니다.\nFirebase Console > Authentication > Settings(설정) > Authorized domains(승인된 도메인)에 현재 브라우저의 도메인(예: vercel.app)을 추가해주세요.");
      } else {
        alert("로그인 중 오류가 발생했습니다: " + (error?.message || "알 수 없는 오류"));
      }
    }
  };

  const signOutUser = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut: signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
