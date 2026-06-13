// API 기본 주소 + 공통 fetch 헬퍼 (자바의 RestTemplate 같은 역할).
// 주소는 코드에 박지 않고 환경변수로: 배포는 VITE_API_BASE, 개발은 localhost 폴백.
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

// 이미지 경로 → <img src>로 쓸 완성 주소. 외부 URL은 그대로, 업로드 경로는 API_BASE 붙임.
export function assetUrl(pathOrUrl) {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${API_BASE}${pathOrUrl}`;
}

// ── 로그인 토큰(JWT) 보관: localStorage → 새로고침해도 로그인 유지 ──
const TOKEN_KEY = 'fairy_token';
export function getToken() { return localStorage.getItem(TOKEN_KEY); }
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// 토큰 있으면 Authorization 헤더 부착 (매 요청에 신분증 제시)
function authHeader() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// 응답 공통 처리: 실패면 서버가 준 에러 메시지로 throw
async function handle(res) {
  if (!res.ok) {
    let message = `요청 실패 (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch { /* JSON 아니면 기본 메시지 */ }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: { ...authHeader() } });
  return handle(res);
}
export async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(body || {}),
  });
  return handle(res);
}
export async function apiPatch(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(body || {}),
  });
  return handle(res);
}
export async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE', headers: { ...authHeader() } });
  return handle(res);
}
// 파일 업로드 (Content-Type은 브라우저가 boundary와 함께 자동 설정)
export async function apiUpload(path, formData) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST', headers: { ...authHeader() }, body: formData,
  });
  return handle(res);
}
