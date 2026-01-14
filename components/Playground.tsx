
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Upload, Zap, Download, ImageIcon, Settings2, Code, ChevronDown, SplitSquareVertical, LayoutGrid, Monitor } from 'lucide-react';
import { ModelBackend, Annotation } from '../types';

interface InferenceState {
  backend: ModelBackend;
  prompt: string;
  threshold: number;
  results: Annotation[];
  isInferencing: boolean;
}

const Playground: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const [isCompareMode, setIsCompareMode] = useState(false);

  // Model A State
  const [modelA, setModelA] = useState<InferenceState>({
    backend: ModelBackend.Mock,
    prompt: 'person, safety vest, helmet',
    threshold: 0.5,
    results: [],
    isInferencing: false
  });

  // Model B State
  const [modelB, setModelB] = useState<InferenceState>({
    backend: ModelBackend.Ollama,
    prompt: 'industrial hazards, machinery',
    threshold: 0.3,
    results: [],
    isInferencing: false
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImage(url);
      setModelA(prev => ({ ...prev, results: [] }));
      setModelB(prev => ({ ...prev, results: [] }));
    }
  };

  const runInference = (model: 'A' | 'B') => {
    if (!image) return;
    const setState = model === 'A' ? setModelA : setModelB;
    
    setState(prev => ({ ...prev, isInferencing: true }));
    
    // Simulate Local API Latency
    setTimeout(() => {
      const results: Annotation[] = [
        { id: `${model}-1`, label: 'person', confidence: 0.94, bbox: { x: 400, y: 100, w: 300, h: 600 }, source: model },
        { id: `${model}-2`, label: 'hazard', confidence: 0.65, bbox: { x: 450, y: 250, w: 200, h: 250 }, source: model },
        { id: `${model}-3`, label: 'safety gear', confidence: 0.45, bbox: { x: 480, y: 100, w: 120, h: 80 }, source: model }
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
      <header className="h-16 border-b border-app px-6 flex items-center justify-between bg-panel/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="text-app-muted"><Zap size={18} /></div>
          <div>
            <h1 className="text-sm font-bold tracking-tight uppercase">Inference Engine</h1>
            <p className="text-[10px] text-app-muted font-mono">LOCAL_MODELS_V2_ORCHESTRATOR</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsCompareMode(!isCompareMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all border ${isCompareMode ? 'bg-app-accent text-white border-app-accent shadow-lg' : 'bg-panel text-app-muted border-app'}`}
          >
            {isCompareMode ? <LayoutGrid size={14}/> : <SplitSquareVertical size={14}/>}
            {isCompareMode ? 'Unified View' : 'Compare Mode (A/B)'}
          </button>
          <div className="w-px h-4 bg-app/10" />
          <label className="flex items-center gap-2 px-3 py-1.5 bg-panel border border-app rounded-md text-app text-xs font-semibold hover:border-app-accent cursor-pointer transition-all">
            <Upload size={14} /> Load Frame
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
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
        <div className={`flex-1 bg-stage relative flex p-6 overflow-hidden ${isCompareMode ? 'flex-col gap-4' : 'items-center justify-center'}`}>
          {!image ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
               <div className="w-16 h-16 bg-sidebar border border-app rounded-2xl flex items-center justify-center text-app-muted shadow-sm">
                  <ImageIcon size={32} />
               </div>
               <p className="text-xs text-app-muted max-w-[200px]">Upload a local image to run multi-backend inference</p>
            </div>
          ) : (
            <>
              {isCompareMode ? (
                <div className="grid grid-cols-2 h-full gap-4">
                  <ModelViewport label="Model Output A" src={image} size={imgSize} results={modelA.results} threshold={modelA.threshold} onImageLoad={handleImageLoad} />
                  <ModelViewport label="Model Output B" src={image} size={imgSize} results={modelB.results} threshold={modelB.threshold} />
                </div>
              ) : (
                <ModelViewport label="Live View" src={image} size={imgSize} results={modelA.results} threshold={modelA.threshold} onImageLoad={handleImageLoad} />
              )}
            </>
          )}
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

const InferenceSidebar = ({ title, state, setState, onRun, active, variant = 'left' }: any) => (
  <div className={`w-80 border-${variant === 'left' ? 'r' : 'l'} border-app p-6 flex flex-col gap-6 bg-sidebar/20 shrink-0`}>
    <div className="flex items-center gap-2 border-b border-app pb-3">
      <Settings2 size={14} className="text-app-muted"/>
      <span className="text-[10px] font-black text-app-muted uppercase tracking-[0.2em]">{title}</span>
    </div>
    
    <div className="space-y-5 flex-1">
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider">Backend</label>
        <select 
          value={state.backend}
          onChange={(e) => setState({ ...state, backend: e.target.value as ModelBackend })}
          className="w-full bg-panel border border-app rounded-lg px-3 py-2 text-sm text-app outline-none focus:border-app-accent"
        >
          <option value={ModelBackend.Mock}>Mock Adapter</option>
          <option value={ModelBackend.Ollama}>Ollama (Local)</option>
          <option value={ModelBackend.LMStudio}>LM Studio</option>
        </select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider">Threshold</label>
          <span className="text-[10px] font-mono text-app-accent">{Math.round(state.threshold * 100)}%</span>
        </div>
        <input 
          type="range" min="0" max="1" step="0.01" 
          value={state.threshold}
          onChange={(e) => setState({ ...state, threshold: parseFloat(e.target.value) })}
          className="w-full accent-indigo-500 h-1 bg-panel rounded-full appearance-none border border-app"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider">Zero-Shot Target</label>
        <textarea 
          value={state.prompt}
          onChange={(e) => setState({ ...state, prompt: e.target.value })}
          className="w-full bg-panel border border-app rounded-lg px-3 py-2 text-sm text-app outline-none focus:border-app-accent h-20 resize-none font-mono text-[11px]"
        />
      </div>
    </div>

    <button 
      onClick={onRun}
      disabled={!active || state.isInferencing}
      className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 ${
        !active || state.isInferencing ? 'bg-panel text-app-muted' : 'bg-app-accent text-white hover:brightness-110 shadow-lg'
      }`}
    >
      {state.isInferencing ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" /> : <Zap size={14} fill="currentColor" />}
      {state.isInferencing ? 'PROCESSING...' : 'RUN ANALYTICS'}
    </button>
  </div>
);

const ModelViewport = ({ label, src, size, results, threshold, onImageLoad }: any) => (
  <div className="relative flex-1 bg-panel rounded-xl border border-app overflow-hidden shadow-inner flex flex-col group">
    <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur rounded text-[8px] font-bold text-white uppercase tracking-widest z-10 border border-white/10">{label}</div>
    <div className="flex-1 flex items-center justify-center overflow-auto p-4 cursor-zoom-in">
      <div className="relative inline-block">
        <img src={src} onLoad={onImageLoad} className="max-h-full max-w-full rounded border border-app shadow-2xl" alt="Scene" />
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${size.width} ${size.height}`}>
          {results.filter((r: any) => r.confidence >= threshold).map((res: any) => (
            <g key={res.id}>
              <rect x={res.bbox.x} y={res.bbox.y} width={res.bbox.w} height={res.bbox.h} stroke="var(--accent)" fill="rgba(99, 102, 241, 0.1)" strokeWidth="2" />
              <text x={res.bbox.x + 5} y={res.bbox.y - 10} fill="var(--accent)" className="text-[12px] font-bold uppercase">{res.label} {Math.round(res.confidence * 100)}%</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  </div>
);

export default Playground;
