import base64
import io
import json
import re
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple

from PIL import Image


def encode_image_base64(image_path: str) -> Tuple[str, int, int, str]:
    """Return base64 (no data URI), width, height, and mime type for an image."""
    path = Path(image_path)
    with path.open("rb") as handle:
        data = handle.read()
    image = Image.open(io.BytesIO(data))
    width, height = image.size
    mime = Image.MIME.get(image.format, "image/jpeg")
    encoded = base64.b64encode(data).decode("ascii")
    return encoded, width, height, mime


def parse_qwen_response(response_text: str) -> List[Dict[str, Any]]:
    """
    Parse Qwen-style JSON output.

    Expected format:
    [
      {"bbox_2d": [x1, y1, x2, y2], "label": "class_name"}
    ]
    """
    match = re.search(r"(\[.*\])", response_text, re.DOTALL)
    if match:
        clean_text = match.group(1)
    else:
        clean_text = response_text.replace("```json", "").replace("```", "").strip()

    annotations: List[Dict[str, Any]] = []
    try:
        data = json.loads(clean_text)
        for item in data:
            if "bbox_2d" not in item:
                continue
            x1, y1, x2, y2 = item["bbox_2d"]
            w = x2 - x1
            h = y2 - y1
            annotations.append(
                {
                    "label": item.get("label", "object"),
                    "confidence": float(item.get("confidence", 1.0)),
                    "bbox": {"x": x1, "y": y1, "w": w, "h": h},
                }
            )
    except Exception:
        return []

    return annotations


def scale_qwen_bbox(annotations: Iterable[Dict[str, Any]], width: int, height: int) -> List[Dict[str, Any]]:
    """Convert Qwen's 0-1000 scale bbox to absolute pixels."""
    scaled = []
    for ann in annotations:
        bbox = dict(ann.get("bbox", {}))
        bbox["x"] = (bbox.get("x", 0) / 1000.0) * width
        bbox["y"] = (bbox.get("y", 0) / 1000.0) * height
        bbox["w"] = (bbox.get("w", 0) / 1000.0) * width
        bbox["h"] = (bbox.get("h", 0) / 1000.0) * height
        scaled.append({**ann, "bbox": bbox})
    return scaled


def ensure_dir(path: str) -> Path:
    """Create a directory if it doesn't exist."""
    out = Path(path)
    out.mkdir(parents=True, exist_ok=True)
    return out


def yolo_label_line(class_id: int, bbox: Dict[str, float]) -> str:
    return f"{class_id} {bbox['x']:.6f} {bbox['y']:.6f} {bbox['w']:.6f} {bbox['h']:.6f}"


def normalize_bbox(bbox: Dict[str, float], width: int, height: int) -> Dict[str, float]:
    """Convert pixel bbox (x,y,w,h) to normalized YOLO center coords."""
    if width == 0 or height == 0:
        return {"x": 0.0, "y": 0.0, "w": 0.0, "h": 0.0}
    x_center = (bbox["x"] + bbox["w"] / 2.0) / width
    y_center = (bbox["y"] + bbox["h"] / 2.0) / height
    w = bbox["w"] / width
    h = bbox["h"] / height
    return {"x": x_center, "y": y_center, "w": w, "h": h}
