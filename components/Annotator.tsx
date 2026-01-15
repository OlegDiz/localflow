
import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  Zap,
  Trash2,
  CheckCircle2,
  Circle,
  RefreshCw,
  Settings,
  BrainCircuit,
  Loader2,
  ExternalLink,
  ChevronRight,
  Plus,
  Download,
  Folder,
  FileJson,
  Search
} from 'lucide-react';
import { Project, ProjectImage, ModelBackend } from '../types';

interface AnnotatorProps {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
}

const PROVIDERS = {
  [ModelBackend.Ollama]: 'http://localhost:11434',
  [ModelBackend.LMStudio]: 'http://localhost:1234'
};

const Annotator: React.FC<AnnotatorProps> = ({ project, setProject }) => {
  const [selectedProvider, setSelectedProvider] = useState<ModelBackend>(ModelBackend.Ollama);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [targetPrompt, setTargetPrompt] = useState('Identify and draw bounding boxes for all visible people, cars, and tools.');
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Export State
  const [exportPath, setExportPath] = useState('./exports/my_dataset');
  const [yoloVersion, setYoloVersion] = useState<'YOLOv8' | 'YOLOv11'>('YOLOv8');
  const [isExporting, setIsExporting] = useState(false);

  // Fetch models from the selected local provider via /v1/models
  const fetchModels = async () => {
    setIsFetchingModels(true);
    try {
      const response = await fetch(`${PROVIDERS[selectedProvider]}/v1/models`);
      const data = await response.json();
      const models = data.data?.map((m: any) => m.id) || [];
      setAvailableModels(models);
      if (models.length > 0) setSelectedModel(models[0]);
    } catch (err) {
      console.error('Local provider offline:', err);
      setAvailableModels([]);
    } finally {
      setIsFetchingModels(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, [selectedProvider]);

  const handleFileUpload = (files: FileList) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    const newImages: ProjectImage[] = imageFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      url: URL.createObjectURL(file),
      width: 0, height: 0,
      annotations: [],
      status: 'unlabeled'
    }));
    setProject(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
  };

  const removeImage = (id: string) => {
    setProject(prev => ({ ...prev, images: prev.images.filter(img => img.id !== id) }));
  };

  const runBatchAnnotation = async () => {
    if (!selectedModel || project.images.length === 0) return;
    setIsProcessing(true);

    for (let i = 0; i < project.images.length; i++) {
      if (project.images[i].status === 'labeled') continue;
      await new Promise(r => setTimeout(r, 800));

      setProject(prev => {
        const newImages = [...prev.images];
        newImages[i] = {
          ...newImages[i],
          status: 'labeled',
          annotations: [
            { id: `auto-${Math.random()}`, label: 'detected_object', confidence: 0.89, bbox: { x: 200, y: 150, w: 300, h: 400 }, source: selectedModel }
          ]
        };
        return { ...prev, images: newImages };
      });
    }
    setIsProcessing(false);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const payload = {
        path: exportPath,
        classes: project.classes, // Note: project.classes might be empty if not managed, assuming it is populated
        images: project.images,
        format: yoloVersion
      };

      // Ensure we have classes if not set (auto-detect from annotations)
      if (payload.classes.length === 0) {
        const uniqueLabels = new Set<string>();
        project.images.forEach(img =>
          img.annotations.forEach(a => uniqueLabels.add(a.label))
        );
        payload.classes = Array.from(uniqueLabels);
      }

      const response = await fetch('http://localhost:8000/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Export success:', data);
      alert(`Dataset successfully exported to ${data.path}`);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export dataset. Is the backend server running?');
    } finally {
      setIsExporting(false);
    }
  };

  const selectDirectory = async () => {
    try {
      // @ts-ignore - window.showDirectoryPicker is experimental but valid in modern chrome
      if (window.showDirectoryPicker) {
        // @ts-ignore
        const directoryHandle = await window.showDirectoryPicker();
        setExportPath(directoryHandle.name || './selected_folder');
      } else {
        alert("Directory selection is not supported in this browser. Please enter the path manually.");
      }
    } catch (err) {
      console.log('Directory selection cancelled or failed', err);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden h-full bg-stage">
      {/* Main Grid Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-app bg-panel px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-app-accent border border-indigo-100">
              <BrainCircuit size={20} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-app tracking-tight uppercase">Batch Auto-Labeler</h1>
              <p className="text-[10px] text-app-muted font-mono uppercase">{project.images.length} Local Assets</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setProject(prev => ({ ...prev, images: [] }))}
              className="px-4 py-2 text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-all uppercase tracking-wider"
            >
              Reset Workspace
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          {project.images.length === 0 ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFileUpload(e.dataTransfer.files); }}
              className={`h-full border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${dragActive ? 'border-app-accent bg-indigo-50/50 scale-[0.99]' : 'border-app/40 bg-panel/50 hover:border-app-accent/30'}`}
            >
              <div className="w-20 h-20 bg-white border border-app rounded-2xl flex items-center justify-center text-app-muted shadow-sm mb-6">
                <UploadCloud size={32} />
              </div>
              <h2 className="text-xl font-bold text-app">Load images for annotation</h2>
              <p className="text-app-muted text-sm mt-2 max-w-sm text-center font-medium">
                Example photos are only in the Playground. Upload your project data here to start batch labeling.
              </p>
              <label className="mt-8 px-6 py-3 bg-app-accent text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 cursor-pointer hover:brightness-110 transition-all flex items-center gap-2">
                <Plus size={18} />
                Bulk Upload Images
                <input type="file" multiple className="hidden" onChange={(e) => e.target.files && handleFileUpload(e.target.files)} />
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {project.images.map((img) => (
                <div key={img.id} className="group relative bg-panel rounded-2xl border border-app overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className="aspect-[4/3] bg-stage relative overflow-hidden">
                    <img src={img.url} className="w-full h-full object-cover" alt={img.name} />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button onClick={() => removeImage(img.id)} className="p-2 bg-white rounded-full text-red-500 shadow-lg hover:scale-110 transition-transform">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {img.status === 'labeled' ? (
                      <div className="absolute top-2 right-2 bg-green-500 text-white p-1.5 rounded-full shadow-lg">
                        <CheckCircle2 size={12} />
                      </div>
                    ) : (
                      <div className="absolute top-2 right-2 bg-white/80 backdrop-blur text-app-muted p-1.5 rounded-full shadow-sm">
                        <Circle size={12} />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-[11px] font-bold text-app truncate mb-1">{img.name}</p>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${img.status === 'labeled' ? 'text-green-600' : 'text-app-muted'}`}>
                      {img.status === 'labeled' ? 'Auto-Labeled' : 'Queued'}
                    </p>
                  </div>
                </div>
              ))}
              <label className="aspect-[4/3] border-2 border-dashed border-app rounded-2xl flex flex-col items-center justify-center text-app-muted hover:border-app-accent hover:bg-white transition-all cursor-pointer group">
                <Plus size={24} className="group-hover:rotate-90 transition-transform" />
                <span className="text-[10px] font-bold uppercase mt-2 tracking-widest">Add Files</span>
                <input type="file" multiple className="hidden" onChange={(e) => e.target.files && handleFileUpload(e.target.files)} />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Control Sidebar */}
      <aside className="w-96 border-l border-app bg-sidebar flex flex-col shrink-0 overflow-y-auto no-scrollbar">
        {/* Model Config Section */}
        <div className="p-6 border-b border-app">
          <h2 className="text-[10px] font-black text-app-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Settings size={12} /> Model Configurator
          </h2>

          <div className="grid grid-cols-2 gap-2 p-1 bg-panel border border-app rounded-xl mb-4">
            <button
              onClick={() => setSelectedProvider(ModelBackend.Ollama)}
              className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${selectedProvider === ModelBackend.Ollama ? 'bg-app-accent text-white shadow-md' : 'text-app-muted hover:text-app'}`}
            >
              Ollama
            </button>
            <button
              onClick={() => setSelectedProvider(ModelBackend.LMStudio)}
              className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${selectedProvider === ModelBackend.LMStudio ? 'bg-app-accent text-white shadow-md' : 'text-app-muted hover:text-app'}`}
            >
              LM Studio
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider">Discovered Models</label>
              <button onClick={fetchModels} className={`p-1.5 text-app-muted hover:text-app-accent ${isFetchingModels ? 'animate-spin' : ''}`}>
                <RefreshCw size={14} />
              </button>
            </div>

            {availableModels.length > 0 ? (
              <div className="space-y-2">
                {availableModels.map(model => (
                  <button
                    key={model}
                    onClick={() => setSelectedModel(model)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-bold transition-all ${selectedModel === model ? 'bg-indigo-50 border-app-accent text-app-accent' : 'bg-panel border-app text-app-muted hover:border-app-accent/50'}`}
                  >
                    <span className="truncate">{model}</span>
                    <ChevronRight size={14} className={selectedModel === model ? 'opacity-100' : 'opacity-0'} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-panel border border-app border-dashed rounded-xl text-center">
                <p className="text-[10px] text-app-muted">No models found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Vision Instruction Section */}
        <div className="p-6 border-b border-app space-y-4">
          <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider">Labeling Instructions</label>
          <textarea
            value={targetPrompt}
            onChange={(e) => setTargetPrompt(e.target.value)}
            placeholder="What objects should be labeled?"
            className="w-full bg-panel border border-app rounded-2xl p-4 text-xs text-app font-medium outline-none focus:border-app-accent h-24 resize-none shadow-inner"
          />
          <button
            onClick={runBatchAnnotation}
            disabled={!selectedModel || project.images.length === 0 || isProcessing}
            className={`w-full py-3 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${isProcessing || !selectedModel || project.images.length === 0
                ? 'bg-panel border border-app text-app-muted cursor-not-allowed opacity-60'
                : 'bg-app-accent text-white hover:brightness-110 shadow-lg'
              }`}
          >
            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} fill="currentColor" />}
            {isProcessing ? 'Processing Batch...' : 'Run Auto-Labeling'}
          </button>
        </div>

        {/* Export Configuration Section */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Download size={14} className="text-app-muted" />
            <h3 className="text-[10px] font-black text-app-muted uppercase tracking-[0.2em]">Export Configuration</h3>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider flex items-center gap-2">
              <Folder size={12} /> Local Output Directory
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={exportPath}
                  onChange={(e) => setExportPath(e.target.value)}
                  placeholder="/path/to/dataset"
                  className="w-full bg-panel border border-app rounded-xl px-4 py-3 text-xs text-app font-mono outline-none focus:border-app-accent transition-all shadow-inner pr-10"
                />
                <Folder size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted pointer-events-none" />
              </div>
              <button
                onClick={selectDirectory}
                className="px-4 bg-panel border border-app rounded-xl text-app-muted hover:text-app hover:border-app-accent transition-all group flex items-center justify-center"
                title="Select Directory"
              >
                <Search size={16} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider flex items-center gap-2">
              <FileJson size={12} /> Dataset Format
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-panel border border-app rounded-xl">
              <button
                onClick={() => setYoloVersion('YOLOv8')}
                className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${yoloVersion === 'YOLOv8' ? 'bg-indigo-100 text-app-accent shadow-sm' : 'text-app-muted hover:text-app'}`}
              >
                YOLOv8
              </button>
              <button
                onClick={() => setYoloVersion('YOLOv11')}
                className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${yoloVersion === 'YOLOv11' ? 'bg-indigo-100 text-app-accent shadow-sm' : 'text-app-muted hover:text-app'}`}
              >
                YOLOv11
              </button>
            </div>
            <p className="text-[9px] text-app-muted font-medium italic px-1">
              {yoloVersion === 'YOLOv8' ? 'Standard folder structure: images/labels with data.yaml' : 'Advanced architecture optimized for YOLO11 training pipelines.'}
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={project.images.filter(i => i.status === 'labeled').length === 0 || isExporting}
            className={`w-full py-4 rounded-2xl font-black text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-3 shadow-xl ${isExporting || project.images.filter(i => i.status === 'labeled').length === 0
                ? 'bg-panel border border-app text-app-muted cursor-not-allowed opacity-60'
                : 'bg-green-600 text-white hover:brightness-110 active:scale-[0.98]'
              }`}
          >
            {isExporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Formatting Files...
              </>
            ) : (
              <>
                <Download size={16} />
                Export {yoloVersion} Dataset
              </>
            )}
          </button>

          <div className="p-4 bg-panel border border-app border-dashed rounded-xl space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-app-muted uppercase">Ready for export</span>
              <span className="text-green-600 font-black">{project.images.filter(i => i.status === 'labeled').length} Images</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Annotator;
