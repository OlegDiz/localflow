from typing import Any, Dict, List, Optional

import os
import requests

from .utils import encode_image_base64, parse_qwen_response, scale_qwen_bbox


class InferenceError(RuntimeError):
    pass


def _ollama_infer(model: str, prompt: str, image_path: Optional[str], base_url: str) -> List[Dict[str, Any]]:
    encoded = None
    width = height = 0
    if image_path:
        encoded, width, height, _ = encode_image_base64(image_path)

    system_prompt = "You are a vision assistant. Return bounding boxes in JSON format."
    payload = {
        "model": model,
        "prompt": f"{prompt} {system_prompt}",
        "system": system_prompt,
        "stream": False,
        "images": [encoded] if encoded else [],
        "options": {"num_gpu": -1},
    }

    response = requests.post(f"{base_url}/api/generate", json=payload, timeout=120)
    response.raise_for_status()
    data = response.json()
    raw_text = data.get("response", "")

    annotations = parse_qwen_response(raw_text)
    if width and height:
        annotations = scale_qwen_bbox(annotations, width, height)
    return annotations


def _lmstudio_infer(model: str, prompt: str, image_path: Optional[str], base_url: str) -> List[Dict[str, Any]]:
    encoded = None
    width = height = 0
    mime = "image/jpeg"
    if image_path:
        encoded, width, height, mime = encode_image_base64(image_path)

    system_prompt = "You are a vision assistant. Return bounding boxes in JSON format."

    content: List[Dict[str, Any]] = [{"type": "text", "text": f"{prompt} {system_prompt}"}]
    if encoded:
        content.append({
            "type": "image_url",
            "image_url": {"url": f"data:{mime};base64,{encoded}"},
        })

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": content}],
        "temperature": 0.2,
        "max_tokens": 2048,
    }

    response = requests.post(f"{base_url}/v1/chat/completions", json=payload, timeout=120)
    response.raise_for_status()
    data = response.json()
    choices = data.get("choices", [])
    raw_text = choices[0]["message"]["content"] if choices else ""

    annotations = parse_qwen_response(raw_text)
    if width and height:
        annotations = scale_qwen_bbox(annotations, width, height)
    return annotations


def run_inference(backend: str, model: str, prompt: str, image_path: Optional[str]) -> List[Dict[str, Any]]:
    if not model and backend.lower() != "mock":
        raise InferenceError("No model selected.")

    backend_key = backend.lower()
    ollama_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
    lmstudio_url = os.getenv("LMSTUDIO_BASE_URL", "http://127.0.0.1:1234").rstrip("/")
    if backend_key == "ollama":
        return _ollama_infer(model, prompt, image_path, ollama_url)
    if backend_key == "lmstudio":
        return _lmstudio_infer(model, prompt, image_path, lmstudio_url)

    return []


def fetch_models(backend: str) -> List[str]:
    backend_key = backend.lower()
    if backend_key == "ollama":
        base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
        response = requests.get(f"{base_url}/v1/models", timeout=30)
    elif backend_key == "lmstudio":
        base_url = os.getenv("LMSTUDIO_BASE_URL", "http://127.0.0.1:1234").rstrip("/")
        response = requests.get(f"{base_url}/v1/models", timeout=30)
    else:
        return ["mock-vision-v1"]

    response.raise_for_status()
    data = response.json()
    return [model.get("id", "") for model in data.get("data", []) if model.get("id")]
