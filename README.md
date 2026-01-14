# <p align="center"><img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/box-select.svg" width="100" height="100" style="background: #6366f1; padding: 15px; border-radius: 20px; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4);" /><br/>LocalFlow Studio</p>

<p align="center">
  <img src="https://img.shields.io/badge/Local--First-Vision%20Studio-6366f1?style=for-the-badge" />
  <img src="https://img.shields.io/badge/YOLO-v8%20|%20v11-10b981?style=for-the-badge" />
  <img src="https://img.shields.io/badge/AI--Orchestration-Local%20Only-f59e0b?style=for-the-badge" />
</p>

---

**LocalFlow Studio** is a professional, local-first computer vision platform designed for rapid dataset curation and model testing. It bridges the gap between raw data and training-ready assets by leveraging local multimodal models (VLMs) for automated labeling and zero-shot inference, ensuring 100% data privacy.

## ✨ Core Capabilities

### 🧠 Intelligent Auto-Labeling
Harness local inference servers to pre-annotate your images. By connecting to models like **LLaVA**, **Moondream**, or **BakLLaVA**, you can generate complex bounding boxes via natural language prompts without manual clicking.

### 📦 Production-Ready Exports
Full support for modern training architectures. Currently, the studio is optimized for:
- **YOLOv8**: Standard directory structure (`images/labels`) with auto-generated `data.yaml`.
- **YOLOv11**: Advanced dataset architecture designed specifically for the latest YOLO11 training pipelines.

### 🧪 Inference Playground
Validate your models before you train. Use the **Compare Mode** to run dual-inference across different local providers (Ollama vs. LM Studio) or different model versions side-by-side on the same frame.

## 🚀 Native Integration

LocalFlow is built to talk directly to your local AI stack via OpenAI-compatible endpoints:

- **Ollama**: Default integration on `http://localhost:11434`
- **LM Studio**: Seamless connection on `http://localhost:1234`
- **Filesystem API**: Native directory selection for direct local exports.

## 🛠 Project Workflow

1.  **Ingest**: Drag and drop your local image assets into the **Annotator**.
2.  **Auto-Label**: Choose a local VLM and provide a prompt (e.g., *"Label all safety helmets and tools"*).
3.  **Validate**: Review auto-generated labels in the workspace.
4.  **Target**: Select your export format (**YOLOv8** or **YOLOv11**).
5.  **Export**: Pick a local folder and generate a training-ready dataset instantly.

---

## 🏗 Why LocalFlow?

- **Privacy**: Your data never leaves your GPU. No cloud uploads, no external tracking.
- **Speed**: Eliminate the bottleneck of manual labeling with zero-shot pre-annotation.
- **Flexibility**: Switch between local backends and model versions in a single click.

---

## 📜 License

MIT License

Copyright (c) 2024 LocalFlow Studio

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
