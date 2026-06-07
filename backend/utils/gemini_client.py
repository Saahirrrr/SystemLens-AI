"""
backend/utils/gemini_client.py

Async Gemini API client for the Discovery Agent.

Features
--------
- Gemini 2.5 Flash (configurable via env)
- JSON-mode generation with optional Pydantic response schema
- Multimodal generation (text + image bytes) for document vision
- Built-in SDK-level retry via HttpRetryOptions (handles 429/5xx at transport)
- Application-level exponential backoff fallback for ClientError / APIError
- Per-call timeout enforced with asyncio.wait_for
- Structured logging with per-call correlation IDs
- Zero runtime dependencies beyond google-genai and python-dotenv

Environment variables
---------------------
GEMINI_API_KEY          Required. Your Google AI Studio API key.
GEMINI_MODEL            Default: gemini-2.5-flash
GEMINI_TIMEOUT          Seconds per call before TimeoutError. Default: 120
GEMINI_MAX_RETRIES      App-level retries on top of SDK retries. Default: 3
GEMINI_INITIAL_BACKOFF  Seconds for first retry wait. Default: 2.0
GEMINI_BACKOFF_MULT     Multiplier per retry. Default: 2.0
GEMINI_MAX_BACKOFF      Cap on backoff wait. Default: 30.0
GEMINI_TEMPERATURE      Sampling temperature. Default: 0.1 (deterministic)
GEMINI_SDK_RETRIES      SDK-level transport retry attempts. Default: 3
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import random
import time
import uuid
from dataclasses import dataclass, field
from typing import Any, Type

from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.errors import APIError, ClientError
from pydantic import BaseModel

load_dotenv()

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class GeminiConfig:
    """
    Immutable configuration sourced from environment variables.
    Raises KeyError at startup if GEMINI_API_KEY is not set.
    """

    api_key: str = field(
        default_factory=lambda: os.environ["GEMINI_API_KEY"]
    )
    model_name: str = field(
        default_factory=lambda: os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    )
    timeout_seconds: float = field(
        default_factory=lambda: float(os.getenv("GEMINI_TIMEOUT", "120"))
    )
    max_retries: int = field(
        default_factory=lambda: int(os.getenv("GEMINI_MAX_RETRIES", "3"))
    )
    initial_backoff: float = field(
        default_factory=lambda: float(os.getenv("GEMINI_INITIAL_BACKOFF", "2.0"))
    )
    backoff_multiplier: float = field(
        default_factory=lambda: float(os.getenv("GEMINI_BACKOFF_MULT", "2.0"))
    )
    max_backoff: float = field(
        default_factory=lambda: float(os.getenv("GEMINI_MAX_BACKOFF", "30.0"))
    )
    temperature: float = field(
        default_factory=lambda: float(os.getenv("GEMINI_TEMPERATURE", "0.1"))
    )
    sdk_retries: int = field(
        default_factory=lambda: int(os.getenv("GEMINI_SDK_RETRIES", "3"))
    )


# ---------------------------------------------------------------------------
# Retry helpers
# ---------------------------------------------------------------------------


def _is_retryable(exc: Exception) -> bool:
    """
    Return True for transient errors that warrant a retry.

    SDK-level retry (HttpRetryOptions) already handles 429/5xx at the
    transport layer.  This application-level check is a safety net for
    errors that escape the SDK retry budget, e.g. 503s during a burst.
    """
    if isinstance(exc, ClientError):
        # ClientError wraps HTTP 4xx; only 429 is retryable
        return exc.status_code == 429
    if isinstance(exc, APIError):
        # APIError covers 5xx server errors
        return True
    if isinstance(exc, asyncio.TimeoutError):
        return True
    return False


def _backoff_seconds(attempt: int, config: GeminiConfig) -> float:
    """
    Exponential backoff with full jitter.

    Formula: min(max_backoff, initial * multiplier^attempt) * random(0.5, 1.0)
    Jitter avoids thundering-herd retries across concurrent requests.
    """
    exponential = config.initial_backoff * (config.backoff_multiplier ** attempt)
    capped = min(config.max_backoff, exponential)
    return capped * random.uniform(0.5, 1.0)


# ---------------------------------------------------------------------------
# Client
# ---------------------------------------------------------------------------


class GeminiClient:
    """
    Async wrapper around the google-genai SDK for the Discovery Agent.

    Usage
    -----
    # At FastAPI startup (lifespan):
        client = GeminiClient()

    # In a service:
        result: dict = await client.generate_json(
            prompt="Extract systems from: ...",
            system_instruction="You are a system analyst...",
            response_schema=SystemExtractionResponse,   # Pydantic model
        )

        result: dict = await client.generate_multimodal(
            prompt="List all IT systems visible in this diagram.",
            image_bytes=file_bytes,
            image_mime_type="image/png",
        )
    """

    def __init__(self, config: GeminiConfig | None = None) -> None:
        self._config = config or GeminiConfig()
        self._client = self._build_client()
        logger.info(
            "GeminiClient initialised",
            extra={"model": self._config.model_name},
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def generate_json(
        self,
        prompt: str,
        system_instruction: str | None = None,
        response_schema: Type[BaseModel] | None = None,
    ) -> dict[str, Any]:
        """
        Send a text prompt and return a parsed JSON dict.

        Parameters
        ----------
        prompt:
            The user-facing prompt text.
        system_instruction:
            Optional system-level instruction injected before the prompt.
        response_schema:
            Optional Pydantic model.  When provided, Gemini constrains its
            output to the model's JSON schema — eliminating markdown wrapping
            and schema drift.

        Returns
        -------
        dict
            Parsed JSON response from the model.

        Raises
        ------
        GeminiJSONParseError
            When the response cannot be parsed as JSON after all retries.
        GeminiRetryExhaustedError
            When all retry attempts fail.
        asyncio.TimeoutError
            When a single call exceeds GEMINI_TIMEOUT seconds (propagated
            after all retries are exhausted).
        """
        call_id = str(uuid.uuid4())[:8]
        generation_config = self._json_generation_config(response_schema)
        contents = [types.Content(role="user", parts=[types.Part(text=prompt)])]

        raw = await self._call_with_retry(
            call_id=call_id,
            contents=contents,
            system_instruction=system_instruction,
            generation_config=generation_config,
        )
        return self._parse_json(raw, call_id)

    async def generate_multimodal(
        self,
        prompt: str,
        image_bytes: bytes,
        image_mime_type: str = "image/png",
        system_instruction: str | None = None,
        response_schema: Type[BaseModel] | None = None,
    ) -> dict[str, Any]:
        """
        Send an image + text prompt and return a parsed JSON dict.

        Used by document_parser.py for PNG/JPG files that cannot be
        converted to plain text via PyMuPDF.

        Parameters
        ----------
        prompt:
            Instruction to accompany the image.
        image_bytes:
            Raw bytes of the image file.
        image_mime_type:
            MIME type string, e.g. "image/png" or "image/jpeg".
        system_instruction:
            Optional system-level instruction.
        response_schema:
            Optional Pydantic model for constrained JSON output.

        Returns
        -------
        dict
            Parsed JSON response from the model.
        """
        call_id = str(uuid.uuid4())[:8]
        generation_config = self._json_generation_config(response_schema)
        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part(
                        inline_data=types.Blob(
                            mime_type=image_mime_type,
                            data=image_bytes,
                        )
                    ),
                    types.Part(text=prompt),
                ],
            )
        ]

        raw = await self._call_with_retry(
            call_id=call_id,
            contents=contents,
            system_instruction=system_instruction,
            generation_config=generation_config,
        )
        return self._parse_json(raw, call_id)

    # ------------------------------------------------------------------
    # Internal — call + retry
    # ------------------------------------------------------------------

    async def _call_with_retry(
        self,
        call_id: str,
        contents: list[types.Content],
        system_instruction: str | None,
        generation_config: types.GenerateContentConfig,
    ) -> str:
        """
        Execute a Gemini API call with application-level exponential backoff.

        The SDK's built-in HttpRetryOptions already handle transient 429/5xx
        at the transport layer.  This layer retries errors that escape the
        SDK budget (e.g. timeout, persistent 429 bursts).
        """
        cfg = self._config
        last_exc: Exception | None = None

        for attempt in range(cfg.max_retries + 1):
            try:
                logger.debug(
                    "Gemini call attempt %d/%d [%s]",
                    attempt + 1,
                    cfg.max_retries + 1,
                    call_id,
                )
                t0 = time.monotonic()

                response = await asyncio.wait_for(
                    self._client.aio.models.generate_content(
                        model=cfg.model_name,
                        contents=contents,
                        config=generation_config
                        if system_instruction is None
                        else self._inject_system_instruction(
                            generation_config, system_instruction
                        ),
                    ),
                    timeout=cfg.timeout_seconds,
                )

                elapsed = time.monotonic() - t0
                logger.info(
                    "Gemini call succeeded in %.2fs [%s]", elapsed, call_id
                )
                return response.text  # type: ignore[return-value]

            except Exception as exc:
                last_exc = exc
                if not _is_retryable(exc) or attempt == cfg.max_retries:
                    logger.error(
                        "Gemini call failed (non-retryable or exhausted) [%s]: %s",
                        call_id,
                        exc,
                    )
                    raise GeminiRetryExhaustedError(
                        f"All {cfg.max_retries + 1} attempts failed"
                    ) from exc

                wait = _backoff_seconds(attempt, cfg)
                logger.warning(
                    "Gemini call attempt %d failed [%s], retrying in %.1fs: %s",
                    attempt + 1,
                    call_id,
                    wait,
                    exc,
                )
                await asyncio.sleep(wait)

        # Should never reach here, but satisfies type checkers
        raise GeminiRetryExhaustedError("Retry loop exited unexpectedly") from last_exc

    # ------------------------------------------------------------------
    # Internal — client construction & config helpers
    # ------------------------------------------------------------------

    def _build_client(self) -> genai.Client:
        """
        Construct the google-genai Client with SDK-level retry options.

        HttpRetryOptions fires *before* the application-level backoff in
        _call_with_retry, giving a two-tier retry strategy:
          Tier 1 (SDK):  fast retries at the HTTP transport layer
          Tier 2 (app):  slower exponential backoff for persistent failures
        """
        return genai.Client(
            api_key=self._config.api_key,
            http_options=types.HttpOptions(
                retry_options=types.HttpRetryOptions(
                    attempts=self._config.sdk_retries,
                    initial_delay=1.0,
                    http_status_codes=[429, 500, 502, 503, 504],
                )
            ),
        )

    def _json_generation_config(
        self, response_schema: Type[BaseModel] | None
    ) -> types.GenerateContentConfig:
        """
        Build a GenerateContentConfig that enforces JSON output.

        When a Pydantic response_schema is provided, Gemini constrains
        its output to that exact schema — preventing spurious fields and
        missing required keys.
        """
        base: dict[str, Any] = {
            "response_mime_type": "application/json",
            "temperature": self._config.temperature,
        }
        if response_schema is not None:
            base["response_schema"] = response_schema
        return types.GenerateContentConfig(**base)

    @staticmethod
    def _inject_system_instruction(
        config: types.GenerateContentConfig,
        instruction: str,
    ) -> types.GenerateContentConfig:
        """
        Return a copy of *config* with system_instruction set.

        Gemini 2.5 Flash supports system instructions natively; they are
        injected here rather than prepended to the user prompt so they do
        not consume conversational context tokens.
        """
        return types.GenerateContentConfig(
            response_mime_type=config.response_mime_type,
            response_schema=config.response_schema,
            temperature=config.temperature,
            system_instruction=instruction,
        )

    # ------------------------------------------------------------------
    # Internal — response parsing
    # ------------------------------------------------------------------

    @staticmethod
    def _parse_json(raw: str, call_id: str) -> dict[str, Any]:
        """
        Parse a raw string response as JSON.

        Gemini JSON mode should return clean JSON, but this method strips
        any accidental markdown code fences (```json ... ```) as a
        defensive fallback.
        """
        text = raw.strip()

        # Defensive: strip markdown code fences if present
        if text.startswith("```"):
            lines = text.splitlines()
            # Remove opening fence (```json or ```) and closing fence (```)
            lines = lines[1:] if lines[0].startswith("```") else lines
            lines = lines[:-1] if lines and lines[-1].strip() == "```" else lines
            text = "\n".join(lines).strip()

        try:
            return json.loads(text)
        except json.JSONDecodeError as exc:
            logger.error(
                "JSON parse failed [%s]. Raw response (first 500 chars): %.500s",
                call_id,
                raw,
            )
            raise GeminiJSONParseError(
                f"Response was not valid JSON: {exc}"
            ) from exc


# ---------------------------------------------------------------------------
# Custom exceptions
# ---------------------------------------------------------------------------


class GeminiClientError(Exception):
    """Base class for all GeminiClient errors."""


class GeminiRetryExhaustedError(GeminiClientError):
    """Raised when all retry attempts are exhausted."""


class GeminiJSONParseError(GeminiClientError):
    """Raised when the model response cannot be parsed as JSON."""
