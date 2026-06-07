/**
 * Demo data for the Discovery Agent frontend.
 *
 * Generates realistic enterprise system data featuring:
 * Workday, Okta, Salesforce, ServiceNow, Google Drive, Jira, Confluence, Microsoft Teams
 *
 * All analysis_confidence values use the 0.0–1.0 scale matching the real backend.
 */

import type { SystemRecord } from "@/types";

// ---------------------------------------------------------------------------
// Demo Inventory
// ---------------------------------------------------------------------------

export function getDemoInventory(): { systems: SystemRecord[] } {
  return {
    systems: [
      {
        id: "sys-001", name: "Workday", category: "HCM / HR",
        authentication_method: "OAuth 2.0", criticality: "critical",
        key_entities: ["Employee Records", "Payroll Data", "Org Chart"],
        business_processes: ["Onboarding", "Payroll Processing", "Performance Reviews"],
        confidence_score: 0.95, evidence: "Referenced as primary HRIS in architecture document section 2.1.",
        source_document: "architecture_overview.pdf",
        source_location: { page_number: 4, section_hint: "Section 2.1 – Core HR Systems" },
        flagged_for_review: false,
      },
      {
        id: "sys-002", name: "Okta", category: "Identity & Access",
        authentication_method: "SAML 2.0", criticality: "critical",
        key_entities: ["User Identities", "SSO Sessions", "MFA Policies"],
        business_processes: ["User Provisioning", "SSO", "Access Reviews"],
        confidence_score: 0.98, evidence: "Identified as the central identity provider across all integrations.",
        source_document: "architecture_overview.pdf",
        source_location: { page_number: 6, section_hint: "Section 3.1 – Identity Layer" },
        flagged_for_review: false,
      },
      {
        id: "sys-003", name: "Salesforce", category: "CRM",
        authentication_method: "OAuth 2.0", criticality: "high",
        key_entities: ["Accounts", "Opportunities", "Contacts", "Cases"],
        business_processes: ["Lead-to-Cash", "Case Management", "Pipeline Reporting"],
        confidence_score: 0.92, evidence: "Primary CRM platform referenced in sales workflow diagrams.",
        source_document: "architecture_overview.pdf",
        source_location: { page_number: 12, section_hint: "Section 4 – CRM & Sales" },
        flagged_for_review: false,
      },
      {
        id: "sys-004", name: "ServiceNow", category: "ITSM",
        authentication_method: "OAuth 2.0", criticality: "high",
        key_entities: ["Incidents", "Change Requests", "CMDB Assets"],
        business_processes: ["Incident Management", "Change Management", "Asset Tracking"],
        confidence_score: 0.90, evidence: "IT service management platform for incident and change workflows.",
        source_document: "architecture_overview.pdf",
        source_location: { page_number: 18, section_hint: "Section 5 – IT Operations" },
        flagged_for_review: false,
      },
      {
        id: "sys-005", name: "Jira", category: "Project Management",
        authentication_method: "API Token", criticality: "medium",
        key_entities: ["Issues", "Sprints", "Epics", "Boards"],
        business_processes: ["Sprint Planning", "Bug Tracking", "Release Management"],
        confidence_score: 0.88, evidence: "Used by engineering teams for issue tracking and sprint management.",
        source_document: "architecture_overview.pdf",
        source_location: { page_number: 22, section_hint: "Section 6 – Dev Toolchain" },
        flagged_for_review: false,
      },
      {
        id: "sys-006", name: "Confluence", category: "Knowledge Management",
        authentication_method: "API Token", criticality: "medium",
        key_entities: ["Spaces", "Pages", "Templates"],
        business_processes: ["Documentation", "Knowledge Sharing"],
        confidence_score: 0.85, evidence: "Wiki platform integrated with Jira for team documentation.",
        source_document: "architecture_overview.pdf",
        source_location: { page_number: 24, section_hint: "Section 6.2 – Documentation" },
        flagged_for_review: false,
      },
      {
        id: "sys-007", name: "Google Drive", category: "File Storage",
        authentication_method: "OAuth 2.0", criticality: "medium",
        key_entities: ["Documents", "Spreadsheets", "Shared Drives"],
        business_processes: ["Document Collaboration", "File Sharing"],
        confidence_score: 0.80, evidence: "Cloud storage referenced for shared document collaboration.",
        source_document: "architecture_overview.pdf",
        source_location: { page_number: 26, section_hint: "Section 7 – Collaboration" },
        flagged_for_review: true,
      },
      {
        id: "sys-008", name: "Microsoft Teams", category: "Communication",
        authentication_method: "OAuth 2.0", criticality: "medium",
        key_entities: ["Channels", "Messages", "Meetings"],
        business_processes: ["Team Communication", "Video Conferencing", "Notifications"],
        confidence_score: 0.82, evidence: "Primary communication platform with webhook integrations.",
        source_document: "architecture_overview.pdf",
        source_location: { page_number: 28, section_hint: "Section 7.2 – Messaging" },
        flagged_for_review: false,
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Demo Analysis Results  (AnalysisReport[] — mirrors backend output exactly)
// ---------------------------------------------------------------------------

export function getDemoAnalysisResult() {
  return [
    {
      use_case_name: "Employee Onboarding Automation",
      generated_at: new Date().toISOString(),
      gap_count: 2,
      use_case_mappings: [
        { system_name: "Workday", role: "source", relevance_reason: "Source of new hire records", analysis_confidence: 0.95 },
        { system_name: "Okta", role: "orchestrator", relevance_reason: "Provisions user accounts and SSO access", analysis_confidence: 0.98 },
        { system_name: "Jira", role: "destination", relevance_reason: "Receives onboarding task assignments", analysis_confidence: 0.85 },
        { system_name: "Microsoft Teams", role: "destination", relevance_reason: "Sends welcome notifications to channels", analysis_confidence: 0.80 },
      ],
      data_flows: [
        {
          source_system: "Workday",
          destination_system: "Okta",
          data_entity: "Employee Profile",
          direction: "push",
          integration_type: "API",
          analysis_confidence: 0.95,
        },
        {
          source_system: "Okta",
          destination_system: "Jira",
          data_entity: "User Account",
          direction: "push",
          integration_type: "webhook",
          analysis_confidence: 0.88,
        },
        {
          source_system: "Okta",
          destination_system: "Microsoft Teams",
          data_entity: "Provisioning Event",
          direction: "push",
          integration_type: "webhook",
          analysis_confidence: 0.82,
        },
        {
          source_system: "Workday",
          destination_system: "Salesforce",
          data_entity: "Department Assignment",
          direction: "push",
          integration_type: "API",
          analysis_confidence: 0.78,
        },
      ],
      integration_gaps: [
        {
          source_system: "Workday",
          destination_system: "ServiceNow",
          missing_data_entity: "IT Asset Assignment",
          gap_reason: "No automated flow exists to assign laptops and equipment during onboarding. IT assets are currently tracked manually in a spreadsheet.",
          effort_estimate: "medium",
          effort_reasoning: "Requires building a ServiceNow integration with Workday's onboarding event API.",
          analysis_confidence: 0.90,
          flagged_for_review: false,
        },
        {
          source_system: "Okta",
          destination_system: "Confluence",
          missing_data_entity: "Wiki Space Access",
          gap_reason: "New employees are not automatically granted access to their department's Confluence spaces. Access requests are manual.",
          effort_estimate: "low",
          effort_reasoning: "Confluence supports SCIM provisioning through Okta; just needs configuration.",
          analysis_confidence: 0.85,
          flagged_for_review: false,
        },
      ],
      priority_report: [
        {
          rank: 1,
          priority_tier: "P1 — Critical",
          priority_score: 92.5,
          source_system: "Workday",
          destination_system: "ServiceNow",
          missing_data_entity: "IT Asset Assignment",
          effort_estimate: "medium",
          business_impact_score: 0.95,
          workflow_frequency_score: 0.90,
          downstream_dependency_score: 0.85,
          analysis_confidence: 0.90,
          confidence_penalty: 0.95,
          score_breakdown: { business_impact: 38, workflow_frequency: 27, downstream: 17, confidence_adj: 10.5 },
        },
        {
          rank: 2,
          priority_tier: "P2 — High",
          priority_score: 74.0,
          source_system: "Okta",
          destination_system: "Confluence",
          missing_data_entity: "Wiki Space Access",
          effort_estimate: "low",
          business_impact_score: 0.70,
          workflow_frequency_score: 0.80,
          downstream_dependency_score: 0.60,
          analysis_confidence: 0.85,
          confidence_penalty: 0.89,
          score_breakdown: { business_impact: 28, workflow_frequency: 24, downstream: 12, confidence_adj: 10 },
        },
      ],
    },
    {
      use_case_name: "Incident Escalation Workflow",
      generated_at: new Date().toISOString(),
      gap_count: 1,
      use_case_mappings: [
        { system_name: "ServiceNow", role: "source", relevance_reason: "Primary incident management system", analysis_confidence: 0.92 },
        { system_name: "Jira", role: "destination", relevance_reason: "Receives escalated engineering tickets", analysis_confidence: 0.88 },
        { system_name: "Microsoft Teams", role: "observer", relevance_reason: "Receives alert notifications", analysis_confidence: 0.80 },
      ],
      data_flows: [
        {
          source_system: "ServiceNow",
          destination_system: "Jira",
          data_entity: "Escalated Incident",
          direction: "push",
          integration_type: "API",
          analysis_confidence: 0.90,
        },
        {
          source_system: "ServiceNow",
          destination_system: "Microsoft Teams",
          data_entity: "Incident Alert",
          direction: "push",
          integration_type: "webhook",
          analysis_confidence: 0.85,
        },
        {
          source_system: "Jira",
          destination_system: "ServiceNow",
          data_entity: "Resolution Update",
          direction: "push",
          integration_type: "API",
          analysis_confidence: 0.82,
        },
      ],
      integration_gaps: [
        {
          source_system: "ServiceNow",
          destination_system: "Salesforce",
          missing_data_entity: "Customer Impact Assessment",
          gap_reason: "When a P1 incident affects customer-facing systems, there is no automated flow to update the Salesforce case or notify the account team. The handoff is done via email.",
          effort_estimate: "high",
          effort_reasoning: "Requires bidirectional integration between ServiceNow incident records and Salesforce case management, including field mapping and SLA alignment.",
          analysis_confidence: 0.78,
          flagged_for_review: true,
        },
      ],
      priority_report: [
        {
          rank: 3,
          priority_tier: "P2 — High",
          priority_score: 81.0,
          source_system: "ServiceNow",
          destination_system: "Salesforce",
          missing_data_entity: "Customer Impact Assessment",
          effort_estimate: "high",
          business_impact_score: 0.92,
          workflow_frequency_score: 0.65,
          downstream_dependency_score: 0.88,
          analysis_confidence: 0.78,
          confidence_penalty: 0.82,
          score_breakdown: { business_impact: 36.8, workflow_frequency: 19.5, downstream: 17.6, confidence_adj: 7.1 },
        },
      ],
    },
  ];
}
