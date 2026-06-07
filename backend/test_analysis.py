"""
backend/test_analysis.py

A standalone script to test the AnalysisEngine with a mock L1 inventory
and predefined use cases.
Usage:
    python3 backend/test_analysis.py
"""

import asyncio
import json
import logging
import sys
from datetime import datetime

from backend.models.system import SystemRecord
from backend.services.analysis_engine import (
    AnalysisEngine,
    AnalysisEngineError,
    UseCase,
)

# Configure simple logging to stdout
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("test_analysis")


def create_sample_inventory() -> list[SystemRecord]:
    """Creates a sample L1 inventory with 4 common enterprise systems."""
    return [
        SystemRecord(
            name="Salesforce CRM",
            category="CRM",
            authentication_method="OAuth2",
            criticality="high",
            confidence_score=0.95,
            key_entities=["Customer", "Opportunity", "Contact", "Account", "User"],
            business_processes=["Sales Pipeline Management", "Lead Tracking", "Contract Management"],
            evidence="The Sales team manages all customer opportunities, contacts, and accounts in Salesforce CRM.",
            source_document="acme_it_audit.pdf",
        ),
        SystemRecord(
            name="Workday",
            category="HRIS",
            authentication_method="SAML",
            criticality="critical",
            confidence_score=0.96,
            key_entities=["Employee", "Payroll Run", "Benefits Plan", "Department"],
            business_processes=["Payroll Processing", "Employee Onboarding", "Employee Offboarding", "Performance Reviews"],
            evidence="HR operations are handled by Workday, including payroll processing, benefits administration, and performance reviews.",
            source_document="acme_it_audit.pdf",
        ),
        SystemRecord(
            name="Okta",
            category="IdP",
            authentication_method="SAML",
            criticality="critical",
            confidence_score=0.97,
            key_entities=["User", "Group", "MFA Policy", "SSO Application"],
            business_processes=["Identity Provisioning", "Single Sign-On", "MFA Enforcement", "Access Revocation"],
            evidence="Acme Corp uses Okta as its primary Identity Provider (IdP) for single sign-on across all corporate applications.",
            source_document="acme_it_audit.pdf",
        ),
        SystemRecord(
            name="ServiceNow",
            category="ITSM",
            authentication_method="Unknown",
            criticality="high",
            confidence_score=0.82,
            key_entities=["Ticket", "Incident", "Change Request", "CMDB Record", "Task"],
            business_processes=["Incident Management", "Change Management", "Asset Tracking", "Onboarding Tasks", "Offboarding Tasks"],
            evidence="IT operations are tracked in ServiceNow. Tickets are raised for all infrastructure changes.",
            source_document="acme_it_audit.pdf",
        ),
    ]


def create_sample_use_cases() -> list[UseCase]:
    """Creates two sample use cases to be analyzed against the inventory."""
    return [
        UseCase(
            name="Employee Onboarding",
            description="When a new employee joins Acme Corp, their user account must be created, "
                        "Salesforce CRM access provisioned, and an IT onboarding ticket raised "
                        "automatically. Payroll setup in Workday must be triggered upon contract signing.",
            trigger="New hire record created in Workday",
            expected_outcome="New employee has Okta SSO access, Salesforce CRM licence, "
                             "and an open ServiceNow onboarding ticket — all within 24 hours.",
            stated_systems=["Workday", "Okta"]
        ),
        UseCase(
            name="Employee Offboarding",
            description="When an employee leaves the company, their access to all corporate systems "
                        "must be revoked immediately. Their Workday record must be marked as terminated, "
                        "which should trigger a de-provisioning workflow to remove Okta access and "
                        "Salesforce licenses. A ServiceNow ticket should be generated to track hardware return.",
            trigger="Employee status changed to 'Terminated' in Workday",
            expected_outcome="Former employee's Okta and Salesforce access is revoked instantly. "
                             "An offboarding ticket is created in ServiceNow for hardware retrieval.",
            stated_systems=["Workday", "Okta", "ServiceNow"]
        )
    ]


async def main() -> None:
    logger.info("Initializing test data...")
    inventory = create_sample_inventory()
    use_cases = create_sample_use_cases()

    logger.info("Starting AnalysisEngine...")
    engine = AnalysisEngine()

    try:
        reports = await engine.analyze_use_cases(inventory, use_cases)
    except AnalysisEngineError as exc:
        logger.error("AnalysisEngine failed: %s", exc)
        sys.exit(1)
    except Exception as exc:
        logger.error("Unexpected error during analysis: %s", exc)
        sys.exit(1)

    if not reports:
        logger.warning("No reports were generated.")
        sys.exit(0)

    # Print the structured output for each use case
    for report in reports:
        print("\\n" + "=" * 80)
        print(f"USE CASE: {report.use_case_name.upper()}")
        print("=" * 80)

        print("\\n--- Use Case Mappings ---")
        mappings_dict = [m.model_dump() for m in report.use_case_mappings]
        print(json.dumps(mappings_dict, indent=2))

        print("\\n--- Data Flows ---")
        flows_dict = [f.model_dump() for f in report.data_flows]
        print(json.dumps(flows_dict, indent=2))

        print("\\n--- Integration Gaps ---")
        gaps_dict = [g.model_dump() for g in report.integration_gaps]
        print(json.dumps(gaps_dict, indent=2))

        print("\\n--- Priority Report ---")
        priorities_dict = [p.model_dump() for p in report.priority_report]
        print(json.dumps(priorities_dict, indent=2))

    print("\\nDone.")


if __name__ == "__main__":
    # Ensure graceful exit on KeyboardInterrupt
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Interrupted by user. Exiting.")
        sys.exit(1)
