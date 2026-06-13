// AuthContext 상자 + 꺼내 쓰는 훅.
// Provider(컴포넌트)와 분리: 한 파일에서 컴포넌트+훅 같이 export 하면 Fast Refresh가 깨짐.
import { createContext, useContext } from 'react';

export const AuthContext = createContext();
export function useAuth() { return useContext(AuthContext); }
