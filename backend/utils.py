import os
import yaml
from pathlib import Path
from typing import List, Dict, Any

def create_yolo_structure(base_path: str, classes: List[str]):
    """
    Creates the standard YOLO dataset structure:
    base_path/
        data.yaml
        images/
            train/
            val/
        labels/
            train/
            val/
    """
    base = Path(base_path)
    
    # Create directories
    for subdir in ['images/train', 'images/val', 'labels/train', 'labels/val']:
        (base / subdir).mkdir(parents=True, exist_ok=True)
        
    # Create data.yaml
    yaml_content = {
        'path': str(base.absolute()),
        'train': 'images/train',
        'val': 'images/val',
        'nc': len(classes),
        'names': classes
    }
    
    with open(base / 'data.yaml', 'w') as f:
        yaml.dump(yaml_content, f, default_flow_style=False)
        
    return str(base.absolute())

def save_yolo_label(base_path: str, image_name: str, annotations: List[Dict[str, Any]], classes: List[str], subset: str = 'train'):
    """
    Saves a YOLO formatted txt file for a given image.
    YOLO format: <class_id> <x_center> <y_center> <width> <height>
    All coordinates should be normalized (0-1).
    """
    # Create label file path
    # image_name: 'my_photo.jpg' -> 'my_photo.txt'
    name_stem = Path(image_name).stem
    label_path = Path(base_path) / 'labels' / subset / f"{name_stem}.txt"
    
    lines = []
    for ann in annotations:
        try:
            class_id = classes.index(ann['label'])
        except ValueError:
            # If label not in classes, maybe auto-add or skip? For now skip or use -1
            continue
            
        bbox = ann['bbox']
        # Assuming bbox comes in as x, y, w, h (pixels)
        # We need normalized x_center, y_center, w, h
        # BUT we need image dimensions to normalize.
        # IF the frontend sends normalized coordinates, we are good.
        # If not, we need image width/height passed in.
        
        # NOTE: The current types.ts BoundingBox is x,y,w,h.
        # We'll assume the frontend will do the conversion or pass the necessary info.
        # For now, let's assume the frontend sends NORMALIZED xywh if possible, 
        # OR we accept image dimensions here.
        
        # Let's simple write exact values for now and refine later.
        # YOLO needs normalized values 0-1.
        
        lines.append(f"{class_id} {bbox['x']} {bbox['y']} {bbox['w']} {bbox['h']}")
        
    with open(label_path, 'w') as f:
        f.write('\n'.join(lines))

def parse_qwen_response(response_text: str) -> List[Dict[str, Any]]:
    """
    Parses the Qwen3-VL JSON output.
    Expected format: 
    ```json
    [
      {"bbox_2d": [x1, y1, x2, y2], "label": "class_name"}
    ]
    ```
    Returns a list of annotations with bbox in {x, y, w, h} format.
    """
    import json
    import re
    
    print(f"Parsing Qwen Response: {repr(response_text)}")
    
    # 1. Try to find a JSON list
    match = re.search(r'(\[.*\])', response_text, re.DOTALL)
    if match:
        clean_text = match.group(1)
    else:
        # Fallback cleanup
        clean_text = response_text.replace("```json", "").replace("```", "").strip()
    
    annotations = []
    try:
        data = json.loads(clean_text)
        
        # 2. Iterate over detections
        for item in data:
            if "bbox_2d" in item:
                x1, y1, x2, y2 = item["bbox_2d"]
                w = x2 - x1
                h = y2 - y1
                
                annotations.append({
                    "label": item.get("label", "object"),
                    "confidence": 1.0, # Qwen doesn't give confidence in this mode usually
                    "bbox": {
                        "x": x1, 
                        "y": y1, 
                        "w": w, 
                        "h": h
                    }
                })
    except Exception as e:
        print(f"Failed to parse Qwen output: {clean_text} | Error: {e}")
        pass
        
    return annotations
