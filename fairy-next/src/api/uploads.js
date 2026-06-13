// 이미지 업로드 API. File 배열 → 서버 저장 → URL 배열 반환.
import { apiUpload } from './client';

export async function uploadImages(files) {
  const fd = new FormData();
  for (const f of files) fd.append('images', f);
  const { urls } = await apiUpload('/api/uploads', fd);
  return urls; // ['/uploads/img/...']
}
