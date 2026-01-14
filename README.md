# <p align="center"><img src="https://cdn.jsdelivr.net/npm/lucide-static@0.462.0/icons/box-select.svg" width="100" height="100" style="background: #6366f1; padding: 20px; border-radius: 24px; box-shadow: 0 12px 30px rgba(99, 102, 241, 0.4);" /><br/>LocalFlow Studio</p>

<p align="center">
  <img src="https://img.shields.io/badge/Local--First-Vision%20Studio-6366f1?style=for-the-badge" />
  <img src="https://img.shields.io/badge/YOLO-v8%20|%20v11-10b981?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Post--Corona-Lazy%20Labeling-f59e0b?style=for-the-badge" />
</p>

---

**LocalFlow Studio** is a professional, local-first computer vision platform designed for rapid dataset curation and model testing. Built for the modern, slightly-more-relaxed engineer, it bridges the gap between raw data and training-ready assets using local multimodal models (VLMs) to do the boring stuff for you.

## 🍹 The "Lazy Annotation" Philosophy
Let’s be real: manual clicking is so 2019. In the pre-corona era, you might have hired a junior or managed a fleet of interns to draw thousands of boxes. We’ve evolved. LocalFlow Studio is for the developer who’d rather write a prompt once than click a mouse a thousand times. It’s about being **efficiently lazy**—using your GPU as a virtual intern that doesn't need coffee breaks or LinkedIn endorsements.

## ✨ Core Capabilities

### 🧠 Intelligent Auto-Labeling
Harness local inference servers to pre-annotate your images. By connecting to models like **LLaVA**, **Moondream**, or **BakLLaVA**, you can generate complex bounding boxes via natural language prompts. Just tell the AI what you want, and go grab an oat milk latte while it works.

### 📦 Production-Ready Exports
Full support for modern training architectures. Currently, the studio is optimized for:
- **YOLOv8**: Standard directory structure (`images/labels`) with auto-generated `data.yaml`.
- **YOLOv11**: Advanced dataset architecture designed specifically for the latest YOLO11 training pipelines.

### 🧪 Inference Playground
Validate your models before you commit to training. Use the **Compare Mode** to run dual-inference across different local providers (Ollama vs. LM Studio) side-by-side.

## 🚀 Native Integration

LocalFlow is built to talk directly to your local AI stack via OpenAI-compatible endpoints:

- **Ollama**: Default integration on `http://localhost:11434`
- **LM Studio**: Seamless connection on `http://localhost:1234`
- **Filesystem API**: Native directory selection for direct local exports.

## 🛠 Project Workflow

1.  **Ingest**: Drag and drop your local image assets into the **Annotator**.
2.  **Prompt**: Tell the AI what to find (e.g., *"Label all safety helmets and tools"*).
3.  **Approve**: Briefly check the AI's homework.
4.  **Target**: Select your export format (**YOLOv8** or **YOLOv11**).
5.  **Export**: Pick a local folder and get back to your real work.

---

## 🏗 Why LocalFlow?

- **Privacy**: Your data never leaves your machine. No cloud, no tracking, no leaks.
- **Speed**: Zero-shot pre-annotation is exponentially faster than manual labor.
- **Cost**: No monthly subscriptions. Just you and your silicon.

---

## 📜 License

MIT License

Copyright (c) 2024 LocalFlow Studio

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
