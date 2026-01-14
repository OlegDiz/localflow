
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Trash2, 
  MousePointer2, Square, Wand2, 
  Download, Search, Layers, Crosshair, Monitor,
  BarChart3, Info, CheckCircle2, Circle, Keyboard,
  UploadCloud, Plus
} from 'lucide-react';
import { Project, Annotation, BoundingBox, ProjectImage } from '../types';

interface AnnotatorProps {
  project: Project | null;
  setProject: React.Dispatch<React.SetStateAction<Project | null>>;
}

const Annotator: React.FC<AnnotatorProps> = ({ project, setProject }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tool, setTool] = useState<'select' | 'draw'>('draw');
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [activeClassIndex, setActiveClassIndex] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [tempBox, setTempBox] = useState<BoundingBox | null>(null);

  if (!project) return null;
  const currentImage = project.images[currentIndex];

  // Logic: Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key.toLowerCase() === 'w') setTool('draw');
      if (e.key.toLowerCase() === 'v' || e.key.toLowerCase() === 's') setTool('select');
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedBoxId) deleteBox(selectedBoxId);
      }
      // Numeric class selection
      const num = parseInt(e.key);
      if (num > 0 && num <= project.classes.length) {
        setActiveClassIndex(num - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, selectedBoxId, project.classes]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    project.classes.forEach(c => counts[c] = 0);
    project.images.forEach(img => {
      img.annotations.forEach(ann => {
        counts[ann.label] = (counts[ann.label] || 0) + 1;
      });
    });
    return counts;
  }, [project]);

  const maxStat = Math.max(...Object.values(stats), 1);

  const handleNext = () => currentIndex < project.images.length - 1 && (setCurrentIndex(currentIndex + 1), setSelectedBoxId(null));
  const handlePrev = () => currentIndex > 0 && (setCurrentIndex(currentIndex - 1), setSelectedBoxId(null));

  const toggleVerify = () => {
    const updated = project.images.map((img, i) => 
      i === currentIndex ? { ...img, status: img.status === 'labeled' ? 'unlabeled' : 'labeled' } : img
    );
    setProject({ ...project, images: updated as any });
  };

  const deleteBox = (id: string) => {
    const updated = project.images.map((img, i) => i === currentIndex ? { ...img, annotations: img.annotations.filter(a => a.id !== id) } : img);
    setProject({ ...project, images: updated });
    setSelectedBoxId(null);
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) return;

    const newImages: ProjectImage[] = imageFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      url: URL.createObjectURL(file),
      width: 1200, // Default until loaded
      height: 800,
      annotations: [],
      status: 'unlabeled'
    }));

    setProject(prev => prev ? {
      ...prev,
      images: [...prev.images, ...newImages]
    } : null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (tool !== 'draw' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setIsDrawing(true);
    setStartPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;
    setMousePos({ x: curX, y: curY });

    if (!isDrawing) return;
    setTempBox({ 
      x: Math.min(startPos.x, curX), 
      y: Math.min(startPos.y, curY), 
      w: Math.abs(curX - startPos.x), 
      h: Math.abs(curY - startPos.y) 
    });
  };

  const handleMouseUp = () => {
    if (isDrawing && tempBox && tempBox.w > 5) {
      const newAnn: Annotation = { 
        id: Math.random().toString(36).substr(2, 9), 
        label: project.classes[activeClassIndex], 
        confidence: 1, 
        bbox: tempBox, 
        source: 'manual' 
      };
      const updated = project.images.map((img, i) => i === currentIndex ? { ...img, annotations: [...img.annotations, newAnn] } : img);
      setProject({ ...project, images: updated });
    }
    setIsDrawing(false); 
    setTempBox(null);
  };

  return (
    <div className="flex-1 flex overflow-hidden h-full bg-stage relative">
      {/* Keyboard Shortcut Help Overlay */}
      {showShortcuts && (
        <div className="absolute inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowShortcuts(false)}>
          <div className="bg-sidebar border border-app rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-app pb-4">
              <Keyboard className="text-app-accent" />
              <h3 className="text-lg font-bold">Studio Shortcuts</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ShortcutRow keyName="W" desc="Draw Tool" />
              <ShortcutRow keyName="V / S" desc="Select Tool" />
              <ShortcutRow keyName="1 - 9" desc="Switch Class" />
              <ShortcutRow keyName="← / →" desc="Navigation" />
              <ShortcutRow keyName="Del" desc="Remove Box" />
              <ShortcutRow keyName="Esc" desc="Deselect" />
            </div>
            <button onClick={() => setShowShortcuts(false)} className="w-full py-2 bg-panel border border-app rounded-lg text-sm font-bold hover:bg-app-accent hover:text-white transition-all">Close</button>
          </div>
        </div>
      )}

      {/* Asset Explorer */}
      <div 
        className={`w-72 border-r border-app bg-sidebar flex flex-col shrink-0 transition-all ${isDraggingOver ? 'ring-2 ring-inset ring-app-accent bg-app-accent/5' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-4 border-b border-app flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black text-app-muted uppercase tracking-widest flex items-center gap-2">
              <Monitor size={12}/> Dataset Files
            </h2>
            <button onClick={() => setShowShortcuts(true)} className="p-1 hover:text-app-accent text-app-muted"><Keyboard size={14}/></button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" />
            <input type="text" placeholder="Filter images..." className="w-full bg-panel border border-app rounded-md py-1.5 pl-9 pr-3 text-xs outline-none focus:border-app-accent transition-all" />
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
              <div className="w-12 h-10 bg-panel rounded border border-app overflow-hidden relative grayscale-[0.5] shadow-sm shrink-0">
                <img src={img.url} className="w-full h-full object-cover opacity-80" />
                {img.status === 'labeled' && <div className="absolute top-0 right-0 w-full h-full bg-green-500/10 flex items-center justify-center"><CheckCircle2 size={12} className="text-green-500" /></div>}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-[11px] font-medium truncate tracking-tight">{img.name}</p>
                <p className="text-[9px] font-mono opacity-50 uppercase tracking-tighter">{img.annotations.length} RECTS</p>
              </div>
            </button>
          ))}

          {/* Persistent Drop Zone / Add Button */}
          <div className={`mt-4 border-2 border-dashed rounded-xl p-6 transition-all flex flex-col items-center justify-center gap-2 text-center ${isDraggingOver ? 'border-app-accent bg-app-accent/10' : 'border-app/40 hover:border-app-accent hover:bg-panel'}`}>
            <div className="p-2 bg-panel rounded-full border border-app text-app-muted shadow-sm group-hover:text-app-accent">
              <UploadCloud size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-app-muted uppercase tracking-wider">Drop Assets</p>
              <p className="text-[9px] text-app-muted/60">PNG, JPG to upload</p>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 relative flex flex-col overflow-hidden">
        <div className="h-12 border-b border-app px-6 flex items-center justify-between bg-panel/40 backdrop-blur shadow-sm">
          <div className="flex items-center gap-3 text-xs font-medium text-app-muted">
            <span className="text-app-muted uppercase tracking-wider font-bold">{project.name}</span>
            <span className="text-app-muted/30">/</span>
            <span className="text-app-accent font-mono text-[10px]">{currentImage?.name || 'No Image Selected'}</span>
          </div>

          <div className="flex items-center gap-4">
            {currentImage && (
              <button 
                onClick={toggleVerify}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all border ${currentImage.status === 'labeled' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-panel text-app-muted border-app'}`}
              >
                {currentImage.status === 'labeled' ? <CheckCircle2 size={12}/> : <Circle size={12}/>}
                {currentImage.status === 'labeled' ? 'Verified' : 'Unverified'}
              </button>
            )}
            <div className="w-px h-4 bg-app/10" />
            <div className="flex items-center gap-1">
              <button onClick={handlePrev} className="p-1 text-app-muted hover:text-app transition-colors"><ChevronLeft size={18}/></button>
              <span className="text-[10px] font-mono w-16 text-center text-app-muted">{project.images.length > 0 ? currentIndex + 1 : 0} / {project.images.length}</span>
              <button onClick={handleNext} className="p-1 text-app-muted hover:text-app transition-colors"><ChevronRight size={18}/></button>
            </div>
          </div>
        </div>

        {/* Floating Tool Dock */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-panel border border-app rounded-full shadow-xl z-50">
          <ToolBtn active={tool === 'select'} onClick={() => setTool('select')} icon={<MousePointer2 size={16}/>} shortcut="V" />
          <ToolBtn active={tool === 'draw'} onClick={() => setTool('draw')} icon={<Square size={16}/>} shortcut="W" />
          <div className="w-px h-4 bg-app/10 mx-1" />
          <button onClick={() => setSelectedBoxId(null)} className="p-2.5 text-app-muted hover:text-app transition-colors" title="Clear Selection"><Crosshair size={16}/></button>
        </div>

        {/* Precision Magnifier */}
        {isDrawing && currentImage && (
          <div 
            className="fixed pointer-events-none w-48 h-48 border-4 border-app-accent rounded-full overflow-hidden z-[100] shadow-2xl bg-black"
            style={{ left: mousePos.x + 300, top: mousePos.y + 100 }}
          >
            <div className="absolute scale-[4] origin-top-left" style={{ left: -mousePos.x * 4 + 96, top: -mousePos.y * 4 + 96 }}>
              <img src={currentImage.url} className="max-w-none" style={{ height: 'auto', width: canvasRef.current?.clientWidth }} />
            </div>
            <div className="absolute inset-0 border border-white/20 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full" />
          </div>
        )}

        <div className="flex-1 overflow-auto bg-stage flex items-center justify-center p-20 cursor-crosshair">
          {currentImage ? (
            <div ref={canvasRef} className="relative shadow-2xl rounded-sm" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
              <img src={currentImage.url} className="max-h-[75vh] block pointer-events-none border border-app shadow-sm" alt="Canvas" />
              {currentImage.annotations.map(ann => (
                <div 
                  key={ann.id}
                  onClick={(e) => { e.stopPropagation(); setSelectedBoxId(ann.id); }}
                  className={`absolute border-[1.5px] transition-all cursor-pointer ${selectedBoxId === ann.id ? 'border-app-accent bg-app-accent/10 shadow-lg' : 'border-app-accent/40 bg-app-accent/5 hover:border-app-accent'}`}
                  style={{ left: ann.bbox.x, top: ann.bbox.y, width: ann.bbox.w, height: ann.bbox.h }}
                >
                  <span className="absolute -top-5 left-0 px-1 bg-app-accent text-[9px] font-bold text-white uppercase tracking-tighter rounded-t-sm whitespace-nowrap">{ann.label}</span>
                </div>
              ))}
              {tempBox && <div className="absolute border-[1.5px] border-dashed border-app-accent/60 bg-app-accent/10" style={{ left: tempBox.x, top: tempBox.y, width: tempBox.w, height: tempBox.h }} />}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-sidebar border border-app border-dashed rounded-2xl flex items-center justify-center text-app-muted">
                <UploadCloud size={32} />
              </div>
              <p className="text-app-muted text-sm">Drag and drop images into the sidebar to begin</p>
            </div>
          )}
        </div>
      </div>

      {/* Inspector Panel */}
      <div className="w-80 border-l border-app bg-sidebar flex flex-col shrink-0">
        <div className="p-5 border-b border-app">
           <h2 className="text-[10px] font-black text-app-muted uppercase tracking-widest flex items-center gap-2">
            <Layers size={12}/> Scene Objects
          </h2>
        </div>
        
        <div className="flex-1 p-5 space-y-8 overflow-y-auto no-scrollbar">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
               <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider">Available Classes</label>
               <span className="text-[9px] text-app-muted opacity-50">Press 1-9</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {project.classes.map((cls, i) => (
                <button 
                  key={cls}
                  onClick={() => setActiveClassIndex(i)}
                  className={`px-3 py-2 text-[10px] font-bold uppercase rounded-md border text-left transition-all flex items-center justify-between ${i === activeClassIndex ? 'bg-app-accent text-white border-app-accent shadow-sm' : 'bg-panel border-app text-app-muted hover:border-app-accent hover:text-app'}`}
                >
                  <span className="truncate">{cls}</span>
                  <span className="opacity-40 text-[8px] font-mono">{i + 1}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-app space-y-4">
            <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider flex items-center gap-2">
              <BarChart3 size={12}/> Global Health
            </label>
            <div className="space-y-3">
              {Object.entries(stats).map(([label, count]) => (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold uppercase text-app-muted">
                    <span>{label}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-panel rounded-full overflow-hidden border border-app">
                    <div className="h-full bg-app-accent transition-all duration-1000" style={{ width: `${(count / maxStat) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedBoxId && (
            <div className="pt-8 border-t border-app space-y-4 animate-in slide-in-from-right-4 duration-200">
               <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider">Selection Details</label>
                  <span className="text-[9px] font-mono bg-panel border border-app px-1 rounded">{selectedBoxId.slice(-4)}</span>
               </div>
               <div className="space-y-3">
                  <button 
                    onClick={() => deleteBox(selectedBoxId)}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-[10px] font-bold uppercase hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 size={12}/> Delete Object [DEL]
                  </button>
               </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-app">
          <button className="w-full py-3 bg-app-accent text-white rounded-xl text-xs font-black uppercase tracking-wider hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2">
            <Download size={14} /> Export Dataset
          </button>
        </div>
      </div>
    </div>
  );
};

const ToolBtn = ({ active, onClick, icon, shortcut }: any) => (
  <button 
    onClick={onClick}
    className={`p-3 rounded-full transition-all relative group ${active ? 'bg-app-accent text-white shadow-md' : 'text-app-muted hover:bg-panel hover:text-app'}`}
  >
    {icon}
    <span className="absolute -bottom-1 -right-1 bg-panel border border-app text-[7px] px-1 rounded font-bold text-app group-hover:border-app-accent transition-colors">{shortcut}</span>
  </button>
);

const ShortcutRow = ({ keyName, desc }: { keyName: string, desc: string }) => (
  <div className="flex items-center justify-between p-2 bg-panel rounded border border-app">
    <span className="text-[10px] text-app-muted font-medium">{desc}</span>
    <span className="px-1.5 py-0.5 bg-sidebar border border-app rounded font-mono text-[9px] font-bold">{keyName}</span>
  </div>
);

export default Annotator;
