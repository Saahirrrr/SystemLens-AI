// lib/api.ts — Type-safe API client for the Discovery Agent backend

import type {
  AnalysisRequest,
  AnalysisReport,
  ApiError,
  InventoryResponse,
  UploadResponse,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      // ignore parse failure
    }
    const err: ApiError = { status: res.status, detail };
    throw err;
  }
  return res.json() as Promise<T>;
}

// ─── Documents ───────────────────────────────────────────────────────────────

export async function uploadDocument(
  file: File,
  sessionId?: string,
  onProgress?: (pct: number) => void
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    if (sessionId) formData.append("session_id", sessionId);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}/api/v1/documents/upload`);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as UploadResponse);
      } else {
        let detail = `HTTP ${xhr.status}`;
        try {
          const body = JSON.parse(xhr.responseText);
          detail = body.detail ?? detail;
        } catch {
          // ignore
        }
        reject({ status: xhr.status, detail } as ApiError);
      }
    };

    xhr.onerror = () => reject({ status: 0, detail: "Network error" } as ApiError);
    xhr.send(formData);
  });
}

// ─── Inventory ───────────────────────────────────────────────────────────────

export async function getInventory(sessionId: string): Promise<InventoryResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/inventory/${sessionId}`, {
    cache: "no-store",
  });
  return handleResponse<InventoryResponse>(res);
}

// ─── Analysis ────────────────────────────────────────────────────────────────

export async function runAnalysis(request: AnalysisRequest): Promise<AnalysisReport[]> {
  const res = await fetch(`${BASE_URL}/api/v1/analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return handleResponse<AnalysisReport[]>(res);
}
