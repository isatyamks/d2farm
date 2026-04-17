// ─────────────────────────────────────────────────────
// API Wrapper with Offline Fallback
// Tries network first, falls back to IndexedDB queue
// ─────────────────────────────────────────────────────

import { saveOffline, getOfflineQueue, markSynced } from './offlineStorage';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  offline?: boolean;
}

export async function apiGet<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    const data = await res.json();
    return { success: data.success !== false, data };
  } catch {
    console.warn(`[API] Offline — GET ${endpoint} failed`);
    return { success: false, error: 'Network unavailable', offline: true };
  }
}

export async function apiPost<T = unknown>(endpoint: string, body: Record<string, unknown>, offlineStore?: string): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { success: data.success !== false, data };
  } catch {
    console.warn(`[API] Offline — POST ${endpoint} queued`);
    if (offlineStore) {
      await saveOffline(offlineStore, { endpoint, body }, 'CREATE');
    }
    return { success: false, error: 'Saved offline. Will sync when connected.', offline: true };
  }
}

export async function apiPut<T = unknown>(endpoint: string, body: Record<string, unknown>): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { success: data.success !== false, data };
  } catch {
    console.warn(`[API] Offline — PUT ${endpoint} failed`);
    return { success: false, error: 'Network unavailable', offline: true };
  }
}

export async function apiDelete(endpoint: string): Promise<ApiResponse> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    return { success: data.success !== false, data };
  } catch {
    return { success: false, error: 'Network unavailable', offline: true };
  }
}

// Sync offline queue with server
export async function syncOfflineData(): Promise<{ synced: number; failed: number }> {
  const queue = await getOfflineQueue();
  let synced = 0;
  let failed = 0;

  for (const entry of queue) {
    try {
      const { endpoint, body } = entry.data as { endpoint: string; body: Record<string, unknown> };
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: entry.action === 'DELETE' ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await markSynced(entry.id);
        synced++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  if (synced > 0) console.log(`✅ Synced ${synced} offline entries`);
  return { synced, failed };
}
