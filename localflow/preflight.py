import os
from typing import Dict, Tuple

import requests


DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434"
DEFAULT_LMSTUDIO_URL = "http://127.0.0.1:1234"


def _get_env(name: str, default: str) -> str:
    value = os.getenv(name, default).strip()
    return value.rstrip("/")


def probe_ollama(base_url: str) -> bool:
    try:
        response = requests.get(f"{base_url}/api/tags", timeout=5)
        return response.ok and response.headers.get("content-type", "").startswith("application/json")
    except Exception:
        return False


def probe_lmstudio(base_url: str) -> bool:
    try:
        response = requests.get(f"{base_url}/v1/models", timeout=5)
        return response.ok and response.headers.get("content-type", "").startswith("application/json")
    except Exception:
        return False


def select_provider() -> Tuple[str, Dict[str, bool], Dict[str, str]]:
    provider = os.getenv("LLM_PROVIDER", "auto").strip().lower()
    ollama_url = _get_env("OLLAMA_BASE_URL", DEFAULT_OLLAMA_URL)
    lmstudio_url = _get_env("LMSTUDIO_BASE_URL", DEFAULT_LMSTUDIO_URL)

    statuses = {
        "ollama": probe_ollama(ollama_url),
        "lmstudio": probe_lmstudio(lmstudio_url),
    }
    urls = {"ollama": ollama_url, "lmstudio": lmstudio_url}

    if provider == "ollama":
        return "ollama", statuses, urls
    if provider == "lmstudio":
        return "lmstudio", statuses, urls

    if statuses["ollama"]:
        return "ollama", statuses, urls
    if statuses["lmstudio"]:
        return "lmstudio", statuses, urls
    return "auto", statuses, urls


def check_or_raise() -> str:
    provider, statuses, urls = select_provider()
    if provider == "ollama" and statuses["ollama"]:
        return "Ollama"
    if provider == "lmstudio" and statuses["lmstudio"]:
        return "LMStudio"
    if provider == "auto" and (statuses["ollama"] or statuses["lmstudio"]):
        return "Ollama" if statuses["ollama"] else "LMStudio"

    message = (
        "No reachable LLM runtime found.\n"
        "Tried:\n"
        f"- Ollama: {urls['ollama']} (/api/tags) -> {'ok' if statuses['ollama'] else 'down'}\n"
        f"- LM Studio: {urls['lmstudio']} (/v1/models) -> {'ok' if statuses['lmstudio'] else 'down'}\n"
        "Set LLM_PROVIDER=ollama|lmstudio|auto and update OLLAMA_BASE_URL / LMSTUDIO_BASE_URL in your .env.\n"
        "Start the provider (Ollama: `ollama serve`, LM Studio: Local Server -> Start)."
    )
    raise RuntimeError(message)


DEFAULT_PROVIDER = check_or_raise()
