'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode'
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

interface SessionUser {
  sub: string;
  email: string;
  tenantId: string;
  role: string;
}

interface SessionState {
  user: SessionUser | null;
  accessToken: string | null;
}

interface SessionContextProps extends SessionState {
  authenticate: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  loading: boolean;
}

export const SessionContext = createContext<SessionContextProps | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionState>({ accessToken: null, user: null });
  const [loading, setLoading] = useState(true)

  const router = useRouter();
  const ACCESS_TOKEN = 'accessToken';
  const REFRESH_TOKEN = 'refreshToken';

  useEffect(() => {
    setLoading(true);
    try{
      const storedAccess = Cookies.get(ACCESS_TOKEN) ?? null;
      if (storedAccess) {
        const validUser = decodeJwt(storedAccess);
        if (validUser) {
          setSession({ 
              accessToken: storedAccess,
              user: validUser 
          });
        } else {
          logout(); 
        }
      }
    } finally{
      setLoading(false);
    }
   
  }, []);
  

  function authenticate(newAccessToken: string, newRefreshToken: string) {
    Cookies.set(ACCESS_TOKEN, newAccessToken);
    Cookies.set(REFRESH_TOKEN, newRefreshToken);
    setSession({
      accessToken: newAccessToken,
      user: decodeJwt(newAccessToken),
    });
  }

  function logout() {
    Cookies.remove(ACCESS_TOKEN);
    Cookies.remove(REFRESH_TOKEN);
    setSession({ accessToken: null, user: null });
    router.push('/auth/login');
  }

  function decodeJwt(token: string): SessionUser | null {
    try {
      const payload: any = jwtDecode(token);
      
      return {
        sub: payload.sub,
        email: payload.email,
        tenantId: payload.tenantId,
        role: payload.role,
      };
    } catch (e) {
      return null;
    }
  }

  return (
    <SessionContext.Provider value={{ 
      user: session.user,
      accessToken: session.accessToken,
      authenticate,
      logout,
      loading
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}