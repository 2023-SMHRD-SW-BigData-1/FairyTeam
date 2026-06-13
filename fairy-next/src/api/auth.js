// 인증 API.
import { apiGet, apiPost, apiPatch, setToken } from './client';

export async function login(email, password) {
  const { token, user } = await apiPost('/api/auth/login', { email, password });
  setToken(token);
  return user;
}
export async function signup(data) {
  const { token, user } = await apiPost('/api/auth/signup', data);
  setToken(token);
  return user;
}
export function me() {
  return apiGet('/api/auth/me'); // { user }
}
export async function updateMe(data) {
  const { user } = await apiPatch('/api/auth/me', data);
  return user;
}
