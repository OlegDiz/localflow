# <p align="center"><img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/box-select.svg" width="100" height="100" style="background: #6366f1; padding: 20px; border-radius: 24px; box-shadow: 0 12px 30px rgba(99, 102, 241, 0.4);" /><br/>LocalFlow</p>

<p align="center">
  <img src="https://img.shields.io/badge/Local--First-Vision-6366f1?style=for-the-badge" />
  <img src="https://img.shields.io/badge/YOLO-v8%20|%20v11-10b981?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Post--Corona-Lazy%20Labeling-f59e0b?style=for-the-badge" />
</p>

---

LocalFlow is a local-first vision studio for the efficiently lazy. Use local VLMs as virtual interns to auto-label datasets and orchestrate YOLO pipelines without the manual clicking of the pre-corona era. Privacy-first, high-performance, and 100% coffee-break free.

## 🚀 How to Launch

LocalFlow is designed to run entirely on your hardware. Follow these steps to get your local labeling factory running:

### 1. Power up your Local Brain
Ensure you have a local inference server running. LocalFlow supports:
*   **Ollama**: Install from [ollama.com](https://ollama.com) and run it.
*   **LM Studio**: Install from [lmstudio.ai](https://lmstudio.ai) and start the Local Server.

### 2. Grab a Multimodal Model
You need a model that understands images. Open your terminal and run:
```bash
# For Ollama users
ollama pull llava
# or
ollama pull moondream
```
*If using LM Studio, download any Vision-enabled model (like LLaVA or Qwen-VL) and load it into the server tab.*

### 3. Open the App
Launch this framework in your browser. LocalFlow will automatically attempt to handshake with `localhost:11434` (Ollama) or `localhost:1234` (LM Studio).

### 4. Connect and Label
1. Go to the **Playground** to test your model's zero-shot performance.
2. Switch to **Annotate**, bulk-upload your local images, and hit **Run Auto-Labeling**.
3. Once satisfied, set your local export path and hit **Export**.

## ✨ Core Capabilities

- **Intelligent Auto-Labeling**: Use VLMs to pre-annotate images via natural language prompts.
- **Production Exports**: Native support for **YOLOv8** and **YOLOv11** structures (`images/labels` + `data.yaml`).
- **Inference Playground**: Compare dual-inference results side-by-side.
- **Privacy Native**: 100% local. Your data never leaves your machine.

## 🛠️ How to Run

The easiest way to start both the backend (FastAPI) and frontend (React) is using the included script:

```bash
./start.sh
```

**Manual Startup:**

1. **Backend** (Port 8000):
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```

2. **Frontend** (Port 3000):
   ```bash
   npm run dev
   ```

---

## 📜 License

MIT License. Copyright (c) 2024 LocalFlow.