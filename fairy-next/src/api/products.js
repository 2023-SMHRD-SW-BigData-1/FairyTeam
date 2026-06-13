// 상품 API.
import { apiGet, apiPost, apiPatch, apiDelete } from './client';

// 목록 — params: { category, q, sort, page, size }
export function listProducts(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
  ).toString();
  return apiGet(`/api/products${qs ? `?${qs}` : ''}`); // { items, page, size, total }
}
export function getProduct(id) { return apiGet(`/api/products/${id}`); }
export function createProduct(data) { return apiPost('/api/products', data); } // { id }
export function updateProduct(id, data) { return apiPatch(`/api/products/${id}`, data); }
export function deleteProduct(id) { return apiDelete(`/api/products/${id}`); }
