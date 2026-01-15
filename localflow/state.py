import asyncio
import os
import uuid
from pathlib import Path
from typing import Dict, List, Optional, TypedDict

import reflex as rx

from .export import create_yolo_zip
from .inference import fetch_models, run_inference
from .utils import encode_image_base64
from .preflight import DEFAULT_PROVIDER, probe_lmstudio, probe_ollama


class BoundingBox(TypedDict):
    x: float
    y: float
    w: float
    h: float


class Annotation(TypedDict):
    id: str
    label: str
    confidence: float
    bbox: BoundingBox
    source: str


class ProjectImage(TypedDict):
    id: str
    name: str
    path: str
    url: str
    width: int
    height: int
    annotations: List[Annotation]
    status: str


class AppState(rx.State):
    active_tab: str = "playground"

    # Model configuration
    backend: str = DEFAULT_PROVIDER
    available_models: List[str] = []
    model: str = ""
    prompt: str = "person, safety vest, helmet"
    threshold: float = 0.5

    # Playground
    playground_image: Optional[ProjectImage] = None
    playground_images: List[ProjectImage] = []
    is_inferencing: bool = False

    # Annotator
    project_images: List[ProjectImage] = []
    is_batching: bool = False
    batch_prompt: str = "Identify and draw bounding boxes for all visible people, cars, and tools."

    # Export
    export_ratio: float = 0.8
    export_seed: int = 42

    # Provider health
    ollama_up: bool = False
    lmstudio_up: bool = False

    def set_tab(self, tab: str) -> None:
        self.active_tab = tab

    def set_prompt(self, value: str) -> None:
        self.prompt = value

    def set_batch_prompt(self, value: str) -> None:
        self.batch_prompt = value

    def set_model(self, value: str) -> None:
        self.model = value

    def set_threshold(self, value) -> None:
        if isinstance(value, list):
            value = value[0] if value else self.threshold
        self.threshold = float(value)

    def set_export_ratio(self, value) -> None:
        if isinstance(value, list):
            value = value[0] if value else self.export_ratio
        self.export_ratio = float(value)

    def set_backend(self, backend: str) -> None:
        self.backend = backend
        self.model = ""
        self.available_models = []

    async def refresh_models(self) -> None:
        self.available_models = []
        models = await asyncio.to_thread(fetch_models, self.backend)
        self.available_models = models
        if models:
            self.model = models[0]

    @rx.event(background=True)
    async def poll_health(self) -> None:
        ollama_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
        lmstudio_url = os.getenv("LMSTUDIO_BASE_URL", "http://127.0.0.1:1234").rstrip("/")
        ollama_ok = await asyncio.to_thread(probe_ollama, ollama_url)
        lmstudio_ok = await asyncio.to_thread(probe_lmstudio, lmstudio_url)
        async with self:
            self.ollama_up = ollama_ok
            self.lmstudio_up = lmstudio_ok

    def _store_upload(self, filename: str, data: bytes) -> str:
        upload_dir = rx.get_upload_dir()
        upload_dir.mkdir(parents=True, exist_ok=True)
        unique_name = f"{uuid.uuid4().hex}_{Path(filename).name}"
        path = upload_dir / unique_name
        path.write_bytes(data)
        return str(path)

    async def upload_playground(self, files: List[rx.UploadFile]) -> None:
        if not files:
            return
        file = files[0]
        data = await file.read()
        saved_path = self._store_upload(file.filename, data)
        _, width, height, _ = encode_image_base64(saved_path)
        new_image: ProjectImage = {
            "id": uuid.uuid4().hex,
            "name": file.filename,
            "path": saved_path,
            "url": rx.get_upload_url(Path(saved_path).name),
            "width": width,
            "height": height,
            "annotations": [],
            "status": "unlabeled",
        }
        self.playground_images = [*self.playground_images, new_image]
        self.playground_image = new_image

    def select_playground_image(self, image_id: str) -> None:
        for image in self.playground_images:
            if image["id"] == image_id:
                self.playground_image = image
                return

    async def upload_batch(self, files: List[rx.UploadFile]) -> None:
        if not files:
            return
        new_images: List[ProjectImage] = []
        for file in files:
            data = await file.read()
            saved_path = self._store_upload(file.filename, data)
            _, width, height, _ = encode_image_base64(saved_path)
            new_images.append(
                {
                    "id": uuid.uuid4().hex,
                    "name": file.filename,
                    "path": saved_path,
                    "url": rx.get_upload_url(Path(saved_path).name),
                    "width": width,
                    "height": height,
                    "annotations": [],
                    "status": "unlabeled",
                }
            )
        self.project_images = [*self.project_images, *new_images]

    @rx.event(background=True)
    async def run_playground_inference(self) -> None:
        if not self.playground_image:
            return
        async with self:
            self.is_inferencing = True
        image_path = self.playground_image["path"]
        results = await asyncio.to_thread(run_inference, self.backend, self.model, self.prompt, image_path)
        for item in results:
            item["id"] = f"auto-{uuid.uuid4().hex[:8]}"
            item["source"] = self.model
        async with self:
            self.playground_image["annotations"] = results
            self.is_inferencing = False

    @rx.event(background=True)
    async def run_batch_labeling(self) -> None:
        if not self.project_images:
            return
        async with self:
            self.is_batching = True

        updated_images: List[ProjectImage] = []
        for image in self.project_images:
            results = await asyncio.to_thread(run_inference, self.backend, self.model, self.batch_prompt, image["path"])
            for item in results:
                item["id"] = f"auto-{uuid.uuid4().hex[:8]}"
                item["source"] = self.model
            updated = dict(image)
            updated["annotations"] = results
            updated["status"] = "labeled" if results else "unlabeled"
            updated_images.append(updated)

            async with self:
                self.project_images = updated_images[:]

        async with self:
            self.is_batching = False

    def clear_project(self) -> None:
        self.project_images = []

    def remove_image(self, image_id: str) -> None:
        self.project_images = [img for img in self.project_images if img["id"] != image_id]

    def export_yolo(self):
        classes = sorted({ann["label"] for img in self.project_images for ann in img.get("annotations", [])})
        labeled = [img for img in self.project_images if img.get("status") == "labeled"]
        zip_path = create_yolo_zip(labeled, classes, self.export_ratio, self.export_seed)
        return rx.download(zip_path)

    @rx.var
    def labeled_count(self) -> int:
        return len([img for img in self.project_images if img.get("status") == "labeled"])

    @rx.var
    def has_images(self) -> bool:
        return bool(self.project_images)

    @rx.var
    def playground_viewbox(self) -> str:
        if not self.playground_image:
            return "0 0 1 1"
        width = self.playground_image.get("width", 1)
        height = self.playground_image.get("height", 1)
        return f"0 0 {width} {height}"

    @rx.var
    def playground_aspect_ratio(self) -> str:
        if not self.playground_image:
            return "16/9"
        width = self.playground_image.get("width", 1)
        height = self.playground_image.get("height", 1)
        return f"{width}/{height}"

    @rx.var
    def playground_annotations(self) -> List[Annotation]:
        if not self.playground_image:
            return []
        return self.playground_image.get("annotations", [])

    @rx.var
    def can_run_inference(self) -> bool:
        return bool(self.playground_image) and bool(self.model)
