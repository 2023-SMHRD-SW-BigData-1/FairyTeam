// 로그인 상태 보관소 — 진짜 서버 인증(JWT)과 연결.
import { useEffect, useState } from 'react';
import { AuthContext } from './useAuth';
import * as authApi from '../api/auth';
import { getToken, setToken } from '../api/client';
import { resetSocket } from '../lib/socket';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);  // null=로그아웃, {id,...}=로그인
  const [loading, setLoading] = useState(true); // 최초 토큰 복원 중인지

  // 앱 시작 시 저장된 토큰으로 내 정보 복원 (새로고침해도 로그인 유지)
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!getToken()) { setLoading(false); return; }
      try {
        const { user } = await authApi.me();
        if (alive) setUser(user);
      } catch {
        setToken(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  async function login(email, password) {
    const u = await authApi.login(email, password);
    setUser(u);
    resetSocket(); // 새 토큰으로 소켓 재연결
    return u;
  }
  async function signup(data) {
    const u = await authApi.signup(data);
    setUser(u);
    resetSocket();
    return u;
  }
  function logout() {
    setToken(null);
    setUser(null);
    resetSocket();
  }
  // 내 정보 수정 후 컨텍스트 갱신
  function patchUser(u) { setUser(u); }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, patchUser }}>
      {children}
    </AuthContext.Provider>
  );
}
