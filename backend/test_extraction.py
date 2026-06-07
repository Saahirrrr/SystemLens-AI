"""
backend/test_extraction.py

A standalone script to test the DocumentParser and SystemExtractor pipeline.
Usage:
    python3 backend/test_extraction.py [path/to/sample/document.pdf]
"""

import asyncio
import json
import logging
import sys
from pathlib import Path

from backend.services.document_parser import (
    DocumentParserError,
    UnsupportedFormatError,
    parse_document,
)
from backend.services.system_extractor import (
    SystemExtractionError,
    SystemExtractor,
)

# Configure simple logging to stdout
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("test_extraction")


async def main() -> None:
    # 1. Load sample file path
    if len(sys.argv) > 1:
        file_path_str = sys.argv[1]
    else:
        # Default fallback if no argument is provided
        file_path_str = "sample_document.txt"
        
    file_path = Path(file_path_str)
    
    if not file_path.exists():
        logger.error("File not found: %s", file_path.absolute())
        # If running the default fallback, let's create a dummy text file to test with
        if file_path.name == "sample_document.txt":
            logger.info("Creating a dummy sample_document.txt for testing...")
            dummy_content = (
                "IT Systems Audit Report\\n\\n"
                "We use Salesforce CRM for tracking all customer interactions. "
                "Salesforce is business critical and uses OAuth2 for authentication.\\n\\n"
                "For HR, we use Workday. It manages Employee data and Payroll processes. "
                "Workday is critical and authenticates via SAML."
            )
            file_path.write_text(dummy_content, encoding="utf-8")
        else:
            sys.exit(1)

    logger.info("Reading file: %s", file_path)
    try:
        raw_bytes = file_path.read_bytes()
    except Exception as exc:
        logger.error("Failed to read file: %s", exc)
        sys.exit(1)

    # 2. Parse with DocumentParser
    logger.info("Parsing document...")
    try:
        parsed_doc = parse_document(file_path.name, raw_bytes)
    except UnsupportedFormatError as exc:
        logger.error("Unsupported file format: %s", exc)
        sys.exit(1)
    except DocumentParserError as exc:
        logger.error("Document parsing failed: %s", exc)
        sys.exit(1)

    logger.info(
        "Successfully parsed %s as %s with %d pages.",
        parsed_doc.filename,
        parsed_doc.document_type.value,
        parsed_doc.total_pages,
    )

    # 3. Extract systems using SystemExtractor
    logger.info("Extracting systems...")
    extractor = SystemExtractor()
    try:
        systems = await extractor.extract_systems(parsed_doc)
    except SystemExtractionError as exc:
        logger.error("System extraction failed: %s", exc)
        sys.exit(1)
    except Exception as exc:
        logger.error("Unexpected error during extraction: %s", exc)
        sys.exit(1)

    # 4. Print structured JSON output
    print("\\n" + "=" * 60)
    print("EXTRACTION RESULTS (ALL SYSTEMS)")
    print("=" * 60)
    
    systems_dicts = [sys.model_dump() for sys in systems]
    print(json.dumps(systems_dicts, indent=2))

    # 5. Print flagged systems separately
    flagged = [s for s in systems if s.flagged_for_review]
    
    print("\\n" + "=" * 60)
    print(f"FLAGGED SYSTEMS ({len(flagged)} found)")
    print("=" * 60)
    
    if not flagged:
        print("No systems flagged for review.")
    else:
        flagged_dicts = [s.model_dump() for s in flagged]
        print(json.dumps(flagged_dicts, indent=2))
        
    print("\\nDone.")


if __name__ == "__main__":
    # Ensure graceful exit on KeyboardInterrupt
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Interrupted by user. Exiting.")
        sys.exit(1)
