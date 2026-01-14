
# LocalFlow - Localhost Data Annotation Tool

LocalFlow is a high-performance local alternative to Roboflow. It runs entirely on your machine, integrating with local ML backends like Ollama and LM Studio for auto-labeling.

## Key Features
- **Playground**: Test local vision models on single images.
- **Annotate**: Bulk label datasets with drag-and-resize bounding boxes.
- **Auto-Label**: Uses zero-shot models (via Ollama) to pre-populate labels.
- **YOLO Export**: One-click export for YOLOv8 and YOLO11 training.

## Run Instructions

### 1. Start Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python main.py
```
*Backend runs on http://localhost:8000*

### 2. Start Frontend (React/Vite)
```bash
npm install
npm run dev
```
*Frontend runs on http://localhost:3000*

## API Specification
- `POST /inference`: Send image + prompt to run local ML.
- `GET /projects`: List all local projects.
- `POST /projects/{id}/export`: Split dataset and generate a ZIP.

## Internal Schema
Annotations are stored as:
```json
{
  "id": "uuid",
  "label": "string",
  "confidence": 0.0-1.0,
  "bbox": { "x": int, "y": int, "w": int, "h": int },
  "source": "model_name"
}
```
