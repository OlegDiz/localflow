from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from .utils import create_yolo_structure, save_yolo_label

app = FastAPI(title="LocalFlow Backend")

# Allow CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BoundingBox(BaseModel):
    x: float
    y: float
    w: float
    h: float

class Annotation(BaseModel):
    id: str
    label: str
    confidence: float
    bbox: BoundingBox
    source: str

class ImageMetadata(BaseModel):
    id: str
    name: str
    width: int
    height: int
    annotations: List[Annotation]
    status: str

class ProjectExport(BaseModel):
    path: str
    classes: List[str]
    images: List[ImageMetadata]
    format: str = "YOLOv8"

@app.get("/")
def read_root():
    return {"message": "LocalFlow Backend is running! 🚀", "docs": "/docs"}

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "localflow-backend"}

class InferenceParams(BaseModel):
    backend: str
    model: str
    prompt: str
    image: Optional[str] = None # Base64 encoded including scheme potentially
    threshold: Optional[float] = 0.5

@app.post("/api/inference")
async def run_inference(params: InferenceParams):
    import requests
    import base64
    from io import BytesIO
    from PIL import Image
    # Import here or at top. Using inside for now to avoid mess if top changes.
    from .utils import parse_qwen_response

    if params.backend == "Ollama":
        print(f"Running inference on {params.model} via Ollama...")
        try:
            # Prepare image: Logic to strip header if present (data:image/jpeg;base64,...)
            clean_image = params.image
            if clean_image and "," in clean_image:
                 clean_image = clean_image.split(",")[1]

            # Decode image to get dimensions
            image_data = base64.b64decode(clean_image)
            img = Image.open(BytesIO(image_data))
            img_w, img_h = img.size
            print(f"Image Dimensions: {img_w}x{img_h}")

            # Qwen specific prompt addition to ensure JSON
            # This is critical.
            system_prompt = "You are a vision assistant. Return bounding boxes in JSON format."
            
            payload = {
                "model": params.model,
                "prompt": params.prompt + " " + system_prompt, # Append to user prompt for safety
                "system": system_prompt, # Also set system param
                "stream": False,
                "images": [clean_image] if clean_image else [],
                "options": {"num_gpu": -1} # Force GPU offloading (CUDA/Metal)
                # "format": "json" REMOVED: Causes empty response with Qwen3-VL
            }
            
            # NOTE: Ollama's /api/generate is used here.
            response = requests.post("http://localhost:11434/api/generate", json=payload)
            response.raise_for_status()
            result = response.json()
            raw_text = result['response']
            print(f"Raw Model Output: {raw_text}")
            
            # Parse
            annotations = parse_qwen_response(raw_text)
            
            # SCALING: Qwen3-VL usually outputs 1000-scale coordinates
            # Frontend expects ABSOLUTE PIXELS
            for ann in annotations:
                ann['source'] = params.model
                ann['id'] = f"auto-{os.urandom(4).hex()}"
                
                # Check if coordinates look like 1000-scale (max ~1000)
                # If they are normalized 0-1, we multiply by size.
                # If they are 0-1000, we divide by 1000 then multiply.
                # Qwen typically does 0-1000.
                
                # Applying 1000-scale conversion
                bbox = ann['bbox']
                bbox['x'] = (bbox['x'] / 1000.0) * img_w
                bbox['y'] = (bbox['y'] / 1000.0) * img_h
                bbox['w'] = (bbox['w'] / 1000.0) * img_w
                bbox['h'] = (bbox['h'] / 1000.0) * img_h
                
            return {"results": annotations}
            
        except Exception as e:
            print(f"Inference Error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    return {"results": []}

@app.post("/api/export")
async def export_dataset(project: ProjectExport):
    try:
        base_path = project.path
        
        # Security check: unlikely to be needed for a local tool, 
        # but good practice to ensure we aren't writing to root or something.
        # (Skipping deep validation for MVP)

        print(f"Exporting project to {base_path} with {len(project.images)} images")
        
        # 1. Create Structure
        create_yolo_structure(base_path, project.classes)
        
        # 2. Save Labels (and ideally move images)
        for img in project.images:
            if img.status != 'labeled' and img.status != 'auto-labeled':
                continue
                
            # Normalize coordinates for YOLO
            # YOLO format: x_center, y_center, width, height (all normalized 0-1)
            # Input bbox (from types.ts): x, y, w, h (pixels, presumably top-left x,y)
            
            # We need to construct a list of dicts for the utils function
            normalized_annotations = []
            for ann in img.annotations:
                # Convert top-left pixel to normalized center
                if img.width == 0 or img.height == 0:
                    continue
                    
                nx = (ann.bbox.x + ann.bbox.w / 2) / img.width
                ny = (ann.bbox.y + ann.bbox.h / 2) / img.height
                nw = ann.bbox.w / img.width
                nh = ann.bbox.h / img.height
                
                normalized_annotations.append({
                    "label": ann.label,
                    "bbox": {"x": nx, "y": ny, "w": nw, "h": nh}
                })
            
            save_yolo_label(base_path, img.name, normalized_annotations, project.classes)
            
            # TODO: Handle Image File Copying
            # The frontend needs to upload the image binary or we need a way to read it.
            # For now, we only create the labels.
            
        return {"success": True, "path": base_path}
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
