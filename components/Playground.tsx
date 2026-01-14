
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Zap, Download, ImageIcon, Settings2, Code, ChevronDown } from 'lucide-react';
import { ModelBackend, Annotation } from '../types';

const Playground: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isInferencing, setIsInferencing] = useState(false);
  const [prompt, setPrompt] = useState('person, safety vest, helmet');
  const [backend, setBackend] = useState<ModelBackend>(ModelBackend.Mock);
  const [results, setResults] = useState<Annotation[]>([]);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImage(url);
      setResults([]);
    }
  };

  const runInference = () => {
    if (!image) return;
    setIsInferencing(true);
    setTimeout(() => {
      const mockResults: Annotation[] = [
        { id: '1', label: 'person', confidence: 0.94, bbox: { x: 400, y: 100, w: 300, h: 600 }, source: 'Mock' },
        { id: '2', label: 'safety vest', confidence: 0.88, bbox: { x: 450, y: 250, w: 200, h: 250 }, source: 'Mock' }
      ];
      setResults(mockResults);
      setIsInferencing(false);
    }, 1200);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setImgSize({ width: naturalWidth, height: naturalHeight });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-panel">
      {/* Technical Header */}
      <header className="h-16 border-b border-app px-6 flex items-center justify-between bg-panel/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="text-app-muted">
            <Zap size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight uppercase">Inference Stage</h1>
            <p className="text-[10px] text-app-muted font-mono tracking-widest">LOCAL_LLM_ORCHESTRATOR_V1</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-3 py-1.5 bg-panel border border-app rounded-md text-app text-xs font-semibold hover:border-app-accent cursor-pointer transition-all shadow-sm">
            <Upload size={14} />
            Load Asset
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
          <button 
            disabled={results.length === 0}
            className="p-1.5 text-app-muted hover:text-app-accent disabled:opacity-30 transition-colors"
          >
            <Download size={18} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Controls Sidebar */}
        <div className="w-80 border-r border-app p-6 flex flex-col gap-8 bg-sidebar/20">
          <div className="space-y-4">
            <SectionHeader icon={<Settings2 size={14}/>} title="Configuration" />
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider">Backend</label>
                <div className="relative">
                  <select 
                    value={backend}
                    onChange={(e) => setBackend(e.target.value as ModelBackend)}
                    className="w-full bg-panel border border-app rounded-lg px-3 py-2 text-sm text-app outline-none appearance-none focus:border-app-accent transition-colors"
                  >
                    <option value={ModelBackend.Mock}>Mock Adapter</option>
                    <option value={ModelBackend.Ollama}>Ollama (Local)</option>
                    <option value={ModelBackend.LMStudio}>LM Studio</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider">Zero-Shot Classes</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-panel border border-app rounded-lg px-3 py-2 text-sm text-app outline-none focus:border-app-accent transition-colors resize-none h-24 font-mono"
                  placeholder="e.g. person, car, bike..."
                />
              </div>
            </div>
          </div>

          <button 
            onClick={runInference}
            disabled={!image || isInferencing}
            className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 ${
              !image || isInferencing 
                ? 'bg-panel text-app-muted cursor-not-allowed border border-app' 
                : 'bg-app-accent text-white hover:brightness-110 active:scale-[0.98]'
            }`}
          >
            {isInferencing ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" /> : <Zap size={16} fill="currentColor" />}
            {isInferencing ? 'PROCESSING' : 'RUN INFERENCE'}
          </button>

          {results.length > 0 && (
            <div className="flex-1 flex flex-col min-h-0">
               <SectionHeader icon={<Code size={14}/>} title="Results" />
               <div className="mt-3 flex-1 overflow-y-auto pr-1 space-y-2 no-scrollbar">
                  {results.map(res => (
                    <div key={res.id} className="p-2.5 bg-panel/50 border border-app rounded-lg flex items-center justify-between group">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-app uppercase tracking-tight">{res.label}</span>
                        <span className="text-[10px] text-app-muted font-mono italic">CONF: {(res.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-app-accent/50" />
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>

        {/* Main Workspace Stage */}
        <div className="flex-1 bg-stage relative flex items-center justify-center overflow-auto p-12">
          {!image ? (
            <div className="text-center space-y-6 max-w-sm">
              <div className="mx-auto w-16 h-16 bg-panel border border-app rounded-2xl flex items-center justify-center text-app-muted shadow-sm">
                <ImageIcon size={32} />
              </div>
              <div>
                <h3 className="text-app-muted font-medium">Ready for input</h3>
                <p className="text-xs text-app-muted mt-2">Upload a frame to begin zero-shot inference testing with your local model backends.</p>
              </div>
            </div>
          ) : (
            <div className="relative group shadow-2xl">
              <img 
                src={image} 
                onLoad={handleImageLoad}
                className="max-h-[70vh] rounded-sm border border-app" 
                alt="Stage"
              />
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox={`0 0 ${imgSize.width} ${imgSize.height}`}
                preserveAspectRatio="xMidYMid meet"
              >
                {results.map((res) => (
                  <g key={res.id}>
                    <rect 
                      x={res.bbox.x} y={res.bbox.y} width={res.bbox.w} height={res.bbox.h}
                      stroke="var(--accent)"
                      fill="rgba(99, 102, 241, 0.05)"
                      strokeWidth="2"
                    />
                    <rect 
                      x={res.bbox.x} y={res.bbox.y - 18} width={res.label.length * 8 + 10} height={18}
                      fill="var(--accent)"
                    />
                    <text 
                      x={res.bbox.x + 5} y={res.bbox.y - 5}
                      fill="white"
                      className="text-[10px] font-bold uppercase tracking-wider"
                    >
                      {res.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SectionHeader = ({ icon, title }: any) => (
  <div className="flex items-center gap-2 border-b border-app pb-2">
    <div className="text-app-muted">{icon}</div>
    <span className="text-[10px] font-black text-app-muted uppercase tracking-[0.2em]">{title}</span>
  </div>
);

export default Playground;
