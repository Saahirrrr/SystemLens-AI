export type Entity = {
  id: string;
  name: string;
  type: string;
  metadata?: Record<string, unknown>;
};

export type ApiResponse<T> = {
  data?: T;
  error?: string;
  status: number;
};

export interface SystemRecord {
  id: string;
  name: string;
  category: string;
  authentication_method: string;
  criticality: string;
  key_entities: string[];
  business_processes: string[];
  confidence_score: number;
  evidence: string;
  source_document: string;
  source_location: {
    page_number?: number;
    section_hint?: string | null;
  };
  flagged_for_review: boolean;
}

export interface InventoryData {
  systems: SystemRecord[];
}

export interface UseCase {
  id?: string;
  name: string;
  description: string;
  trigger: string;
  expected_outcome: string;
  stated_systems: string[];
}
