
import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, Trash2, 
  MousePointer2, Square, Wand2, 
  Download, Search, Layers, Crosshair, Monitor
} from 'lucide-react';
import { Project, Annotation, BoundingBox } from '../types';

interface AnnotatorProps {
  project: Project | null;
  setProject: React.Dispatch<React.SetStateAction<Project | null>>;
}

const Annotator: React.FC<AnnotatorProps> = ({ project, setProject }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tool, setTool] = useState<'select' | 'draw'>('draw');
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [isAutoLabeling, setIsAutoLabeling] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [tempBox, setTempBox] = useState<BoundingBox | null>(null);

  if (!project) return null;
  const currentImage = project.images[currentIndex];

  const handleNext = () => currentIndex < project.images.length - 1 && (setCurrentIndex(currentIndex + 1), setSelectedBoxId(null));
  const handlePrev = () => currentIndex > 0 && (setCurrentIndex(currentIndex - 1), setSelectedBoxId(null));

  const deleteBox = (id: string) => {
    const updated = project.images.map((img, i) => i === currentIndex ? { ...img, annotations: img.annotations.filter(a => a.id !== id) } : img);
    setProject({ ...project, images: updated });
    setSelectedBoxId(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (tool !== 'draw' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setIsDrawing(true);
    setStartPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const curX = e.clientX - rect.left, curY = e.clientY - rect.top;
    setTempBox({ x: Math.min(startPos.x, curX), y: Math.min(startPos.y, curY), w: Math.abs(curX - startPos.x), h: Math.abs(curY - startPos.y) });
  };

  const handleMouseUp = () => {
    if (isDrawing && tempBox && tempBox.w > 5) {
      const newAnn: Annotation = { id: Math.random().toString(), label: project.classes[0], confidence: 1, bbox: tempBox, source: 'manual' };
      const updated = project.images.map((img, i) => i === currentIndex ? { ...img, annotations: [...img.annotations, newAnn] } : img);
      setProject({ ...project, images: updated });
    }
    setIsDrawing(false); setTempBox(null);
  };

  return (
    <div className="flex-1 flex overflow-hidden h-full bg-stage">
      {/* Asset Explorer - Left Sidebar */}
      <div className="w-72 border-r border-app bg-sidebar flex flex-col shrink-0">
        <div className="p-4 border-b border-app flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black text-app-muted uppercase tracking-widest flex items-center gap-2">
              <Monitor size={12}/> Filesystem
            </h2>
            <span className="text-[10px] text-app-muted font-mono">{project.images.length} assets</span>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" />
            <input type="text" placeholder="Search frame..." className="w-full bg-panel border border-app rounded-md py-1.5 pl-9 pr-3 text-xs outline-none focus:border-app-accent transition-all" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
          {project.images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all border ${
                currentIndex === idx ? 'bg-panel border-app-accent/40 text-app-accent shadow-sm' : 'bg-transparent border-transparent hover:bg-panel text-app-muted'
              }`}
            >
              <div className="w-12 h-10 bg-panel rounded border border-app overflow-hidden relative grayscale-[0.5] shadow-sm">
                <img src={img.url} className="w-full h-full object-cover opacity-80" />
                {img.annotations.length > 0 && <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-app-accent rounded-bl" />}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-[11px] font-medium truncate tracking-tight">{img.name}</p>
                <p className="text-[9px] font-mono opacity-50 uppercase tracking-tighter">{img.annotations.length} RECTS</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Primary Workspace */}
      <div className="flex-1 relative flex flex-col overflow-hidden">
        {/* Technical Navbar */}
        <div className="h-12 border-b border-app px-6 flex items-center justify-between bg-panel/40 backdrop-blur shadow-sm">
          <div className="flex items-center gap-3 text-xs font-medium text-app-muted">
            <span className="text-app-muted">PROJECTS</span>
            <span className="text-app-muted/30">/</span>
            <span className="text-app uppercase tracking-wider font-bold">{project.name}</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              <button onClick={handlePrev} className="p-1 text-app-muted hover:text-app transition-colors"><ChevronLeft size={18}/></button>
              <span className="text-[10px] font-mono w-16 text-center text-app-muted">{currentIndex + 1} / {project.images.length}</span>
              <button onClick={handleNext} className="p-1 text-app-muted hover:text-app transition-colors"><ChevronRight size={18}/></button>
            </div>
            <button 
              onClick={() => setIsAutoLabeling(true)}
              className="flex items-center gap-2 px-3 py-1 bg-app-accent text-white rounded text-[10px] font-bold uppercase tracking-tight hover:brightness-110 shadow-md transition-all"
            >
              <Wand2 size={12} />
              Auto Predict
            </button>
          </div>
        </div>

        {/* Floating Tool Dock */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-panel border border-app rounded-full shadow-xl z-50">
          <ToolBtn active={tool === 'select'} onClick={() => setTool('select')} icon={<MousePointer2 size={16}/>} />
          <ToolBtn active={tool === 'draw'} onClick={() => setTool('draw')} icon={<Square size={16}/>} />
          <div className="w-px h-4 bg-app/10 mx-1" />
          <button onClick={() => setSelectedBoxId(null)} className="p-2.5 text-app-muted hover:text-app transition-colors"><Crosshair size={16}/></button>
        </div>

        {/* The Stage */}
        <div className="flex-1 overflow-auto bg-stage flex items-center justify-center p-20 cursor-crosshair">
          <div ref={canvasRef} className="relative shadow-2xl rounded-sm overflow-hidden" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
            <img src={currentImage.url} className="max-h-[75vh] block pointer-events-none border border-app shadow-sm" alt="Canvas" />
            {currentImage.annotations.map(ann => (
              <div 
                key={ann.id}
                onClick={(e) => { e.stopPropagation(); setSelectedBoxId(ann.id); }}
                className={`absolute border-[1.5px] transition-all cursor-pointer ${selectedBoxId === ann.id ? 'border-app-accent bg-app-accent/10 shadow-lg' : 'border-app-accent/40 bg-app-accent/5 hover:border-app-accent'}`}
                style={{ left: ann.bbox.x, top: ann.bbox.y, width: ann.bbox.w, height: ann.bbox.h }}
              >
                <span className="absolute -top-5 left-0 px-1 bg-app-accent text-[9px] font-bold text-white uppercase tracking-tighter rounded-t-sm">{ann.label}</span>
              </div>
            ))}
            {tempBox && <div className="absolute border-[1.5px] border-dashed border-app-accent/60 bg-app-accent/10" style={{ left: tempBox.x, top: tempBox.y, width: tempBox.w, height: tempBox.h }} />}
          </div>
        </div>
      </div>

      {/* Inspector Panel - Right Sidebar */}
      <div className="w-80 border-l border-app bg-sidebar flex flex-col shrink-0">
        <div className="p-5 border-b border-app">
           <h2 className="text-[10px] font-black text-app-muted uppercase tracking-widest flex items-center gap-2">
            <Layers size={12}/> Properties
          </h2>
        </div>
        
        <div className="flex-1 p-5 space-y-8 overflow-y-auto no-scrollbar">
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider">Class Labels</label>
            <div className="grid grid-cols-2 gap-2">
              {project.classes.map((cls, i) => (
                <button 
                  key={cls}
                  className={`px-3 py-2 text-[10px] font-bold uppercase rounded-md border text-left transition-all ${i === 0 ? 'bg-app-accent text-white border-app-accent shadow-sm' : 'bg-panel border-app text-app-muted hover:border-app-accent hover:text-app'}`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {selectedBoxId && (
            <div className="pt-8 border-t border-app space-y-4 animate-in slide-in-from-right-4 duration-200">
               <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider">Selection ID: {selectedBoxId.slice(-4)}</label>
               <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-panel rounded-lg border border-app shadow-sm">
                    <span className="text-xs text-app-muted">Visibility</span>
                    <span className="text-[10px] font-mono text-app-accent">ENABLED</span>
                  </div>
                  <button 
                    onClick={() => deleteBox(selectedBoxId)}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-[10px] font-bold uppercase hover:bg-red-500/20 transition-all shadow-sm"
                  >
                    <Trash2 size={12}/> Purge Object
                  </button>
               </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-app">
          <button className="w-full py-3 bg-app-accent text-white rounded-xl text-xs font-black uppercase tracking-wider hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2">
            <Download size={14} />
            Export Weights
          </button>
        </div>
      </div>
    </div>
  );
};

const ToolBtn = ({ active, onClick, icon }: any) => (
  <button 
    onClick={onClick}
    className={`p-3 rounded-full transition-all ${active ? 'bg-app-accent text-white shadow-md' : 'text-app-muted hover:bg-panel hover:text-app'}`}
  >
    {icon}
  </button>
);

export default Annotator;
