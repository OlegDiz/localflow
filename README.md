# <p align="center"><img src="https://cdn.jsdelivr.net/npm/lucide-static@0.462.0/icons/box-select.svg" width="100" height="100" style="background: #6366f1; padding: 20px; border-radius: 24px; filter: drop-shadow(0 12px 30px rgba(99, 102, 241, 0.4));" /><br/>LocalFlow</p>

<p align="center">
  <img src="https://img.shields.io/badge/Local--First-Vision-6366f1?style=for-the-badge" />
  <img src="https://img.shields.io/badge/YOLO-v8%20|%20v11-10b981?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Post--Corona-Lazy%20Labeling-f59e0b?style=for-the-badge" />
</p>

---

LocalFlow is a local-first computer vision platform designed for rapid dataset curation and model testing. Built for the modern, efficiently-lazy engineer, it replaces the manual clicking of the pre-corona era—where you'd hire a junior to draw thousands of boxes—with local multimodal models (VLMs) that act as virtual interns. It’s for the developer who’d rather write a prompt once than click a mouse five thousand times; high-performance vision orchestration that works locally, privately, and without the need for coffee breaks or LinkedIn endorsements.

## ✨ Core Capabilities

- **Intelligent Auto-Labeling**: Harness local VLMs (LLaVA, Moondream) to pre-annotate images via natural language prompts.
- **Production Exports**: Native support for **YOLOv8** and **YOLOv11** dataset structures (`images/labels` + `data.yaml`).
- **Inference Playground**: Compare dual-inference results from Ollama or LM Studio side-by-side.
- **Privacy Native**: 100% local. Your data stays on your machine, away from the cloud.

## 🚀 Native Integration

LocalFlow communicates directly with your local AI stack via OpenAI-compatible endpoints:
- **Ollama**: `http://localhost:11434`
- **LM Studio**: `http://localhost:1234`
- **Filesystem API**: Native directory selection for direct local exports.

---

## 📜 License

MIT License

Copyright (c) 2024 LocalFlow

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
