// Socket.io 클라이언트 (싱글톤). 채팅 화면에서 가져다 씀.
import { io } from 'socket.io-client';
import { API_BASE, getToken } from '../api/client';

let socket = null;

// 현재 토큰으로 소켓을 얻음 (없으면 생성). 로그인해야 토큰이 붙음.
export function getSocket() {
  if (!socket) {
    socket = io(API_BASE, {
      auth: { token: getToken() },
      autoConnect: true,
    });
  }
  return socket;
}

// 로그인/로그아웃으로 토큰이 바뀌면 끊고 다음 호출 때 새로 연결.
export function resetSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}
