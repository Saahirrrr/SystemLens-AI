import { ApiResponse, InventoryData, UseCase } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const apiClient = {
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      return { error: String(error), status: 500 };
    }
  },
  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      return { error: String(error), status: 500 };
    }
  },
  async getInventory(sessionId: string): Promise<ApiResponse<InventoryData>> {
    return this.get<InventoryData>(`/api/v1/inventory/${sessionId}`);
  },
  async submitAnalysis(sessionId: string, useCases: UseCase[]): Promise<ApiResponse<unknown>> {
    return this.post<unknown>("/api/v1/analysis", {
      session_id: sessionId,
      use_cases: useCases
    });
  }
};
