// 위탁거래 API.
import { apiGet, apiPost, apiPatch } from './client';

export function listTrades() { return apiGet('/api/trades'); }
export function getTrade(id) { return apiGet(`/api/trades/${id}`); }
export function requestTrade(productId, storeId) { return apiPost('/api/trades', { productId, storeId }); }
// action: 'consign' | 'pickup' | 'cancel'
export function tradeAction(id, action) { return apiPatch(`/api/trades/${id}`, { action }); }
