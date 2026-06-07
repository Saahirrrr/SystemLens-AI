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

export interface DataFlow {
  source_system: string;
  destination_system: string;
  data_entity: string;
  direction: string;
  integration_type: string;
  analysis_confidence: number;
}

export interface IntegrationGap {
  source_system: string;
  destination_system: string;
  missing_data_entity: string;
  gap_reason: string;
  effort_estimate: string;
  effort_reasoning: string;
  analysis_confidence: number;
  flagged_for_review: boolean;
}

export interface PriorityItem {
  rank: number;
  priority_tier: string;
  priority_score: number;
  source_system: string;
  destination_system: string;
  missing_data_entity: string;
  effort_estimate: string;
  business_impact_score: number;
  workflow_frequency_score: number;
  downstream_dependency_score: number;
  analysis_confidence: number;
  confidence_penalty: number;
  score_breakdown: Record<string, number>;
}

export interface AnalysisConfidenceData {
  name: string;
  value: number;
  [key: string]: unknown;
}

export interface AnalysisResultData {
  metadata?: {
    use_cases_analysed?: number;
    total_gaps_found?: number;
    highest_priority_tier?: string;
    generated_timestamp?: string;
  };
  total_systems?: number;
  total_data_flows?: number;
  total_integration_gaps?: number;
  average_confidence?: number;
  
  data_flows?: DataFlow[];
  integration_gaps?: IntegrationGap[];
  priority_report?: PriorityItem[];
  analysis_confidence?: AnalysisConfidenceData[];
  
  use_cases_analysed?: number;
  total_gaps_found?: number;
  highest_priority_tier?: string;
  generated_timestamp?: string;
}
