import random
import shutil
import tempfile
from pathlib import Path
from typing import Dict, List, Tuple

import yaml

from .utils import ensure_dir, normalize_bbox, yolo_label_line


def _split_images(images: List[Dict], train_ratio: float, seed: int) -> Tuple[List[Dict], List[Dict]]:
    rng = random.Random(seed)
    shuffled = images[:]
    rng.shuffle(shuffled)
    split_at = max(1, int(len(shuffled) * train_ratio)) if shuffled else 0
    return shuffled[:split_at], shuffled[split_at:]


def _write_data_yaml(base_path: Path, classes: List[str]) -> None:
    data = {
        "path": str(base_path),
        "train": "images/train",
        "val": "images/valid",
        "nc": len(classes),
        "names": classes,
    }
    with (base_path / "data.yaml").open("w", encoding="utf-8") as handle:
        yaml.safe_dump(data, handle, sort_keys=False)


def _write_labels(
    label_dir: Path,
    image: Dict,
    classes: List[str],
) -> None:
    annotations = image.get("annotations", [])
    width = image.get("width", 0)
    height = image.get("height", 0)

    lines = []
    for ann in annotations:
        label = ann.get("label")
        if label not in classes:
            continue
        class_id = classes.index(label)
        bbox = ann.get("bbox", {})
        normalized = normalize_bbox(bbox, width, height)
        lines.append(yolo_label_line(class_id, normalized))

    label_path = label_dir / f"{Path(image['name']).stem}.txt"
    with label_path.open("w", encoding="utf-8") as handle:
        handle.write("\n".join(lines))


def _copy_image(image_path: str, dest_dir: Path) -> None:
    dest_dir.mkdir(parents=True, exist_ok=True)
    target = dest_dir / Path(image_path).name
    shutil.copy2(image_path, target)


def create_yolo_zip(
    images: List[Dict],
    classes: List[str],
    train_ratio: float = 0.8,
    seed: int = 42,
) -> str:
    temp_root = Path(tempfile.mkdtemp(prefix="localflow_yolo_"))
    dataset_root = temp_root / "localflow_yolo_dataset"

    train_images, valid_images = _split_images(images, train_ratio, seed)
    train_img_dir = ensure_dir(dataset_root / "images/train")
    valid_img_dir = ensure_dir(dataset_root / "images/valid")
    train_lbl_dir = ensure_dir(dataset_root / "labels/train")
    valid_lbl_dir = ensure_dir(dataset_root / "labels/valid")

    _write_data_yaml(dataset_root, classes)

    for image in train_images:
        _copy_image(image["path"], train_img_dir)
        _write_labels(train_lbl_dir, image, classes)

    for image in valid_images:
        _copy_image(image["path"], valid_img_dir)
        _write_labels(valid_lbl_dir, image, classes)

    zip_path = shutil.make_archive(str(dataset_root), "zip", root_dir=dataset_root)
    return zip_path
