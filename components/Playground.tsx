
import React, { useState, useEffect } from 'react';
import { Upload, Zap, ImageIcon, Settings2, SplitSquareVertical, LayoutGrid, Library, Info, RefreshCw, UploadCloud, Plus } from 'lucide-react';
import { ModelBackend, Annotation, ProjectImage } from '../types';

interface InferenceState {
  backend: ModelBackend;
  model: string;
  prompt: string;
  threshold: number;
  results: Annotation[];
  isInferencing: boolean;
}

interface PlaygroundProps {
  exampleImages: ProjectImage[];
}

const PROVIDERS = {
  [ModelBackend.Ollama]: 'http://localhost:11434',
  [ModelBackend.LMStudio]: 'http://localhost:1234',
  [ModelBackend.Mock]: ''
};

const Playground: React.FC<PlaygroundProps> = ({ exampleImages }) => {
  const [image, setImage] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Model A State
  const [modelA, setModelA] = useState<InferenceState>({
    backend: ModelBackend.Mock,
    model: 'mock-vision-v1',
    prompt: 'person, safety vest, helmet',
    threshold: 0.5,
    results: [],
    isInferencing: false
  });

  // Model B State
  const [modelB, setModelB] = useState<InferenceState>({
    backend: ModelBackend.Ollama,
    model: '',
    prompt: 'industrial hazards, machinery',
    threshold: 0.3,
    results: [],
    isInferencing: false
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      selectImage(url);
    }
  };

  const selectImage = (url: string) => {
    setImage(url);
    setModelA(prev => ({ ...prev, results: [] }));
    setModelB(prev => ({ ...prev, results: [] }));
  };

  const runInference = (modelKey: 'A' | 'B') => {
    if (!image) return;
    const setState = modelKey === 'A' ? setModelA : setModelB;
    const state = modelKey === 'A' ? modelA : modelB;
    
    setState(prev => ({ ...prev, isInferencing: true }));
    
    setTimeout(() => {
      const results: Annotation[] = [
        { id: `${modelKey}-1`, label: 'person', confidence: 0.94, bbox: { x: 400, y: 100, w: 300, h: 600 }, source: state.model || 'unknown' },
        { id: `${modelKey}-2`, label: 'detected_object', confidence: 0.65, bbox: { x: 450, y: 250, w: 200, h: 250 }, source: state.model || 'unknown' },
        { id: `${modelKey}-3`, label: 'detail', confidence: 0.45, bbox: { x: 480, y: 100, w: 120, h: 80 }, source: state.model || 'unknown' }
      ];
      setState(prev => ({ ...prev, results, isInferencing: false }));
    }, 1000 + Math.random() * 1000);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setImgSize({ width: naturalWidth, height: naturalHeight });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-panel">
      {/* Header */}
      <header className="h-16 border-b border-app px-6 flex items-center justify-between bg-panel/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="text-app-accent"><Zap size={18} /></div>
          <div>
            <h1 className="text-sm font-bold tracking-tight uppercase">Inference Playground</h1>
            <p className="text-[10px] text-app-muted font-mono">LOCAL_VISION_ORCHESTRATOR</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsCompareMode(!isCompareMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all border ${isCompareMode ? 'bg-app-accent text-white border-app-accent shadow-lg' : 'bg-panel text-app-muted border-app'}`}
          >
            {isCompareMode ? <LayoutGrid size={14}/> : <SplitSquareVertical size={14}/>}
            {isCompareMode ? 'Single View' : 'Compare Mode'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Comparison Sidebar A */}
        <InferenceSidebar 
          title="Configuration A" 
          state={modelA} 
          setState={setModelA} 
          onRun={() => runInference('A')} 
          active={image !== null}
        />

        {/* Dynamic Stage */}
        <div className={`flex-1 bg-stage relative flex flex-col p-6 overflow-hidden`}>
          <div className={`flex-1 flex ${isCompareMode && image ? 'flex-col gap-4' : 'items-center justify-center'} min-h-0`}>
            {!image ? (
              <div 
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => { 
                  e.preventDefault(); 
                  setDragActive(false); 
                  const file = e.dataTransfer.files[0];
                  if (file && file.type.startsWith('image/')) {
                    selectImage(URL.createObjectURL(file));
                  }
                }}
                className={`w-full h-full border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${dragActive ? 'border-app-accent bg-indigo-50/50 scale-[0.99]' : 'border-app/40 bg-panel/50 hover:border-app-accent/30'}`}
              >
                <div className="w-20 h-20 bg-white border border-app rounded-2xl flex items-center justify-center text-app-muted shadow-sm mb-6">
                  <UploadCloud size={32} />
                </div>
                <h2 className="text-xl font-bold text-app">Load an image to test</h2>
                <p className="text-app-muted text-sm mt-2 max-w-sm text-center font-medium">
                  Drag a local photo here or use an example from the gallery below to run vision inference.
                </p>
                <label className="mt-8 px-6 py-3 bg-app-accent text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 cursor-pointer hover:brightness-110 transition-all flex items-center gap-2">
                  <Plus size={18} />
                  Choose File
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              </div>
            ) : (
              <>
                {isCompareMode ? (
                  <div className="grid grid-cols-2 h-full gap-4">
                    <ModelViewport label={`A: ${modelA.model || 'None'}`} src={image} size={imgSize} results={modelA.results} threshold={modelA.threshold} onImageLoad={handleImageLoad} />
                    <ModelViewport label={`B: ${modelB.model || 'None'}`} src={image} size={imgSize} results={modelB.results} threshold={modelB.threshold} />
                  </div>
                ) : (
                  <ModelViewport label={modelA.model || 'Live View'} src={image} size={imgSize} results={modelA.results} threshold={modelA.threshold} onImageLoad={handleImageLoad} />
                )}
              </>
            )}
          </div>

          {/* Examples Gallery */}
          <div className="mt-6 shrink-0 space-y-3">
             <div className="flex items-center gap-2 px-1">
                <Library size={12} className="text-app-muted" />
                <span className="text-[10px] font-black text-app-muted uppercase tracking-widest">Example Gallery</span>
             </div>
             <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {exampleImages.map((img) => (
                  <button 
                    key={img.id}
                    onClick={() => selectImage(img.url)}
                    className={`group relative shrink-0 w-28 h-20 rounded-lg overflow-hidden border-2 transition-all ${image === img.url ? 'border-app-accent ring-2 ring-app-accent/20' : 'border-app hover:border-app-accent/50'}`}
                  >
                    <img src={img.url} className="w-full h-full object-cover" alt={img.name} />
                  </button>
                ))}
             </div>
          </div>
        </div>

        {/* Comparison Sidebar B (Only in Compare Mode) */}
        {isCompareMode && (
          <InferenceSidebar 
            title="Configuration B" 
            state={modelB} 
            setState={setModelB} 
            onRun={() => runInference('B')} 
            active={image !== null}
            variant="right"
          />
        )}
      </div>
    </div>
  );
};

const InferenceSidebar = ({ title, state, setState, onRun, active, variant = 'left' }: any) => {
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const fetchModels = async () => {
    if (state.backend === ModelBackend.Mock) {
      setAvailableModels(['mock-vision-v1', 'mock-seg-v2']);
      return;
    }
    setIsFetching(true);
    try {
      const response = await fetch(`${PROVIDERS[state.backend]}/v1/models`);
      const data = await response.json();
      const models = data.data?.map((m: any) => m.id) || [];
      setAvailableModels(models);
      if (models.length > 0 && !state.model) {
        setState({ ...state, model: models[0] });
      }
    } catch (err) {
      console.error(`Failed to fetch models for ${state.backend}`, err);
      setAvailableModels([]);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, [state.backend]);

  return (
    <div className={`w-80 border-${variant === 'left' ? 'r' : 'l'} border-app p-6 flex flex-col gap-6 bg-sidebar/20 shrink-0`}>
      <div className="flex items-center gap-2 border-b border-app pb-3">
        <Settings2 size={14} className="text-app-muted"/>
        <span className="text-[10px] font-black text-app-muted uppercase tracking-[0.2em]">{title}</span>
      </div>
      
      <div className="space-y-5 flex-1 overflow-y-auto no-scrollbar">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider">Provider</label>
          <select 
            value={state.backend}
            onChange={(e) => setState({ ...state, backend: e.target.value as ModelBackend, model: '' })}
            className="w-full bg-panel border border-app rounded-lg px-3 py-2 text-sm text-app outline-none focus:border-app-accent transition-colors font-semibold"
          >
            <option value={ModelBackend.Mock}>Internal Mock</option>
            <option value={ModelBackend.Ollama}>Ollama (Local)</option>
            <option value={ModelBackend.LMStudio}>LM Studio</option>
          </select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider">Model</label>
            <button onClick={fetchModels} className={`p-1 text-app-muted hover:text-app-accent ${isFetching ? 'animate-spin' : ''}`}>
              <RefreshCw size={10} />
            </button>
          </div>
          <select 
            value={state.model}
            onChange={(e) => setState({ ...state, model: e.target.value })}
            className="w-full bg-panel border border-app rounded-lg px-3 py-2 text-sm text-app outline-none focus:border-app-accent transition-colors font-mono text-[11px]"
          >
            {!isFetching && availableModels.length === 0 && <option value="">No models found</option>}
            {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider">Confidence Threshold</label>
            <span className="text-[10px] font-mono text-app-accent">{Math.round(state.threshold * 100)}%</span>
          </div>
          <input 
            type="range" min="0" max="1" step="0.01" 
            value={state.threshold}
            onChange={(e) => setState({ ...state, threshold: parseFloat(e.target.value) })}
            className="w-full accent-indigo-500 h-1 bg-panel rounded-full appearance-none border border-app cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider">Zero-Shot Target</label>
          <textarea 
            value={state.prompt}
            onChange={(e) => setState({ ...state, prompt: e.target.value })}
            className="w-full bg-panel border border-app rounded-lg px-3 py-2 text-sm text-app outline-none focus:border-app-accent h-24 resize-none font-mono text-[11px] leading-tight"
            placeholder="What should the model find?"
          />
        </div>

        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex gap-3 text-app-accent">
          <Info size={16} className="shrink-0 mt-0.5" />
          <p className="text-[10px] font-medium leading-normal">Targets are passed as zero-shot queries to the local vision model.</p>
        </div>
      </div>

      <button 
        onClick={onRun}
        disabled={!active || state.isInferencing || (!state.model && state.backend !== ModelBackend.Mock)}
        className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 ${
          !active || state.isInferencing || (!state.model && state.backend !== ModelBackend.Mock) ? 'bg-panel text-app-muted cursor-not-allowed' : 'bg-app-accent text-white hover:brightness-110 shadow-lg active:scale-[0.98]'
        }`}
      >
        {state.isInferencing ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} fill="currentColor" />}
        {state.isInferencing ? 'INFERRING...' : 'TEST INFERENCE'}
      </button>
    </div>
  );
};

const ModelViewport = ({ label, src, size, results, threshold, onImageLoad }: any) => (
  <div className="relative flex-1 bg-panel rounded-xl border border-app overflow-hidden shadow-sm flex flex-col group">
    <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur rounded text-[8px] font-bold text-white uppercase tracking-widest z-10 border border-white/10 max-w-[80%] truncate">{label}</div>
    <div className="flex-1 flex items-center justify-center overflow-auto p-4 bg-stage/50">
      <div className="relative inline-block shadow-2xl">
        <img src={src} onLoad={onImageLoad} className="max-h-full max-w-full rounded border border-app" alt="Scene" />
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${size.width} ${size.height}`}>
          {results.filter((r: any) => r.confidence >= threshold).map((res: any) => (
            <g key={res.id}>
              <rect x={res.bbox.x} y={res.bbox.y} width={res.bbox.w} height={res.bbox.h} stroke="var(--accent)" fill="rgba(99, 102, 241, 0.1)" strokeWidth="3" />
              <text x={res.bbox.x + 5} y={res.bbox.y - 10} fill="var(--accent)" className="text-[14px] font-black uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">{res.label}</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  </div>
);

export default Playground;
