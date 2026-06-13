// 카테고리 API.
import { apiGet } from './client';

export function listCategories() { return apiGet('/api/categories'); }       // 대분류 [{code,name,emoji}]
export function getCategoryTree() { return apiGet('/api/categories/tree'); } // 대>중>소 중첩
