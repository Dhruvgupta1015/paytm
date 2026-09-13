import { API_BASE } from './constants';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Policy APIs ─────────────────────────────────────────────────

export function fetchPolicies() {
  return request<import('@/types').Policy[]>('/api/policies');
}

export function fetchPolicy(id: string) {
  return request<import('@/types').Policy>(`/api/policies/${id}`);
}

// ─── Chat API ────────────────────────────────────────────────────

export function sendChatMessage(messages: { role: string; content: string }[]) {
  return request<{ reply: string }>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  });
}

// ─── Policy Explanation API ──────────────────────────────────────

export function explainPolicy(policyId: string, clause: string) {
  return request<{ explanation: string }>('/api/explain-policy', {
    method: 'POST',
    body: JSON.stringify({ policyId, clause }),
  });
}

// ─── Document APIs ───────────────────────────────────────────────

export function uploadDocument(fileName: string, fileType: string) {
  return request<import('@/types').ClaimDocument>('/api/documents/upload', {
    method: 'POST',
    body: JSON.stringify({ fileName, fileType }),
  });
}

export function verifyDocuments(documentIds: string[]) {
  return request<{ documents: import('@/types').ClaimDocument[] }>('/api/documents/verify', {
    method: 'POST',
    body: JSON.stringify({ documentIds }),
  });
}

// ─── Claim APIs ──────────────────────────────────────────────────

export function createClaimDraft(journeyState: import('@/types').JourneyState) {
  return request<import('@/types').Claim>('/api/claim/draft', {
    method: 'POST',
    body: JSON.stringify(journeyState),
  });
}

export function submitClaim(claimId: string) {
  return request<import('@/types').Claim>('/api/claim/submit', {
    method: 'POST',
    body: JSON.stringify({ claimId }),
  });
}

export function fetchClaimStatus(claimId: string) {
  return request<import('@/types').Claim>(`/api/claim/${claimId}`);
}

export const api = {
  fetchPolicies,
  fetchPolicy,
  sendChatMessage: (content: string, history: { role: string; content: string }[] = []) =>
    sendChatMessage([...history.map((m) => ({ role: m.role, content: m.content })), { role: 'user', content }]),
  explainPolicy,
  uploadDocument,
  verifyDocuments,
  createClaimDraft,
  submitClaim,
  fetchClaimStatus,
};

